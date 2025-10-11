// src/services/metalRates.js
// Provides live metal rates for Gold, Silver, Platinum.
// Uses mock data by default with gentle variations.
// Optionally integrates with external APIs when environment variables are configured.

const BASES = {
  gold: { central: 11000, india: 11400, local: 11450 }, // per gram (INR)
  silver: { central: 11000, india: 11000, local: 11000 },
  platinum: { central: 45400, india: 11000, local: 11000 },
};

function jitter(value, pct = 0.005) {
  const delta = value * pct;
  const change = (Math.random() * 2 - 1) * delta;
  return Math.max(0, Number((value + change).toFixed(2)));
}

export async function getMetalRates({ market = 'Local Market', useLiveApi = false } = {}) {
  // Placeholder for API-driven implementation
  if (useLiveApi) {
    // Example skeleton for future integration
    // const apiKey = process.env.REACT_APP_GOLD_API_KEY;
    // if (!apiKey) console.warn('Missing REACT_APP_GOLD_API_KEY; falling back to mock data');
    // try { ...fetch and map... } catch { ...fallback... }
  }

  // Mocked values with small variations per call
  const gold = {
    central: jitter(BASES.gold.central),
    india: jitter(BASES.gold.india),
    local: jitter(BASES.gold.local),
  };
  const silver = {
    central: jitter(BASES.silver.central),
    india: jitter(BASES.silver.india),
    local: jitter(BASES.silver.local),
  };
  const platinum = {
    central: jitter(BASES.platinum.central),
    india: jitter(BASES.platinum.india),
    local: jitter(BASES.platinum.local),
  };

  return {
    market,
    updatedAt: new Date().toISOString(),
    gold,
    silver,
    platinum,
    currency: 'INR',
    unit: 'gram',
  };
}

export function formatCurrencyINR(value) {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);
  } catch {
    return `₹${Number(value).toFixed(2)}`;
  }
}
