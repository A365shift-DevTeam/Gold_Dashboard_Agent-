import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

// ─── DUMMY DATA ──────────────────────────────────────────────────────────────
const BRANCHES = [
  "Dubai Mall", "Deira Gold Souk", "Gold & Diamond Park", "Mall of Emirates",
  "Ibn Battuta Mall", "Bur Dubai", "Karama Center", "Meena Bazaar",
  "Al Ghurair Center", "Mirdif City Centre", "Dragon Mart", "Silicon Oasis",
  "Business Bay", "DIFC", "JBR Walk", "Marina Mall", "Al Barsha", "Jumeirah",
  "Oud Metha", "Al Quoz", "Satwa", "Al Mankhool"
];

const CATEGORIES = ["Rings", "Bangles", "Necklaces", "Chains", "Earrings", "Bracelets", "Pendants", "Sets"];
const CARATS = ["24K", "18K"];

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rndF(min, max) { return (Math.random() * (max - min) + min).toFixed(1); }

const branchData = BRANCHES.map((name, i) => ({
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
}));

const hourlyData = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h.toString().padStart(2, "0")}:00`,
  sales: h >= 10 && h <= 21 ? rnd(15000, 95000) : rnd(0, 8000),
  transactions: h >= 10 && h <= 21 ? rnd(5, 45) : rnd(0, 5),
}));

const dailyData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => ({
  day: d,
  "24K": rnd(120000, 650000),
  "18K": rnd(80000, 420000),
}));

const monthlyData = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => ({
  month: m,
  "24K": rnd(1200000, 4800000),
  "18K": rnd(800000, 3200000),
  target: 4000000,
}));

const caratShare = [
  { name: "24K", value: 62, color: "#C9A84C" },
  { name: "18K", value: 38, color: "#8B6914" },
];

const topItems = CATEGORIES.map(cat => ({
  category: cat,
  carat: CARATS[rnd(0, 1)],
  qty: rnd(20, 180),
  grams: parseFloat(rndF(50, 500)),
  revenue: rnd(45000, 380000),
  avgDaysToSell: rnd(1, 12),
})).sort((a, b) => b.revenue - a.revenue);

const slowItems = CATEGORIES.slice().reverse().map(cat => ({
  category: cat,
  carat: CARATS[rnd(0, 1)],
  daysInStock: rnd(14, 60),
  stock: rnd(5, 40),
  lastSale: `${rnd(8, 45)} days ago`,
  branch: BRANCHES[rnd(0, 21)],
}));

// ─── AI INTELLIGENCE ENGINE ─────────────────────────────────────────────────
function generateAIInsights(branches) {
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

  lowStock.forEach(b => {
    const is24 = b.stock24K < b.reorderLevel24K;
    notifs.push({
      id: id++, type: "critical", icon: "🔴", title: "Low Stock Alert",
      msg: `${is24 ? "24K" : "18K"} below threshold in ${b.name}. Only ${is24 ? b.stock24K : b.stock18K}g remaining.`,
      time: `${rnd(1, 30)} min ago`, action: `Reorder ${is24 ? "24K" : "18K"} for ${b.name}`
    });
  });

  fastMovers.forEach(b => {
    notifs.push({
      id: id++, type: "warning", icon: "🟡", title: "Fast Moving",
      msg: `${b.fastMoving} selling fast in ${b.name} (${b.transactions} txns) — reorder within 48h.`,
      time: `${rnd(5, 60)} min ago`, action: `Review ${b.name} stock`
    });
  });

  overstock.forEach(b => {
    notifs.push({
      id: id++, type: "info", icon: "🔵", title: "Overstock Detected",
      msg: `${b.name} has excess ${b.stock24K > 600 ? `${b.stock24K}g 24K` : `${b.stock18K}g 18K`}. Consider branch transfer.`,
      time: `${rnd(15, 120)} min ago`, action: "Plan transfer"
    });
  });

  aging.forEach(b => {
    notifs.push({
      id: id++, type: "warning", icon: "�", title: "Aging Inventory",
      msg: `${b.name}: stock aging ${b.inventoryAge}d. Consider markdown for ${b.slowMoving}.`,
      time: `${rnd(2, 8)}h ago`, action: "Review markdown"
    });
  });

  notifs.push({
    id: id++, type: "success", icon: "🟢", title: "Top Performer",
    msg: `${top.name} leads with AED ${fmt(top.sales24K + top.sales18K)} total revenue today.`, time: "1h ago"
  });
  notifs.push({
    id: id++, type: "warning", icon: "🟡", title: "Underperformer",
    msg: `${bottom.name} at AED ${fmt(bottom.sales24K + bottom.sales18K)} — lowest across branches.`, time: "2h ago"
  });
  notifs.push({
    id: id++, type: "success", icon: "🟢", title: "AI Forecast",
    msg: `Weekend demand predicted +${rnd(15, 35)}% for 24K Necklaces in top 5 branches. Stock up now.`, time: "3h ago"
  });
  notifs.push({
    id: id++, type: "info", icon: "�", title: "Carat Shift",
    msg: `18K preference rising in ${sorted.slice(3, 5).map(b => b.name).join(" & ")} (+${rnd(8, 24)}% vs last week).`, time: "4h ago"
  });
  notifs.push({
    id: id++, type: "info", icon: "🔵", title: "EOD Summary",
    msg: `Total: AED ${fmt(totalRev)} | 24K: ${fmt(t24K)} | 18K: ${fmt(t18K)} | ${totalTxn} transactions.`, time: "5h ago"
  });

  const summary = `${top.name} leads all branches with AED ${fmt(top.sales24K + top.sales18K)} total revenue. ` +
    `${lowStock.length} branch${lowStock.length !== 1 ? "es" : ""} below reorder threshold` +
    `${lowStock.length > 0 ? " — replenish " + lowStock.slice(0, 2).map(b => b.name).join(" and ") + " immediately" : ""}. ` +
    `Carat split: ${caratPct}% revenue is 24K. ` +
    `${aging.length > 0 ? aging.length + " branches show inventory aging >30d. " : ""}` +
    `${overstock.length > 0 ? overstock.length + " branches overstocked — transfers recommended." : "Stock levels optimal."}`;

  // Reorder suggestions
  const reorderSuggestions = lowStock.map(b => {
    const is24 = b.stock24K < b.reorderLevel24K;
    const deficit = is24 ? b.reorderLevel24K - b.stock24K + rnd(50, 150) : b.reorderLevel18K - b.stock18K + rnd(30, 100);
    return { branch: b.name, carat: is24 ? "24K" : "18K", currentStock: is24 ? b.stock24K : b.stock18K, suggestedOrder: deficit, urgency: deficit > 100 ? "HIGH" : "MEDIUM" };
  });

  // Transfer opportunities
  const transferOps = overstock.slice(0, 3).map(b => {
    const target = lowStock.length > 0 ? lowStock[rnd(0, lowStock.length - 1)] : sorted[sorted.length - rnd(1, 3)];
    const is24Over = b.stock24K > 600;
    return { from: b.name, to: target?.name || "Warehouse", carat: is24Over ? "24K" : "18K", qty: rnd(80, 200), savings: `AED ${rnd(5, 15)}K` };
  });

  return {
    notifications: notifs.slice(0, 12), summary, criticalCount: notifs.filter(n => n.type === "critical").length, reorderSuggestions, transferOps,
    stats: { lowStock: lowStock.length, overstock: overstock.length, aging: aging.length, caratPct, topBranch: top, bottomBranch: bottom }
  };
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
const GOLD = "#C9A84C";
const GOLD_DARK = "#8B6914";
const GOLD_PALE = "#F5E9C8";
const BG = "#0B0D11";
const SURFACE = "#13161D";
const SURFACE2 = "#1A1E28";
const BORDER = "#2A2D3A";
const TEXT = "#E8E0D0";
const TEXT_DIM = "#8A8070";

const fmt = (n) => n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n;
const fmtAED = (n) => `AED ${fmt(n)}`;

function KPICard({ label, value, sub, delta, icon, highlight }) {
  const up = delta > 0;
  return (
    <div style={{
      background: highlight ? `linear-gradient(135deg, #1A1505 0%, #2A2008 100%)` : SURFACE,
      border: `1px solid ${highlight ? GOLD_DARK : BORDER}`,
      borderRadius: 12, padding: "20px 22px", flex: 1, minWidth: 160,
      position: "relative", overflow: "hidden",
    }}>
      {highlight && <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${GOLD_DARK}, ${GOLD})`,
      }} />}
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ color: TEXT_DIM, fontSize: 11, fontFamily: "'DM Mono',monospace", letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: highlight ? GOLD : TEXT, fontSize: 26, fontWeight: 700, fontFamily: "'Playfair Display',serif", letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ color: TEXT_DIM, fontSize: 11, marginTop: 4 }}>{sub}</div>}
      {delta !== undefined && (
        <div style={{ color: up ? "#4ECDC4" : "#FF6B6B", fontSize: 11, marginTop: 6, fontFamily: "'DM Mono',monospace" }}>
          {up ? "▲" : "▼"} {Math.abs(delta)}% vs yesterday
        </div>
      )}
    </div>
  );
}

function SectionHeader({ children, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 3, height: 18, background: `linear-gradient(180deg,${GOLD},${GOLD_DARK})`, borderRadius: 2 }} />
        <span style={{ color: TEXT, fontSize: 14, fontWeight: 600, fontFamily: "'Playfair Display',serif", letterSpacing: "0.01em" }}>{children}</span>
      </div>
      {action && <span style={{ color: GOLD, fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono',monospace" }}>{action}</span>}
    </div>
  );
}

function NotificationPane({ notifications, summary, criticalCount, onDismiss, filter, setFilter }) {
  const FILTERS = ["all", "critical", "warning", "info", "success"];
  const FILTER_COLORS = { all: TEXT_DIM, critical: "#FF4444", warning: "#F5A623", info: "#4A9EFF", success: "#4ECDC4" };
  const filtered = filter === "all" ? notifications : notifications.filter(n => n.type === filter);
  return (
    <div style={{ width: 320, background: SURFACE, borderLeft: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", height: "100%", flexShrink: 0 }}>
      <div style={{ padding: "18px 20px", borderBottom: `1px solid ${BORDER}`, background: SURFACE2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: GOLD, fontSize: 13, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>Intelligence Centre</div>
          <div style={{ color: TEXT_DIM, fontSize: 10, fontFamily: "'DM Mono',monospace", marginTop: 2 }}>LIVE AI-POWERED ALERTS</div>
        </div>
        {criticalCount > 0 && <div style={{ background: "#FF4444", color: "#fff", borderRadius: 10, fontSize: 10, padding: "2px 8px", fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{criticalCount} CRITICAL</div>}
      </div>

      <div style={{ margin: 14, background: "#0D1018", border: `1px solid ${GOLD_DARK}`, borderRadius: 10, padding: 14 }}>
        <div style={{ color: GOLD, fontSize: 10, fontFamily: "'DM Mono',monospace", marginBottom: 8, letterSpacing: "0.08em" }}>✦ AI EXECUTIVE SUMMARY</div>
        <div style={{ color: TEXT, fontSize: 11, lineHeight: 1.7 }}>{summary}</div>
      </div>

      {/* Filter Buttons */}
      <div style={{ display: "flex", gap: 4, padding: "0 14px 10px", flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? `${FILTER_COLORS[f]}22` : "transparent",
            border: `1px solid ${filter === f ? FILTER_COLORS[f] : BORDER}`,
            color: filter === f ? FILTER_COLORS[f] : TEXT_DIM,
            borderRadius: 5, padding: "3px 8px", cursor: "pointer", fontSize: 9,
            fontFamily: "'DM Mono',monospace", textTransform: "uppercase", transition: "all 0.15s",
          }}>{f} {f !== "all" && `(${notifications.filter(n => n.type === f).length})`}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 14px 14px" }}>
        {filtered.length === 0 && <div style={{ color: TEXT_DIM, fontSize: 11, textAlign: "center", padding: 20 }}>No {filter} alerts</div>}
        {filtered.map(n => (
          <div key={n.id} style={{
            background: SURFACE2, border: `1px solid ${BORDER}`,
            borderLeft: `3px solid ${n.type === "critical" ? "#FF4444" : n.type === "warning" ? "#F5A623" : n.type === "success" ? "#4ECDC4" : "#4A9EFF"}`,
            borderRadius: 8, padding: "12px 14px", marginBottom: 10, transition: "opacity 0.2s",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div style={{ color: TEXT, fontSize: 12, fontWeight: 600 }}>{n.icon} {n.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ color: TEXT_DIM, fontSize: 9, fontFamily: "'DM Mono',monospace" }}>{n.time}</div>
                <button onClick={() => onDismiss(n.id)} style={{ background: "transparent", border: "none", color: TEXT_DIM, cursor: "pointer", fontSize: 10, padding: 0, lineHeight: 1 }} title="Dismiss">✕</button>
              </div>
            </div>
            <div style={{ color: TEXT_DIM, fontSize: 11, lineHeight: 1.6 }}>{n.msg}</div>
            {n.action && <button style={{
              marginTop: 8, background: `${n.type === "critical" ? "#FF4444" : n.type === "warning" ? "#F5A623" : n.type === "success" ? "#4ECDC4" : "#4A9EFF"}18`,
              border: `1px solid ${n.type === "critical" ? "#FF4444" : n.type === "warning" ? "#F5A623" : n.type === "success" ? "#4ECDC4" : "#4A9EFF"}44`,
              color: n.type === "critical" ? "#FF4444" : n.type === "warning" ? "#F5A623" : n.type === "success" ? "#4ECDC4" : "#4A9EFF",
              borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 10, fontFamily: "'DM Mono',monospace",
            }}>{n.action}</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

function BranchTable({ data, onSelect, selected }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
            {["Branch", "24K Sales", "18K Sales", "Grams Sold", "Txns", "Avg Order", "Stock Status", ""].map(h => (
              <th key={h} style={{ padding: "10px 12px", color: TEXT_DIM, fontFamily: "'DM Mono',monospace", fontSize: 10, textAlign: "left", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((b) => {
            const isLow24K = b.stock24K < b.reorderLevel24K;
            const isLow18K = b.stock18K < b.reorderLevel18K;
            const isSelected = selected === b.id;
            return (
              <tr key={b.id}
                onClick={() => onSelect(isSelected ? null : b.id)}
                style={{
                  borderBottom: `1px solid ${BORDER}`, cursor: "pointer",
                  background: isSelected ? "#1A1505" : "transparent",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => !isSelected && (e.currentTarget.style.background = SURFACE2)}
                onMouseLeave={e => !isSelected && (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "11px 12px", color: isSelected ? GOLD : TEXT, fontWeight: isSelected ? 600 : 400 }}>{b.name}</td>
                <td style={{ padding: "11px 12px", color: GOLD, fontFamily: "'DM Mono',monospace" }}>{fmtAED(b.sales24K)}</td>
                <td style={{ padding: "11px 12px", color: "#8B6914", fontFamily: "'DM Mono',monospace" }}>{fmtAED(b.sales18K)}</td>
                <td style={{ padding: "11px 12px", color: TEXT, fontFamily: "'DM Mono',monospace" }}>{(b.grams24K + b.grams18K).toLocaleString()}g</td>
                <td style={{ padding: "11px 12px", color: TEXT }}>{b.transactions}</td>
                <td style={{ padding: "11px 12px", color: TEXT, fontFamily: "'DM Mono',monospace" }}>{fmtAED(b.avgOrderValue)}</td>
                <td style={{ padding: "11px 12px" }}>
                  {(isLow24K || isLow18K) ? (
                    <span style={{ color: "#FF4444", background: "rgba(255,68,68,0.12)", padding: "3px 8px", borderRadius: 6, fontSize: 10, fontFamily: "'DM Mono',monospace" }}>
                      LOW {isLow24K ? "24K" : "18K"}
                    </span>
                  ) : (
                    <span style={{ color: "#4ECDC4", background: "rgba(78,205,196,0.1)", padding: "3px 8px", borderRadius: 6, fontSize: 10, fontFamily: "'DM Mono',monospace" }}>OK</span>
                  )}
                </td>
                <td style={{ padding: "11px 12px", color: GOLD, fontSize: 10 }}>›</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BranchDetail({ branch, onClose }) {
  return (
    <div style={{
      background: SURFACE2, border: `1px solid ${GOLD_DARK}`,
      borderRadius: 12, padding: 20, marginBottom: 20,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ color: GOLD, fontSize: 16, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{branch.name}</div>
          <div style={{ color: TEXT_DIM, fontSize: 11, fontFamily: "'DM Mono',monospace", marginTop: 2 }}>BRANCH DRILL-DOWN</div>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${BORDER}`, color: TEXT_DIM, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>✕ Close</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "24K Revenue", val: fmtAED(branch.sales24K), c: GOLD },
          { label: "18K Revenue", val: fmtAED(branch.sales18K), c: "#8B6914" },
          { label: "Total Grams", val: `${branch.grams24K + branch.grams18K}g`, c: TEXT },
          { label: "Transactions", val: branch.transactions, c: TEXT },
          { label: "Avg Order", val: fmtAED(branch.avgOrderValue), c: TEXT },
          { label: "24K Stock", val: `${branch.stock24K}g`, c: branch.stock24K < branch.reorderLevel24K ? "#FF4444" : "#4ECDC4" },
          { label: "18K Stock", val: `${branch.stock18K}g`, c: branch.stock18K < branch.reorderLevel18K ? "#FF4444" : "#4ECDC4" },
          { label: "Avg Days to Sell", val: `${branch.inventoryAge}d`, c: TEXT },
        ].map(item => (
          <div key={item.label} style={{ background: BG, borderRadius: 8, padding: "12px 14px", border: `1px solid ${BORDER}` }}>
            <div style={{ color: TEXT_DIM, fontSize: 9, fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em", marginBottom: 4 }}>{item.label.toUpperCase()}</div>
            <div style={{ color: item.c, fontSize: 18, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{item.val}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1, background: BG, borderRadius: 8, padding: 12, border: `1px solid ${BORDER}` }}>
          <div style={{ color: TEXT_DIM, fontSize: 9, fontFamily: "'DM Mono',monospace", marginBottom: 6 }}>FAST MOVING</div>
          <div style={{ color: "#4ECDC4", fontSize: 13, fontWeight: 600 }}>🚀 {branch.fastMoving}</div>
        </div>
        <div style={{ flex: 1, background: BG, borderRadius: 8, padding: 12, border: `1px solid ${BORDER}` }}>
          <div style={{ color: TEXT_DIM, fontSize: 9, fontFamily: "'DM Mono',monospace", marginBottom: 6 }}>SLOW MOVING</div>
          <div style={{ color: "#F5A623", fontSize: 13, fontWeight: 600 }}>🐢 {branch.slowMoving}</div>
        </div>
        <div style={{ flex: 1, background: BG, borderRadius: 8, padding: 12, border: `1px solid ${BORDER}` }}>
          <div style={{ color: TEXT_DIM, fontSize: 9, fontFamily: "'DM Mono',monospace", marginBottom: 6 }}>STOCK STATUS</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: branch.stock24K < branch.reorderLevel24K || branch.stock18K < branch.reorderLevel18K ? "#FF4444" : "#4ECDC4" }}>
            {branch.stock24K < branch.reorderLevel24K || branch.stock18K < branch.reorderLevel18K ? "⚠️ Reorder Needed" : "✅ Healthy Stock"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function GoldDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [filterCarat, setFilterCarat] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [timeView, setTimeView] = useState("daily");
  const [clock, setClock] = useState(new Date());
  const [notifFilter, setNotifFilter] = useState("all");
  const [dismissed, setDismissed] = useState([]);

  // ── AI Intelligence Engine (dynamic) ──
  const aiData = generateAIInsights(branchData);
  const liveNotifs = aiData.notifications.filter(n => !dismissed.includes(n.id));
  const handleDismiss = useCallback((id) => setDismissed(prev => [...prev, id]), []);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const totalSales = branchData.reduce((s, b) => s + b.sales24K + b.sales18K, 0);
  const totalGrams = branchData.reduce((s, b) => s + b.grams24K + b.grams18K, 0);
  const totalTxns = branchData.reduce((s, b) => s + b.transactions, 0);
  const total24K = branchData.reduce((s, b) => s + b.sales24K, 0);
  const total18K = branchData.reduce((s, b) => s + b.sales18K, 0);
  const lowStockCount = branchData.filter(b => b.stock24K < b.reorderLevel24K || b.stock18K < b.reorderLevel18K).length;

  const topBranches = [...branchData].sort((a, b) => (b.sales24K + b.sales18K) - (a.sales24K + a.sales18K)).slice(0, 10);

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "branches", label: "Branches" },
    { id: "carats", label: "Carat Analysis" },
    { id: "time", label: "Time Trends" },
    { id: "inventory", label: "Inventory" },
    { id: "products", label: "Products" },
  ];

  const tooltipStyle = { background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 11 };

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: BG, color: TEXT,
      minHeight: "100vh", display: "flex", flexDirection: "column",
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background: ${BG}; }
        ::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius:10px; }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── TOPBAR ── */}
      <div style={{
        background: SURFACE, borderBottom: `1px solid ${BORDER}`,
        padding: "0 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 60, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 36, height: 36, background: `linear-gradient(135deg,${GOLD_DARK},${GOLD})`,
            borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>💎</div>
          <div>
            <div style={{ color: GOLD, fontSize: 15, fontWeight: 700, fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>Al Nafais Gold</div>
            <div style={{ color: TEXT_DIM, fontSize: 10, fontFamily: "'DM Mono',monospace", letterSpacing: "0.1em" }}>SALES INTELLIGENCE PLATFORM</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              background: activeTab === t.id ? `linear-gradient(135deg,${GOLD_DARK},${GOLD})` : "transparent",
              border: activeTab === t.id ? "none" : `1px solid ${BORDER}`,
              color: activeTab === t.id ? "#000" : TEXT_DIM,
              borderRadius: 7, padding: "6px 14px", cursor: "pointer",
              fontSize: 12, fontWeight: activeTab === t.id ? 700 : 400,
              transition: "all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: TEXT, fontSize: 13, fontFamily: "'DM Mono',monospace" }}>
              {clock.toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div style={{ color: TEXT_DIM, fontSize: 10, fontFamily: "'DM Mono',monospace" }}>Dubai / UTC+4</div>
          </div>
          <div style={{ width: 1, height: 30, background: BORDER }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <div style={{ width: 32, height: 32, background: `linear-gradient(135deg,${GOLD_DARK},${GOLD})`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>👤</div>
            <div>
              <div style={{ color: TEXT, fontSize: 12, fontWeight: 500 }}>Regional Manager</div>
              <div style={{ color: TEXT_DIM, fontSize: 10, fontFamily: "'DM Mono',monospace" }}>All 22 Branches</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* ── CONTENT ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>

          {/* FILTERS BAR */}
          <div style={{
            display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap", alignItems: "center",
          }}>
            <div style={{ color: TEXT_DIM, fontSize: 11, fontFamily: "'DM Mono',monospace", marginRight: 4 }}>FILTER:</div>
            {["All", "24K", "18K"].map(c => (
              <button key={c} onClick={() => setFilterCarat(c)} style={{
                background: filterCarat === c ? `${GOLD}22` : "transparent",
                border: `1px solid ${filterCarat === c ? GOLD : BORDER}`,
                color: filterCarat === c ? GOLD : TEXT_DIM,
                borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 11,
                fontFamily: "'DM Mono',monospace", transition: "all 0.15s",
              }}>{c}</button>
            ))}
            <div style={{ width: 1, height: 20, background: BORDER }} />
            {["All", ...CATEGORIES].map(c => (
              <button key={c} onClick={() => setFilterCategory(c)} style={{
                background: filterCategory === c ? `${GOLD}22` : "transparent",
                border: `1px solid ${filterCategory === c ? GOLD : BORDER}`,
                color: filterCategory === c ? GOLD : TEXT_DIM,
                borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 11,
                transition: "all 0.15s",
              }}>{c}</button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <select style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT, borderRadius: 6, padding: "5px 10px", fontSize: 11, fontFamily: "'DM Mono',monospace" }}>
                <option>Today</option><option>This Week</option><option>This Month</option><option>Custom Range</option>
              </select>
              <select style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT, borderRadius: 6, padding: "5px 10px", fontSize: 11 }}>
                <option>All Branches</option>
                {BRANCHES.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <>
              {/* KPI Cards */}
              <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
                <KPICard label="Total Sales" value={fmtAED(totalSales)} sub="All 22 branches" delta={8.4} icon="💰" highlight />
                <KPICard label="Gold Sold" value={`${(totalGrams / 1000).toFixed(2)} kg`} sub={`${totalGrams.toLocaleString()}g total`} delta={5.1} icon="⚖️" />
                <KPICard label="24K Revenue" value={fmtAED(total24K)} sub="62% of total" delta={11.2} icon="🥇" />
                <KPICard label="18K Revenue" value={fmtAED(total18K)} sub="38% of total" delta={3.8} icon="🥈" />
                <KPICard label="Transactions" value={totalTxns.toLocaleString()} sub="Avg AED 14,280" delta={6.3} icon="🧾" />
                <KPICard label="Low Stock Alerts" value={lowStockCount} sub="Branches need reorder" icon="⚠️" delta={-2} />
              </div>

              {/* Charts Row 1 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 280px", gap: 16, marginBottom: 16 }}>
                {/* Hourly Trend */}
                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                  <SectionHeader action="View All">Hourly Sales Trend</SectionHeader>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={hourlyData}>
                      <defs>
                        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                      <XAxis dataKey="hour" stroke={TEXT_DIM} tick={{ fontSize: 9, fontFamily: "'DM Mono',monospace" }} interval={3} />
                      <YAxis stroke={TEXT_DIM} tick={{ fontSize: 9 }} tickFormatter={v => fmt(v)} />
                      <Tooltip contentStyle={tooltipStyle} formatter={v => [fmtAED(v), "Sales"]} />
                      <Area type="monotone" dataKey="sales" stroke={GOLD} fill="url(#goldGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Carat Comparison */}
                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                  <SectionHeader>
                    <div style={{ display: "flex", gap: 8 }}>
                      {["daily", "weekly", "monthly"].map(v => (
                        <button key={v} onClick={() => setTimeView(v)} style={{
                          background: timeView === v ? `${GOLD}22` : "transparent",
                          border: `1px solid ${timeView === v ? GOLD : BORDER}`,
                          color: timeView === v ? GOLD : TEXT_DIM, borderRadius: 5,
                          padding: "3px 8px", cursor: "pointer", fontSize: 10, fontFamily: "'DM Mono',monospace",
                        }}>{v[0].toUpperCase() + v.slice(1)}</button>
                      ))}
                    </div>
                  </SectionHeader>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={timeView === "monthly" ? monthlyData : dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                      <XAxis dataKey={timeView === "monthly" ? "month" : "day"} stroke={TEXT_DIM} tick={{ fontSize: 9 }} />
                      <YAxis stroke={TEXT_DIM} tick={{ fontSize: 9 }} tickFormatter={v => fmt(v)} />
                      <Tooltip contentStyle={tooltipStyle} formatter={v => [fmtAED(v)]} />
                      <Bar dataKey="24K" fill={GOLD} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="18K" fill={GOLD_DARK} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Carat Pie */}
                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                  <SectionHeader>Carat Split</SectionHeader>
                  <ResponsiveContainer width="100%" height={130}>
                    <PieChart>
                      <Pie data={caratShare} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" startAngle={90} endAngle={-270}>
                        {caratShare.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}%`]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                    {caratShare.map(c => (
                      <div key={c.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                          <span style={{ color: TEXT_DIM, fontSize: 11 }}>{c.name}</span>
                        </div>
                        <span style={{ color: TEXT, fontSize: 12, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{c.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Branches */}
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <SectionHeader action="View All 22">Top Performing Branches</SectionHeader>
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                  {topBranches.slice(0, 8).map((b, i) => {
                    const total = b.sales24K + b.sales18K;
                    const max = topBranches[0].sales24K + topBranches[0].sales18K;
                    const pct = (total / max) * 100;
                    return (
                      <div key={b.id} style={{
                        background: SURFACE2, border: `1px solid ${BORDER}`,
                        borderRadius: 10, padding: "14px 16px", minWidth: 140, flexShrink: 0, cursor: "pointer",
                      }} onClick={() => setSelectedBranch(selectedBranch === b.id ? null : b.id)}>
                        <div style={{ color: TEXT_DIM, fontSize: 9, fontFamily: "'DM Mono',monospace", marginBottom: 4 }}>#{i + 1}</div>
                        <div style={{ color: TEXT, fontSize: 12, fontWeight: 600, marginBottom: 10, lineHeight: 1.3 }}>{b.name}</div>
                        <div style={{ background: BORDER, borderRadius: 4, height: 4, marginBottom: 8, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, background: `linear-gradient(90deg,${GOLD_DARK},${GOLD})`, height: "100%", borderRadius: 4 }} />
                        </div>
                        <div style={{ color: GOLD, fontSize: 13, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{fmtAED(total)}</div>
                        <div style={{ color: TEXT_DIM, fontSize: 10, marginTop: 2 }}>{b.transactions} txns</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tables Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Top Selling */}
                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                  <SectionHeader>Top Selling Items</SectionHeader>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                        {["Item", "Carat", "Qty", "Revenue", "Days to Sell"].map(h => (
                          <th key={h} style={{ padding: "8px 10px", color: TEXT_DIM, fontFamily: "'DM Mono',monospace", fontSize: 9, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {topItems.map((item, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <td style={{ padding: "9px 10px", color: TEXT }}>{item.category}</td>
                          <td style={{ padding: "9px 10px", color: item.carat === "24K" ? GOLD : GOLD_DARK, fontFamily: "'DM Mono',monospace" }}>{item.carat}</td>
                          <td style={{ padding: "9px 10px", color: TEXT }}>{item.qty}</td>
                          <td style={{ padding: "9px 10px", color: GOLD, fontFamily: "'DM Mono',monospace" }}>{fmtAED(item.revenue)}</td>
                          <td style={{ padding: "9px 10px" }}>
                            <span style={{ color: item.avgDaysToSell <= 3 ? "#4ECDC4" : item.avgDaysToSell <= 7 ? GOLD : "#F5A623", fontFamily: "'DM Mono',monospace" }}>{item.avgDaysToSell}d</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Slow Moving */}
                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                  <SectionHeader>Slow Moving Inventory</SectionHeader>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                        {["Item", "Carat", "Days", "Stock", "Branch"].map(h => (
                          <th key={h} style={{ padding: "8px 10px", color: TEXT_DIM, fontFamily: "'DM Mono',monospace", fontSize: 9, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {slowItems.map((item, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <td style={{ padding: "9px 10px", color: TEXT }}>{item.category}</td>
                          <td style={{ padding: "9px 10px", color: item.carat === "24K" ? GOLD : GOLD_DARK, fontFamily: "'DM Mono',monospace" }}>{item.carat}</td>
                          <td style={{ padding: "9px 10px" }}>
                            <span style={{ color: "#FF6B6B", fontFamily: "'DM Mono',monospace" }}>{item.daysInStock}d</span>
                          </td>
                          <td style={{ padding: "9px 10px", color: TEXT }}>{item.stock} pcs</td>
                          <td style={{ padding: "9px 10px", color: TEXT_DIM, fontSize: 10 }}>{item.branch.split(" ").slice(0, 2).join(" ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Recommendations */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                <div style={{ background: SURFACE, border: `1px solid ${GOLD_DARK}`, borderRadius: 12, padding: 20 }}>
                  <SectionHeader action={`${aiData.reorderSuggestions.length} items`}>🤖 AI Reorder Suggestions</SectionHeader>
                  {aiData.reorderSuggestions.length === 0 ? (
                    <div style={{ color: "#4ECDC4", fontSize: 12, padding: 12, textAlign: "center" }}>✅ All branches stocked above reorder levels</div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead><tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                        {["Branch", "Carat", "Current", "Order Qty", "Urgency"].map(h => (
                          <th key={h} style={{ padding: "8px 10px", color: TEXT_DIM, fontFamily: "'DM Mono',monospace", fontSize: 9, textAlign: "left", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {aiData.reorderSuggestions.map((r, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                            <td style={{ padding: "9px 10px", color: TEXT }}>{r.branch}</td>
                            <td style={{ padding: "9px 10px", color: r.carat === "24K" ? GOLD : GOLD_DARK, fontFamily: "'DM Mono',monospace" }}>{r.carat}</td>
                            <td style={{ padding: "9px 10px", color: "#FF6B6B", fontFamily: "'DM Mono',monospace" }}>{r.currentStock}g</td>
                            <td style={{ padding: "9px 10px", color: "#4ECDC4", fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>+{r.suggestedOrder}g</td>
                            <td style={{ padding: "9px 10px" }}>
                              <span style={{ color: r.urgency === "HIGH" ? "#FF4444" : "#F5A623", background: r.urgency === "HIGH" ? "rgba(255,68,68,0.12)" : "rgba(245,166,35,0.12)", padding: "3px 8px", borderRadius: 6, fontSize: 9, fontFamily: "'DM Mono',monospace" }}>
                                {r.urgency === "HIGH" ? "🔥 HIGH" : "⚡ MED"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div style={{ background: SURFACE, border: `1px solid ${GOLD_DARK}`, borderRadius: 12, padding: 20 }}>
                  <SectionHeader action="AI-Optimized">🔄 Branch Transfer Opportunities</SectionHeader>
                  {aiData.transferOps.length === 0 ? (
                    <div style={{ color: "#4ECDC4", fontSize: 12, padding: 12, textAlign: "center" }}>✅ No transfer opportunities detected</div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead><tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                        {["From", "To", "Carat", "Qty", "Est. Savings"].map(h => (
                          <th key={h} style={{ padding: "8px 10px", color: TEXT_DIM, fontFamily: "'DM Mono',monospace", fontSize: 9, textAlign: "left", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {aiData.transferOps.map((t, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                            <td style={{ padding: "9px 10px", color: "#F5A623" }}>{t.from}</td>
                            <td style={{ padding: "9px 10px", color: "#4ECDC4" }}>{t.to}</td>
                            <td style={{ padding: "9px 10px", color: t.carat === "24K" ? GOLD : GOLD_DARK, fontFamily: "'DM Mono',monospace" }}>{t.carat}</td>
                            <td style={{ padding: "9px 10px", color: TEXT, fontFamily: "'DM Mono',monospace" }}>{t.qty}g</td>
                            <td style={{ padding: "9px 10px", color: "#4ECDC4", fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{t.savings}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── BRANCHES TAB ── */}
          {activeTab === "branches" && (
            <>
              {selectedBranch !== null && (
                <BranchDetail branch={branchData[selectedBranch]} onClose={() => setSelectedBranch(null)} />
              )}
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                <SectionHeader>All 22 Dubai Branches — Click to Drill Down</SectionHeader>
                <BranchTable data={branchData} onSelect={setSelectedBranch} selected={selectedBranch} />
              </div>
            </>
          )}

          {/* ── CARAT ANALYSIS TAB ── */}
          {activeTab === "carats" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                  <SectionHeader>24K vs 18K — Monthly Revenue</SectionHeader>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                      <XAxis dataKey="month" stroke={TEXT_DIM} tick={{ fontSize: 10 }} />
                      <YAxis stroke={TEXT_DIM} tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                      <Tooltip contentStyle={tooltipStyle} formatter={v => [fmtAED(v)]} />
                      <Bar dataKey="24K" fill={GOLD} radius={[3, 3, 0, 0]} name="24K Gold" />
                      <Bar dataKey="18K" fill={GOLD_DARK} radius={[3, 3, 0, 0]} name="18K Gold" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                  <SectionHeader>Carat Preference by Branch (Top 10)</SectionHeader>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topBranches} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                      <XAxis type="number" stroke={TEXT_DIM} tick={{ fontSize: 9 }} tickFormatter={v => fmt(v)} />
                      <YAxis type="category" dataKey="shortName" stroke={TEXT_DIM} tick={{ fontSize: 9 }} width={80} />
                      <Tooltip contentStyle={tooltipStyle} formatter={v => [fmtAED(v)]} />
                      <Bar dataKey="sales24K" fill={GOLD} name="24K" stackId="a" />
                      <Bar dataKey="sales18K" fill={GOLD_DARK} name="18K" stackId="a" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                {[
                  { label: "24K Total Revenue", val: fmtAED(total24K), sub: "Across all branches", c: GOLD },
                  { label: "18K Total Revenue", val: fmtAED(total18K), sub: "Across all branches", c: GOLD_DARK },
                  { label: "24K Grams Sold", val: `${branchData.reduce((s, b) => s + b.grams24K, 0).toLocaleString()}g`, sub: "This period", c: GOLD },
                  { label: "18K Grams Sold", val: `${branchData.reduce((s, b) => s + b.grams18K, 0).toLocaleString()}g`, sub: "This period", c: GOLD_DARK },
                ].map(item => (
                  <div key={item.label} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                    <div style={{ color: TEXT_DIM, fontSize: 10, fontFamily: "'DM Mono',monospace", marginBottom: 8, letterSpacing: "0.06em" }}>{item.label.toUpperCase()}</div>
                    <div style={{ color: item.c, fontSize: 28, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{item.val}</div>
                    <div style={{ color: TEXT_DIM, fontSize: 11, marginTop: 4 }}>{item.sub}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── TIME TRENDS TAB ── */}
          {activeTab === "time" && (
            <>
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <SectionHeader>Peak Hour Analysis</SectionHeader>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={hourlyData}>
                    <defs>
                      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={GOLD} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                    <XAxis dataKey="hour" stroke={TEXT_DIM} tick={{ fontSize: 10, fontFamily: "'DM Mono',monospace" }} />
                    <YAxis stroke={TEXT_DIM} tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                    <Tooltip contentStyle={tooltipStyle} formatter={v => [fmtAED(v), "Revenue"]} />
                    <Area type="monotone" dataKey="sales" stroke={GOLD} fill="url(#g2)" strokeWidth={2.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                  <SectionHeader>Daily Sales Pattern</SectionHeader>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                      <XAxis dataKey="day" stroke={TEXT_DIM} tick={{ fontSize: 10 }} />
                      <YAxis stroke={TEXT_DIM} tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                      <Tooltip contentStyle={tooltipStyle} formatter={v => [fmtAED(v)]} />
                      <Bar dataKey="24K" fill={GOLD} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="18K" fill={GOLD_DARK} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                  <SectionHeader>Monthly Trend vs Target</SectionHeader>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                      <XAxis dataKey="month" stroke={TEXT_DIM} tick={{ fontSize: 10 }} />
                      <YAxis stroke={TEXT_DIM} tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                      <Tooltip contentStyle={tooltipStyle} formatter={v => [fmtAED(v)]} />
                      <Line type="monotone" dataKey="24K" stroke={GOLD} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="18K" stroke={GOLD_DARK} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="target" stroke="#FF6B6B" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Target" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* ── INVENTORY TAB ── */}
          {activeTab === "inventory" && (
            <>
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Low Stock", count: branchData.filter(b => b.stock24K < b.reorderLevel24K || b.stock18K < b.reorderLevel18K).length, c: "#FF4444" },
                  { label: "Healthy Stock", count: branchData.filter(b => b.stock24K >= b.reorderLevel24K && b.stock18K >= b.reorderLevel18K).length, c: "#4ECDC4" },
                  { label: "Overstocked", count: branchData.filter(b => b.stock24K > 600 || b.stock18K > 450).length, c: "#F5A623" },
                  { label: "Aging > 30d", count: branchData.filter(b => b.inventoryAge > 30).length, c: "#FF8C69" },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
                    <div style={{ color: TEXT_DIM, fontSize: 10, fontFamily: "'DM Mono',monospace", marginBottom: 8 }}>{s.label.toUpperCase()}</div>
                    <div style={{ color: s.c, fontSize: 32, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{s.count}</div>
                    <div style={{ color: TEXT_DIM, fontSize: 11, marginTop: 2 }}>branches</div>
                  </div>
                ))}
              </div>

              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                <SectionHeader>Branch-wise Stock Levels</SectionHeader>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                        {["Branch", "24K Stock", "24K Reorder", "18K Stock", "18K Reorder", "Status", "Inventory Age"].map(h => (
                          <th key={h} style={{ padding: "10px 12px", color: TEXT_DIM, fontFamily: "'DM Mono',monospace", fontSize: 9, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {branchData.map(b => {
                        const isLow24K = b.stock24K < b.reorderLevel24K;
                        const isLow18K = b.stock18K < b.reorderLevel18K;
                        const isOver = b.stock24K > 600 || b.stock18K > 450;
                        return (
                          <tr key={b.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                            <td style={{ padding: "10px 12px", color: TEXT }}>{b.name}</td>
                            <td style={{ padding: "10px 12px", color: isLow24K ? "#FF4444" : GOLD, fontFamily: "'DM Mono',monospace" }}>{b.stock24K}g</td>
                            <td style={{ padding: "10px 12px", color: TEXT_DIM }}>{b.reorderLevel24K}g</td>
                            <td style={{ padding: "10px 12px", color: isLow18K ? "#FF4444" : GOLD_DARK, fontFamily: "'DM Mono',monospace" }}>{b.stock18K}g</td>
                            <td style={{ padding: "10px 12px", color: TEXT_DIM }}>{b.reorderLevel18K}g</td>
                            <td style={{ padding: "10px 12px" }}>
                              {isLow24K || isLow18K ? (
                                <span style={{ color: "#FF4444", background: "rgba(255,68,68,0.12)", padding: "3px 8px", borderRadius: 6, fontSize: 9 }}>⚠ LOW</span>
                              ) : isOver ? (
                                <span style={{ color: "#F5A623", background: "rgba(245,166,35,0.12)", padding: "3px 8px", borderRadius: 6, fontSize: 9 }}>📦 OVER</span>
                              ) : (
                                <span style={{ color: "#4ECDC4", background: "rgba(78,205,196,0.1)", padding: "3px 8px", borderRadius: 6, fontSize: 9 }}>✓ OK</span>
                              )}
                            </td>
                            <td style={{ padding: "10px 12px", color: b.inventoryAge > 30 ? "#FF8C69" : TEXT_DIM, fontFamily: "'DM Mono',monospace" }}>{b.inventoryAge}d</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── PRODUCTS TAB ── */}
          {activeTab === "products" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                  <SectionHeader>Revenue by Category</SectionHeader>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topItems} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                      <XAxis type="number" stroke={TEXT_DIM} tick={{ fontSize: 9 }} tickFormatter={v => fmt(v)} />
                      <YAxis type="category" dataKey="category" stroke={TEXT_DIM} tick={{ fontSize: 10 }} width={70} />
                      <Tooltip contentStyle={tooltipStyle} formatter={v => [fmtAED(v), "Revenue"]} />
                      <Bar dataKey="revenue" fill={GOLD} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                  <SectionHeader>Time to Sale Analysis</SectionHeader>
                  <div style={{ marginTop: 8 }}>
                    {topItems.map((item, i) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ color: TEXT, fontSize: 12 }}>{item.category} ({item.carat})</span>
                          <span style={{ color: item.avgDaysToSell <= 3 ? "#4ECDC4" : item.avgDaysToSell <= 7 ? GOLD : "#FF8C69", fontSize: 11, fontFamily: "'DM Mono',monospace" }}>{item.avgDaysToSell}d avg</span>
                        </div>
                        <div style={{ background: BORDER, borderRadius: 4, height: 5, overflow: "hidden" }}>
                          <div style={{
                            width: `${Math.min((item.avgDaysToSell / 12) * 100, 100)}%`,
                            background: item.avgDaysToSell <= 3 ? "#4ECDC4" : item.avgDaysToSell <= 7 ? GOLD : "#FF8C69",
                            height: "100%", borderRadius: 4, transition: "width 0.5s",
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, gridColumn: "span 2" }}>
                  <SectionHeader>Full Product Movement Table</SectionHeader>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                        {["Category", "Carat", "Qty Sold", "Grams Sold", "Revenue", "Avg Days to Sell", "Status"].map(h => (
                          <th key={h} style={{ padding: "10px 12px", color: TEXT_DIM, fontFamily: "'DM Mono',monospace", fontSize: 9, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {topItems.map((item, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <td style={{ padding: "10px 12px", color: TEXT, fontWeight: 500 }}>{item.category}</td>
                          <td style={{ padding: "10px 12px", color: item.carat === "24K" ? GOLD : GOLD_DARK, fontFamily: "'DM Mono',monospace" }}>{item.carat}</td>
                          <td style={{ padding: "10px 12px", color: TEXT }}>{item.qty}</td>
                          <td style={{ padding: "10px 12px", color: TEXT, fontFamily: "'DM Mono',monospace" }}>{item.grams}g</td>
                          <td style={{ padding: "10px 12px", color: GOLD, fontFamily: "'DM Mono',monospace" }}>{fmtAED(item.revenue)}</td>
                          <td style={{ padding: "10px 12px", fontFamily: "'DM Mono',monospace", color: item.avgDaysToSell <= 3 ? "#4ECDC4" : item.avgDaysToSell <= 7 ? GOLD : "#FF8C69" }}>{item.avgDaysToSell}d</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{
                              color: item.avgDaysToSell <= 3 ? "#4ECDC4" : item.avgDaysToSell <= 7 ? GOLD : "#FF8C69",
                              background: item.avgDaysToSell <= 3 ? "rgba(78,205,196,0.1)" : item.avgDaysToSell <= 7 ? "rgba(201,168,76,0.1)" : "rgba(255,140,105,0.1)",
                              padding: "3px 8px", borderRadius: 6, fontSize: 9, fontFamily: "'DM Mono',monospace",
                            }}>
                              {item.avgDaysToSell <= 3 ? "🔥 HOT" : item.avgDaysToSell <= 7 ? "↗ MOVING" : "🐢 SLOW"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── NOTIFICATION PANE (AI-Powered) ── */}
        <NotificationPane notifications={liveNotifs} summary={aiData.summary} criticalCount={aiData.criticalCount} onDismiss={handleDismiss} filter={notifFilter} setFilter={setNotifFilter} />
      </div>

      {/* FOOTER */}
      <div style={{
        background: SURFACE, borderTop: `1px solid ${BORDER}`,
        padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 10, color: TEXT_DIM, fontFamily: "'DM Mono',monospace", flexShrink: 0,
      }}>
        <span>AL NAFAIS GOLD — SALES INTELLIGENCE PLATFORM v2.4</span>
        <span style={{ color: GOLD }}>● LIVE</span>
        <span>22 Branches · Dubai, UAE · Data refreshes every 5 min</span>
      </div>
    </div>
  );
}
