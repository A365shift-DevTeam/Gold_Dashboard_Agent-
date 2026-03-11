import { fmtAED } from './constants';
import { useTheme } from './themeContext';

// ─── DETAIL MODAL (Premium Full-Screen Overlay) ─────────────────────────────
export function DetailModal({ title, subtitle, onClose, children }) {
  const { GOLD, GOLD_DARK, BG, SURFACE, SURFACE2, BORDER, TEXT_DIM } = useTheme();
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "fadeIn 0.25s ease-out",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: BG, border: `1px solid ${BORDER}`,
          borderRadius: 16, width: "90vw", maxWidth: 1200,
          maxHeight: "85vh", display: "flex", flexDirection: "column",
          boxShadow: `0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px ${GOLD_DARK}33`,
          animation: "slideUp 0.3s ease-out",
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: "20px 28px", borderBottom: `1px solid ${BORDER}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: SURFACE, borderRadius: "16px 16px 0 0", flexShrink: 0,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 3, height: 20, background: `linear-gradient(180deg,${GOLD},${GOLD_DARK})`, borderRadius: 2 }} />
              <span style={{ color: GOLD, fontSize: 18, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{title}</span>
            </div>
            {subtitle && <div style={{ color: TEXT_DIM, fontSize: 11, fontFamily: "'DM Mono',monospace", marginTop: 4, paddingLeft: 13 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{
            background: SURFACE2, border: `1px solid ${BORDER}`, color: TEXT_DIM,
            borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12,
            display: "flex", alignItems: "center", gap: 6,
            transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT_DIM; }}
          >
            <span style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", opacity: 0.5 }}>ESC</span> ✕ Close
          </button>
        </div>
        {/* Modal Body - scrollable */}
        <div className="scroll-container" style={{ flex: 1, padding: 28, overflow: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}


// ─── KPI CARD ────────────────────────────────────────────────────────────────
export function KPICard({ label, value, sub, delta, icon, highlight, pulse }) {
  const { GOLD, GOLD_BRIGHT, GOLD_DARK, SURFACE, BORDER, TEXT, TEXT_DIM, themeName, SUCCESS, DANGER } = useTheme();
  const up = delta > 0;
  return (
    <div className={highlight ? "gold-glow" : ""} style={{
      background: highlight 
        ? (themeName === "dark" 
            ? `linear-gradient(135deg, #1A1505 0%, #2A2008 100%)` 
            : `linear-gradient(135deg, #FFF9EB 0%, #F5E9C8 100%)`) 
        : SURFACE,
      border: `1px solid ${highlight ? GOLD : BORDER}`,
      borderRadius: 12, padding: "20px 22px", flex: 1, minWidth: 160,
      position: "relative", overflow: "hidden",
      transition: "all 0.4s ease",
      boxShadow: pulse ? `0 0 12px ${GOLD}22` : (highlight ? `0 0 20px ${GOLD_BRIGHT}20` : "none"),
    }}>
      {highlight && <>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${GOLD_DARK}, ${GOLD})`,
        }} />
        <div className="gold-shimmer" style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
        }} />
      </>}
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ color: TEXT_DIM, fontSize: 11, fontFamily: "'DM Mono',monospace", letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
      <div style={{
        color: highlight ? GOLD : TEXT, fontSize: 26, fontWeight: 700,
        fontFamily: "'Playfair Display',serif", letterSpacing: "-0.02em",
        transition: "color 0.3s",
      }}>{value}</div>
      {sub && <div style={{ color: TEXT_DIM, fontSize: 11, marginTop: 4 }}>{sub}</div>}
      {delta !== undefined && (
        <div style={{ color: up ? SUCCESS : DANGER, fontSize: 11, marginTop: 6, fontFamily: "'DM Mono',monospace" }}>
          {up ? "▲" : "▼"} {Math.abs(delta)}% vs yesterday
        </div>
      )}
    </div>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
export function SectionHeader({ children, action, onAction }) {
  const { GOLD, GOLD_DARK, TEXT } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative", width: 3, height: 18 }}>
          <div style={{ width: 3, height: 18, background: `linear-gradient(180deg,${GOLD},${GOLD_DARK})`, borderRadius: 2 }} />
          <div className="gold-shimmer" style={{ position: "absolute", top: 0, left: 0, width: 3, height: 18, borderRadius: 2 }} />
        </div>
        <span style={{ color: TEXT, fontSize: 14, fontWeight: 600, fontFamily: "'Playfair Display',serif", letterSpacing: "0.01em" }}>{children}</span>
      </div>
      {action && <span onClick={onAction} style={{ color: GOLD, fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono',monospace" }}>{action}</span>}
    </div>
  );
}

// ─── NOTIFICATION PANE ───────────────────────────────────────────────────────
export function NotificationPane({ notifications, summary, criticalCount, onDismiss, filter, setFilter, lastUpdated }) {
  const { GOLD, GOLD_DARK, SURFACE, SURFACE2, BORDER, TEXT, TEXT_DIM, themeName, SUCCESS, SUCCESS_BG, WARNING, WARNING_BG, DANGER, DANGER_BG, INFO, INFO_BG } = useTheme();
  const FILTERS = ["all", "critical", "warning", "info", "success"];
  const FILTER_COLORS = { all: TEXT_DIM, critical: DANGER, warning: WARNING, info: INFO, success: SUCCESS };
  const filtered = filter === "all" ? notifications : notifications.filter(n => n.type === filter);
  return (
    <div style={{ width: 340, background: SURFACE, borderLeft: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", height: "100%", flexShrink: 0 }}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${BORDER}`, background: SURFACE2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ color: GOLD, fontSize: 13, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>Intelligence Centre</div>
            {/* Live pulse indicator */}
            <div style={{
              width: 6, height: 6, borderRadius: "50%", background: SUCCESS,
              animation: "pulse 2s infinite",
            }} />
          </div>
          <div style={{ color: TEXT_DIM, fontSize: 10, fontFamily: "'DM Mono',monospace", marginTop: 2 }}>
            LIVE AI-POWERED ALERTS
            {lastUpdated && <span style={{ marginLeft: 8, color: SUCCESS }}>· Updated {lastUpdated}</span>}
          </div>
        </div>
        {criticalCount > 0 && <div style={{ background: DANGER, color: "#fff", borderRadius: 10, fontSize: 10, padding: "2px 8px", fontWeight: 700, fontFamily: "'DM Mono',monospace", animation: "pulse 1.5s infinite" }}>{criticalCount} CRITICAL</div>}
      </div>

      <div style={{ margin: 14, background: themeName === "dark" ? "#0D1018" : SURFACE, border: `1px solid ${GOLD_DARK}`, borderRadius: 10, padding: 14 }}>
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

      <div className="notif-scroll" style={{ flex: 1, padding: "0 14px 14px" }}>
        {filtered.length === 0 && <div style={{ color: TEXT_DIM, fontSize: 11, textAlign: "center", padding: 20 }}>No {filter} alerts</div>}
        {filtered.map(n => (
          <div key={n.id} style={{
            background: SURFACE2, border: `1px solid ${BORDER}`,
            borderLeft: `3px solid ${n.type === "critical" ? DANGER : n.type === "warning" ? WARNING : n.type === "success" ? SUCCESS : INFO}`,
            borderRadius: 8, padding: "14px 16px", marginBottom: 12, transition: "all 0.3s ease",
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
              marginTop: 10, 
              background: n.type === "critical" ? DANGER_BG : n.type === "warning" ? WARNING_BG : n.type === "success" ? SUCCESS_BG : INFO_BG,
              border: `1px solid ${n.type === "critical" ? DANGER : n.type === "warning" ? WARNING : n.type === "success" ? SUCCESS : INFO}44`,
              color: n.type === "critical" ? DANGER : n.type === "warning" ? WARNING : n.type === "success" ? SUCCESS : INFO,
              borderRadius: 5, padding: "6px 12px", cursor: "pointer", fontSize: 10, fontFamily: "'DM Mono',monospace",
            }}>{n.action}</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BRANCH TABLE ────────────────────────────────────────────────────────────
export function BranchTable({ data, onSelect, selected }) {
  const { GOLD, GOLD_24K, GOLD_18K, GOLD_DARK, SURFACE2, BORDER, TEXT, TEXT_DIM, themeName, DANGER, DANGER_BG, SUCCESS, SUCCESS_BG } = useTheme();
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
                  background: isSelected ? (themeName === "dark" ? "#1A1505" : "#FFF9EB") : "transparent",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => !isSelected && (e.currentTarget.style.background = SURFACE2)}
                onMouseLeave={e => !isSelected && (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "11px 12px", color: isSelected ? GOLD : TEXT, fontWeight: isSelected ? 600 : 400 }}>{b.name}</td>
                <td style={{ padding: "11px 12px", color: GOLD_24K, fontFamily: "'DM Mono',monospace" }}>{fmtAED(b.sales24K)}</td>
                <td style={{ padding: "11px 12px", color: GOLD_18K, fontFamily: "'DM Mono',monospace" }}>{fmtAED(b.sales18K)}</td>
                <td style={{ padding: "11px 12px", color: TEXT, fontFamily: "'DM Mono',monospace" }}>{(b.grams24K + b.grams18K).toLocaleString()}g</td>
                <td style={{ padding: "11px 12px", color: TEXT }}>{b.transactions}</td>
                <td style={{ padding: "11px 12px", color: TEXT, fontFamily: "'DM Mono',monospace" }}>{fmtAED(b.avgOrderValue)}</td>
                <td style={{ padding: "11px 12px" }}>
                  {(isLow24K || isLow18K) ? (
                    <span style={{ color: DANGER, background: DANGER_BG, padding: "4px 10px", borderRadius: 6, fontSize: 10, fontFamily: "'DM Mono',monospace", fontWeight: 500 }}>
                      LOW {isLow24K ? "24K" : "18K"}
                    </span>
                  ) : (
                    <span style={{ color: SUCCESS, background: SUCCESS_BG, padding: "4px 10px", borderRadius: 6, fontSize: 10, fontFamily: "'DM Mono',monospace", fontWeight: 500 }}>OK</span>
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

// ─── BRANCH DETAIL ───────────────────────────────────────────────────────────
export function BranchDetail({ branch, onClose }) {
  const { GOLD, GOLD_24K, GOLD_18K, GOLD_DARK, BG, SURFACE2, BORDER, TEXT, TEXT_DIM, SUCCESS, DANGER, WARNING } = useTheme();
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
          { label: "24K Revenue", val: fmtAED(branch.sales24K), c: GOLD_24K },
          { label: "18K Revenue", val: fmtAED(branch.sales18K), c: GOLD_18K },
          { label: "Total Grams", val: `${branch.grams24K + branch.grams18K}g`, c: TEXT },
          { label: "Transactions", val: branch.transactions, c: TEXT },
          { label: "Avg Order", val: fmtAED(branch.avgOrderValue), c: TEXT },
          { label: "24K Stock", val: `${branch.stock24K}g`, c: branch.stock24K < branch.reorderLevel24K ? DANGER : SUCCESS },
          { label: "18K Stock", val: `${branch.stock18K}g`, c: branch.stock18K < branch.reorderLevel18K ? DANGER : SUCCESS },
          { label: "Avg Days to Sell", val: `${branch.inventoryAge}d`, c: TEXT },
        ].map(item => (
          <div key={item.label} style={{ background: BG, borderRadius: 8, padding: "12px 14px", border: `1px solid ${BORDER}` }}>
            <div style={{ color: TEXT_DIM, fontSize: 9, fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em", marginBottom: 4 }}>{item.label.toUpperCase()}</div>
            <div style={{ color: item.c, fontSize: 18, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{item.val}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1, background: BG, borderRadius: 8, padding: 16, border: `1px solid ${BORDER}` }}>
          <div style={{ color: TEXT_DIM, fontSize: 9, fontFamily: "'DM Mono',monospace", marginBottom: 6 }}>FAST MOVING</div>
          <div style={{ color: SUCCESS, fontSize: 14, fontWeight: 600 }}>🚀 {branch.fastMoving}</div>
        </div>
        <div style={{ flex: 1, background: BG, borderRadius: 8, padding: 16, border: `1px solid ${BORDER}` }}>
          <div style={{ color: TEXT_DIM, fontSize: 9, fontFamily: "'DM Mono',monospace", marginBottom: 6 }}>SLOW MOVING</div>
          <div style={{ color: WARNING, fontSize: 14, fontWeight: 600 }}>🐢 {branch.slowMoving}</div>
        </div>
        <div style={{ flex: 1, background: BG, borderRadius: 8, padding: 16, border: `1px solid ${BORDER}` }}>
          <div style={{ color: TEXT_DIM, fontSize: 9, fontFamily: "'DM Mono',monospace", marginBottom: 6 }}>STOCK STATUS</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: branch.stock24K < branch.reorderLevel24K || branch.stock18K < branch.reorderLevel18K ? DANGER : SUCCESS }}>
            {branch.stock24K < branch.reorderLevel24K || branch.stock18K < branch.reorderLevel18K ? "⚠️ Reorder Needed" : "✅ Healthy Stock"}
          </div>
        </div>
      </div>
    </div>
  );
}
