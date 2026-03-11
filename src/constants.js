// ─── DOMAIN CONSTANTS ────────────────────────────────────────────────────────
export const BRANCHES = [
  "Dubai Mall", "Deira Gold Souk", "Gold & Diamond Park", "Mall of Emirates",
  "Ibn Battuta Mall", "Bur Dubai", "Karama Center", "Meena Bazaar",
  "Al Ghurair Center", "Mirdif City Centre", "Dragon Mart", "Silicon Oasis",
  "Business Bay", "DIFC", "JBR Walk", "Marina Mall", "Al Barsha", "Jumeirah",
  "Oud Metha", "Al Quoz", "Satwa", "Al Mankhool"
];

export const CATEGORIES = ["Rings", "Bangles", "Necklaces", "Chains", "Earrings", "Bracelets", "Pendants", "Sets"];
export const CARATS = ["24K", "18K"];

// ─── FORMATTERS ──────────────────────────────────────────────────────────────
export const fmt = (n) => n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n;
export const fmtAED = (n) => `AED ${fmt(n)}`;
