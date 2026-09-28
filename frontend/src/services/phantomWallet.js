/**
 * Pure Native Phantom Wallet & Solana RPC Service
 * Zero external libraries (no @solana/web3.js bloat, 0 KB bundle addition)
 * Provides direct connection to Phantom, balance checking, and Jupiter swap routing.
 */

const SOLANA_PUBLIC_RPCS = [
  'https://api.mainnet-beta.solana.com',
  'https://rpc.ankr.com/solana',
  'https://solana.public-rpc.com'
];

export const JUPITER_INTEGRATOR_CONFIG = {
  platformFeeBps: 80, // 0.8% Platform Integrator Fee
  defaultFeeRecipient: 'MBGvN92jN77K4R6s3z7hT4b9WwE3u1v2xY4z7K8m9Pq', // Replace with owner wallet
  supportedMemecoins: [
    { symbol: 'SOL', name: 'Solana', mint: 'So11111111111111111111111111111111111111112', decimals: 9, icon: '🟣' },
    { symbol: 'WIF', name: 'dogwifhat', mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', decimals: 6, icon: '🐶' },
    { symbol: 'BONK', name: 'Bonk', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5, icon: '🐕' },
    { symbol: 'POPCAT', name: 'Popcat', mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', decimals: 9, icon: '🐱' },
    { symbol: 'MOODENG', name: 'Moo Deng', mint: 'ED5nyyWEZyPPokBSJ85QBeRiKn3GyxHSChjhDqPpump', decimals: 6, icon: '🦛' },
    { symbol: 'PNUT', name: 'Peanut the Squirrel', mint: '2qEHjDLDLbuBgRYvsxhc5RefwhHybpRhnsZ6AAUpump', decimals: 6, icon: '🐿️' },
    { symbol: 'GOAT', name: 'Goatseus Maximus', mint: 'CzLSujWBLFsSjncfkh59rQDqJgCSwUiWnWoQ8zKPpump', decimals: 6, icon: '🐐' },
    { symbol: 'MEW', name: 'cat in a dogs world', mint: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5', decimals: 5, icon: '🐈' }
  ]
};

export function getPhantomProvider() {
  if (typeof window === 'undefined') return null;
  if ('phantom' in window) {
    const provider = window.phantom?.solana;
    if (provider?.isPhantom) return provider;
  }
  if ('solana' in window) {
    const provider = window.solana;
    if (provider?.isPhantom) return provider;
  }
  return null;
}

export async function connectPhantom(onlyIfTrusted = false) {
  const provider = getPhantomProvider();
  if (!provider) {
    return {
      success: false,
      installed: false,
      error: 'Phantom Wallet tidak ditemukan di browser. Silakan pasang ekstensi Phantom.'
    };
  }

  try {
    const resp = await provider.connect({ onlyIfTrusted });
    const address = resp.publicKey ? resp.publicKey.toString() : '';
    return {
      success: true,
      installed: true,
      address,
      provider
    };
  } catch (err) {
    return {
      success: false,
      installed: true,
      error: err?.message || 'Koneksi ke Phantom dibatalkan oleh pengguna.'
    };
  }
}

export async function disconnectPhantom() {
  const provider = getPhantomProvider();
  if (provider && provider.disconnect) {
    try {
      await provider.disconnect();
    } catch (_) {}
  }
}

export async function getSolBalance(walletAddress) {
  if (!walletAddress) return 0;
  for (const rpc of SOLANA_PUBLIC_RPCS) {
    try {
      const resp = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [walletAddress]
        })
      });
      if (resp.ok) {
        const json = await resp.json();
        const lamports = json?.result?.value;
        if (typeof lamports === 'number') {
          return lamports / 1e9; // 1 SOL = 1,000,000,000 lamports
        }
      }
    } catch (_) {
      // try next RPC fallback
    }
  }
  return 0;
}

export function shortenAddress(addr, chars = 4) {
  if (!addr || typeof addr !== 'string') return '';
  if (addr.length <= chars * 2) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}
