// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
export const GOLD = "#C9A84C";
export const GOLD_DARK = "#8B6914";
export const GOLD_PALE = "#F5E9C8";
export const BG = "#0B0D11";
export const SURFACE = "#13161D";
export const SURFACE2 = "#1A1E28";
export const BORDER = "#2A2D3A";
export const TEXT = "#E8E0D0";
export const TEXT_DIM = "#8A8070";

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
