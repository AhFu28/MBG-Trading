/**
 * WhatsApp Auto-Bot Daemon for MBG Trading
 *
 * Connects to WhatsApp Web via @whiskeysockets/baileys (WebSocket).
 * Auth session is persisted locally in `wa_auth/` (gitignored).
 * Provides a local HTTP API on port 5055 for instantaneous sending
 * from Node.js, Python, or command-line scripts.
 */

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePhone, cleanForWhatsApp, MAS_FUAD_WHATSAPP } from '../frontend/src/services/whatsappHandoff.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const AUTH_DIR = path.join(ROOT_DIR, 'wa_auth');
const QUEUE_FILE = path.join(AUTH_DIR, 'outbox_queue.json');
const STATUS_FILE = path.join(AUTH_DIR, 'status.json');
const QR_FILE = path.join(AUTH_DIR, 'latest_qr.txt');

const PORT = parseInt(process.env.WA_BOT_PORT || '5055', 10);
const TARGET_FUAD_DIGITS = normalizePhone(MAS_FUAD_WHATSAPP);
const FUAD_JID = `${TARGET_FUAD_DIGITS}@s.whatsapp.net`;

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// Global daemon state
let sock = null;
let isConnected = false;
let latestQR = null;
let latestAsciiQR = null;
let latestSvgQR = null;
let reconnectAttempts = 0;
let isSendingQueue = false;

function log(msg) {
  const ts = new Date().toLocaleTimeString('id-ID', { hour12: false });
  console.log(`[WA-BOT ${ts}] ${msg}`);
}

function updateStatus(state, extra = {}) {
  const data = {
    state,
    connected: isConnected,
    hasQR: !!latestQR,
    reconnectAttempts,
    targetPhone: TARGET_FUAD_DIGITS,
    updatedAt: new Date().toISOString(),
    ...extra
  };
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Ignore write errors
  }
}

// Queue management (Outbox)
function loadQueue() {
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      const raw = fs.readFileSync(QUEUE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    log(`Warning: Failed to read queue: ${err.message}`);
  }
  return [];
}

function saveQueue(queue) {
  try {
    const tmp = `${QUEUE_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(queue, null, 2), 'utf-8');
    fs.renameSync(tmp, QUEUE_FILE);
  } catch (err) {
    log(`Error saving queue: ${err.message}`);
  }
}

export function queueMessage(message, to = FUAD_JID) {
  const queue = loadQueue();
  const item = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    to,
    message,
    queuedAt: new Date().toISOString(),
  };
  queue.push(item);
  saveQueue(queue);
  log(`Pesan masuk ke antrean (Outbox ID: ${item.id}). Total antrean: ${queue.length}`);
  return item;
}

async function processQueue() {
  if (!isConnected || !sock || isSendingQueue) return;
  const queue = loadQueue();
  if (queue.length === 0) return;

  isSendingQueue = true;
  log(`Memproses pengiriman antrean (${queue.length} pesan)...`);

  const remaining = [];
  for (const item of queue) {
    try {
      const jid = item.to.includes('@') ? item.to : `${normalizePhone(item.to)}@s.whatsapp.net`;
      log(`Mengirim pesan outbox ${item.id} ke ${jid}...`);
      await sock.sendMessage(jid, { text: item.message });
      log(`✓ Sukses terkirim: ${item.id}`);
      // Small pause between messages to prevent spam triggers
      await new Promise(r => setTimeout(r, 1200));
    } catch (err) {
      log(`✗ Gagal kirim outbox ${item.id}: ${err.message}`);
      remaining.push(item);
    }
  }

  saveQueue(remaining);
  isSendingQueue = false;
}

// Baileys Connection Setup
async function startSocket() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307], isLatest: false }));

  log(`Memulai WhatsApp Socket (Baileys v${version.join('.')}, isLatest: ${isLatest})...`);
  updateStatus('CONNECTING');

  sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false, // handled manually with formatted banner
    auth: state,
    browser: ['MBG Trading Intelligence', 'Chrome', '124.0.0.0'],
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 60_000,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      latestQR = qr;
      latestSvgQR = await QRCode.toString(qr, { type: 'svg', margin: 2 }).catch(() => null);

      qrcodeTerminal.generate(qr, { small: true }, (ascii) => {
        latestAsciiQR = ascii;
        try {
          fs.writeFileSync(QR_FILE, ascii, 'utf-8');
        } catch (e) {}

        console.log('\n======================================================');
        console.log('📲 SCAN QR CODE UNTUK TAUTKAN WHATSAPP BOT:');
        console.log('1. Buka aplikasi WhatsApp di HP Anda');
        console.log('2. Buka Menu (titik tiga) > Perangkat Tertaut (Linked Devices)');
        console.log('3. Ketuk "Tautkan Perangkat" lalu arahkan kamera ke QR di bawah:');
        console.log('======================================================\n');
        console.log(ascii);
        console.log('======================================================\n');
        console.log(`🌐 Atau buka di browser: http://127.0.0.1:${PORT}\n`);
      });
      updateStatus('SCAN_QR_REQUIRED', { qr });
    }

    if (connection === 'close') {
      isConnected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      log(`Koneksi terputus (Status: ${statusCode || 'unknown'}, Reconnect: ${shouldReconnect})`);

      if (statusCode === DisconnectReason.loggedOut) {
        log('Session logged out oleh pengguna. Menghapus auth files...');
        try {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          fs.mkdirSync(AUTH_DIR, { recursive: true });
        } catch (e) {}
        updateStatus('LOGGED_OUT');
        latestQR = null;
        latestAsciiQR = null;
      } else {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 15000);
        log(`Mencoba sambung kembali dalam ${(delay / 1000).toFixed(1)} detik... (Percobaan ke-${reconnectAttempts})`);
        updateStatus('RECONNECTING', { nextAttemptInMs: delay });
        setTimeout(startSocket, delay);
      }
    } else if (connection === 'open') {
      isConnected = true;
      latestQR = null;
      latestAsciiQR = null;
      latestSvgQR = null;
      reconnectAttempts = 0;
      try {
        if (fs.existsSync(QR_FILE)) fs.unlinkSync(QR_FILE);
      } catch (e) {}

      const userJid = sock.user?.id || 'unknown';
      log(`🎉 BERHASIL TERHUBUNG KE WHATSAPP!`);
      log(`   Akun Bot WA Aktif : ${userJid}`);
      log(`   Target Mas Fuad   : ${TARGET_FUAD_DIGITS} (+62 812-2417-0187)`);
      updateStatus('CONNECTED', { user: sock.user });

      // Drain outbox queue
      processQueue();
    }
  });

  return sock;
}

// Embedded Local HTTP API Server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  const sendJson = (status, obj) => {
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(JSON.stringify(obj, null, 2));
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // Health / Status endpoint
  if (req.method === 'GET' && (url.pathname === '/status' || url.pathname === '/health')) {
    const queue = loadQueue();
    return sendJson(200, {
      ok: true,
      connected: isConnected,
      hasQR: !!latestQR,
      queueLength: queue.length,
      targetPhone: TARGET_FUAD_DIGITS,
      botUser: sock?.user || null,
    });
  }

  // Browser HTML Dashboard (View visual QR code)
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/qr-web')) {
    const queue = loadQueue();
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MBG Trading — WhatsApp Bot Gateway</title>
<meta http-equiv="refresh" content="${isConnected ? '30' : '6'}">
<style>
  body { background: #0a0e17; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
  .card { background: #111827; border: 1px solid #1f293d; border-radius: 18px; padding: 32px 28px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.6); }
  .badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 9999px; font-size: 12px; font-weight: 800; margin-bottom: 16px; }
  .badge-connected { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
  .badge-waiting { background: rgba(234,179,8,0.15); color: #facc15; border: 1px solid rgba(234,179,8,0.3); }
  .qr-box { background: #ffffff; border-radius: 12px; padding: 16px; display: inline-block; margin: 18px 0; max-width: 280px; width: 100%; box-sizing: border-box; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
  .qr-box svg { width: 100%; height: auto; display: block; }
  ol { text-align: left; font-size: 12.5px; color: #94a3b8; line-height: 1.7; margin: 16px 0; padding-left: 20px; }
  .info-bar { background: rgba(255,255,255,0.04); border-radius: 8px; padding: 10px 14px; font-size: 11.5px; color: #94a3b8; margin-top: 18px; }
</style>
</head>
<body>
<div class="card">
  <div style="font-size:32px; margin-bottom: 8px;">🤖 📲</div>
  <h2 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 800;">MBG WhatsApp Gateway</h2>
  <div style="font-size: 12px; color: #94a3b8; margin-bottom: 18px;">Pengiriman Pesan Otomatis ke Mas Fuad</div>

  ${isConnected ? `
    <div class="badge badge-connected">● TERHUBUNG KE WHATSAPP</div>
    <div style="font-size: 14px; color: #4ade80; margin: 20px 0; font-weight: 700;">
      ✅ Bot WhatsApp aktif & siap mengirim otomatis!
    </div>
    <p style="font-size: 12px; color: #94a3b8; line-height: 1.6;">
      Setiap update atau briefing untuk Mas Fuad akan langsung otomatis terkirim ke nomor <b>+${TARGET_FUAD_DIGITS}</b> tanpa perlu klik manual.
    </p>
  ` : latestSvgQR ? `
    <div class="badge badge-waiting">⏳ MENUNGGU SCAN QR CODE</div>
    <div class="qr-box">
      ${latestSvgQR}
    </div>
    <ol>
      <li>Buka aplikasi <b>WhatsApp</b> di HP Anda</li>
      <li>Buka <b>Menu (titik tiga)</b> &gt; <b>Perangkat Tertaut</b></li>
      <li>Ketuk <b>Tautkan Perangkat</b> lalu scan QR di atas</li>
    </ol>
    <div style="font-size: 11px; color: #64748b;">Halaman ini auto-refresh setiap 6 detik saat menunggu koneksi.</div>
  ` : `
    <div class="badge badge-waiting">⏳ SEDANG MEMUAT BOT...</div>
    <p style="font-size: 13px; color: #94a3b8; margin: 30px 0;">Menghubungkan ke WhatsApp Web...</p>
  `}

  ${!isConnected ? `
    <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #1f293d; text-align: left;">
      <div style="font-size: 13px; font-weight: 700; color: #f8fafc; margin-bottom: 5px;">
        💡 Gagal Scan QR? Pakai Kode Pairing (Tanpa Kamera)
      </div>
      <div style="font-size: 11.5px; color: #94a3b8; margin-bottom: 12px; line-height: 1.5;">
        Ketik nomor HP pengirim Anda di bawah ini untuk mendapatkan 8-digit kode pairing:
      </div>
      <div style="display: flex; gap: 8px;">
        <input id="phoneInput" type="text" placeholder="Contoh: 08123456789" style="flex: 1; background: #0b0f19; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; color: #fff; font-size: 13px; outline: none;">
        <button onclick="getPairingCode()" style="background: #25D366; color: #000; border: none; border-radius: 8px; padding: 10px 14px; font-weight: 700; cursor: pointer; font-size: 12px;">Minta Kode</button>
      </div>
      <div id="pairingResult" style="display: none; margin-top: 14px; background: rgba(37,211,102,0.1); border: 1px solid rgba(37,211,102,0.3); border-radius: 10px; padding: 14px; text-align: center;">
        <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">KODE PAIRING ANDA:</div>
        <div id="pairingCodeDisplay" style="font-size: 26px; font-weight: 900; letter-spacing: 4px; color: #25D366; font-family: monospace;">----</div>
        <div style="font-size: 11.5px; color: #cbd5e1; margin-top: 8px; line-height: 1.5;">
          Di WA HP: Perangkat Tertaut &gt; Tautkan Perangkat &gt; <b>Tautkan dengan nomor telepon saja</b> &gt; ketikkan kode di atas.
        </div>
      </div>
    </div>
    <script>
    async function getPairingCode() {
      const phone = document.getElementById('phoneInput').value.trim();
      if (!phone) return alert('Masukkan nomor HP Anda terlebih dahulu');
      try {
        const res = await fetch('/pairing-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone })
        });
        const data = await res.json();
        if (data.ok) {
          document.getElementById('pairingCodeDisplay').innerText = data.code;
          document.getElementById('pairingResult').style.display = 'block';
        } else {
          alert('Gagal: ' + (data.error || 'Terjadi kesalahan'));
        }
      } catch (e) {
        alert('Error: ' + e.message);
      }
    }
    </script>
  ` : ''}

  <div class="info-bar">
    Target Mas Fuad: <b>+${TARGET_FUAD_DIGITS}</b><br>
    Antrean Outbox: <b>${queue.length} pesan</b>
  </div>
</div>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  // Request WhatsApp Pairing Code (Camera-less connection via phone number)
  if (req.method === 'POST' && url.pathname === '/pairing-code') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const rawPhone = body.phone || body.phoneNumber || '';
        const digits = normalizePhone(rawPhone);
        if (!digits || digits.length < 10) {
          return sendJson(400, { ok: false, error: 'Nomor telepon tidak valid (minimal 10 digit).' });
        }

        if (isConnected) {
          return sendJson(200, { ok: true, alreadyConnected: true, message: 'Bot sudah terhubung ke WhatsApp.' });
        }

        if (!sock) {
          return sendJson(500, { ok: false, error: 'Socket WhatsApp belum siap.' });
        }

        log(`Meminta kode pairing untuk nomor: +${digits}...`);
        const code = await sock.requestPairingCode(digits);
        const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;
        log(`✓ Kode pairing didapatkan: ${formattedCode}`);

        return sendJson(200, {
          ok: true,
          code: formattedCode,
          phone: digits,
          instructions: [
            'Buka WhatsApp di HP Anda',
            'Buka Menu > Perangkat Tertaut > Tautkan Perangkat',
            'Ketuk tautan di bawah: "Tautkan dengan nomor telepon saja"',
            `Masukkan kode: ${formattedCode}`,
          ]
        });
      } catch (err) {
        log(`✗ Gagal meminta kode pairing: ${err.message}`);
        return sendJson(500, { ok: false, error: err.message });
      }
    });
    return;
  }

  // View QR endpoint
  if (req.method === 'GET' && url.pathname === '/qr') {
    if (latestAsciiQR) {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end(latestAsciiQR);
    }
    return sendJson(200, {
      ok: true,
      hasQR: false,
      message: isConnected ? 'Bot sudah terhubung ke WhatsApp. Tidak ada QR code aktif.' : 'Sedang memuat QR code...',
    });
  }

  // Send message to Mas Fuad directly
  if (req.method === 'POST' && (url.pathname === '/send-fuad' || url.pathname === '/send-mas-fuad')) {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const rawMessage = body.message || body.text || '';
        if (!rawMessage.trim()) {
          return sendJson(400, { ok: false, error: 'Parameter message wajib diisi.' });
        }

        const message = cleanForWhatsApp(rawMessage);

        if (!isConnected || !sock) {
          const item = queueMessage(message, FUAD_JID);
          return sendJson(202, {
            ok: true,
            queued: true,
            messageId: item.id,
            to: TARGET_FUAD_DIGITS,
            note: 'Bot WA belum tersambung (menunggu scan QR). Pesan telah disimpan di Outbox dan akan langsung terkirim otomatis saat terhubung.',
          });
        }

        log(`Mengirim pesan langsung ke Mas Fuad (${FUAD_JID})...`);
        const result = await sock.sendMessage(FUAD_JID, { text: message });
        log(`✓ Pesan berhasil terkirim ke Mas Fuad! (ID: ${result?.key?.id})`);

        return sendJson(200, {
          ok: true,
          sent: true,
          to: TARGET_FUAD_DIGITS,
          messageId: result?.key?.id,
          messagePreview: message.slice(0, 100),
        });
      } catch (err) {
        log(`✗ Gagal mengirim pesan ke Mas Fuad: ${err.message}`);
        return sendJson(500, { ok: false, error: err.message });
      }
    });
    return;
  }

  // Generic send endpoint
  if (req.method === 'POST' && url.pathname === '/send') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const message = (body.message || body.text || '').trim();
        const toPhone = normalizePhone(body.to || MAS_FUAD_WHATSAPP);

        if (!message) {
          return sendJson(400, { ok: false, error: 'Parameter message wajib diisi.' });
        }
        if (!toPhone) {
          return sendJson(400, { ok: false, error: 'Nomor telepon tujuan tidak valid.' });
        }

        const targetJid = `${toPhone}@s.whatsapp.net`;

        if (!isConnected || !sock) {
          const item = queueMessage(message, targetJid);
          return sendJson(202, {
            ok: true,
            queued: true,
            messageId: item.id,
            to: toPhone,
            note: 'Bot WA belum tersambung. Pesan masuk antrean outbox.',
          });
        }

        log(`Mengirim pesan ke ${targetJid}...`);
        const result = await sock.sendMessage(targetJid, { text: message });
        log(`✓ Berhasil terkirim ke ${targetJid}`);

        return sendJson(200, {
          ok: true,
          sent: true,
          to: toPhone,
          messageId: result?.key?.id,
        });
      } catch (err) {
        return sendJson(500, { ok: false, error: err.message });
      }
    });
    return;
  }

  sendJson(404, { ok: false, error: 'Endpoint tidak ditemukan.' });
});

// Global error resilience (keep daemon alive across network dropouts)
process.on('uncaughtException', (err) => {
  log(`Resilience guard: Uncaught exception handled safely: ${err.message}`);
});

process.on('unhandledRejection', (reason) => {
  log(`Resilience guard: Unhandled rejection handled safely: ${reason?.message || reason}`);
});

// Start Daemon
server.listen(PORT, '127.0.0.1', () => {
  log(`HTTP API Server berjalan di http://127.0.0.1:${PORT}`);
  log(`Endpoints: /status, /qr, /send-fuad, /send`);
  startSocket();
});

// Clean shutdown
process.on('SIGINT', () => {
  log('Menerima SIGINT, mematikan server...');
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Menerima SIGTERM, mematikan server...');
  server.close();
  process.exit(0);
});
