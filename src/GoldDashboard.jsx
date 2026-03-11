import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

import { BRANCHES, CATEGORIES, fmt, fmtAED } from './constants';
import { useTheme } from './themeContext';
import {
  generateBranchData, tickBranchData, generateHourlyData, generateDailyData,
  generateMonthlyData, generateTopItems, generateSlowItems, generateAIInsights,
  computeFilteredMetrics, DATE_MULTIPLIERS
} from './dataEngine';
import { KPICard, SectionHeader, NotificationPane, BranchTable, BranchDetail, DetailModal } from './components';

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function GoldDashboard() {
  const { GOLD, GOLD_BRIGHT, GOLD_24K, GOLD_18K, GOLD_DARK, BG, SURFACE, SURFACE2, BORDER, TEXT, TEXT_DIM, DANGER, DANGER_BG, SUCCESS, WARNING, INFO, toggleTheme, themeName } = useTheme();
  // ── UI States ──
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [filterCarat, setFilterCarat] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterDate, setFilterDate] = useState("Today");
  const [filterBranch, setFilterBranch] = useState("All Branches");
  const [timeView, setTimeView] = useState("daily");
  const [clock, setClock] = useState(new Date());
  const [notifFilter, setNotifFilter] = useState("all");
  const [dismissed, setDismissed] = useState([]);
  const [dataPulse, setDataPulse] = useState(false);
  const [viewAllModal, setViewAllModal] = useState(null); // null | 'branches' | 'hourly'
  const tickCountRef = useRef(0);

  // ── LIVE DATA (state, not constants) ──
  const [branchData, setBranchData] = useState(() => generateBranchData());
  const [hourlyData, setHourlyData] = useState(() => generateHourlyData());
  const [dailyData, setDailyData] = useState(() => generateDailyData());
  const [monthlyData, setMonthlyData] = useState(() => generateMonthlyData());
  const [lastUpdated, setLastUpdated] = useState("Just now");

  // ── Clock tick (1s) ──
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── ESC key to close modal ──
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setViewAllModal(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Live data tick (30s) — simulates real-time feed ──
  useEffect(() => {
    const t = setInterval(() => {
      tickCountRef.current += 1;
      setBranchData(prev => tickBranchData(prev));
      setHourlyData(generateHourlyData());
      // Regenerate daily/monthly less frequently
      if (tickCountRef.current % 3 === 0) {
        setDailyData(generateDailyData());
        setMonthlyData(generateMonthlyData());
      }
      setLastUpdated("Just now");
      setDismissed([]); // Reset dismissed on new data
      // Pulse animation
      setDataPulse(true);
      setTimeout(() => setDataPulse(false), 1500);
    }, 30000);
    return () => clearInterval(t);
  }, []);

  // Update "last updated" text
  useEffect(() => {
    const t = setInterval(() => {
      setLastUpdated(prev => {
        if (prev === "Just now") return "30s ago";
        if (prev === "30s ago") return "1 min ago";
        return prev;
      });
    }, 30000);
    return () => clearInterval(t);
  }, []);

  // ── FILTER PIPELINE (useMemo) ──
  const filteredBranches = useMemo(() => {
    if (filterBranch === "All Branches") return branchData;
    return branchData.filter(b => b.name === filterBranch);
  }, [branchData, filterBranch]);

  const dateMultiplier = DATE_MULTIPLIERS[filterDate] || 1;

  const metrics = useMemo(() =>
    computeFilteredMetrics(filteredBranches, filterCarat, dateMultiplier, filterCategory),
    [filteredBranches, filterCarat, dateMultiplier, filterCategory]
  );

  const topBranches = useMemo(() => {
    const sorted = [...filteredBranches].sort((a, b) => {
      if (filterCarat === "24K") return b.sales24K - a.sales24K;
      if (filterCarat === "18K") return b.sales18K - a.sales18K;
      return (b.sales24K + b.sales18K) - (a.sales24K + a.sales18K);
    });
    return sorted.slice(0, 10);
  }, [filteredBranches, filterCarat]);

  // ── Dynamic carat pie (computed from actual data) ──
  const caratShare = useMemo(() => [
    { name: "24K", value: metrics.caratPct24K, color: GOLD_24K },
    { name: "18K", value: metrics.caratPct18K, color: GOLD_18K },
  ], [metrics.caratPct24K, metrics.caratPct18K, GOLD_24K, GOLD_18K]);

  // ── Carat-filtered chart data ──
  const filteredHourlyData = useMemo(() => {
    if (filterCarat === "All") return hourlyData;
    return hourlyData.map(h => ({
      ...h,
      sales: filterCarat === "24K" ? h.sales24K : h.sales18K,
    }));
  }, [hourlyData, filterCarat]);

  const filteredDailyData = useMemo(() => {
    if (filterCarat === "All") return dailyData;
    return dailyData.map(d => {
      if (filterCarat === "24K") return { day: d.day, "24K": d["24K"] };
      return { day: d.day, "18K": d["18K"] };
    });
  }, [dailyData, filterCarat]);

  const filteredMonthlyData = useMemo(() => {
    if (filterCarat === "All") return monthlyData;
    return monthlyData.map(m => {
      if (filterCarat === "24K") return { month: m.month, "24K": m["24K"], target: m.target };
      return { month: m.month, "18K": m["18K"], target: m.target };
    });
  }, [monthlyData, filterCarat]);

  // ── Product tables (filtered by carat + category) ──
  const topItems = useMemo(() =>
    generateTopItems(filteredBranches, filterCarat, filterCategory),
    [filteredBranches, filterCarat, filterCategory]
  );

  const slowItems = useMemo(() =>
    generateSlowItems(filteredBranches, filterCarat, filterCategory),
    [filteredBranches, filterCarat, filterCategory]
  );

  // ── AI Intelligence Engine (reactive to filters + data) ──
  const aiData = useMemo(() =>
    generateAIInsights(filteredBranches, { filterCarat, filterBranch, filterDate }),
    [filteredBranches, filterCarat, filterBranch, filterDate]
  );

  const liveNotifs = aiData.notifications.filter(n => !dismissed.includes(n.id));
  const handleDismiss = useCallback((id) => setDismissed(prev => [...prev, id]), []);

  // ── Derived values for display ──
  const branchCountLabel = filterBranch === "All Branches"
    ? `All ${branchData.length} branches`
    : filterBranch;

  const dateLabel = filterDate !== "Today" ? ` (${filterDate})` : "";

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
      height: "100vh", display: "flex", flexDirection: "column",
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
      `}</style>

      {/* ── TOPBAR ── */}
      <div style={{
        background: SURFACE, borderBottom: `1px solid ${BORDER}`,
        padding: "0 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 60, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="gold-glow" style={{
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
              background: activeTab === t.id 
                ? (themeName === "light" ? GOLD_BRIGHT : `linear-gradient(135deg,${GOLD_DARK},${GOLD})`) 
                : "transparent",
              border: activeTab === t.id ? "none" : `1px solid ${BORDER}`,
              color: activeTab === t.id ? (themeName === "light" ? "#FFFFFF" : "#000000") : TEXT_DIM,
              boxShadow: activeTab === t.id ? `0 0 15px ${GOLD_BRIGHT}A0` : "none",
              borderRadius: 7, padding: "6px 14px", cursor: "pointer",
              fontSize: 12, fontWeight: activeTab === t.id ? 700 : 400,
              transition: "all 0.25s ease",
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={toggleTheme} style={{
            background: "transparent", border: `1px solid ${BORDER}`, color: TEXT,
            borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", transition: "all 0.2s",
            fontSize: 16,
          }} title="Toggle Theme">
            {themeName === "dark" ? "☀️" : "🌙"}
          </button>
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
              <div style={{ color: TEXT_DIM, fontSize: 10, fontFamily: "'DM Mono',monospace" }}>{branchCountLabel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* ── CONTENT ── */}
        <div className="scroll-container" style={{ flex: 1, padding: 24 }}>

          {/* FILTERS BAR — ALL FUNCTIONAL NOW */}
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
              <select
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT, borderRadius: 6, padding: "5px 10px", fontSize: 11, fontFamily: "'DM Mono',monospace" }}
              >
                <option>Today</option><option>This Week</option><option>This Month</option><option>Custom Range</option>
              </select>
              <select
                value={filterBranch}
                onChange={e => setFilterBranch(e.target.value)}
                style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT, borderRadius: 6, padding: "5px 10px", fontSize: 11 }}
              >
                <option>All Branches</option>
                {BRANCHES.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <>
              {/* KPI Cards — now driven by filtered metrics */}
              <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
                <KPICard label="Total Sales" value={fmtAED(metrics.totalSales)} sub={`${branchCountLabel}${dateLabel}`} delta={8.4} icon="💰" highlight pulse={dataPulse} />
                <KPICard label="Gold Sold" value={`${(metrics.totalGrams / 1000).toFixed(2)} kg`} sub={`${metrics.totalGrams.toLocaleString()}g total`} delta={5.1} icon="⚖️" pulse={dataPulse} />
                {(filterCarat === "All" || filterCarat === "24K") && (
                  <KPICard label="24K Revenue" value={fmtAED(metrics.total24K)} sub={`${metrics.caratPct24K}% of total`} delta={11.2} icon="🥇" pulse={dataPulse} />
                )}
                {(filterCarat === "All" || filterCarat === "18K") && (
                  <KPICard label="18K Revenue" value={fmtAED(metrics.total18K)} sub={`${metrics.caratPct18K}% of total`} delta={3.8} icon="🥈" pulse={dataPulse} />
                )}
                <KPICard label="Transactions" value={metrics.totalTxns.toLocaleString()} sub={`Avg ${fmtAED(metrics.totalTxns > 0 ? Math.round(metrics.totalSales / metrics.totalTxns) : 0)}`} delta={6.3} icon="🧾" pulse={dataPulse} />
                <KPICard label="Low Stock Alerts" value={metrics.lowStockCount} sub="Branches need reorder" icon="⚠️" delta={-2} pulse={dataPulse} />
              </div>

              {/* Charts Row 1 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 280px", gap: 16, marginBottom: 16 }}>
                {/* Hourly Trend */}
                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                  <SectionHeader action="View All" onAction={() => setViewAllModal('hourly')}>Hourly Sales Trend{filterCarat !== "All" ? ` (${filterCarat})` : ""}</SectionHeader>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={filteredHourlyData}>
                      <defs>
                        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={filterCarat === "18K" ? GOLD_DARK : GOLD} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={filterCarat === "18K" ? GOLD_DARK : GOLD} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                      <XAxis dataKey="hour" stroke={TEXT_DIM} tick={{ fontSize: 9, fontFamily: "'DM Mono',monospace" }} interval={3} />
                      <YAxis stroke={TEXT_DIM} tick={{ fontSize: 9 }} tickFormatter={v => fmt(v)} />
                      <Tooltip contentStyle={tooltipStyle} formatter={v => [fmtAED(v), "Sales"]} />
                      <Area type="monotone" dataKey="sales" stroke={filterCarat === "18K" ? GOLD_DARK : GOLD} fill="url(#goldGrad)" strokeWidth={2} dot={false} />
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
                    <BarChart data={timeView === "monthly" ? filteredMonthlyData : filteredDailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                      <XAxis dataKey={timeView === "monthly" ? "month" : "day"} stroke={TEXT_DIM} tick={{ fontSize: 9 }} />
                      <YAxis stroke={TEXT_DIM} tick={{ fontSize: 9 }} tickFormatter={v => fmt(v)} />
                      <Tooltip contentStyle={tooltipStyle} formatter={v => [fmtAED(v)]} />
                      {(filterCarat === "All" || filterCarat === "24K") && <Bar dataKey="24K" fill={GOLD_24K} radius={[3, 3, 0, 0]} />}
                      {(filterCarat === "All" || filterCarat === "18K") && <Bar dataKey="18K" fill={GOLD_18K} radius={[3, 3, 0, 0]} />}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Carat Pie — DYNAMIC */}
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
                <SectionHeader action={`View All ${filteredBranches.length}`} onAction={() => setViewAllModal('branches')}>Top Performing Branches{filterCarat !== "All" ? ` (${filterCarat})` : ""}</SectionHeader>
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                  {topBranches.slice(0, 8).map((b, i) => {
                    const total = filterCarat === "24K" ? b.sales24K : filterCarat === "18K" ? b.sales18K : b.sales24K + b.sales18K;
                    const maxB = topBranches[0];
                    const max = filterCarat === "24K" ? maxB.sales24K : filterCarat === "18K" ? maxB.sales18K : maxB.sales24K + maxB.sales18K;
                    const pct = max > 0 ? (total / max) * 100 : 0;
                    return (
                      <div key={b.id} style={{
                        background: themeName === "dark" ? "#1A1505" : "#FFF9EB", border: `1px solid ${BORDER}`,
                        borderRadius: 10, padding: "14px 16px", minWidth: 140, flexShrink: 0, cursor: "pointer",
                        transition: "border-color 0.2s",
                      }} onClick={() => setSelectedBranch(selectedBranch === b.id ? null : b.id)}>
                        <div style={{ color: TEXT_DIM, fontSize: 9, fontFamily: "'DM Mono',monospace", marginBottom: 4 }}>#{i + 1}</div>
                        <div style={{ color: TEXT, fontSize: 12, fontWeight: 600, marginBottom: 10, lineHeight: 1.3 }}>{b.name}</div>
                        <div style={{ background: BORDER, borderRadius: 4, height: 4, marginBottom: 8, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, background: `linear-gradient(90deg,${GOLD_DARK},${GOLD})`, height: "100%", borderRadius: 4, transition: "width 0.5s" }} />
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
                  <SectionHeader>Top Selling Items{filterCategory !== "All" ? ` — ${filterCategory}` : ""}{filterCarat !== "All" ? ` (${filterCarat})` : ""}</SectionHeader>
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
                          <td style={{ padding: "9px 10px", color: item.carat === "24K" ? GOLD_24K : GOLD_18K, fontFamily: "'DM Mono',monospace" }}>{item.carat}</td>
                          <td style={{ padding: "9px 10px", color: TEXT }}>{item.qty}</td>
                          <td style={{ padding: "9px 10px", color: GOLD, fontFamily: "'DM Mono',monospace" }}>{fmtAED(item.revenue)}</td>
                          <td style={{ padding: "9px 10px" }}>
                            <span style={{ color: item.avgDaysToSell <= 3 ? SUCCESS : item.avgDaysToSell <= 7 ? GOLD : WARNING, fontFamily: "'DM Mono',monospace" }}>{item.avgDaysToSell}d</span>
                          </td>
                        </tr>
                      ))}
                      {topItems.length === 0 && (
                        <tr><td colSpan={5} style={{ padding: 20, color: TEXT_DIM, textAlign: "center" }}>No items match the current filters</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Slow Moving */}
                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                  <SectionHeader>Slow Moving Inventory{filterCategory !== "All" ? ` — ${filterCategory}` : ""}</SectionHeader>
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
                          <td style={{ padding: "9px 10px", color: item.carat === "24K" ? GOLD_24K : GOLD_18K, fontFamily: "'DM Mono',monospace" }}>{item.carat}</td>
                          <td style={{ padding: "9px 10px" }}>
                            <span style={{ color: DANGER, fontFamily: "'DM Mono',monospace" }}>{item.daysInStock}d</span>
                          </td>
                          <td style={{ padding: "9px 10px", color: TEXT }}>{item.stock} pcs</td>
                          <td style={{ padding: "9px 10px", color: TEXT_DIM, fontSize: 10 }}>{item.branch.split(" ").slice(0, 2).join(" ")}</td>
                        </tr>
                      ))}
                      {slowItems.length === 0 && (
                        <tr><td colSpan={5} style={{ padding: 20, color: TEXT_DIM, textAlign: "center" }}>No items match the current filters</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Recommendations */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                <div style={{ background: SURFACE, border: `1px solid ${GOLD_DARK}`, borderRadius: 12, padding: 20 }}>
                  <SectionHeader action={`${aiData.reorderSuggestions.length} items`}>🤖 AI Reorder Suggestions</SectionHeader>
                  {aiData.reorderSuggestions.length === 0 ? (
                    <div style={{ color: SUCCESS, fontSize: 12, padding: 12, textAlign: "center" }}>✅ All branches stocked above reorder levels</div>
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
                            <td style={{ padding: "9px 10px", color: r.carat === "24K" ? GOLD_24K : GOLD_18K, fontFamily: "'DM Mono',monospace" }}>{r.carat}</td>
                            <td style={{ padding: "9px 10px", color: DANGER, fontFamily: "'DM Mono',monospace" }}>{r.currentStock}g</td>
                            <td style={{ padding: "9px 10px", color: SUCCESS, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>+{r.suggestedOrder}g</td>
                            <td style={{ padding: "9px 10px" }}>
                              <span style={{ color: r.urgency === "HIGH" ? DANGER : WARNING, background: r.urgency === "HIGH" ? DANGER_BG : "rgba(245,166,35,0.12)", padding: "4px 10px", borderRadius: 6, fontSize: 9, fontFamily: "'DM Mono',monospace", letterSpacing: "0.05em", fontWeight: 600 }}>
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
                    <div style={{ color: SUCCESS, fontSize: 12, padding: 12, textAlign: "center" }}>✅ No transfer opportunities detected</div>
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
                            <td style={{ padding: "9px 10px", color: WARNING }}>{t.from}</td>
                            <td style={{ padding: "9px 10px", color: SUCCESS }}>{t.to}</td>
                            <td style={{ padding: "9px 10px", color: t.carat === "24K" ? GOLD_24K : GOLD_18K, fontFamily: "'DM Mono',monospace" }}>{t.carat}</td>
                            <td style={{ padding: "9px 10px", color: TEXT, fontFamily: "'DM Mono',monospace" }}>{t.qty}g</td>
                            <td style={{ padding: "9px 10px", color: SUCCESS, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{t.savings}</td>
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
              {selectedBranch !== null && branchData[selectedBranch] && (
                <BranchDetail branch={branchData[selectedBranch]} onClose={() => setSelectedBranch(null)} />
              )}
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                <SectionHeader>All {filteredBranches.length} Dubai Branches — Click to Drill Down</SectionHeader>
                <BranchTable data={filteredBranches} onSelect={setSelectedBranch} selected={selectedBranch} />
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
                    <BarChart data={filteredMonthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                      <XAxis dataKey="month" stroke={TEXT_DIM} tick={{ fontSize: 10 }} />
                      <YAxis stroke={TEXT_DIM} tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                      <Tooltip contentStyle={tooltipStyle} formatter={v => [fmtAED(v)]} />
                      {(filterCarat === "All" || filterCarat === "24K") && <Bar dataKey="24K" fill={GOLD_24K} radius={[3, 3, 0, 0]} name="24K Gold" />}
                      {(filterCarat === "All" || filterCarat === "18K") && <Bar dataKey="18K" fill={GOLD_18K} radius={[3, 3, 0, 0]} name="18K Gold" />}
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
                      {(filterCarat === "All" || filterCarat === "24K") && <Bar dataKey="sales24K" fill={GOLD_24K} name="24K" stackId="a" />}
                      {(filterCarat === "All" || filterCarat === "18K") && <Bar dataKey="sales18K" fill={GOLD_18K} name="18K" stackId="a" radius={[0, 3, 3, 0]} />}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                {[
                  { label: "24K Total Revenue", val: fmtAED(metrics.total24K), sub: branchCountLabel, c: GOLD_24K },
                  { label: "18K Total Revenue", val: fmtAED(metrics.total18K), sub: branchCountLabel, c: GOLD_18K },
                  { label: "24K Grams Sold", val: `${filteredBranches.reduce((s, b) => s + b.grams24K, 0).toLocaleString()}g`, sub: "This period", c: GOLD_24K },
                  { label: "18K Grams Sold", val: `${filteredBranches.reduce((s, b) => s + b.grams18K, 0).toLocaleString()}g`, sub: "This period", c: GOLD_18K },
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
                <SectionHeader>Peak Hour Analysis{filterCarat !== "All" ? ` (${filterCarat})` : ""}</SectionHeader>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={filteredHourlyData}>
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
                    <BarChart data={filteredDailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                      <XAxis dataKey="day" stroke={TEXT_DIM} tick={{ fontSize: 10 }} />
                      <YAxis stroke={TEXT_DIM} tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                      <Tooltip contentStyle={tooltipStyle} formatter={v => [fmtAED(v)]} />
                      {(filterCarat === "All" || filterCarat === "24K") && <Bar dataKey="24K" fill={GOLD_24K} radius={[3, 3, 0, 0]} />}
                      {(filterCarat === "All" || filterCarat === "18K") && <Bar dataKey="18K" fill={GOLD_18K} radius={[3, 3, 0, 0]} />}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
                  <SectionHeader>Monthly Trend vs Target</SectionHeader>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={filteredMonthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                      <XAxis dataKey="month" stroke={TEXT_DIM} tick={{ fontSize: 10 }} />
                      <YAxis stroke={TEXT_DIM} tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                      <Tooltip contentStyle={tooltipStyle} formatter={v => [fmtAED(v)]} />
                      {(filterCarat === "All" || filterCarat === "24K") && <Line type="monotone" dataKey="24K" stroke={GOLD_24K} strokeWidth={2} dot={false} />}
                      {(filterCarat === "All" || filterCarat === "18K") && <Line type="monotone" dataKey="18K" stroke={GOLD_18K} strokeWidth={2} dot={false} />}
                      <Line type="monotone" dataKey="target" stroke={DANGER} strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Target" />
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
                  { label: "Low Stock", count: filteredBranches.filter(b => b.stock24K < b.reorderLevel24K || b.stock18K < b.reorderLevel18K).length, c: DANGER },
                  { label: "Healthy Stock", count: filteredBranches.filter(b => b.stock24K >= b.reorderLevel24K && b.stock18K >= b.reorderLevel18K).length, c: SUCCESS },
                  { label: "Overstocked", count: filteredBranches.filter(b => b.stock24K > 600 || b.stock18K > 450).length, c: WARNING },
                  { label: "Aging > 30d", count: filteredBranches.filter(b => b.inventoryAge > 30).length, c: DANGER },
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
                      {filteredBranches.map(b => {
                        const isLow24K = b.stock24K < b.reorderLevel24K;
                        const isLow18K = b.stock18K < b.reorderLevel18K;
                        const isOver = b.stock24K > 600 || b.stock18K > 450;
                        return (
                          <tr key={b.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                            <td style={{ padding: "10px 12px", color: TEXT }}>{b.name}</td>
                            <td style={{ padding: "10px 12px", color: isLow24K ? DANGER : GOLD_24K, fontFamily: "'DM Mono',monospace", fontWeight: isLow24K ? 600 : 400 }}>{b.stock24K}g</td>
                            <td style={{ padding: "10px 12px", color: TEXT_DIM }}>{b.reorderLevel24K}g</td>
                            <td style={{ padding: "10px 12px", color: isLow18K ? DANGER : GOLD_18K, fontFamily: "'DM Mono',monospace", fontWeight: isLow18K ? 600 : 400 }}>{b.stock18K}g</td>
                            <td style={{ padding: "10px 12px", color: TEXT_DIM }}>{b.reorderLevel18K}g</td>
                            <td style={{ padding: "10px 12px" }}>
                              {isLow24K || isLow18K ? (
                                <span style={{ color: DANGER, background: "rgba(255,68,68,0.12)", padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 500 }}>⚠ LOW</span>
                              ) : isOver ? (
                                <span style={{ color: WARNING, background: "rgba(245,166,35,0.12)", padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 500 }}>📦 OVER</span>
                              ) : (
                                <span style={{ color: SUCCESS, background: "rgba(78,205,196,0.1)", padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 500 }}>✓ OK</span>
                              )}
                            </td>
                            <td style={{ padding: "10px 12px", color: b.inventoryAge > 30 ? DANGER : TEXT_DIM, fontFamily: "'DM Mono',monospace", fontWeight: b.inventoryAge > 30 ? 600 : 400 }}>{b.inventoryAge}d</td>
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
                  <SectionHeader>Revenue by Category{filterCarat !== "All" ? ` (${filterCarat})` : ""}</SectionHeader>
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
                          <span style={{ color: item.avgDaysToSell <= 3 ? SUCCESS : item.avgDaysToSell <= 7 ? GOLD : DANGER, fontSize: 11, fontFamily: "'DM Mono',monospace" }}>{item.avgDaysToSell}d avg</span>
                        </div>
                        <div style={{ background: BORDER, borderRadius: 4, height: 5, overflow: "hidden" }}>
                          <div style={{
                            width: `${Math.min((item.avgDaysToSell / 12) * 100, 100)}%`,
                            background: item.avgDaysToSell <= 3 ? SUCCESS : item.avgDaysToSell <= 7 ? GOLD : DANGER,
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
                          <td style={{ padding: "10px 12px", color: item.carat === "24K" ? GOLD_24K : GOLD_18K, fontFamily: "'DM Mono',monospace" }}>{item.carat}</td>
                          <td style={{ padding: "10px 12px", color: TEXT }}>{item.qty}</td>
                          <td style={{ padding: "10px 12px", color: TEXT, fontFamily: "'DM Mono',monospace" }}>{item.grams}g</td>
                          <td style={{ padding: "10px 12px", color: GOLD, fontFamily: "'DM Mono',monospace" }}>{fmtAED(item.revenue)}</td>
                          <td style={{ padding: "10px 12px", fontFamily: "'DM Mono',monospace", color: item.avgDaysToSell <= 3 ? SUCCESS : item.avgDaysToSell <= 7 ? GOLD : DANGER, fontWeight: 500 }}>{item.avgDaysToSell}d</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{
                              color: item.avgDaysToSell <= 3 ? SUCCESS : item.avgDaysToSell <= 7 ? GOLD : DANGER,
                              background: item.avgDaysToSell <= 3 ? "rgba(43,152,144,0.12)" : item.avgDaysToSell <= 7 ? "rgba(201,168,76,0.1)" : "rgba(220,38,38,0.1)",
                              padding: "4px 10px", borderRadius: 6, fontSize: 10, fontFamily: "'DM Mono',monospace", fontWeight: 600,
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

        {/* ── NOTIFICATION PANE (AI-Powered, REACTIVE) ── */}
        <NotificationPane
          notifications={liveNotifs}
          summary={aiData.summary}
          criticalCount={aiData.criticalCount}
          onDismiss={handleDismiss}
          filter={notifFilter}
          setFilter={setNotifFilter}
          lastUpdated={lastUpdated}
        />
      </div>

      {/* ── VIEW ALL MODALS ── */}
      {viewAllModal === 'branches' && (
        <DetailModal
          title={`All ${topBranches.length} Branches — Performance Ranking`}
          subtitle={`${filterCarat !== 'All' ? filterCarat + ' · ' : ''}${filterBranch === 'All Branches' ? 'All Branches' : filterBranch} · ${filterDate}`}
          onClose={() => setViewAllModal(null)}
        >
          {/* Summary stats row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total Revenue', val: fmtAED(metrics.totalSales), c: GOLD, icon: '💰' },
              { label: 'Total Grams', val: `${(metrics.totalGrams / 1000).toFixed(2)} kg`, c: TEXT, icon: '⚖️' },
              { label: 'Total Transactions', val: metrics.totalTxns.toLocaleString(), c: TEXT, icon: '🧾' },
              { label: 'Branches Tracked', val: topBranches.length, c: GOLD, icon: '🏬' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ color: TEXT_DIM, fontSize: 9, fontFamily: "'DM Mono',monospace", marginBottom: 4, letterSpacing: '0.06em' }}>{s.label.toUpperCase()}</div>
                <div style={{ color: s.c, fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{s.val}</div>
              </div>
            ))}
          </div>
          {/* All branches grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {topBranches.map((b, i) => {
              const total = filterCarat === '24K' ? b.sales24K : filterCarat === '18K' ? b.sales18K : b.sales24K + b.sales18K;
              const maxB = topBranches[0];
              const max = filterCarat === '24K' ? maxB.sales24K : filterCarat === '18K' ? maxB.sales18K : maxB.sales24K + maxB.sales18K;
              const pct = max > 0 ? (total / max) * 100 : 0;
              const isLow = b.stock24K < b.reorderLevel24K || b.stock18K < b.reorderLevel18K;
              return (
                <div key={b.id} className={i < 3 ? "gold-glow" : ""} style={{
                  background: i < 3 ? (themeName === "dark" ? "#1A1505" : "#FFF9EB") : SURFACE, border: `1px solid ${i < 3 ? GOLD_DARK : BORDER}`,
                  borderRadius: 10, padding: '16px 18px', position: 'relative', overflow: 'hidden',
                  transition: 'border-color 0.2s, transform 0.2s',
                }}>
                  {i < 3 && <>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${GOLD_DARK},${GOLD})` }} />
                    <div className="gold-shimmer" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2 }} />
                  </>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{
                      color: i < 3 ? GOLD : TEXT_DIM, fontSize: 10, fontFamily: "'DM Mono',monospace",
                      background: i < 3 ? `${GOLD}15` : `${BORDER}88`, padding: '2px 8px', borderRadius: 4,
                    }}>#{i + 1}</div>
                    {isLow && <span style={{ color: DANGER, fontSize: 9, fontFamily: "'DM Mono',monospace", background: DANGER_BG, padding: '2px 6px', borderRadius: 4 }}>LOW STOCK</span>}
                  </div>
                  <div style={{ color: TEXT, fontSize: 13, fontWeight: 600, marginBottom: 10, lineHeight: 1.3 }}>{b.name}</div>
                  <div style={{ background: BORDER, borderRadius: 4, height: 4, marginBottom: 10, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, background: `linear-gradient(90deg,${GOLD_DARK},${GOLD})`, height: '100%', borderRadius: 4 }} />
                  </div>
                  <div style={{ color: GOLD, fontSize: 18, fontWeight: 700, fontFamily: "'Playfair Display',serif", marginBottom: 8 }}>{fmtAED(total)}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                    <div><div style={{ color: TEXT_DIM, fontSize: 8, fontFamily: "'DM Mono',monospace" }}>TXNS</div><div style={{ color: TEXT, fontSize: 12 }}>{b.transactions}</div></div>
                    <div><div style={{ color: TEXT_DIM, fontSize: 8, fontFamily: "'DM Mono',monospace" }}>GRAMS</div><div style={{ color: TEXT, fontSize: 12 }}>{(b.grams24K + b.grams18K).toLocaleString()}g</div></div>
                    <div><div style={{ color: TEXT_DIM, fontSize: 8, fontFamily: "'DM Mono',monospace" }}>AVG ORDER</div><div style={{ color: TEXT, fontSize: 12 }}>{fmtAED(b.avgOrderValue)}</div></div>
                    <div><div style={{ color: TEXT_DIM, fontSize: 8, fontFamily: "'DM Mono',monospace" }}>FAST ITEM</div><div style={{ color: '#4ECDC4', fontSize: 12 }}>{b.fastMoving}</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        </DetailModal>
      )}

      {viewAllModal === 'hourly' && (
        <DetailModal
          title={`Hourly Sales Trend — Full 24h View${filterCarat !== 'All' ? ` (${filterCarat})` : ''}`}
          subtitle={`${branchCountLabel} · ${filterDate} · Real-time hourly breakdown`}
          onClose={() => setViewAllModal(null)}
        >
          {/* Hourly KPI summary */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            {(() => {
              const peak = filteredHourlyData.reduce((a, b) => b.sales > a.sales ? b : a, filteredHourlyData[0]);
              const low = filteredHourlyData.reduce((a, b) => b.sales < a.sales && b.sales > 0 ? b : a, filteredHourlyData[12]);
              const avg = Math.round(filteredHourlyData.reduce((s, h) => s + h.sales, 0) / 24);
              const totalSales = filteredHourlyData.reduce((s, h) => s + h.sales, 0);
              return [
                { label: 'Total Hourly Revenue', val: fmtAED(totalSales), c: GOLD, icon: '📊' },
                { label: 'Peak Hour', val: `${peak.hour}`, sub: fmtAED(peak.sales), c: '#4ECDC4', icon: '🔥' },
                { label: 'Lowest Hour', val: `${low.hour}`, sub: fmtAED(low.sales), c: '#FF8C69', icon: '📉' },
                { label: 'Hourly Average', val: fmtAED(avg), c: TEXT, icon: '📈' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ color: TEXT_DIM, fontSize: 9, fontFamily: "'DM Mono',monospace", marginBottom: 4, letterSpacing: '0.06em' }}>{s.label.toUpperCase()}</div>
                  <div style={{ color: s.c, fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{s.val}</div>
                  {s.sub && <div style={{ color: TEXT_DIM, fontSize: 11, marginTop: 2 }}>{s.sub}</div>}
                </div>
              ));
            })()}
          </div>
          {/* Full-width hourly area chart */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={filteredHourlyData}>
                <defs>
                  <linearGradient id="goldGradModal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={filterCarat === '18K' ? GOLD_DARK : GOLD} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={filterCarat === '18K' ? GOLD_DARK : GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                <XAxis dataKey="hour" stroke={TEXT_DIM} tick={{ fontSize: 11, fontFamily: "'DM Mono',monospace" }} />
                <YAxis stroke={TEXT_DIM} tick={{ fontSize: 11 }} tickFormatter={v => fmt(v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={v => [fmtAED(v), 'Revenue']} />
                <Area type="monotone" dataKey="sales" stroke={filterCarat === '18K' ? GOLD_DARK : GOLD} fill="url(#goldGradModal)" strokeWidth={2.5} dot={{ r: 3, fill: GOLD, stroke: BG, strokeWidth: 2 }} activeDot={{ r: 6, fill: GOLD }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Hourly breakdown table */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
            <div style={{ color: TEXT_DIM, fontSize: 10, fontFamily: "'DM Mono',monospace", marginBottom: 12, letterSpacing: '0.06em' }}>HOUR-BY-HOUR BREAKDOWN</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
              {filteredHourlyData.map((h, i) => {
                const peak = filteredHourlyData.reduce((a, b) => b.sales > a.sales ? b : a, filteredHourlyData[0]);
                const isPeak = h.hour === peak.hour;
                const isActive = h.sales > 0;
                return (
                  <div key={i} style={{
                    background: isPeak ? '#1A1505' : SURFACE2, border: `1px solid ${isPeak ? GOLD_DARK : BORDER}`,
                    borderRadius: 8, padding: '10px 12px', textAlign: 'center',
                    opacity: isActive ? 1 : 0.4,
                  }}>
                    <div style={{ color: isPeak ? GOLD : TEXT_DIM, fontSize: 10, fontFamily: "'DM Mono',monospace", marginBottom: 4 }}>{h.hour}</div>
                    <div style={{ color: isPeak ? GOLD : TEXT, fontSize: 13, fontWeight: 600, fontFamily: "'Playfair Display',serif" }}>{fmtAED(h.sales)}</div>
                    {isPeak && <div style={{ color: GOLD, fontSize: 8, fontFamily: "'DM Mono',monospace", marginTop: 4 }}>🔥 PEAK</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </DetailModal>
      )}

      {/* FOOTER */}
      <div style={{
        background: SURFACE, borderTop: `1px solid ${BORDER}`,
        padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 10, color: TEXT_DIM, fontFamily: "'DM Mono',monospace", flexShrink: 0,
      }}>
        <span>AL NAFAIS GOLD — SALES INTELLIGENCE PLATFORM v3.0</span>
        <span style={{ color: GOLD, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ECDC4", display: "inline-block", animation: "pulse 2s infinite" }} />
          LIVE
        </span>
        <span>{filteredBranches.length} Branches · Dubai, UAE · Data refreshes every 30s</span>
      </div>
    </div>
  );
}
