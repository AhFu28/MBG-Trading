/**
 * Cloudflare Pages Function: Telegram Webhook Handler (MBG V2 24/7)
 * Route: /api/telegram-webhook
 * 
 * Menangani pesan masuk dari grup/personal Telegram 24/7 di Cloudflare Edge (<25ms)
 * Tanpa perlu komputer lokal menyala & 100% Gratis (Rp 0 / bulan).
 */

const POPULAR_ALIASES = {
  BCA: "BBCA",
  BRI: "BBRI",
  MANDIRI: "BMRI",
  BNI: "BBNI",
  TELKOM: "TLKM",
  ASTRA: "ASII",
  ANTAM: "ANTM",
  MEDCO: "MEDC",
  ADARO: "ADRO",
  UNILEVER: "UNVR",
  INDOFOOD: "INDF",
  VALE: "INCO",
  BUKAPALAK: "BUKA",
  GOTO: "GOTO",
  BITCOIN: "BTC",
  ETHEREUM: "ETH",
  SOLANA: "SOL",
  RIPPLE: "XRP",
  DOGECOIN: "DOGE",
  CARDANO: "ADA",
  BINANCE: "BNB"
};

const KNOWN_CRYPTO = new Set(["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "LINK", "SUI", "PEPE", "SHIB"]);

// In-memory cache for edge performance
let cachedBundle = null;
let lastCacheTime = 0;

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseCommand(rawText) {
  const clean = rawText.replace(/@\w+/g, "").trim();
  if (!clean) return { type: "UNKNOWN", arg: "" };

  if (/^\/?(news|berita|makro|kabar|snips|recap|daily|brief)$/i.test(clean)) return { type: "NEWS", arg: "" };
  if (/^\/?(research|riset|analisis|deepdive)$/i.test(clean)) return { type: "RESEARCH", arg: "" };
  if (/^\/?(plan|sinyal|rekomendasi)$/i.test(clean)) return { type: "PLAN", arg: "" };
  if (/^\/?(help|start|menu|bantuan)$/i.test(clean)) return { type: "HELP", arg: "" };

  const mDiv = clean.match(/^\/?(?:dividend|dividen)\s*([A-Za-z]{3,10})?$/i);
  if (mDiv) {
    const sym = (mDiv[1] || "").toUpperCase();
    return { type: "DIVIDEND", arg: POPULAR_ALIASES[sym] || sym };
  }

  const mSaham = clean.match(/^\/?(?:saham|stock|saham_bei)\s*([A-Za-z]{3,10})?$/i);
  if (mSaham) {
    const sym = (mSaham[1] || "").toUpperCase();
    if (!sym) return { type: "SAHAM_EMPTY", arg: "" };
    return { type: "SAHAM", arg: POPULAR_ALIASES[sym] || sym };
  }

  const mCrypto = clean.match(/^\/?(?:crypto|kripto|coin)\s*([A-Za-z]{3,10})?$/i);
  if (mCrypto) {
    const sym = (mCrypto[1] || "").toUpperCase();
    if (!sym) return { type: "CRYPTO_EMPTY", arg: "" };
    return { type: "CRYPTO", arg: POPULAR_ALIASES[sym] || sym };
  }

  const mCek = clean.match(/^\/?(?:cek|harga|info)\s+([A-Za-z]{3,10})$/i);
  if (mCek) {
    const sym = mCek[1].toUpperCase();
    const resolved = POPULAR_ALIASES[sym] || sym;
    if (KNOWN_CRYPTO.has(resolved)) {
      return { type: "CRYPTO", arg: resolved };
    }
    return { type: "SAHAM", arg: resolved };
  }

  return { type: "UNKNOWN", arg: clean };
}

async function sendTelegramReply(botToken, chatId, replyToId, htmlText) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: htmlText,
    parse_mode: "HTML",
    disable_web_page_preview: true
  };
  if (replyToId) {
    payload.reply_to_message_id = replyToId;
  }

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("sendTelegramReply error:", err);
  }
}

export async function onRequestGet(context) {
  return new Response(
    JSON.stringify({
      status: "online",
      service: "MBG v2 Telegram Webhook (Cloudflare Pages)",
      timestamp: new Date().toISOString()
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // Security: ENFORCE webhook secret — reject if not configured
  const webhookSecret = env.TELEGRAM_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("TELEGRAM_WEBHOOK_SECRET not configured — rejecting all webhook requests");
    return new Response("Webhook secret not configured", { status: 500 });
  }
  const secretHeader = request.headers.get("x-telegram-bot-api-secret-token");
  if (secretHeader !== webhookSecret) {
    return new Response("Unauthorized", { status: 403 });
  }

  const botToken = env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.warn("TELEGRAM_BOT_TOKEN not configured in environment");
    // Return 200 so Telegram does not trigger exponential retry storm
    return new Response("OK", { status: 200 });
  }

  try {
    const update = await request.json();
    const message = update.message || update.channel_post;
    if (!message || !message.text) {
      return new Response("OK", { status: 200 });
    }

    const chatId = message.chat?.id;
    const messageId = message.message_id;
    const text = message.text;

    const { type, arg } = parseCommand(text);
    if (type === "UNKNOWN") {
      return new Response("OK", { status: 200 });
    }

    // Ambil bundle data dari origin CDN Cloudflare dengan cache 60s
    let bundle = {};
    const now = Date.now();
    if (cachedBundle && now - lastCacheTime < 60000) {
      bundle = cachedBundle;
    } else {
      try {
        const url = new URL(request.url);
        const bundleUrl = `${url.origin}/data/latest_cockpit_bundle.json`;
        const res = await fetch(bundleUrl);
        if (res.ok) {
          bundle = await res.json();
          cachedBundle = bundle;
          lastCacheTime = now;
        }
      } catch (e) {
        console.warn("Could not fetch bundle:", e);
        if (cachedBundle) bundle = cachedBundle;
      }
    }

    let reply = "";

    if (type === "HELP") {
      reply = 
        "🤖 <b>PANDUAN PERINTAH BOT MBG TRADING (24/7 CLOUD)</b>\n\n" +
        "Ketik salah satu perintah berikut di grup kapan saja:\n" +
        "• <code>/brief</code> ➔ Intisari pasar harian (Daily Brief) pagi & sore\n" +
        "• <code>/research</code> ➔ Catatan riset tematik mendalam & evaluasi sepekan\n" +
        "• <code>/saham &lt;KODE&gt;</code> ➔ Cek analisa & level harga saham BEI (cth: <code>/saham BBCA</code>)\n" +
        "• <code>/dividend &lt;KODE&gt;</code> ➔ Cek kalender dividen BEI & kelayakan beli (cth: <code>/dividend PTBA</code>)\n" +
        "• <code>/crypto &lt;KOIN&gt;</code> ➔ Cek harga spot & level kripto (cth: <code>/crypto BTC</code>)\n" +
        "• <code>/news</code> (atau <code>/snips</code>) ➔ Rekap harian pasar & berita berpoin\n" +
        "• <code>/plan</code> ➔ Daftar rekomendasi saham & kripto hari ini\n\n" +
        "💡 <i>Tips: Anda juga bisa ketik santai tanpa garis miring, contoh: <code>brief</code>, <code>research</code>, atau <code>cek BBCA</code>.</i>";
    } else if (type === "NEWS") {
      const macro = bundle.macro_telemetry || {};
      const snips = macro.daily_snips || {};
      const verdict = snips.market_verdict || {};

      const goldP = macro.gold_price || 2750;
      const goldC = macro.gold_change_pct || 0;
      const oilP = macro.brent_oil_price || 74;
      const oilC = macro.brent_oil_change_pct || 0;
      const dxy = macro.dxy_index || 104.5;

      const stanceBadge = esc(verdict.badge || (goldC > 0 ? "🟢 ROTASI KOMODITAS" : "⚪ KONSOLIDASI PASAR"));
      const narrative = esc(verdict.narrative || macro.full_narrative || "IHSG bergerak konsolidatif dengan selektivitas saham solid.");

      const newsList = (macro.live_news || []).slice(0, 3);
      let newsFormatted = "";

      newsList.forEach((n, idx) => {
        const title = esc(n.title);
        const source = esc(n.source);
        const takeaways = (n.key_takeaways && n.key_takeaways.length)
          ? n.key_takeaways.slice(0, 2).map(t => `   ▫️ ${esc(t)}`).join("\n")
          : `   ▫️ ${esc(n.summary || 'Berita pasar dan sentimen terkini.')}`;
        newsFormatted += `${idx + 1}. <b>${title}</b> (<i>${source}</i>)\n${takeaways}\n\n`;
      });

      reply = 
        "📰 <b>MBG DAILY MARKET SNIPS & MACRO BRIEF</b>\n" +
        `Status: ${stanceBadge}\n\n` +
        "🌍 <b>Indikator Komoditas & Dolar:</b>\n" +
        `  • Emas Dunia  : $${goldP.toLocaleString()} (${goldC > 0 ? "+" : ""}${goldC}%) ${goldC > 0 ? "🟢" : "🔴"}\n` +
        `  • Minyak Brent: $${oilP.toLocaleString()} (${oilC > 0 ? "+" : ""}${oilC}%) ${oilC > 0 ? "🟢" : "🔴"}\n` +
        `  • DXY Dollar  : ${dxy} pts 🟡\n\n` +
        `🎯 <b>Market Verdict:</b>\n<i>${narrative}</i>\n\n` +
        `🔥 <b>Berita Pilihan & Poin Kunci:</b>\n${newsFormatted || "1. Pasar finansial konsolidasi sehat.\n\n"}` +
        `💡 <b>Saran Trader:</b>\n<i>${esc(snips.actionable_guidance || "Disiplin pasang stop loss 3-4% dan hindari FOMO.")}</i>`;
    } else if (type === "RESEARCH") {
      const macro = bundle.macro_telemetry || {};
      const newsList = macro.live_news || [];
      const researchItem = newsList.find(n => n.stream === 'RESEARCH' || n.tag === 'RESEARCH') || {
        title: "MBG Sector Research Note: Analisis Rotasi Modal Perbankan vs Komoditas",
        summary: "Riset tematik mendalam mengenai rotasi likuiditas institusi pada klaster saham likuid BEI.",
        key_takeaways: [
          "Sektor Perbankan BUMN (BBRI, BMRI, BBNI): Ketahanan marjin bunga bersih (NIM) dan stabilitas rasio kredit.",
          "Sektor Tambang & Emas (ANTM, BRMS, MDKA): Sensitivitas harga jual rata-rata (ASP) terhadap momentum kenaikan harga emas dunia.",
          "Rekomendasi Alokasi: Terapkan strategi Barbell Strategy (defensif dividen + komoditas rally)."
        ],
        related_tickers: ["BBCA", "BBRI", "ANTM", "MEDC", "MDKA"]
      };

      const rTitle = esc(researchItem.title);
      const rSummary = esc(researchItem.summary);
      const rTakeaways = (researchItem.key_takeaways || []).map((t, idx) => `<b>[${idx+1}]</b> ${esc(t)}`).join("\n\n");
      const rTickers = (researchItem.related_tickers || []).map(t => `$${esc(t)}`).join(", ");

      reply = 
        "🔬 <b>MBG RESEARCH INTELLIGENCE // DEEP DIVE</b>\n\n" +
        `📑 <b>${rTitle}</b>\n\n` +
        `💡 <i>${rSummary}</i>\n\n` +
        "━━━━━━━━━━━━━━━━━━━━━\n" +
        "📋 <b>TEMUAN & ANALISIS RISET:</b>\n\n" +
        `${rTakeaways}\n\n` +
        (rTickers ? `🏛️ <b>Klaster Emiten Fokus:</b> ${rTickers}\n\n` : "") +
        "⚡ <i>Ketik /brief untuk melihat intisari harian pasar.</i>";
    } else if (type === "PLAN") {
      const plans = bundle.daily_trade_plans || [];
      if (!plans.length) {
        reply = "🎯 <b>SAHAM PILIHAN HARI INI</b>\n\n<i>Belum ada trade plan terbit hari ini. Silakan cek kembali saat pasar buka.</i>";
      } else {
        const idxPlans = plans.filter(p => p.market === "IDX").slice(0, 3);
        const cryptoPlans = plans.filter(p => p.market === "CRYPTO").slice(0, 2);

        let lines = ["🎯 <b>SAHAM & KRIPTO PILIHAN HARI INI</b>\n"];
        idxPlans.forEach(p => {
          lines.push(`🟢 <b>$${esc(p.clean_ticker || p.symbol)}</b> [Buy Area: Rp ${p.entry_price?.toLocaleString()}]\n   🔴 SL: Rp ${p.stop_loss?.toLocaleString()} | 🟢 TP: Rp ${p.target_1?.toLocaleString()}`);
        });
        cryptoPlans.forEach(c => {
          lines.push(`🪙 <b>${esc(c.symbol)}</b> [Buy: $${c.entry_price}]\n   🔴 SL: $${c.stop_loss} | 🟢 TP: $${c.target_1}`);
        });
        lines.push("\n⚠️ <i>Pasang batas rugi (Stop Loss) otomatis di sekuritas Anda!</i>");
        reply = lines.join("\n");
      }
    } else if (type === "DIVIDEND") {
      const dividends = bundle.dividend_hunters || [];
      if (!dividends.length) {
        reply = "📅 <b>KALENDER DIVIDEN BEI</b>\n\n<i>Belum ada jadwal dividen dalam radar saat ini.</i>";
      } else if (!arg) {
        let lines = ["📅 <b>KALENDER DIVIDEN BEI (1 BLN TERAKHIR & 3-6 BLN KEDEPAN)</b>\n<i>Daftar jadwal dividen terpilih:</i>\n━━━━━━━━━━━━━━━━━━━━━\n"];
        dividends.slice(0, 7).forEach((item, idx) => {
          const bIcon = item.verdict_badge === 'GREEN' ? '🟢' : item.verdict_badge === 'RED' ? '🔴' : '🟡';
          const diff = item.days_to_cum || 0;
          const countdown = diff === 0 ? "🔴 HARI INI" : diff > 0 ? `H-${diff} Hari` : `PASCA EX (H+${Math.abs(diff)})`;
          lines.push(
            `${idx + 1}. ${bIcon} <b>$${esc(item.ticker)}</b> (${esc(item.company_name)})\n` +
            `   ▫️ Cum Date : <b>${esc(item.cum_date)}</b> [${countdown}]\n` +
            `   ▫️ DPS      : Rp ${Number(item.dps_idr || 0).toLocaleString()} (Yield: <b>${item.dividend_yield_pct}%</b>)\n` +
            `   ▫️ Status   : <b>${esc(item.verdict || 'MONITOR')}</b>\n` +
            `   ▫️ Buy Zone : Rp ${Number(item.buy_zone_low).toLocaleString()} - Rp ${Number(item.buy_zone_high).toLocaleString()}\n`
          );
        });
        lines.push("\n💡 <i>Ketik <code>/dividend &lt;KODE&gt;</code> untuk analisa lengkap (contoh: <code>/dividend HEXA</code>).</i>");
        reply = lines.join("\n");
      } else {
        const match = dividends.find(d => (d.ticker || "").toUpperCase() === arg);
        if (match) {
          const bIcon = match.verdict_badge === 'GREEN' ? '🟢' : match.verdict_badge === 'RED' ? '🔴' : '🟡';
          const diff = match.days_to_cum || 0;
          const countdown = diff === 0 ? "🔴 HARI INI" : diff > 0 ? `H-${diff} Hari` : `PASCA EX (H+${Math.abs(diff)})`;
          reply = 
            `📊 <b>ANALISA DIVIDEN: $${esc(match.ticker)} (${esc(match.company_name)})</b>\n` +
            `Status: ${bIcon} <b>${esc(match.verdict)}</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n` +
            `🗓️ <b>JADWAL DISTRIBUSI:</b>\n` +
            `  • Cum Date     : <b>${esc(match.cum_date)}</b> [${countdown}]\n` +
            `  • Ex Date      : <b>${esc(match.ex_date)}</b>\n` +
            `  • Payment Date : <b>${esc(match.payment_date)}</b>\n\n` +
            `💰 <b>METRIK & IMBAL HASIL:</b>\n` +
            `  • Harga Terkini : Rp ${Number(match.price).toLocaleString()}\n` +
            `  • Estimasi DPS  : <b>Rp ${Number(match.dps_idr).toLocaleString()}</b>\n` +
            `  • Yield Dividen : <b>${match.dividend_yield_pct}%</b>\n` +
            `  • Payout Ratio  : ${match.payout_ratio}%\n\n` +
            `⚠️ <b>RADAR DIVIDEND TRAP:</b>\n` +
            `  • Risiko Trap   : <b>${esc(match.dividend_trap_risk)}</b>\n` +
            `  • Hist. Drop Ex : -${match.historical_drop_pct}%\n\n` +
            `🎯 <b>WORTH TO BUY REKOMENDASI:</b>\n` +
            `  ▫️ <i>${esc(match.summary)}</i>\n` +
            `  🟢 <b>Buy Zone</b> : Rp ${Number(match.buy_zone_low).toLocaleString()} - Rp ${Number(match.buy_zone_high).toLocaleString()}\n` +
            `  🔴 <b>Stop Loss</b>: Rp ${Number(match.sl).toLocaleString()}\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n` +
            `⚠️ <i>Hindari membeli di Hari-H Cum Date saat harga sudah overbought!</i>`;
        } else {
          reply = `📅 <b>DIVIDEN $${esc(arg)}</b>\n\nBelum ada pengumuman jadwal dividen resmi untuk emiten <b>${esc(arg)}</b> dalam radar terdekat.`;
        }
      }
    } else if (type === "SAHAM_EMPTY") {
      reply = "⚠️ <b>KODE SAHAM BELUM DIISI</b>\n\nFormat: <code>/saham &lt;KODE&gt;</code>\nContoh: <code>/saham BBCA</code> atau <code>/saham ANTM</code>";
    } else if (type === "CRYPTO_EMPTY") {
      reply = "⚠️ <b>KODE KRIPTO BELUM DIISI</b>\n\nFormat: <code>/crypto &lt;KOIN&gt;</code>\nContoh: <code>/crypto BTC</code> atau <code>/crypto SOL</code>";
    } else if (type === "SAHAM") {
      const plans = bundle.daily_trade_plans || [];
      const match = plans.find(p => (p.clean_ticker || p.symbol || "").toUpperCase() === arg);
      if (match) {
        reply = 
          `📈 <b>ANALISA SAHAM: $${esc(arg)}</b>\n` +
          `Status: 🟢 <b>AKUMULASI (SINYAL RESMI)</b>\n\n` +
          `💵 Harga Acuan     : Rp ${match.entry_price?.toLocaleString()}\n` +
          `📊 Sinyal Teknikal : <b>${esc(match.technical_signal || "BUY")}</b>\n\n` +
          `🎯 <b>PANDUAN TRADING:</b>\n` +
          `  🟢 Buy Area       : Rp ${match.entry_price?.toLocaleString()}\n` +
          `  🔴 Stop Loss (SL) : Rp ${match.stop_loss?.toLocaleString()} (Disiplin Cut Loss jika jebol!)\n` +
          `  🟢 Target Untung  : Rp ${match.target_1?.toLocaleString()} (R:R 1:${match.risk_reward_ratio || 2.0})\n\n` +
          `💡 <i>Catatan: ${esc(match.opinion_thesis || "Didukung akumulasi terukur.")}</i>`;
      } else {
        reply = 
          `📈 <b>ANALISA SAHAM: $${esc(arg)}</b>\n` +
          `Status: 🟢 <b>WATCHLIST BURSA EFEK INDONESIA</b>\n\n` +
          `📊 Informasi saham <b>$${esc(arg)}</b> siap dipantau.\n` +
          `💡 <i>Saran: Gunakan manajemen risiko ketat dan pantau volume saat pembukaan sesi 1.</i>`;
      }
    } else if (type === "CRYPTO") {
      const cryptos = bundle.crypto_spot_10 || [];
      const pairKey = `${arg}/USDT`;
      const match = cryptos.find(c => c.pair === pairKey || c.pair === arg);
      if (match) {
        reply = 
          `🪙 <b>ANALISA KRIPTO: ${esc(pairKey)}</b>\n` +
          `Status: 🟢 <b>TREN POSITIF (SPOT WATCHLIST)</b>\n\n` +
          `💵 Harga Spot     : $${match.current_price}\n` +
          `📊 Signal Teknikal: <b>${esc(match.technical_signal || "LONG")}</b>\n\n` +
          `🎯 <b>LEVEL KRUSIAL:</b>\n` +
          `  🟢 Buy Area           : $${match.current_price}\n` +
          `  🔴 Stop Loss (SL)     : $${match.stop_loss}\n` +
          `  🟢 Target Profit (TP) : $${match.take_profit_1}\n\n` +
          `💡 <i>Saran Awam: Kripto aktif 24 jam. Pasang limit order demi keamanan dana.</i>`;
      } else {
        reply = 
          `🪙 <b>ANALISA KRIPTO: ${esc(arg)}/USDT</b>\n` +
          `Status: 🟢 <b>SPOT MARKET WATCH</b>\n\n` +
          `Koin <b>${esc(arg)}</b> dipantau pada pasar spot USDT.\n` +
          `💡 <i>Saran: Selalu gunakan batas risiko stop loss terukur.</i>`;
      }
    }

    if (reply) {
      await sendTelegramReply(botToken, chatId, messageId, reply);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook processing error:", err);
    // Return 200 to satisfy Telegram webhook contract and prevent infinite retry loops
    return new Response("OK", { status: 200 });
  }
}
