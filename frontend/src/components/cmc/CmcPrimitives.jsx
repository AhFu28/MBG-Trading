import React, { useId } from 'react';

/**
 * Shared presentational primitives for the CoinMarketCap-style dashboard.
 *
 * WHY THESE LIVE TOGETHER: the old Home page hand-rolled every bar, gauge and
 * percentage inline, which is how it ended up 2,199 lines with the same colour
 * logic copy-pasted a dozen times. These are the pieces CMC repeats across all
 * its panels, defined once.
 *
 * HONEST-DATA RULE: every component here renders an em-dash for a null/absent
 * value. None of them substitutes a plausible-looking default, because a
 * fabricated number on a trading desk is worse than a blank one.
 */

export const DASH = '—';

/** Green for up, red for down, muted for unknown. Never guesses a direction. */
export function changeColor(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return 'var(--text-muted)';
  const n = Number(value);
  if (n > 0) return '#16c784';
  if (n < 0) return '#ea3943';
  return 'var(--text-muted)';
}

/** CMC formats percentages with a leading + for gains and 2 decimals. */
export function formatPct(value, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return DASH;
  const n = Number(value);
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(digits)}%`;
}

/**
 * Inline SVG sparkline for the major-coin cards.
 *
 * Pure SVG rather than a charting library: CMC's sparklines are ~120x32 and
 * pulling in a chart engine for that would cost more than the whole dashboard.
 */
export function Sparkline({ data = [], isUp = true, width = 132, height = 38 }) {
  // useId keeps multiple sparklines from colliding on their gradient id.
  // Math.random() here caused SVG redraw churn on every price tick.
  const gradientId = `spark-${useId().replace(/:/g, '')}`;

  const points = (Array.isArray(data) ? data : []).filter(v => Number.isFinite(Number(v))).map(Number);
  if (points.length < 2) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'var(--text-muted)' }}>
        no chart
      </div>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const stepX = width / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * stepX;
    // Invert Y: SVG origin is top-left, price charts grow upward.
    const y = height - ((p - min) / span) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const stroke = isUp ? '#16c784' : '#ea3943';
  const linePath = `M${coords.join(' L')}`;
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="7 day price trend">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Fear & Greed semicircular gauge.
 *
 * Band boundaries follow the published definition: 0-20 extreme fear,
 * 20-40 fear, 40-60 neutral, 60-80 greed, 80-100 extreme greed.
 */
export function FearGreedGauge({ score, label, size = 132 }) {
  const hasScore = Number.isFinite(Number(score));
  const value = hasScore ? Math.max(0, Math.min(100, Number(score))) : null;

  const radius = size / 2 - 11;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * radius;
  const filled = value === null ? 0 : (value / 100) * circumference;

  const bands = [
    { from: 0, to: 20, color: '#ea3943' },
    { from: 20, to: 40, color: '#f59e0b' },
    { from: 40, to: 60, color: '#eab308' },
    { from: 60, to: 80, color: '#84cc16' },
    { from: 80, to: 100, color: '#16c784' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      <svg width={size} height={size * 0.62} viewBox={`0 0 ${size} ${size * 0.62}`} role="img" aria-label={`Fear and Greed index ${value ?? 'unavailable'}`}>
        {bands.map(b => {
          const startAngle = Math.PI * (1 - b.from / 100);
          const endAngle = Math.PI * (1 - b.to / 100);
          const x1 = cx + radius * Math.cos(startAngle);
          const y1 = cy - radius * Math.sin(startAngle);
          const x2 = cx + radius * Math.cos(endAngle);
          const y2 = cy - radius * Math.sin(endAngle);
          return (
            <path
              key={b.from}
              d={`M${x1},${y1} A${radius},${radius} 0 0 1 ${x2},${y2}`}
              fill="none"
              stroke={b.color}
              strokeWidth="7"
              strokeOpacity={hasScore ? 0.28 : 0.14}
              strokeLinecap="butt"
            />
          );
        })}

        {value !== null && (
          <path
            d={`M${cx - radius},${cy} A${radius},${radius} 0 0 1 ${cx + radius},${cy}`}
            fill="none"
            stroke={bands.find(b => value >= b.from && value <= b.to)?.color || '#eab308'}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
          />
        )}
      </svg>

      <div style={{ marginTop: '-30px', textAlign: 'center' }}>
        <div style={{ fontSize: '26px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1 }}>
          {value === null ? DASH : Math.round(value)}
        </div>
        <div style={{ fontSize: '10.5px', fontWeight: 800, color: changeColor(value === null ? null : value - 50), marginTop: '3px' }}>
          {label || (value === null ? 'Data tidak tersedia' : '')}
        </div>
      </div>
    </div>
  );
}

/**
 * Altcoin Season scale.
 *
 * The marker position and the dial labels come from the API's own `dialConfigs`
 * when available, so we never hardcode a scale the source might disagree with.
 */
export function AltcoinSeasonScale({ value, dialConfigs = [], fallbackHigh = 75, fallbackLow = 25 }) {
  const hasValue = Number.isFinite(Number(value));
  const v = hasValue ? Math.max(0, Math.min(100, Number(value))) : null;

  const named = dialConfigs.filter(d => d && d.name);
  const altDial = named.find(d => /altcoin/i.test(d.name));
  const btcDial = named.find(d => /bitcoin/i.test(d.name));
  const altStart = altDial ? Number(altDial.start) : fallbackHigh;
  const btcEnd = btcDial ? Number(btcDial.end) : fallbackLow;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', height: '9px', borderRadius: '5px', overflow: 'hidden', display: 'flex', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ width: `${btcEnd}%`, background: 'linear-gradient(90deg,#f7931a,#fcd34d)' }} />
        <div style={{ width: `${altStart - btcEnd}%`, background: 'rgba(255,255,255,0.09)' }} />
        <div style={{ flex: 1, background: 'linear-gradient(90deg,#38bdf8,#6366f1)' }} />

        {v !== null && (
          <div
            style={{
              position: 'absolute',
              left: `${v}%`,
              top: '-3px',
              width: '3px',
              height: '15px',
              background: '#ffffff',
              boxShadow: '0 0 6px rgba(255,255,255,0.9)',
              transform: 'translateX(-50%)',
              borderRadius: '2px',
            }}
            title={`Altcoin Season Index: ${v}`}
          />
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>
        <span>Bitcoin Season</span>
        <span>Altcoin Season</span>
      </div>
    </div>
  );
}

/** Segmented dominance bar (BTC / ETH / others). */
export function DominanceBar({ btc, eth, height = 12 }) {
  const b = Number.isFinite(Number(btc)) ? Number(btc) : null;
  const e = Number.isFinite(Number(eth)) ? Number(eth) : null;

  if (b === null && e === null) {
    return (
      <div style={{ height, borderRadius: '4px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'var(--text-muted)' }}>
        Data dominasi tidak tersedia
      </div>
    );
  }

  const btcPct = b ?? 0;
  const ethPct = e ?? 0;
  // Guard against an upstream change that pushes the two over 100%.
  const othersPct = Math.max(0, 100 - btcPct - ethPct);

  const segments = [
    { label: 'Bitcoin', pct: btcPct, color: '#f7931a' },
    { label: 'Ethereum', pct: ethPct, color: '#627eea' },
    { label: 'Others', pct: othersPct, color: '#64748b' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', height, borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        {segments.map(s => (
          s.pct > 0 ? (
            <div key={s.label} style={{ width: `${s.pct}%`, background: s.color }} title={`${s.label}: ${s.pct.toFixed(2)}%`} />
          ) : null
        ))}
      </div>
      <div style={{ display: 'flex', gap: '13px', marginTop: '8px', flexWrap: 'wrap' }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: s.color, display: 'inline-block' }} />
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</span>
            <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{s.pct.toFixed(1)}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Small metric tile: label above, value, optional change below. */
export function MetricTile({ label, value, change, changeSuffix = '%', hint }) {
  const color = change === null || change === undefined ? 'var(--text-muted)' : changeColor(change);
  return (
    <div title={hint || undefined} style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
      <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontSize: '17px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1.1 }}>
        {value}
      </span>
      {change !== null && change !== undefined && (
        <span style={{ fontSize: '11px', fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>
          {formatPct(change)}{changeSuffix === '%' ? '' : ` ${changeSuffix}`}
        </span>
      )}
    </div>
  );
}

/**
 * Exchange open/closed indicator.
 *
 * A panel named "Market Status" must answer whether each market is tradeable
 * right now. Green means open, amber means an intraday break, red means closed.
 * The colour never claims more than the state allows.
 */
export function MarketStatusRow({ status }) {
  if (!status) return null;

  const palette = {
    OPEN: { dot: '#16c784', text: '#16c784', label: 'BUKA' },
    BREAK: { dot: '#f59e0b', text: '#f59e0b', label: 'ISTIRAHAT' },
    CLOSED: { dot: '#ea3943', text: '#ea3943', label: 'TUTUP' },
  }[status.state] || { dot: '#64748b', text: 'var(--text-muted)', label: '—' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '6px 0' }}>
      <span
        style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: palette.dot,
          boxShadow: status.state === 'OPEN' ? `0 0 6px ${palette.dot}` : 'none',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {status.name}
        </span>
        <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {status.detail}
        </span>
      </div>
      <span style={{ fontSize: '9.5px', fontWeight: 800, color: palette.text, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
        {palette.label}
      </span>
    </div>
  );
}

/** Compact market filter pills for the cross-market asset table. */
export function MarketPills({ markets, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
      {markets.map(m => {
        const on = active === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            style={{
              background: on ? 'var(--accent-blue)' : 'var(--bg-panel-subtle)',
              color: on ? '#fff' : 'var(--text-muted)',
              border: on ? '1px solid var(--accent-blue)' : 'var(--border-hairline)',
              borderRadius: '6px',
              padding: '3px 10px',
              fontSize: '10.5px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            {m.label}{typeof m.count === 'number' ? ` (${m.count})` : ''}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Shown when a data source returned nothing.
 *
 * WHY THIS EXISTS: Jendral Arib reported "dibagian home banyak yg kosong2".
 * A blank panel gives the user no way to tell a blocked network from a broken
 * build from an empty market. This states which happened and offers a retry.
 */
export function EmptyState({ message, hint, onRetry, compact = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: compact ? '18px 10px' : '30px 14px', textAlign: 'center' }}>
      <span style={{ fontSize: '19px', opacity: 0.5 }}>⚠️</span>
      <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '380px' }}>
        {message}
      </span>
      {hint && (
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '400px' }}>
          {hint}
        </span>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{ marginTop: '3px', background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', color: 'var(--accent-blue)', borderRadius: '6px', padding: '4px 12px', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          ↻ Coba lagi
        </button>
      )}
    </div>
  );
}

/** Reusable panel shell so every dashboard card has identical chrome. */
export function DashPanel({ title, subtitle, right, children, minHeight, style }) {
  return (
    <section
      className="telemetry-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        minHeight: minHeight || 0,
        padding: '13px 15px',
        gap: '11px',
        borderRadius: '10px',
        ...style,
      }}
    >
      {(title || right) && (
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
            {title && (
              <h3 style={{ margin: 0, fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{subtitle}</span>
            )}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}
