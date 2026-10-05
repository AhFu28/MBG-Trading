import { describe, it, expect } from 'vitest';
import {
  normalizePhone,
  buildWhatsAppLink,
  cleanForWhatsApp,
  buildStatusMessage,
  isConfigured,
} from '../whatsappHandoff.js';

describe('normalizePhone', () => {
  it('accepts every way an Indonesian number gets written', () => {
    const expected = '6281224170187';
    for (const written of [
      '+62 812-2417-0187',
      '6281224170187',
      '081224170187',
      '81224170187',
      '+62812 2417 0187',
      '(62) 812.2417.0187',
    ]) {
      expect(normalizePhone(written)).toBe(expected);
    }
  });

  it('does not double-prefix a number already starting with 62', () => {
    expect(normalizePhone('6281224170187')).toBe('6281224170187');
  });

  it('returns empty for junk instead of producing a broken link', () => {
    for (const junk of ['', null, undefined, 'abc', '---', '   ']) {
      expect(normalizePhone(junk)).toBe('');
    }
  });

  it('strips every non-digit character', () => {
    expect(normalizePhone('+62 (812) 2417-0187')).toBe('6281224170187');
  });
});

describe('buildWhatsAppLink', () => {
  it('builds a wa.me link with the encoded message', () => {
    const link = buildWhatsAppLink('Halo Mas Fuad');
    expect(link).toMatch(/^https:\/\/wa\.me\/6281224170187\?text=/);
    expect(link).toContain('Halo%20Mas%20Fuad');
  });

  it('encodes characters that would otherwise break the URL', () => {
    const link = buildWhatsAppLink('Selesai ✅ — "sudah" & 100%');
    expect(link).not.toContain(' ');
    expect(link).not.toContain('"');
    expect(link).not.toContain('&', link.indexOf('?text=') + 6);
    // Round-trips back to the original message.
    const decoded = decodeURIComponent(link.split('?text=')[1]);
    expect(decoded).toBe('Selesai ✅ — "sudah" & 100%');
  });

  it('returns a bare link when there is no message', () => {
    expect(buildWhatsAppLink('')).toBe('https://wa.me/6281224170187');
    expect(buildWhatsAppLink('   ')).toBe('https://wa.me/6281224170187');
  });

  it('returns null when the number is unusable, so callers can hide the button', () => {
    expect(buildWhatsAppLink('hi', { phone: '' })).toBeNull();
    expect(buildWhatsAppLink('hi', { phone: '123' })).toBeNull();
    expect(buildWhatsAppLink('hi', { phone: null })).toBeNull();
  });

  it('never produces a link with an empty phone slot', () => {
    const link = buildWhatsAppLink('test');
    expect(link).not.toContain('wa.me/?');
    expect(link).not.toMatch(/wa\.me\/\?/);
  });
});

describe('cleanForWhatsApp', () => {
  it('removes the heading so the message reads like a normal chat', () => {
    const block = `💬 Untuk Mas Fuad

Mas, iki wis beres.`;
    expect(cleanForWhatsApp(block)).toBe('Mas, iki wis beres.');
  });

  it('strips markdown blockquote markers', () => {
    const block = `> Mas, ngapunten.
> Iki salahku.`;
    expect(cleanForWhatsApp(block)).toBe('Mas, ngapunten.\nIki salahku.');
  });

  it('removes bold and italic markers but keeps the words', () => {
    const block = 'Mas, **iki penting** lan *wajib* dibaca.';
    expect(cleanForWhatsApp(block)).toBe('Mas, iki penting lan wajib dibaca.');
  });

  it('removes the wrapping quotes', () => {
    expect(cleanForWhatsApp('"Mas, wis beres."')).toBe('Mas, wis beres.');
  });

  it('keeps Javanese text completely untouched', () => {
    const javanese = 'Mas, bot-e wis tak beresno. Sakniki sampun saged dipun-ginakaken.';
    expect(cleanForWhatsApp(javanese)).toBe(javanese);
  });

  it('collapses excessive blank lines but keeps paragraph breaks', () => {
    const block = 'Baris 1\n\n\n\n\nBaris 2';
    expect(cleanForWhatsApp(block)).toBe('Baris 1\n\nBaris 2');
  });

  it('handles empty input without throwing', () => {
    for (const junk of ['', null, undefined]) {
      expect(cleanForWhatsApp(junk)).toBe('');
    }
  });

  it('is safe to call twice', () => {
    const once = cleanForWhatsApp('💬 Untuk Mas Fuad\n\n**Mas**, iki beres.');
    expect(cleanForWhatsApp(once)).toBe('Mas, iki beres.');
  });
});

describe('buildStatusMessage', () => {
  it('assembles a short readable update', () => {
    const msg = buildStatusMessage({
      title: 'Update MBG',
      points: ['Arena sudah diperbaiki', 'VIP belum aktif'],
      closing: 'Tak tunggu kabare.',
    });
    expect(msg).toContain('Update MBG');
    expect(msg).toContain('• Arena sudah diperbaiki');
    expect(msg).toContain('• VIP belum aktif');
    expect(msg).toContain('Tak tunggu kabare.');
  });

  it('omits empty sections instead of leaving blank gaps', () => {
    expect(buildStatusMessage({ title: 'Halo' })).toBe('Halo');
    expect(buildStatusMessage({ points: ['satu'] })).toBe('\n• satu');
  });

  it('handles no input at all', () => {
    expect(buildStatusMessage({})).toBe('');
  });
});

describe('isConfigured', () => {
  it('reports configured for the real number', () => {
    expect(isConfigured()).toBe(true);
  });
});

describe('the long "Untuk Mas Fuad" advice blocks still survive cleaning', () => {
  it('keeps the meaning of a long multi-paragraph message', () => {
    const long = `💬 Untuk Mas Fuad

> *"Mas, **VIP durung tak aktifno** — dudu mergo lali.*
>
> *Data trade plan-e **wis 18 dino**. Contone: CUAN nang plan ditulis entry **Rp 945**, tapi regane saiki **Rp 840**.*
>
> *Saiki wis tak beresno."*`;

    const cleaned = cleanForWhatsApp(long);

    // Meaning-bearing facts must remain.
    expect(cleaned).toContain('VIP durung tak aktifno');
    expect(cleaned).toContain('Rp 945');
    expect(cleaned).toContain('Rp 840');
    expect(cleaned).toContain('18 dino');
    // Formatting noise must be gone.
    expect(cleaned).not.toContain('**');
    expect(cleaned).not.toContain('>');
    expect(cleaned).not.toContain('💬');
  });

  it('produces a link that fits in a URL', () => {
    const long = 'Mas, '.repeat(400);
    const link = buildWhatsAppLink(long);
    expect(link).toBeTruthy();
    expect(link.length).toBeLessThan(8000);
  });
});
