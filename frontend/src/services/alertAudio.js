/**
 * Signal alert audio — one shared implementation, one shared AudioContext.
 *
 * WHY THIS FILE EXISTS
 *
 * The Settings page shipped three controls (on/off, chime preset, volume) that
 * wrote `mbg_audio_*` to localStorage and read them back — but nothing else in
 * the app ever read those keys. The setting was decorative: the page promised
 * "SEMUA USER ... otomatis mendengar audio chime saat ada pergerakan sinyal",
 * and no code path ever played a sound on a real signal. Audited 2026-10-09 and
 * rebuilt so the promise is true.
 *
 * TWO DEFECTS THIS ALSO FIXES, both from the original inline implementation:
 *
 *  1. It constructed a NEW AudioContext on every call and never closed it.
 *     Browsers hard-cap concurrent contexts (~6 in Chrome); after that the
 *     constructor throws, the catch swallowed it, and the chime went permanently
 *     silent for the rest of the session with only a console.warn to show for it.
 *     One lazily-created context is reused here, and the promise is cached so
 *     rapid signals cannot race to build several.
 *
 *  2. `Number(localStorage.getItem(...)) || 0.7` meant a deliberate volume of 0
 *     was treated as "never configured" and silently became 70%. We now
 *     distinguish "absent" from "zero" and honour a real 0.
 *
 * Browsers refuse to start audio before a user gesture. `unlock()` is exported
 * so the app can arm audio on the first real interaction; `playSignalChime()`
 * is safe to call at any time and simply does nothing until then.
 */

const KEY_ENABLED = 'mbg_audio_alert_enabled';
const KEY_CHIME = 'mbg_audio_chime_type';
const KEY_VOLUME = 'mbg_audio_volume';

const DEFAULT_CHIME = 'radar';
const DEFAULT_VOLUME = 0.7;

let audioCtx = null;
let ctxPromise = null;
let unlocked = false;

/** Read a stored setting, distinguishing "absent" from a deliberate zero. */
function readVolume() {
  const raw = localStorage.getItem(KEY_VOLUME);
  if (raw === null || raw === '') return DEFAULT_VOLUME;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_VOLUME;
  return Math.min(Math.max(parsed, 0), 1);
}

export function isAlertSoundEnabled() {
  try {
    return localStorage.getItem(KEY_ENABLED) !== 'false';
  } catch {
    return true;
  }
}

export function getChimeType() {
  try {
    return localStorage.getItem(KEY_CHIME) || DEFAULT_CHIME;
  } catch {
    return DEFAULT_CHIME;
  }
}

export function getAlertVolume() {
  try {
    return readVolume();
  } catch {
    return DEFAULT_VOLUME;
  }
}

/**
 * Get (or lazily create) the single shared AudioContext.
 *
 * Returns null when Web Audio is unavailable or the browser refuses to create
 * a context. Callers must treat null as "stay silent", never as an error.
 */
function getContext() {
  if (audioCtx) return Promise.resolve(audioCtx);
  if (ctxPromise) return ctxPromise;

  ctxPromise = new Promise((resolve) => {
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) {
        resolve(null);
        return;
      }
      const ctx = new Ctor();
      audioCtx = ctx;
      resolve(ctx);
    } catch {
      ctxPromise = null;
      resolve(null);
    }
  });

  return ctxPromise;
}

/**
 * Arm audio on the first user gesture.
 *
 * Browsers start the AudioContext in "suspended" and only allow resume() inside
 * a user-gesture handler. Safe to call repeatedly; only the first call matters.
 */
export async function unlockAlertAudio() {
  if (unlocked) return true;
  const ctx = await getContext();
  if (!ctx) return false;
  try {
    if (ctx.state === 'suspended') await ctx.resume();
    unlocked = ctx.state === 'running';
    return unlocked;
  } catch {
    return false;
  }
}

/** Play a preset. `chimeType` doubles as the event class: radar|chime|kaching. */
export async function playSignalChime(chimeType, volumeOverride) {
  if (!isAlertSoundEnabled()) return false;

  const type = chimeType || getChimeType();
  const volume = typeof volumeOverride === 'number' ? volumeOverride : getAlertVolume();
  // A real zero means the user muted the alert — respect it.
  if (volume <= 0) return false;

  const ctx = await getContext();
  if (!ctx) return false;

  try {
    // Autoplay policy: a context created outside a gesture starts suspended.
    if (ctx.state === 'suspended') {
      await ctx.resume();
      if (ctx.state !== 'running') return false;
    }
    unlocked = true;
  } catch {
    return false;
  }

  const now = ctx.currentTime;

  /** One scheduled note. Shared by every preset. */
  const note = (freq, start, dur, type_, peak) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(Math.max(peak, 0.0001), start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.type = type_;
    osc.frequency.setValueAtTime(freq, start);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  };

  try {
    if (type === 'chime') {
      [587.33, 880].forEach((freq, idx) => note(freq, now + idx * 0.1, 0.3, 'triangle', volume * 0.25));
    } else if (type === 'kaching') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => note(freq, now + idx * 0.06, 0.25, 'sine', volume * 0.2));
    } else {
      // radar: a rising sweep, the default "something just happened" cue.
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(Math.max(volume * 0.3, 0.0001), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch {
    return false;
  }

  return true;
}

/**
 * Map a market event to a preset so the same signal class always sounds alike.
 * `direction` may be LONG/BUY or SHORT/SELL; unknown values get the neutral cue.
 */
export function playEventAlert(kind, direction) {
  const dir = String(direction || '').toUpperCase();
  if (kind === 'execution') {
    return playSignalChime('kaching');
  }
  if (kind === 'risk' || dir === 'SHORT' || dir === 'SELL') {
    return playSignalChime('chime');
  }
  if (kind === 'signal') {
    return playSignalChime();
  }
  return playSignalChime('chime');
}
