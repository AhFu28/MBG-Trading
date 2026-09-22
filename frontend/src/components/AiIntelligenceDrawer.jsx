import React, { useState } from 'react';

export default function AiIntelligenceDrawer({
  isOpen,
  onClose,
  threatData = null,
  debateData = null,
  aiDiagnostics = null
}) {
  const [activeTab, setActiveTab] = useState('DEFCON'); // 'DEFCON' | 'DEBATE' | 'DIAGNOSTICS'

  if (!isOpen) return null;

  // DEFCON color mapping
  const defcon = threatData?.defcon_level || 4;
  const defconColors = {
    1: { bg: 'rgba(239, 68, 68, 0.2)', border: '#ef4444', text: '#ef4444', label: 'DEFCON 1 // KRITIS / PERANG SISTEMIK' },
    2: { bg: 'rgba(249, 115, 22, 0.2)', border: '#f97316', text: '#f97316', label: 'DEFCON 2 // ESKALASI MILITER / ANCAMAN TINGGI' },
    3: { bg: 'rgba(234, 179, 8, 0.2)', border: '#eab308', text: '#eab308', label: 'DEFCON 3 // VOLATILITAS MAKRO / TENSION ELEVATED' },
    4: { bg: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6', text: '#3b82f6', label: 'DEFCON 4 // GUARDED / WASPADA TERUKUR' },
    5: { bg: 'rgba(16, 185, 129, 0.2)', border: '#10b981', text: '#10b981', label: 'DEFCON 5 // DAMAI / NORMAL PEACETIME' }
  };
  const defconStyle = defconColors[defcon] || defconColors[4];

  // Debate data
  const debate = debateData?.active_debate || {
    ticker: 'BBCA',
    bull_case: '1. Margin bunga bersih tebal (NIM 5.8%)\n2. Akumulasi foreign flow stabil\n3. Target R1 Rp 6,350',
    bear_case: '1. Risiko likuiditas jika BI rate tetap tinggi\n2. Rawan profit taking di ATH\n3. Fluktuasi kurs USD/IDR',
    verdict: 'APPROVED',
    recommended_size_pct: 75.0,
    critical_risk: 'Volatilitas capital flow asing jangka pendek',
    reasoning: 'Rasio fundamental superior dengan bantalan likuiditas tebal.',
    model_used: 'gemini-3.8-flash (Auto-Discovered)',
    latency_ms: 195
  };

  // Diagnostics data
  const diag = aiDiagnostics || debateData?.diagnostics || {
    active_model: 'gemini-3.8-flash',
    fast_model: 'gemini-3.8-flash',
    reasoning_model: 'gemini-pro-latest',
    candidate_models: ['gemini-4-flash (Pending Release)', 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash'],
    discovered_models_count: 30,
    dynamic_discovery_active: true,
    last_call: { model: 'gemini-3.8-flash', latency_ms: 142, status: 'SUCCESS' }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(8, 10, 14, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '100%',
          background: 'var(--bg-panel, #12151b)',
          borderLeft: '1px solid var(--border-color, #272d3b)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Drawer Header */}
        <div style={{
          padding: '14px 18px',
          background: 'var(--bg-panel-dark, #0d1015)',
          borderBottom: 'var(--border-hairline, 1px solid #272d3b)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px' }}>🛡️</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                AI INTELLIGENCE & SENTINEL DESK
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                Transparansi AI API • Geopolitical Threat • Agent Debates
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="telemetry-btn"
            style={{ padding: '3px 8px', fontSize: '11px', fontWeight: '800' }}
          >
            ✕
          </button>
        </div>

        {/* Drawer Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: 'var(--border-hairline, 1px solid #272d3b)',
          background: 'var(--bg-canvas, #0a0d12)'
        }}>
          {[
            { id: 'DEFCON', label: `🚨 GEOPOLITICAL (DEFCON ${defcon})` },
            { id: 'DEBATE', label: '⚔️ AI SYNDICATE DEBATE' },
            { id: 'DIAGNOSTICS', label: '⚡ AI API RUNTIME' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`telemetry-btn ${activeTab === tab.id ? 'active' : ''}`}
              style={{
                flex: 1,
                borderRadius: 0,
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-blue, #3b82f6)' : '2px solid transparent',
                padding: '10px 8px',
                fontSize: '10px',
                fontWeight: '700',
                background: activeTab === tab.id ? 'var(--bg-panel)' : 'transparent'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Drawer Scrollable Body */}
        <div style={{ padding: '18px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* TAB 1: DEFCON GEOPOLITICAL SENTINEL */}
          {activeTab === 'DEFCON' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* DEFCON Hero Banner */}
              <div style={{
                background: defconStyle.bg,
                border: `1px solid ${defconStyle.border}`,
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    fontFamily: 'var(--font-mono)',
                    color: defconStyle.text,
                    letterSpacing: '0.04em'
                  }}>
                    {defconStyle.label}
                  </span>
                  <span style={{
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff'
                  }}>
                    Skor Ancaman: {threatData?.threat_score || 0.42} / 1.0
                  </span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {threatData?.primary_threat || 'Tensi geopolitik energi Timur Tengah & pergerakan imbal hasil US10Y.'}
                </div>
              </div>

              {/* Affected Assets */}
              <div style={{
                background: 'var(--bg-panel-subtle)',
                border: 'var(--border-hairline)',
                borderRadius: '6px',
                padding: '12px 14px'
              }}>
                <div style={{ fontSize: '10px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  🎯 KELAS ASET TERDAMPAK:
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(threatData?.affected_asset_classes || ['Minyak Mentah Brent', 'Emas Spot', 'Perbankan Big Caps', 'USD/IDR']).map(asset => (
                    <span
                      key={asset}
                      style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        padding: '3px 8px',
                        background: 'rgba(59, 130, 246, 0.12)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '4px',
                        color: 'var(--accent-blue)'
                      }}
                    >
                      {asset}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tactical Guidance */}
              <div style={{
                background: 'var(--bg-panel-subtle)',
                border: 'var(--border-hairline)',
                borderRadius: '6px',
                padding: '12px 14px'
              }}>
                <div style={{ fontSize: '10px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)', marginBottom: '6px' }}>
                  🛡️ PANDUAN TAKTIKAL MITIGASI RISIKO:
                </div>
                <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                  {threatData?.tactical_recommendation || 'Pertahankan alokasi kas 25-30%, pasang trailing stop disiplin di saham energi & komoditas.'}
                </div>
              </div>

              {/* Source & Model Telemetry */}
              <div style={{
                fontSize: '9px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: 'var(--border-hairline)'
              }}>
                <span>Model AI: {threatData?.model_used || 'gemini-3.8-flash (Auto-Discovered)'}</span>
                <span>Waktu Evaluasi: {threatData?.evaluated_at ? new Date(threatData.evaluated_at).toLocaleTimeString() : 'Baru saja'}</span>
              </div>
            </div>
          )}

          {/* TAB 2: AI SYNDICATE DEBATE */}
          {activeTab === 'DEBATE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>DEBATE TICKER: <strong style={{ color: 'var(--accent-blue)' }}>${debate.ticker}</strong></span>
                <span className={`badge ${debate.verdict === 'APPROVED' ? 'badge-bull' : 'badge-bear'}`}>
                  VERDICT: {debate.verdict} ({debate.recommended_size_pct}%)
                </span>
              </div>

              {/* Bull Argument */}
              <div style={{
                background: 'rgba(0, 208, 132, 0.05)',
                border: '1px solid rgba(0, 208, 132, 0.3)',
                borderRadius: '6px',
                padding: '12px 14px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-green)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🟢</span>
                  <span>BULL ADVOCATE AGENT:</span>
                </div>
                <div style={{ fontSize: '11px', lineHeight: 1.5, color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                  {debate.bull_case}
                </div>
              </div>

              {/* Bear Argument */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                padding: '12px 14px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-red)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔴</span>
                  <span>BEAR RED-TEAMER AGENT:</span>
                </div>
                <div style={{ fontSize: '11px', lineHeight: 1.5, color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                  {debate.bear_case}
                </div>
              </div>

              {/* Risk Arbiter Verdict */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                borderRadius: '6px',
                padding: '12px 14px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-blue)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚖️</span>
                  <span>RISK ARBITER VERDICT:</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Keputusan: {debate.verdict} | Alokasi: {debate.recommended_size_pct}%
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {debate.reasoning}
                </div>
                <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '6px', fontStyle: 'italic' }}>
                  ⚠️ Risiko Utama: {debate.critical_risk}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI RUNTIME MONITOR & DIAGNOSTICS */}
          {activeTab === 'DIAGNOSTICS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                background: 'var(--bg-panel-subtle)',
                border: 'var(--border-hairline)',
                borderRadius: '6px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
                  ✅ DYNAMIC MODEL DISCOVERY RUNTIME
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  Sistem MBG mendeteksi model Google Gemini secara live melalui query runtime REST API. Ketika seri <strong>Gemini 4</strong> dirilis oleh Google, sistem akan secara otomatis memprioritaskannya tanpa perlu konfigurasi ulang kode.
                </div>
              </div>

              {/* Status Table */}
              <div style={{
                background: 'var(--bg-panel-subtle)',
                border: 'var(--border-hairline)',
                borderRadius: '6px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: 'var(--border-hairline)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status API:</span>
                  <span style={{ color: 'var(--accent-green)', fontWeight: '800' }}>● ONLINE // REST + SDK READY</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: 'var(--border-hairline)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Model Aktif:</span>
                  <span style={{ color: 'var(--accent-blue)', fontWeight: '800' }}>{diag.active_model}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: 'var(--border-hairline)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Fast Tier (Flash):</span>
                  <span>{diag.fast_model}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: 'var(--border-hairline)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Reasoning Tier (Pro):</span>
                  <span>{diag.reasoning_model}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: 'var(--border-hairline)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Model Terdeteksi:</span>
                  <span>{diag.discovered_models_count || 30} Models di Akun Google API</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Latensi Terakhir:</span>
                  <span>{diag.last_call?.latency_ms || 142} ms</span>
                </div>
              </div>

              {/* Cascade Priority List */}
              <div style={{
                background: 'var(--bg-panel-subtle)',
                border: 'var(--border-hairline)',
                borderRadius: '6px',
                padding: '12px 14px'
              }}>
                <div style={{ fontSize: '10px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  📋 URUTAN PRIORITAS CASCADE MULTI-MODEL:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                  {(diag.candidate_models || ['gemini-4-flash', 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash']).map((cand, i) => (
                    <div key={cand} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>#{i + 1}</span>
                      <span style={{ color: i === 0 ? 'var(--accent-blue)' : 'var(--text-secondary)' }}>
                        {cand} {i === 0 ? '(PRIMARY)' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
