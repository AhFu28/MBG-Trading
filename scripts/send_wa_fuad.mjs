#!/usr/bin/env node
/**
 * CLI Tool: Send WhatsApp Message to Mas Fuad (+62 812-2417-0187)
 *
 * Usage:
 *   node scripts/send_wa_fuad.mjs "Pesan untuk Mas Fuad"
 *   node scripts/send_wa_fuad.mjs --status
 *   node scripts/send_wa_fuad.mjs --qr
 *   cat update.txt | node scripts/send_wa_fuad.mjs
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanForWhatsApp, normalizePhone, MAS_FUAD_WHATSAPP } from '../frontend/src/services/whatsappHandoff.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const AUTH_DIR = path.join(ROOT_DIR, 'wa_auth');
const QUEUE_FILE = path.join(AUTH_DIR, 'outbox_queue.json');
const QR_FILE = path.join(AUTH_DIR, 'latest_qr.txt');

const PORT = parseInt(process.env.WA_BOT_PORT || '5055', 10);
const TARGET_PHONE = normalizePhone(MAS_FUAD_WHATSAPP);

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(4000, () => {
      req.destroy(new Error('Request timeout'));
    });
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function checkStatus() {
  try {
    const res = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/status',
      method: 'GET',
    });
    console.log('=== STATUS WHATSAPP BOT MBG TRADING ===');
    console.log(`Port Daemon       : ${PORT}`);
    console.log(`Terkoneksi WA     : ${res.data.connected ? '✅ YA' : '⏳ BELUM (Perlu Scan QR)'}`);
    console.log(`Nomor Mas Fuad    : +${res.data.targetPhone}`);
    console.log(`Antrean Outbox    : ${res.data.queueLength} pesan`);
    if (res.data.botUser) {
      console.log(`Akun Bot Aktif    : ${res.data.botUser.id || 'Aktif'}`);
    }
    if (res.data.hasQR) {
      console.log('\n📲 Ada QR code aktif yang menunggu di-scan. Jalankan:');
      console.log('   node scripts/send_wa_fuad.mjs --qr');
    }
    return res.data;
  } catch (err) {
    console.log('=== STATUS WHATSAPP BOT MBG TRADING ===');
    console.log(`Daemon status     : ⚠️ TIDAK BERJALAN di port ${PORT}`);
    console.log(`Pesan error       : ${err.message}`);
    console.log('\nUntuk menyalakan daemon bot WA, jalankan:');
    console.log('   npm run wa:start');
    return null;
  }
}

async function showQR() {
  if (fs.existsSync(QR_FILE)) {
    const qrText = fs.readFileSync(QR_FILE, 'utf-8');
    console.log('\n======================================================');
    console.log('📲 SCAN QR CODE UNTUK TAUTKAN WHATSAPP BOT:');
    console.log('1. Buka aplikasi WhatsApp di HP Anda');
    console.log('2. Buka Menu (titik tiga) > Perangkat Tertaut (Linked Devices)');
    console.log('3. Ketuk "Tautkan Perangkat" lalu arahkan kamera ke QR di bawah:');
    console.log('======================================================\n');
    console.log(qrText);
    console.log('======================================================\n');
    return;
  }

  try {
    const res = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/qr',
      method: 'GET',
    });
    if (res.raw) {
      console.log(res.raw);
    } else {
      console.log(res.data?.message || 'Tidak ada QR code aktif saat ini.');
    }
  } catch (e) {
    console.log('Daemon tidak aktif atau belum ada QR code. Jalankan `npm run wa:start`.');
  }
}

function queueDirectly(message) {
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
  let queue = [];
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
    }
  } catch (e) {}

  const item = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    to: `${TARGET_PHONE}@s.whatsapp.net`,
    message: cleanForWhatsApp(message),
    queuedAt: new Date().toISOString(),
  };
  queue.push(item);

  const tmp = `${QUEUE_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(queue, null, 2), 'utf-8');
  fs.renameSync(tmp, QUEUE_FILE);

  return item;
}

export async function sendMessage(rawMessage) {
  const message = cleanForWhatsApp(rawMessage);
  if (!message) {
    console.error('Error: Pesan kosong.');
    process.exit(1);
  }

  // 1. Try sending via local running daemon
  try {
    const res = await request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/send-fuad',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { message }
    );

    if (res.status === 200 && res.data?.sent) {
      console.log(`✅ [SUKSES TERKIRIM KE WHATSAPP MAS FUAD] (+${TARGET_PHONE})`);
      console.log(`   Message ID: ${res.data.messageId}`);
      return { success: true, sent: true, data: res.data };
    }

    if (res.status === 202 && res.data?.queued) {
      console.log(`⏳ [MASUK ANTREAN OUTBOX] (+${TARGET_PHONE})`);
      console.log(`   ${res.data.note}`);
      return { success: true, queued: true, data: res.data };
    }

    console.error('Respon tidak terduga:', res.data || res.raw);
  } catch (err) {
    // 2. Daemon not running or unreachable -> Fallback: queue directly to outbox
    const item = queueDirectly(message);
    console.log(`⚠️  Daemon bot belum aktif di port ${PORT}.`);
    console.log(`📥 Pesan telah disimpan di ANTREAN OUTBOX (ID: ${item.id}).`);
    console.log(`   Pesan akan terkirim otomatis saat daemon menyala.`);
    console.log(`   Nyalakan bot: npm run wa:start`);
    return { success: true, queuedDirectly: true, id: item.id };
  }
}

async function requestPairing(phone) {
  try {
    const res = await request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/pairing-code',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { phone }
    );

    if (res.data?.ok && res.data?.code) {
      console.log('\n======================================================');
      console.log(`📲 KODE PAIRING WHATSAPP: ${res.data.code}`);
      console.log('======================================================');
      console.log('Langkah-langkah di HP:');
      console.log('1. Buka aplikasi WhatsApp di HP Anda');
      console.log('2. Buka Menu (titik tiga) > Perangkat Tertaut (Linked Devices)');
      console.log('3. Ketuk "Tautkan Perangkat"');
      console.log('4. Ketuk tautan di bawah: "Tautkan dengan nomor telepon saja"');
      console.log(`5. Masukkan 8-digit kode: ${res.data.code}`);
      console.log('======================================================\n');
    } else {
      console.error('Gagal mendapatkan kode pairing:', res.data?.error || res.raw);
    }
  } catch (err) {
    console.error(`Daemon bot belum aktif di port ${PORT}. Jalankan npm run wa:start.`);
  }
}

// CLI Execution
const args = process.argv.slice(2);
const isDirectCli = process.argv[1] && (path.resolve(process.argv[1]) === fileURLToPath(import.meta.url));
if (isDirectCli) {
  if (args.includes('--status')) {
    await checkStatus();
    process.exit(0);
  }

  if (args.includes('--qr')) {
    await showQR();
    process.exit(0);
  }

  const pairIndex = args.indexOf('--pair');
  if (pairIndex !== -1) {
    const phone = args[pairIndex + 1];
    if (!phone) {
      console.error('Harap masukkan nomor HP pengirim setelah --pair. Contoh: --pair 08123456789');
      process.exit(1);
    }
    await requestPairing(phone);
    process.exit(0);
  }

  let inputMessage = args.filter(a => !a.startsWith('--')).join(' ');

  if (!inputMessage) {
    // Check if piped from stdin
    if (!process.stdin.isTTY) {
      inputMessage = fs.readFileSync(0, 'utf-8');
    }
  }

  if (!inputMessage || !inputMessage.trim()) {
    console.log('Penggunaan:');
    console.log('  node scripts/send_wa_fuad.mjs "Pesan update untuk Mas Fuad"');
    console.log('  node scripts/send_wa_fuad.mjs --status');
    console.log('  node scripts/send_wa_fuad.mjs --qr');
    console.log('  node scripts/send_wa_fuad.mjs --pair <nomor_hp_pengirim>');
    process.exit(0);
  }

  await sendMessage(inputMessage);
}
