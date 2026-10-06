/**
 * Tests for honest missing-data rendering.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * A cockpit audit found a single systemic bug repeated across many components:
 *
 *     const value = bundleField || HARDCODED_NUMBER;
 *
 * When the bundle key did not exist — which was the case for `geopolitical_threat`,
 * `global_markets`, `economic_calendar` and `crypto_whales` — the fallback did not
 * "degrade gracefully". It rendered PERMANENTLY as though it were live data:
 *
 *   • App top nav showed "DEFCON 4" from a hardcoded threat level
 *   • GlobalMarkets showed 30 invented index, bond and FX prices
 *   • CryptoFutures showed funding 0.01% NEUTRAL for ~45 pairs nobody measured
 *   • The economic calendar showed RELEASED badges beside invented CPI figures
 *
 * The lesson: a blank cell is honest, a plausible number is a trade. `0` and
 * `'$0'` are CLAIMS. This suite pins the difference so it cannot regress.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(__dirname, '../../');

function read(rel) {
  return fs.readFileSync(path.join(SRC, rel), 'utf8');
}

/**
 * Strip comments before asserting on source text.
 *
 * The fixes here document the removed values in comments (contrasting the old
 * literal with the new behaviour). Matching raw source would flag those notes
 * as if they were live code, so assertions run against comment-free code only.
 */
function readCode(rel) {
  return read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, '')   // block comments
    .replace(/^\s*\/\/.*$/gm, '');       // line comments
}

// ---------------------------------------------------------------------------
// The bundle must not be asked for keys that do not exist
// ---------------------------------------------------------------------------
describe('bundle contract', () => {
  const BUNDLE = path.resolve(
    __dirname, '../../../../engine/cache/latest_cockpit_bundle.json'
  );

  it('the shipped bundle is readable', () => {
    expect(fs.existsSync(BUNDLE)).toBe(true);
  });

  it('does NOT contain the keys that used to trigger hardcoded fallbacks', () => {
    const bundle = JSON.parse(fs.readFileSync(BUNDLE, 'utf8'));
    // If any of these ever appear, the corresponding component should be
    // switched back to reading them — this test is the reminder.
    for (const absent of ['geopolitical_threat', 'global_markets', 'economic_calendar']) {
      expect(bundle).not.toHaveProperty(absent);
    }
  });
});

// ---------------------------------------------------------------------------
// Fake data must be gone or explicitly labelled
// ---------------------------------------------------------------------------
describe('invented threat level', () => {
  it('App does not default DEFCON to 4', () => {
    const app = readCode('App.jsx');
    expect(app).not.toMatch(/defcon_level\s*\|\|\s*4/);
  });

  it('App renders a placeholder when there is no threat feed', () => {
    const app = readCode('App.jsx');
    expect(app).toMatch(/DEFCON —|DEFCON \$\{|DEFCON \$\{/);
  });

  it('the GEO drawer no longer embeds a literal threat assessment', () => {
    const drawer = readCode('components/AiIntelligenceDrawer.jsx');
    expect(drawer).not.toContain("defcon_title: 'DEFCON 4");
    expect(drawer).not.toContain('threat_score: 0.42');
  });

  it('the GEO drawer declares an explicit empty state', () => {
    const drawer = readCode('components/AiIntelligenceDrawer.jsx');
    expect(drawer).toMatch(/const geo = geoDesk \|\| \{/);
  });
});

describe('invented index and commodity prices', () => {
  const GLOBAL = readCode('components/GlobalMarketsTab.jsx');

  it('GlobalMarkets no longer carries the hardcoded S&P and Nasdaq levels', () => {
    expect(GLOBAL).not.toContain('5,548.20');
    expect(GLOBAL).not.toContain('17,420.50');
    expect(GLOBAL).not.toContain('38,720.40');
  });

  it('GlobalMarkets no longer reads the absent global_markets key', () => {
    expect(GLOBAL).not.toContain('bundle?.global_markets');
  });

  it('GlobalMarkets no longer ends fallback chains in a literal price', () => {
    // These exact literals were the "plausible number" fallbacks.
    for (const literal of ["'$103.03'", '99.39', "'100.22'", "'4.84%'", "'6,455.66'"]) {
      expect(GLOBAL).not.toContain(literal);
    }
  });
});

describe('invented funding rates', () => {
  const FUTURES = readCode('components/CryptoFuturesTab.jsx');

  it('does not invent 0.01% funding for pairs the engine did not report', () => {
    expect(FUTURES).not.toMatch(/funding_rate_pct:\s*0\.01\b/);
  });

  it('marks unmeasured pairs as NO_DATA', () => {
    expect(FUTURES).toContain("signal: 'NO_DATA'");
  });

  it('does not coerce missing numbers to zero with || 0', () => {
    // `|| 0` on a data field renders a missing value as a measured zero.
    expect(FUTURES).not.toMatch(/change_24h_pct\s*\|\|\s*0/);
    expect(FUTURES).not.toMatch(/volume_24h_usd\s*\|\|\s*0/);
    expect(FUTURES).not.toMatch(/funding_rate_pct\s*\|\|\s*0/);
  });

  it('renders an em dash for an unknown percentage', () => {
    expect(FUTURES).toContain('const fmtPct');
    expect(FUTURES).toMatch(/const EM_DASH = '—'/);
  });

  it('formatVolSmart returns a dash rather than $0 for missing volume', () => {
    expect(FUTURES).toMatch(/if \(val === null \|\| val === undefined \|\| isNaN\(val\)\) return EM_DASH;/);
  });
});

describe('invented economic calendar outcomes', () => {
  const CAL = readCode('components/EconomicCalendarTab.jsx');

  it('discloses that the schedule is a sample, not a feed', () => {
    expect(CAL).toMatch(/Jadwal contoh, dudu feed langsung/);
  });

  it('no longer re-assigns the same constant through state', () => {
    expect(CAL).not.toMatch(/setEvents\(COMPREHENSIVE_MACRO_EVENTS\)/);
  });
});

// ---------------------------------------------------------------------------
// No component may crash on a missing feed
// ---------------------------------------------------------------------------
describe('missing-data safety', () => {
  it('GlobalMarkets guards price rendering behind an explicit check', () => {
    const global = readCode('components/GlobalMarketsTab.jsx');
    expect(global).toContain('const hasPrice');
    expect(global).toContain('const hasChange');
  });

  it('GlobalMarkets renders a dash, never a zero, for a missing price', () => {
    const global = readCode('components/GlobalMarketsTab.jsx');
    expect(global).toMatch(/:\s*'—'/);
  });
});

// ---------------------------------------------------------------------------
// Dead state must not ship
// ---------------------------------------------------------------------------
describe('dead useState setters', () => {
  /**
   * A setter that is declared and never called means a control was intended and
   * never wired — exactly how the futures liquidations tab stayed at $0. The
   * scan is over the components directory so a new one fails this test.
   */
  const componentsDir = path.join(SRC, 'components');
  const KNOWN_DEAD = new Set([
    // Tier filter in the arena: logic exists, no UI control yet.
    'setAgentFilterTab',
  ]);

  it('every useState setter is called somewhere', () => {
    const offenders = [];
    for (const file of fs.readdirSync(componentsDir)) {
      if (!file.endsWith('.jsx')) continue;
      const src = fs.readFileSync(path.join(componentsDir, file), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      const re = /const\s+\[\s*\w+\s*,\s*(set\w+)\s*\]\s*=\s*useState/g;
      let m;
      while ((m = re.exec(src)) !== null) {
        const setter = m[1];
        if (KNOWN_DEAD.has(setter)) continue;
        const calls = src.match(new RegExp(`\\b${setter}\\s*\\(`, 'g')) || [];
        if (calls.length === 0) offenders.push(`${file}: ${setter}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
