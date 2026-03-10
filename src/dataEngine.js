import { BRANCHES, CATEGORIES, CARATS, fmt } from './constants';

// ─── RANDOM HELPERS ──────────────────────────────────────────────────────────
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rndF(min, max) { return (Math.random() * (max - min) + min).toFixed(1); }

// Small delta for live updates: value ± pct%
function nudge(value, pct = 5) {
  const delta = value * (pct / 100) * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(value + delta));
}

// ─── SEED DATA GENERATORS ───────────────────────────────────────────────────
export function generateBranchData() {
  return BRANCHES.map((name, i) => ({
    id: i,
    name,
    shortName: name.length > 12 ? name.slice(0, 11) + "…" : name,
    sales24K: rnd(80000, 480000),
    sales18K: rnd(50000, 320000),
    grams24K: rnd(200, 1200),
    grams18K: rnd(150, 900),
    transactions: rnd(40, 280),
    stock24K: rnd(100, 800),
    stock18K: rnd(80, 600),
    reorderLevel24K: 150,
    reorderLevel18K: 100,
    fastMoving: CATEGORIES[rnd(0, 4)],
    slowMoving: CATEGORIES[rnd(5, 7)],
    avgOrderValue: rnd(2800, 18000),
    inventoryAge: rnd(3, 45),
    // Per-branch category breakdown (for category filtering)
    categoryBreakdown: CATEGORIES.map(cat => ({
      category: cat,
      sales24K: rnd(5000, 60000),
      sales18K: rnd(3000, 40000),
      qty: rnd(2, 30),
      grams: parseFloat(rndF(5, 60)),
    })),
  }));
}

// Live-tick existing branch data with small fluctuations
export function tickBranchData(prev) {
  return prev.map(b => ({
    ...b,
    sales24K: nudge(b.sales24K, 3),
    sales18K: nudge(b.sales18K, 3),
    grams24K: nudge(b.grams24K, 2),
    grams18K: nudge(b.grams18K, 2),
    transactions: nudge(b.transactions, 4),
    stock24K: nudge(b.stock24K, 1),
    stock18K: nudge(b.stock18K, 1),
    avgOrderValue: nudge(b.avgOrderValue, 2),
    categoryBreakdown: b.categoryBreakdown.map(cb => ({
      ...cb,
      sales24K: nudge(cb.sales24K, 3),
      sales18K: nudge(cb.sales18K, 3),
      qty: nudge(cb.qty, 5),
    })),
  }));
}

export function generateHourlyData() {
  return Array.from({ length: 24 }, (_, h) => ({
    hour: `${h.toString().padStart(2, "0")}:00`,
    sales24K: h >= 10 && h <= 21 ? rnd(8000, 55000) : rnd(0, 4000),
    sales18K: h >= 10 && h <= 21 ? rnd(5000, 35000) : rnd(0, 3000),
    sales: h >= 10 && h <= 21 ? rnd(15000, 95000) : rnd(0, 8000),
    transactions: h >= 10 && h <= 21 ? rnd(5, 45) : rnd(0, 5),
  }));
}

export function generateDailyData() {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => ({
    day: d,
    "24K": rnd(120000, 650000),
    "18K": rnd(80000, 420000),
  }));
}

export function generateMonthlyData() {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => ({
    month: m,
    "24K": rnd(1200000, 4800000),
    "18K": rnd(800000, 3200000),
    target: 4000000,
  }));
}

export function generateTopItems(branches, filterCarat = "All", filterCategory = "All") {
  let items = CATEGORIES.map(cat => {
    const carats = filterCarat === "All" ? CARATS : [filterCarat];
    return carats.map(carat => {
      const is24 = carat === "24K";
      const totalQty = branches.reduce((s, b) => {
        const cb = b.categoryBreakdown.find(c => c.category === cat);
        return s + (cb ? cb.qty : 0);
      }, 0);
      const totalRevenue = branches.reduce((s, b) => {
        const cb = b.categoryBreakdown.find(c => c.category === cat);
        return s + (cb ? (is24 ? cb.sales24K : cb.sales18K) : 0);
      }, 0);
      const totalGrams = branches.reduce((s, b) => {
        const cb = b.categoryBreakdown.find(c => c.category === cat);
        return s + (cb ? cb.grams : 0);
      }, 0);
      return {
        category: cat,
        carat,
        qty: totalQty,
        grams: parseFloat(totalGrams.toFixed(1)),
        revenue: totalRevenue,
        avgDaysToSell: rnd(1, 12),
      };
    });
  }).flat();

  if (filterCategory !== "All") {
    items = items.filter(i => i.category === filterCategory);
  }

  return items.sort((a, b) => b.revenue - a.revenue).slice(0, 8);
}

export function generateSlowItems(branches, filterCarat = "All", filterCategory = "All") {
  let items = CATEGORIES.slice().reverse().map(cat => ({
    category: cat,
    carat: CARATS[rnd(0, 1)],
    daysInStock: rnd(14, 60),
    stock: rnd(5, 40),
    lastSale: `${rnd(8, 45)} days ago`,
    branch: branches[rnd(0, branches.length - 1)]?.name || BRANCHES[0],
  }));

  if (filterCarat !== "All") items = items.filter(i => i.carat === filterCarat);
  if (filterCategory !== "All") items = items.filter(i => i.category === filterCategory);

  return items;
}

// ─── AI INTELLIGENCE ENGINE ─────────────────────────────────────────────────
export function generateAIInsights(branches, { filterCarat = "All", filterBranch = "All Branches", filterDate = "Today" } = {}) {
  if (branches.length === 0) {
    return { notifications: [], summary: "No data for the current filter selection.", criticalCount: 0, reorderSuggestions: [], transferOps: [], stats: {} };
  }

  const sorted = [...branches].sort((a, b) => (b.sales24K + b.sales18K) - (a.sales24K + a.sales18K));
  const top = sorted[0], bottom = sorted[sorted.length - 1];
  const lowStock = branches.filter(b => b.stock24K < b.reorderLevel24K || b.stock18K < b.reorderLevel18K);
  const overstock = branches.filter(b => b.stock24K > 600 || b.stock18K > 450);
  const aging = branches.filter(b => b.inventoryAge > 30);
  const fastMovers = branches.filter(b => b.transactions > 200);
  const t24K = branches.reduce((s, b) => s + b.sales24K, 0);
  const t18K = branches.reduce((s, b) => s + b.sales18K, 0);
  const caratPct = ((t24K / (t24K + t18K)) * 100).toFixed(1);
  const totalRev = t24K + t18K;
  const totalTxn = branches.reduce((s, b) => s + b.transactions, 0);

  const notifs = [];
  let id = 1;
  const now = Date.now();

  // Context label for AI summary
  const ctx = [];
  if (filterCarat !== "All") ctx.push(`${filterCarat} only`);
  if (filterBranch !== "All Branches") ctx.push(filterBranch);
  if (filterDate !== "Today") ctx.push(filterDate);
  const ctxLabel = ctx.length > 0 ? ` [Filtered: ${ctx.join(" · ")}]` : "";

  lowStock.forEach(b => {
    const is24 = b.stock24K < b.reorderLevel24K;
    if (filterCarat !== "All" && filterCarat !== (is24 ? "24K" : "18K")) return;
    notifs.push({
      id: id++, type: "critical", icon: "🔴", title: "Low Stock Alert",
      msg: `${is24 ? "24K" : "18K"} below threshold in ${b.name}. Only ${is24 ? b.stock24K : b.stock18K}g remaining.`,
      time: formatRelativeTime(now - rnd(1, 30) * 60000), action: `Reorder ${is24 ? "24K" : "18K"} for ${b.name}`
    });
  });

  fastMovers.forEach(b => {
    notifs.push({
      id: id++, type: "warning", icon: "🟡", title: "Fast Moving",
      msg: `${b.fastMoving} selling fast in ${b.name} (${b.transactions} txns) — reorder within 48h.`,
      time: formatRelativeTime(now - rnd(5, 60) * 60000), action: `Review ${b.name} stock`
    });
  });

  overstock.forEach(b => {
    notifs.push({
      id: id++, type: "info", icon: "🔵", title: "Overstock Detected",
      msg: `${b.name} has excess ${b.stock24K > 600 ? `${b.stock24K}g 24K` : `${b.stock18K}g 18K`}. Consider branch transfer.`,
      time: formatRelativeTime(now - rnd(15, 120) * 60000), action: "Plan transfer"
    });
  });

  aging.forEach(b => {
    notifs.push({
      id: id++, type: "warning", icon: "⏳", title: "Aging Inventory",
      msg: `${b.name}: stock aging ${b.inventoryAge}d. Consider markdown for ${b.slowMoving}.`,
      time: formatRelativeTime(now - rnd(2, 8) * 3600000), action: "Review markdown"
    });
  });

  notifs.push({
    id: id++, type: "success", icon: "🟢", title: "Top Performer",
    msg: `${top.name} leads with AED ${fmt(top.sales24K + top.sales18K)} total revenue.`, time: formatRelativeTime(now - 3600000)
  });

  if (branches.length > 1) {
    notifs.push({
      id: id++, type: "warning", icon: "🟡", title: "Underperformer",
      msg: `${bottom.name} at AED ${fmt(bottom.sales24K + bottom.sales18K)} — lowest across ${branches.length} branches.`, time: formatRelativeTime(now - 7200000)
    });
  }

  notifs.push({
    id: id++, type: "success", icon: "🟢", title: "AI Forecast",
    msg: `Weekend demand predicted +${rnd(15, 35)}% for ${filterCarat === "All" ? "24K" : filterCarat} Necklaces in top 5 branches. Stock up now.`, time: formatRelativeTime(now - 10800000)
  });

  notifs.push({
    id: id++, type: "info", icon: "📊", title: "Carat Shift",
    msg: `18K preference rising in ${sorted.slice(Math.min(3, sorted.length - 1), Math.min(5, sorted.length)).map(b => b.name).join(" & ")} (+${rnd(8, 24)}% vs last week).`,
    time: formatRelativeTime(now - 14400000)
  });

  notifs.push({
    id: id++, type: "info", icon: "🔵", title: "EOD Summary",
    msg: `Total: AED ${fmt(totalRev)} | 24K: ${fmt(t24K)} | 18K: ${fmt(t18K)} | ${totalTxn} transactions.`, time: formatRelativeTime(now - 18000000)
  });

  const summary = `${top.name} leads ${branches.length > 1 ? `all ${branches.length} branches` : ""} with AED ${fmt(top.sales24K + top.sales18K)} total revenue. ` +
    `${lowStock.length} branch${lowStock.length !== 1 ? "es" : ""} below reorder threshold` +
    `${lowStock.length > 0 ? " — replenish " + lowStock.slice(0, 2).map(b => b.name).join(" and ") + " immediately" : ""}. ` +
    `Carat split: ${caratPct}% revenue is 24K. ` +
    `${aging.length > 0 ? aging.length + " branches show inventory aging >30d. " : ""}` +
    `${overstock.length > 0 ? overstock.length + " branches overstocked — transfers recommended." : "Stock levels optimal."}` +
    ctxLabel;

  const reorderSuggestions = lowStock.map(b => {
    const is24 = b.stock24K < b.reorderLevel24K;
    if (filterCarat !== "All" && filterCarat !== (is24 ? "24K" : "18K")) return null;
    const deficit = is24 ? b.reorderLevel24K - b.stock24K + rnd(50, 150) : b.reorderLevel18K - b.stock18K + rnd(30, 100);
    return { branch: b.name, carat: is24 ? "24K" : "18K", currentStock: is24 ? b.stock24K : b.stock18K, suggestedOrder: deficit, urgency: deficit > 100 ? "HIGH" : "MEDIUM" };
  }).filter(Boolean);

  const transferOps = overstock.slice(0, 3).map(b => {
    const target = lowStock.length > 0 ? lowStock[rnd(0, lowStock.length - 1)] : sorted[sorted.length - rnd(1, Math.min(3, sorted.length))];
    const is24Over = b.stock24K > 600;
    if (filterCarat !== "All" && filterCarat !== (is24Over ? "24K" : "18K")) return null;
    return { from: b.name, to: target?.name || "Warehouse", carat: is24Over ? "24K" : "18K", qty: rnd(80, 200), savings: `AED ${rnd(5, 15)}K` };
  }).filter(Boolean);

  return {
    notifications: notifs.slice(0, 12), summary, criticalCount: notifs.filter(n => n.type === "critical").length, reorderSuggestions, transferOps,
    stats: { lowStock: lowStock.length, overstock: overstock.length, aging: aging.length, caratPct, topBranch: top, bottomBranch: bottom }
  };
}

function formatRelativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── COMPUTE FILTERED DATA ──────────────────────────────────────────────────
export function computeFilteredMetrics(branches, filterCarat, dateMultiplier = 1, filterCategory = "All") {
  let totalSales, totalGrams, total24K, total18K, totalTxns;

  if (filterCategory !== "All") {
    // When a specific category is selected, compute from categoryBreakdown
    total24K = branches.reduce((s, b) => {
      const cb = b.categoryBreakdown?.find(c => c.category === filterCategory);
      return s + (cb ? cb.sales24K : 0);
    }, 0);
    total18K = branches.reduce((s, b) => {
      const cb = b.categoryBreakdown?.find(c => c.category === filterCategory);
      return s + (cb ? cb.sales18K : 0);
    }, 0);
    totalGrams = branches.reduce((s, b) => {
      const cb = b.categoryBreakdown?.find(c => c.category === filterCategory);
      return s + (cb ? cb.grams : 0);
    }, 0);
    totalTxns = branches.reduce((s, b) => {
      const cb = b.categoryBreakdown?.find(c => c.category === filterCategory);
      return s + (cb ? cb.qty : 0);
    }, 0);
  } else {
    // All categories — use branch-level totals
    total24K = branches.reduce((s, b) => s + b.sales24K, 0);
    total18K = branches.reduce((s, b) => s + b.sales18K, 0);
    totalGrams = branches.reduce((s, b) => s + b.grams24K + b.grams18K, 0);
    totalTxns = branches.reduce((s, b) => s + b.transactions, 0);
  }

  if (filterCarat === "24K") {
    totalSales = total24K;
    if (filterCategory === "All") totalGrams = branches.reduce((s, b) => s + b.grams24K, 0);
  } else if (filterCarat === "18K") {
    totalSales = total18K;
    if (filterCategory === "All") totalGrams = branches.reduce((s, b) => s + b.grams18K, 0);
  } else {
    totalSales = total24K + total18K;
  }

  const lowStockCount = branches.filter(b => b.stock24K < b.reorderLevel24K || b.stock18K < b.reorderLevel18K).length;

  // Apply date multiplier
  totalSales = Math.round(totalSales * dateMultiplier);
  totalGrams = Math.round(totalGrams * dateMultiplier);
  total24K = Math.round(total24K * dateMultiplier);
  total18K = Math.round(total18K * dateMultiplier);
  totalTxns = Math.round(totalTxns * (filterCategory !== "All" ? dateMultiplier : 1));

  const caratPct24K = total24K + total18K > 0 ? Math.round((total24K / (total24K + total18K)) * 100) : 50;
  const caratPct18K = 100 - caratPct24K;

  return { totalSales, totalGrams, total24K, total18K, totalTxns, lowStockCount, caratPct24K, caratPct18K };
}

export const DATE_MULTIPLIERS = { "Today": 1, "This Week": 7, "This Month": 30, "Custom Range": 15 };
