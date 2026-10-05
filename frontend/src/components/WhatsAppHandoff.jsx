import React, { useState } from 'react';
import { buildWhatsAppLink, cleanForWhatsApp, isConfigured } from '../services/whatsappHandoff.js';

/**
 * WhatsAppHandoff — turns a "Untuk Mas Fuad" block into one-click sending.
 *
 * Shows the message, a copy button AND a WhatsApp button. Both are offered
 * because wa.me cannot actually send on its own: WhatsApp always requires a
 * human tap. Copying is the fallback when WhatsApp is not installed.
 *
 * If no number is configured the component renders nothing at all, rather than
 * a button that leads nowhere.
 */
export default function WhatsAppHandoff({ message, title = 'Untuk Mas Fuad', compact = false }) {
  const [copied, setCopied] = useState(false);

  if (!isConfigured()) return null;

  const clean = cleanForWhatsApp(message);
  if (!clean) return null;

  const link = buildWhatsAppLink(clean);
  if (!link) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(clean);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div style={{
      marginTop: compact ? '10px' : '14px',
      background: 'rgba(37,211,102,0.07)',
      border: '1px solid rgba(37,211,102,0.30)',
      borderRadius: '11px',
      padding: compact ? '11px 14px' : '14px 17px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '7px',
        fontSize: '11.5px', fontWeight: '800', color: '#25D366', marginBottom: '8px',
      }}>
        <span>💬</span>
        <span>{title}</span>
      </div>

      <div style={{
        fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.75,
        whiteSpace: 'pre-wrap', maxHeight: '190px', overflowY: 'auto',
        background: 'rgba(0,0,0,0.24)', borderRadius: '8px', padding: '11px 13px',
        marginBottom: '11px',
      }}>
        {clean}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            padding: '9px 17px', borderRadius: '8px', textDecoration: 'none',
            background: 'linear-gradient(135deg,#25D366,#128C7E)', color: '#fff',
            fontSize: '12px', fontWeight: '800',
          }}
        >
          <span style={{ fontSize: '14px' }}>📲</span>
          Buka WhatsApp
        </a>

        <button
          type="button"
          onClick={copy}
          style={{
            padding: '9px 15px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
            background: 'rgba(255,255,255,0.07)', color: 'var(--text-primary)',
            border: '1px solid rgba(255,255,255,0.14)', fontSize: '12px', fontWeight: '700',
          }}
        >
          {copied ? '✓ Tersalin' : 'Salin teks'}
        </button>
      </div>

      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '9px', lineHeight: 1.6 }}>
        WhatsApp akan terbuka dengan pesan sudah terisi. Anda tinggal klik <strong>Kirim</strong> —
        WhatsApp tidak mengizinkan pengiriman otomatis.
      </div>
    </div>
  );
}
