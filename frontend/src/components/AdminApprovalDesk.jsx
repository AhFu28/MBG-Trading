import React, { useState, useEffect } from 'react';
import { fetchAdminRequests, approveSubscription, rejectSubscription } from '../services/accountClient.js';

export default function AdminApprovalDesk({ account = {}, onRefreshUser }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'approved'

  const loadRequests = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetchAdminRequests();
      setRequests(res.requests || []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Gagal memuat permintaan admin.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (req) => {
    const confirmMsg = `Aktifkan langganan PRO (30 Hari) untuk ${req.email}?`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(req.id);
    setFeedback(null);
    try {
      const res = await approveSubscription({
        requestId: req.id,
        email: req.email,
        days: 30,
        note: `Approved by ${account.email || 'Admin'} on ${new Date().toLocaleString('id-ID')}`,
      });
      setFeedback({ type: 'success', message: res.message || `Sukses! ${req.email} kini berstatus PRO.` });
      await loadRequests();
      if (onRefreshUser) onRefreshUser();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Gagal approve permintaan.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (req) => {
    const reason = window.prompt('Masukkan alasan penolakan (misal: Bukti tidak cocok / Mutasi tidak masuk):');
    if (!reason) return;

    setActionLoading(req.id);
    setFeedback(null);
    try {
      await rejectSubscription({
        requestId: req.id,
        reason,
      });
      setFeedback({ type: 'info', message: `Permintaan ${req.email} ditolak.` });
      await loadRequests();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menolak permintaan.' });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'approved') return r.status === 'approved';
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const totalRevenue = requests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const panel = {
    background: 'rgba(255,255,255,0.032)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '14px',
    padding: '20px 22px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{
        ...panel,
        background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(15,20,35,0.96) 60%)',
        border: '1px solid rgba(16,185,129,0.35)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.1em', color: 'var(--accent-emerald)', textTransform: 'uppercase', marginBottom: '4px' }}>
              👑 GOVERNANCE DESK
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
              Admin Approval Desk (MBG Quant VIP)
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Otorisasi instan 1-klik untuk aktivasi tier PRO. Khusus Jendral Arib & Kamerad Fuad.
            </p>
          </div>
          <button
            onClick={loadRequests}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#f8fafc',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Memuat...' : '🔄 Refresh Data'}
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '16px' }}>
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ fontSize: '12px', color: 'var(--accent-gold-bright)', fontWeight: '800' }}>MENUNGGU VERIFIKASI</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#fef3c7', marginTop: '4px' }}>{pendingCount} Permintaan</div>
          </div>
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ fontSize: '12px', color: 'var(--accent-mint)', fontWeight: '800' }}>TOTAL DISETUJUI</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#d1fae5', marginTop: '4px' }}>{approvedCount} Akun</div>
          </div>
          <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ fontSize: '12px', color: '#818cf8', fontWeight: '800' }}>TOTAL OMZET TERCATAT</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#e0e7ff', marginTop: '4px' }}>
              Rp {totalRevenue.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: '700',
          background: feedback.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
          color: feedback.type === 'success' ? 'var(--accent-mint)' : '#f87171',
        }}>
          {feedback.message}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { id: 'all', label: `Semua (${requests.length})` },
          { id: 'pending', label: `Menunggu (${pendingCount})` },
          { id: 'approved', label: `Disetujui (${approvedCount})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              background: filter === t.id ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.06)',
              color: filter === t.id ? '#042f2e' : 'var(--text-secondary)',
              border: 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={panel}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '12px' }}>
            Sedang membaca database Supabase...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '12px' }}>
            Tidak ada data permintaan langganan yang cocok dengan filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>WAKTU</th>
                  <th style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>EMAIL AKUN</th>
                  <th style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>PENGIRIM & METODE</th>
                  <th style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>NOMINAL</th>
                  <th style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>CATATAN / BUKTI</th>
                  <th style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>STATUS</th>
                  <th style={{ padding: '10px 8px', color: 'var(--text-muted)', textAlign: 'right' }}>AKSI ADMIN</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(r => {
                  const isPending = r.status === 'pending';
                  const isApproved = r.status === 'approved';
                  const dateStr = new Date(r.created_at).toLocaleString('id-ID', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  });

                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{dateStr}</td>
                      <td style={{ padding: '10px 8px', fontWeight: '700', color: '#f8fafc' }}>{r.email}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>
                        <div style={{ fontWeight: '600' }}>{r.sender_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.payment_method}</div>
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--accent-mint)', fontWeight: '800' }}>
                        Rp {Number(r.amount).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-muted)', maxWidth: '180px' }}>
                        <div>{r.notes || '—'}</div>
                        {r.proof_url && (
                          <a href={r.proof_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--accent-sky)' }}>
                            Lihat Bukti ↗
                          </a>
                        )}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '999px',
                          background: isPending ? 'rgba(245,158,11,0.2)' : isApproved ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                          color: isPending ? 'var(--accent-gold-bright)' : isApproved ? 'var(--accent-mint)' : '#f87171',
                          border: `1px solid ${isPending ? 'rgba(245,158,11,0.4)' : isApproved ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                        }}>
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        {isPending ? (
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => handleApprove(r)}
                              disabled={actionLoading === r.id}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: 'var(--accent-emerald)',
                                border: 'none',
                                color: '#042f2e',
                                fontSize: '12px',
                                fontWeight: '800',
                                cursor: 'pointer',
                              }}
                            >
                              {actionLoading === r.id ? '...' : '⚡ Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(r)}
                              disabled={actionLoading === r.id}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                background: 'rgba(239,68,68,0.2)',
                                border: '1px solid rgba(239,68,68,0.4)',
                                color: '#f87171',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                              }}
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {isApproved ? `✓ Oleh ${r.reviewed_by?.split('@')[0] || 'Admin'}` : 'Ditolak'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
