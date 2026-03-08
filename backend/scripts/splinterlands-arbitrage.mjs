#!/usr/bin/env node

// Comparateur prix Splinterlands : AtomicHub (WAX) vs Marketplace officiel
// Usage: node splinterlands-arbitrage.mjs

const MIN_DISCOUNT_PCT = 10;
const ATOMICHUB_PAGE_SIZE = 100;
const ATOMICHUB_MAX_PAGES = 40;

// --- Fetchers parallèles ---

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchWaxUsdRate() {
  const data = await fetchJson(
    "https://api.coingecko.com/api/v3/simple/price?ids=wax&vs_currencies=usd"
  );
  return data.wax.usd;
}

async function fetchCardDetails() {
  const cards = await fetchJson(
    "https://api2.splinterlands.com/cards/get_details"
  );
  const map = new Map();
  for (const c of cards) {
    map.set(c.id, { name: c.name, rarity: c.rarity, edition: c.editions });
  }
  return map;
}

async function fetchSplinterlandsPrices() {
  const listings = await fetchJson(
    "https://api2.splinterlands.com/market/for_sale_grouped"
  );
  const map = new Map();
  for (const item of listings) {
    const key = `${item.card_detail_id}_${item.gold ? "gold" : "reg"}_${item.edition}`;
    const existing = map.get(key);
    const price = parseFloat(item.low_price_bcx || item.low_price);
    if (!existing || price < existing.price) {
      map.set(key, {
        cardId: item.card_detail_id,
        gold: item.gold,
        edition: item.edition,
        price, // USD
        level: item.level || 1,
      });
    }
  }
  return map;
}

// --- AtomicHub paginated fetch ---

async function fetchAtomicHubListings() {
  const allListings = [];
  for (let page = 1; page <= ATOMICHUB_MAX_PAGES; page++) {
    const url =
      `https://wax.api.atomicassets.io/atomicmarket/v2/sales?` +
      `collection_name=splintrlands&state=1&sort=price&order=asc` +
      `&limit=${ATOMICHUB_PAGE_SIZE}&page=${page}`;
    const data = await fetchJson(url);
    if (!data.data || data.data.length === 0) break;
    allListings.push(...data.data);
  }
  return allListings;
}

const EDITION_MAP = {
  Alpha: 0, Beta: 1, Promo: 2, Reward: 3, Untamed: 4, Dice: 5,
  Gladius: 6, Chaos: 7, "Chaos Legion": 7, Rift: 8, Soulbound: 10,
  Rebellion: 12, "Rebellion Reward": 13,
};

function parseAtomicListing(sale, waxUsdRate) {
  const price = sale.price;
  if (!price || !price.amount) return null;

  const waxPrice = parseFloat(price.amount) / Math.pow(10, price.token_precision || 8);
  const usdPrice = waxPrice * waxUsdRate;

  const asset = sale.assets?.[0];
  if (!asset) return null;

  // Extract card_detail_id from splinterlands_id (e.g. "C3-331-1WC4BH7BA8" -> 331)
  const slId = asset.immutable_data?.splinterlands_id || "";
  const idMatch = slId.match(/-(\d+)-/);
  if (!idMatch) return null;
  const cardDetailId = parseInt(idMatch[1], 10);

  const tplData = asset.template?.immutable_data || {};
  const gold = tplData.foil === "Gold";
  const editionName = tplData.edition || "";
  const edition = EDITION_MAP[editionName] ?? -1;

  return { cardDetailId, gold, edition, waxPrice, usdPrice, saleId: sale.sale_id };
}

// --- Main ---

async function main() {
  console.log("Fetching data...\n");

  const [waxUsdRate, cardDetails, slPrices] = await Promise.all([
    fetchWaxUsdRate(),
    fetchCardDetails(),
    fetchSplinterlandsPrices(),
  ]);

  console.log(`WAX/USD: $${waxUsdRate.toFixed(4)}`);
  console.log(`Cards in reference: ${cardDetails.size}`);
  console.log(`SL market groups: ${slPrices.size}\n`);

  console.log("Fetching AtomicHub listings...");
  const atomicListings = await fetchAtomicHubListings();
  console.log(`AtomicHub listings fetched: ${atomicListings.length}\n`);

  // Compare
  const opportunities = [];

  for (const sale of atomicListings) {
    const parsed = parseAtomicListing(sale, waxUsdRate);
    if (!parsed) continue;

    const key = `${parsed.cardDetailId}_${parsed.gold ? "gold" : "reg"}_${parsed.edition}`;
    const slEntry = slPrices.get(key);
    if (!slEntry) continue;

    const discount = ((slEntry.price - parsed.usdPrice) / slEntry.price) * 100;
    if (discount >= MIN_DISCOUNT_PCT) {
      const card = cardDetails.get(parsed.cardDetailId);
      opportunities.push({
        name: card?.name || `#${parsed.cardDetailId}`,
        gold: parsed.gold,
        edition: parsed.edition,
        atomicWax: parsed.waxPrice,
        atomicUsd: parsed.usdPrice,
        slUsd: slEntry.price,
        discount: discount,
        saleId: parsed.saleId,
      });
    }
  }

  opportunities.sort((a, b) => b.discount - a.discount);

  if (opportunities.length === 0) {
    console.log("No arbitrage opportunities found (>= " + MIN_DISCOUNT_PCT + "% discount).");
    return;
  }

  console.log(
    `Found ${opportunities.length} opportunities (>= ${MIN_DISCOUNT_PCT}% cheaper on AtomicHub):\n`
  );
  console.log(
    "Name".padEnd(25) +
      "Gold  " +
      "Ed  " +
      "Atomic(WAX)  " +
      "Atomic(USD)  " +
      "SL(USD)  " +
      "Discount"
  );
  console.log("-".repeat(95));

  for (const o of opportunities) {
    console.log(
      o.name.padEnd(25) +
        (o.gold ? "Yes   " : "No    ") +
        String(o.edition).padEnd(4) +
        o.atomicWax.toFixed(2).padStart(8) + " WAX  " +
        ("$" + o.atomicUsd.toFixed(3)).padStart(9) + "   " +
        ("$" + o.slUsd.toFixed(3)).padStart(8) + "  " +
        o.discount.toFixed(1).padStart(6) + "%"
    );
  }

  console.log(
    `\nVerify: https://atomichub.io/market?collection_name=splintrlands`
  );
  console.log(`        https://splinterlands.com/market`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
