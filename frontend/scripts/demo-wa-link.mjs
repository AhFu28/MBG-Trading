import { buildWhatsAppLink, cleanForWhatsApp } from '../src/services/whatsappHandoff.js';

const pesan = [
  '💬 Untuk Mas Fuad',
  '',
  '> *"Mas, **VIP durung tak aktifno**. Data trade plan-e **wis 18 dino** —',
  '> CUAN ditulis entry Rp 945, tapi regane saiki **Rp 840**.*',
  '>',
  '> *Saiki wis tak beresno: data seger lan ana pengaman otomatis sing',
  '> nolak sinyal luweh saka 48 jam.*',
  '>',
  '> *Sing dibutuhke mung **token Telegram** lan **chat ID**. Pandhuane',
  '> nang docs/PANDUAN_AKTIVASI_VIP.md."*',
].join('\n');

const clean = cleanForWhatsApp(pesan);
const link = buildWhatsAppLink(clean);

console.log('--- Pesan yang akan terisi di WhatsApp ---');
console.log(clean);
console.log('');
console.log('--- Link yang dihasilkan ---');
console.log(link);
console.log('');
console.log('Panjang link :', link.length, 'karakter');
console.log('Nomor tujuan :', link.match(/wa\.me\/(\d+)/)[1]);
console.log('Dekode ulang :', decodeURIComponent(link.split('?text=')[1]) === clean ? 'COCOK' : 'TIDAK COCOK');
