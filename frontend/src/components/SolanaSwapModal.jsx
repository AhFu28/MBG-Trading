import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  JUPITER_INTEGRATOR_CONFIG,
  connectPhantom,
  disconnectPhantom,
  getSolBalance,
  shortenAddress
} from '../services/phantomWallet.js';

export default function SolanaSwapModal({ isOpen, onClose, walletState, setWalletState }) {
  const [selectedToken, setSelectedToken] = useState(JUPITER_INTEGRATOR_CONFIG.supportedMemecoins[1]); // Default WIF
  const [inputSol, setInputSol] = useState('0.1');
  const [slippage, setSlippage] = useState('1.0');
  const [showDemoNotice, setShowDemoNotice] = useState(false);
  const [tokenPrices, setTokenPrices] = useState({
    SOL: 152.4,
    WIF: 2.38,
    BONK: 0.0000215,
    POPCAT: 1.42,
    MOODENG: 0.28,
    PNUT: 1.15,
    GOAT: 0.68,
    MEW: 0.0084
  });
  const [priceLoading, setPriceLoading] = useState(false);

  // Fetch live prices from DexScreener
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function fetchLiveMemePrices() {
      setPriceLoading(true);
      try {
        const mints = JUPITER_INTEGRATOR_CONFIG.supportedMemecoins
          .filter(t => t.symbol !== 'SOL')
          .map(t => t.mint)
          .join(',');
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mints}`);
        if (res.ok) {
          const json = await res.json();
          const pairs = json?.pairs || [];
          const updated = { ...tokenPrices };
          pairs.forEach(p => {
            const sym = p.baseToken?.symbol?.toUpperCase();
            const px = parseFloat(p.priceUsd);
            if (sym && px && !isNaN(px)) {
              updated[sym] = px;
            }
          });
          if (isMounted) setTokenPrices(updated);
        }
      } catch (err) {
        console.warn('DexScreener live price fallback used:', err);
      } finally {
        if (isMounted) setPriceLoading(false);
      }
    }
    fetchLiveMemePrices();
    const interval = setInterval(fetchLiveMemePrices, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen]);

  // Connect wallet handler
  const handleConnect = async () => {
    const res = await connectPhantom();
    if (res.success) {
      const bal = await getSolBalance(res.address);
      setWalletState({
        connected: true,
        address: res.address,
        balance: bal,
        provider: res.provider
      });
    } else if (!res.installed) {
      window.open('https://phantom.app/', '_blank');
      alert('Ekstensi Phantom tidak terdeteksi. Mengarahkan ke halaman instalasi resmi Phantom.');
    } else {
      alert(res.error || 'Gagal menyambungkan dompet');
    }
  };

  const handleDisconnect = async () => {
    await disconnectPhantom();
    setWalletState({
      connected: false,
      address: '',
      balance: 0,
      provider: null
    });
  };

  // Estimated token output calculation
  const estimatedOutput = useMemo(() => {
    const solVal = parseFloat(inputSol) || 0;
    const solUsd = tokenPrices['SOL'] || 150;
    const targetUsd = tokenPrices[selectedToken.symbol] || 1;
    if (targetUsd <= 0 || solVal <= 0) return '0.00';
    // Fee deduction (0.8%)
    const netSolUsd = solVal * solUsd * (1 - JUPITER_INTEGRATOR_CONFIG.platformFeeBps / 10000);
    const tokens = netSolUsd / targetUsd;
    if (tokens > 10000) return tokens.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (tokens > 10) return tokens.toFixed(2);
    return tokens.toFixed(4);
  }, [inputSol, selectedToken, tokenPrices]);

  const platformFeeEarnedUsd = useMemo(() => {
    const solVal = parseFloat(inputSol) || 0;
    const solUsd = tokenPrices['SOL'] || 150;
    return (solVal * solUsd * (JUPITER_INTEGRATOR_CONFIG.platformFeeBps / 10000)).toFixed(3);
  }, [inputSol, tokenPrices]);

  // DEMO ONLY: No swap is routed. Jupiter integration is a post-launch item.
  const handleExecuteSwap = async () => {
    const solAmt = parseFloat(inputSol);
    if (!solAmt || solAmt <= 0) {
      alert('Masukkan jumlah SOL yang valid');
      return;
    }
    // Show an honest demo notice — no fake transaction, no fake hash, no explorer link.
    setShowDemoNotice(true);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-panel, #0f172a)',
          border: '1px solid rgba(147, 51, 234, 0.4)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(147, 51, 234, 0.2)',
          padding: '20px',
          boxSizing: 'border-box',
          color: 'var(--text-primary, #fff)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>👻</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>SOLANA DEGEN RADAR</span>
                <span style={{ fontSize: '9px', padding: '1px 6px', background: 'rgba(147, 51, 234, 0.25)', color: '#c084fc', borderRadius: '4px', border: '1px solid rgba(147, 51, 234, 0.4)' }}>
                  JUPITER DEX POWERED
                </span>
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #94a3b8)' }}>
                Eksekusi instan 1-2 detik • Non-custodial • Auto Platform Fee
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Wallet Status Bar */}
        <div style={{
          background: walletState.connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.04)',
          border: walletState.connected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          {walletState.connected ? (
            <>
              <div>
                <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  TERHUBUNG KE PHANTOM
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: '700', marginTop: '2px' }}>
                  {shortenAddress(walletState.address, 6)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Saldo Dompet</div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                  {walletState.balance.toFixed(3)} SOL
                </div>
                <button
                  onClick={handleDisconnect}
                  style={{
                    fontSize: '9px',
                    color: '#ef4444',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                    marginTop: '2px'
                  }}
                >
                  Putus Koneksi
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: '700' }}>Dompet Belum Terhubung</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Koneksikan Phantom untuk melihat saldo & eksekusi swap
                </div>
              </div>
              <button
                onClick={handleConnect}
                style={{
                  background: 'linear-gradient(135deg, #ab9ff2 0%, #7e57c2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 14px',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(126, 87, 194, 0.4)'
                }}
              >
                <span>👻</span>
                <span>Connect Phantom</span>
              </button>
            </>
          )}
        </div>

        {/* Memecoin Trending Grid */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.03em', color: 'var(--text-muted)' }}>
              🔥 TRENDING SOLANA MEMECOINS (LIVE DEXSCREENER)
            </span>
            {priceLoading && (
              <span style={{ fontSize: '9.5px', color: '#38bdf8' }}>Memperbarui harga...</span>
            )}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))',
            gap: '6px'
          }}>
            {JUPITER_INTEGRATOR_CONFIG.supportedMemecoins.filter(t => t.symbol !== 'SOL').map(token => {
              const isSelected = selectedToken.symbol === token.symbol;
              const px = tokenPrices[token.symbol] || 0;
              return (
                <div
                  key={token.symbol}
                  onClick={() => setSelectedToken(token)}
                  style={{
                    background: isSelected ? 'rgba(147, 51, 234, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '6px',
                    padding: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px' }}>{token.icon}</span>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: isSelected ? '#c084fc' : 'var(--text-primary)' }}>
                      ${token.symbol}
                    </span>
                  </div>
                  <div style={{ fontSize: '10.5px', fontWeight: '700', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                    ${px < 0.01 ? px.toFixed(6) : px.toFixed(3)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Swap Box */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '16px'
        }}>
          {/* Input SOL */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>Anda Bayar</span>
              <span>Saldo: {walletState.balance.toFixed(3)} SOL</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '6px 10px'
            }}>
              <input
                type="number"
                step="0.05"
                min="0.01"
                value={inputSol}
                onChange={e => setInputSol(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '700',
                  fontFamily: 'var(--font-mono)',
                  width: '100%',
                  outline: 'none'
                }}
                placeholder="0.0"
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '8px', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', flexShrink: 0 }}>
                <span style={{ fontSize: '14px' }}>🟣</span>
                <span style={{ fontWeight: '800', fontSize: '12px' }}>SOL</span>
              </div>
            </div>
            {/* Quick Amount Buttons */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              {['0.05', '0.1', '0.25', '0.5', '1.0'].map(val => (
                <button
                  key={val}
                  onClick={() => setInputSol(val)}
                  style={{
                    background: inputSol === val ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: inputSol === val ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: inputSol === val ? '#38bdf8' : 'var(--text-muted)',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '9.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {val} SOL
                </button>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: '4px 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            ⬇️
          </div>

          {/* Receive Output */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>Estimasi Diterima</span>
              <span>1 {selectedToken.symbol} = ${tokenPrices[selectedToken.symbol] || 0}</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '6px 10px'
            }}>
              <div style={{
                color: '#10b981',
                fontSize: '16px',
                fontWeight: '800',
                fontFamily: 'var(--font-mono)',
                width: '100%'
              }}>
                ≈ {estimatedOutput}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '8px', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', flexShrink: 0 }}>
                <span style={{ fontSize: '14px' }}>{selectedToken.icon}</span>
                <span style={{ fontWeight: '800', fontSize: '12px' }}>{selectedToken.symbol}</span>
              </div>
            </div>
          </div>

          {/* Fee & Slippage Meta */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: '6px',
            padding: '8px 10px',
            fontSize: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Routing Protocol</span>
              <span style={{ color: '#c084fc', fontWeight: '700' }}>Jupiter DEX v6</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Platform Integrator Fee</span>
              <span style={{ color: '#10b981', fontWeight: '700' }}>0.8% (${platformFeeEarnedUsd})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Toleransi Slippage</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['0.5', '1.0', '2.5'].map(sl => (
                  <span
                    key={sl}
                    onClick={() => setSlippage(sl)}
                    style={{
                      cursor: 'pointer',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: slippage === sl ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                      color: slippage === sl ? '#38bdf8' : 'var(--text-muted)',
                      border: slippage === sl ? '1px solid #38bdf8' : 'none'
                    }}
                  >
                    {sl}%
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleExecuteSwap}
          disabled={false}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #ab9ff2 0%, #7e57c2 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '13px',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>🧮</span>
          <span>SIMULASI ESTIMASI SWAP (DEMO — TIDAK ADA TRANSAKSI)</span>
        </button>

        {/* Honest demo notice — replaces the fabricated success state */}
        {showDemoNotice && (
          <div style={{
            marginTop: '12px',
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.5)',
            borderRadius: '6px',
            padding: '10px',
            fontSize: '10.5px',
            color: '#fbbf24'
          }}>
            <div style={{ fontWeight: '800', marginBottom: '2px' }}>
              ⚠️ MODE DEMO — TIDAK ADA TRANSAKSI TERKIRIM
            </div>
            <div style={{ color: 'var(--text-muted, #94a3b8)' }}>
              Estimasi di atas murni kalkulasi harga (DexScreener) untuk edukasi. Eksekusi swap Jupiter yang sebenarnya belum diaktifkan — dompet Anda aman, tidak ada SOL yang berpindah.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
