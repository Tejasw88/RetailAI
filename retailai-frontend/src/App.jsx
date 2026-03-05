import { useState, useEffect, useRef, createContext, useContext } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie } from "recharts";
import { translations, RTL_LANGUAGES, LANGUAGE_LIST } from "./translations";
import { apiUrl } from "./api";
import AddProduct from "./components/AddProduct";
import StockManager from "./components/StockManager";

// ── LANGUAGE CONTEXT ──────────────────────────────────────────
const LangCtx = createContext();
function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("retailai-lang") || "en");
  const changeLang = (l) => { setLang(l); localStorage.setItem("retailai-lang", l); };
  const isRTL = RTL_LANGUAGES.includes(lang);
  return <LangCtx.Provider value={{ lang, setLang: changeLang, isRTL, t: translations[lang] || translations.en }}>{children}</LangCtx.Provider>;
}
const useLang = () => useContext(LangCtx);

// ── SYNTHETIC DATA ────────────────────────────────────────────
// ── CONSTANTS ────────────────────────────────────────────
const getCategoryEmoji = (cat) => {
  const map = { 'Staples': '🌾', 'Cooking': '🫙', 'Dairy': '🧈', 'Snacks': '🍪', 'Instant Food': '🍜', 'Household': '🧲', 'Personal Care': '🪵', 'Beverages': '🌵', 'Health': '💊', 'Other': '📦' };
  return map[cat] || '📦';
};

// Fetch products from API, fallback to localStorage cache
async function fetchProductsFromAPI() {
  try {
    const res = await fetch(apiUrl('/api/products'));
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    // Normalize: ensure emoji, avg_daily exist
    const products = data.map(p => ({
      ...p,
      emoji: p.emoji || getCategoryEmoji(p.category),
      avg_daily: parseFloat(p.avg_daily) || 10,
      current_stock: parseInt(p.current_stock) || 0,
      safety_stock: parseInt(p.safety_stock) || 0,
      reorder_point: parseInt(p.reorder_point) || 0,
      eoq: parseInt(p.eoq) || 0,
      lead_time_days: parseInt(p.lead_time_days) || 5,
      unit_cost: parseFloat(p.unit_cost) || 0,
      selling_price: parseFloat(p.selling_price) || 0,
      mrp: parseFloat(p.mrp) || parseFloat(p.selling_price) || 0,
    }));
    // Cache for offline use
    localStorage.setItem('retailai-products-cache', JSON.stringify(products));
    return products;
  } catch (e) {
    console.warn('API fetch failed, using cache:', e.message);
    try {
      return JSON.parse(localStorage.getItem('retailai-products-cache') || '[]');
    } catch { return []; }
  }
}

const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── HELPERS ───────────────────────────────────────────────────
function getGreeting(t) { const h = new Date().getHours(); return h < 12 ? t.goodMorning : h < 17 ? t.goodAfternoon : t.goodEvening; }
function statusLabel(s, t) { return s === "CRITICAL" ? "🚨 " + t.orderToday : s === "LOW" ? "⚠️ " + t.orderSoon : s === "OVERSTOCK" ? "📦 " + t.tooMuchStock : "✅ " + t.stockGood; }
function statusColor(s) { return s === "CRITICAL" ? "#dc2626" : s === "LOW" ? "#ea580c" : s === "OVERSTOCK" ? "#7c3aed" : "#16a34a"; }
function stockPct(p) { return Math.min(100, Math.round((p.current_stock / Math.max(p.eoq * 1.5, 1)) * 100)); }
function vibrate(ms = 50) { try { navigator.vibrate && navigator.vibrate(ms) } catch (e) { } }
function whatsAppOrder(items, t) {
  vibrate([100, 50, 100]);
  const msg = t.whatsappMessage + "\n" + items.map(i => `- ${i.name} × ${i.eoq} ${t.units}`).join("\n") + "\n" + t.whatsappThankYou;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}

// ── SHARED COMPONENTS ─────────────────────────────────────────
const Card = ({ children, style, onClick, anim }) => (
  <div onClick={onClick} style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", animation: anim || "slideUp 0.4s ease both", cursor: onClick ? "pointer" : "default", ...style }}>{children}</div>
);
const StatCard = ({ icon, value, label, color, onClick, anim }) => (
  <Card onClick={onClick} style={{ textAlign: "center", padding: "18px 12px" }} anim={anim}>
    <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: 36, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 12, color: "#666", marginTop: 6, fontWeight: 600 }}>{label}</div>
  </Card>
);
const StockBar = ({ pct, color }) => (
  <div style={{ height: 10, background: "#f0f0f0", borderRadius: 5, overflow: "hidden", marginTop: 8 }}>
    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 5, animation: "fillBar 0.8s ease both" }} />
  </div>
);
const Badge = ({ label, color }) => (
  <span style={{ background: color + "18", color, border: `1px solid ${color}40`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>{label}</span>
);
const BigBtn = ({ children, color, onClick, style }) => {
  const h = (e) => { vibrate(); onClick && onClick(e); };
  return <button onClick={h} style={{ width: "100%", minHeight: 52, borderRadius: 14, border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer", background: color || "#2563eb", color: "#fff", boxShadow: `0 4px 14px ${color || "#2563eb"}40`, ...style }}>{children}</button>;
};
const SectionTitle = ({ icon, title, sub }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 17, fontWeight: 800, color: "#1a1a2e" }}>{icon} {title}</div>
    {sub && <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{sub}</div>}
  </div>
);

// ── HOME SCREEN ───────────────────────────────────────────────
function HomeScreen({ onNav, onFilter, products }) {
  const { t } = useLang();
  const [activeSlice, setActiveSlice] = useState(null);
  const [festDismissed, setFestDismissed] = useState(false);

  const critical = products.filter(p => p.status === "CRITICAL").length;
  const low = products.filter(p => p.status === "LOW").length;
  const good = products.filter(p => p.status === "OPTIMAL" || p.status === "OVERSTOCK").length;

  const ALERTS = products.filter(p => p.status === "CRITICAL" || p.status === "LOW").map(p => ({
    ...p,
    daysLeft: Math.max(1, Math.round(p.current_stock / p.avg_daily)),
    savings: p.status === "CRITICAL" ? Math.round(p.eoq * p.unit_cost * 0.3) : Math.round(p.eoq * p.unit_cost * 0.15),
  }));
  const savings = ALERTS.reduce((s, a) => s + a.savings, 0);
  const urgents = ALERTS.filter(a => a.status === "CRITICAL" || a.status === "LOW");

  const STOCK_HEALTH = [
    { name: "critical", value: products.filter(p => p.status === "CRITICAL").length, color: "#dc2626", status: "CRITICAL" },
    { name: "orderSoonLabel", value: products.filter(p => p.status === "LOW").length, color: "#ea580c", status: "LOW" },
    { name: "allGood", value: products.filter(p => p.status === "OPTIMAL").length, color: "#16a34a", status: "OPTIMAL" },
    { name: "tooMuch", value: products.filter(p => p.status === "OVERSTOCK").length, color: "#7c3aed", status: "OVERSTOCK" },
  ];

  const TOP_SELLERS = [
    { ...products.find(p => p.id === 1), weekSold: 142, revenue: 49700, medal: "🥇", bg: "#fef3c7" },
    { ...products.find(p => p.id === 9), weekSold: 128, revenue: 4480, medal: "🥈", bg: "#f1f5f9" },
    { ...products.find(p => p.id === 11), weekSold: 119, revenue: 8330, medal: "🥉", bg: "#fef9ee" },
  ];

  const todayIdx = (new Date().getDay() + 6) % 7;
  const barColor = (d, i) => { if (i === todayIdx) return "#2563eb"; if (d.day === "Sat" || d.day === "Sun") return "#16a34a"; if (d.units === Math.min(...SALES_DATA.map(x => x.units))) return "#fca5a5"; return "#93c5fd"; };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 0 }}>{getGreeting(t)} 🏪</h1>
      <Card style={{ background: "linear-gradient(135deg,#FFFDE7,#FFF8E1)", border: "1px solid #FFF59D", padding: "14px 18px" }} anim="slideUp 0.4s 0.02s ease both">
        <div style={{ fontSize: 14, fontWeight: 700, color: "#5D4037", lineHeight: 1.6 }}>{t.shopkeeperKnows}<br />{t.weKnowFuture}</div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <StatCard icon="🚨" value={critical} label={critical + " " + t.itemsOrderToday} color="#dc2626" onClick={() => { onFilter("CRITICAL"); }} anim="slideUp 0.4s 0.05s ease both" />
        <StatCard icon="⚠️" value={low} label={low + " " + t.itemsOrderSoon} color="#ea580c" onClick={() => { onFilter("LOW"); }} anim="slideUp 0.4s 0.1s ease both" />
        <StatCard icon="✅" value={good} label={good + " " + t.itemsAllGood} color="#16a34a" anim="slideUp 0.4s 0.15s ease both" />
        <StatCard icon="💰" value={"₹" + (savings / 1000).toFixed(0) + "K"} label={t.saveThisWeek} color="#ca8a04" anim="slideUp 0.4s 0.2s ease both" />
      </div>

      {/* DONUT CHART */}
      <Card anim="slideUp 0.4s 0.25s ease both">
        <SectionTitle icon="🏥" title={t.shopHealth} sub={t.shopHealthSubtitle} />
        <div style={{ position: "relative", display: "flex", justifyContent: "center", margin: "8px 0" }}>
          <PieChart width={220} height={220}>
            <Pie data={STOCK_HEALTH} cx={110} cy={110} innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value"
              animationBegin={0} animationDuration={800}
              onClick={(_, i) => { vibrate(); setActiveSlice(activeSlice === i ? null : i); }}
            >
              {STOCK_HEALTH.map((e, i) => <Cell key={i} fill={e.color} stroke="none" style={{ cursor: "pointer", transform: activeSlice === i ? "scale(1.06)" : "scale(1)", transformOrigin: "center", transition: "transform 0.2s", filter: activeSlice === i ? `drop-shadow(0 4px 8px ${e.color}40)` : "none" }} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 13, fontFamily: "Nunito" }} formatter={(v) => [`${v} ${t.units}`, ""]} />
          </PieChart>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#1a1a2e" }}>{activeSlice !== null ? STOCK_HEALTH[activeSlice].value : products.length}</div>
            <div style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>{activeSlice !== null ? t[STOCK_HEALTH[activeSlice].name] : t.totalItems}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          {STOCK_HEALTH.map((s, i) => (
            <button key={i} onClick={() => { vibrate(); onFilter(s.status); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, border: "none", background: s.color + "14", cursor: "pointer", fontSize: 12, fontWeight: 700, color: s.color }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />{t[s.name]} {s.value}
            </button>
          ))}
        </div>
      </Card>

      {/* BAR CHART */}
      <Card anim="slideUp 0.4s 0.3s ease both">
        <SectionTitle icon="📈" title={t.last7DaysSales} sub={t.salesSubtitle} />
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={SALES_DATA}>
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#999" }} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", fontSize: 13 }} formatter={(v, n, p) => [`${v} ${t.units} — ₹${p.payload.revenue.toLocaleString()}`, ""]} />
            <Bar dataKey="units" radius={[6, 6, 0, 0]} animationDuration={600}>
              {SALES_DATA.map((d, i) => <Cell key={i} fill={barColor(d, i)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
          {[["📅", bestDay.day, t.bestDay, "#2563eb"], ["📦", totalUnits, t.totalThisWeek, "#16a34a"], ["🔮", "~" + Math.round(totalUnits * 1.08), t.expectedNextWeek, "#7c3aed"]].map(([ic, val, lab, col]) => (
            <div key={lab} style={{ background: "#f9f9f9", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 16 }}>{ic}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: col }}>{val}</div>
              <div style={{ fontSize: 10, color: "#999", fontWeight: 600 }}>{lab}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* TOP 3 */}
      <Card anim="slideUp 0.4s 0.35s ease both">
        <SectionTitle icon="🏆" title={t.bestSellers} sub={t.bestSellersSubtitle} />
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
          {TOP_SELLERS.map((p, i) => (
            <div key={p.id} onClick={() => { onFilter("ALL"); onNav("products"); }} style={{ minWidth: 150, background: p.bg, borderRadius: 14, padding: 14, textAlign: "center", cursor: "pointer", flexShrink: 0, animation: `slideUp 0.4s ${0.4 + i * 0.1}s ease both` }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{p.medal} #{i + 1}</div>
              <div style={{ fontSize: 28, margin: "6px 0" }}>{p.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1a1a2e" }}>{p.name}</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{p.weekSold} {t.soldThisWeek}</div>
              <StockBar pct={Math.round(p.weekSold / TOP_SELLERS[0].weekSold * 100)} color={i === 0 ? "#ca8a04" : i === 1 ? "#64748b" : "#b45309"} />
              <div style={{ fontSize: 13, fontWeight: 900, color: "#16a34a", marginTop: 6 }}>₹{p.revenue.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ORDER LIST */}
      {urgents.length > 0 && (
        <Card anim="slideUp 0.4s 0.45s ease both">
          <SectionTitle icon="📋" title={t.todaysOrderList} />
          {urgents.map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>{a.emoji}</span>
                <div><div style={{ fontWeight: 700, fontSize: 15 }}>{a.name}</div><div style={{ fontSize: 12, color: "#999" }}>{a.daysLeft} {t.daysOfStockLeft}</div></div>
              </div>
              <Badge label={statusLabel(a.status, t)} color={statusColor(a.status)} />
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <BigBtn color="#dc2626" onClick={() => onNav("alerts")}>🛒 {t.orderNow}</BigBtn>
            <BigBtn color="#25D366" onClick={() => whatsAppOrder(urgents, t)} style={{ maxWidth: 140, boxShadow: "0 4px 14px #25D36640" }}>📲 WhatsApp</BigBtn>
          </div>
        </Card>
      )}

      {/* FESTIVAL */}
      {!festDismissed && (
        <Card style={{ background: "linear-gradient(135deg,#FFF8E1,#FFFDE7)", border: "1px solid #FFD54F", position: "relative" }} anim="slideUp 0.4s 0.5s ease both">
          <button onClick={() => setFestDismissed(true)} style={{ position: "absolute", top: 8, right: 12, background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#999" }}>×</button>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#E65100" }}>{t.festivalComing}</div>
          <div style={{ fontSize: 12, color: "#795548", marginTop: 4 }}>{t.lastYearRanOut}</div>
        </Card>
      )}
    </div>
  );
}

// ── PRODUCTS SCREEN ───────────────────────────────────────────
function ProductsScreen({ initialFilter, onAdd, products }) {
  const { t } = useLang();
  const [filter, setFilter] = useState(initialFilter || "ALL");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  useEffect(() => { if (initialFilter) setFilter(initialFilter) }, [initialFilter]);
  const filters = [{ id: "ALL", label: t.allItems, color: "#2563eb" }, { id: "CRITICAL", label: "🚨 " + t.orderToday, color: "#dc2626" }, { id: "LOW", label: "⚠️ " + t.orderSoon, color: "#ea580c" }, { id: "OPTIMAL", label: "✅ " + t.stockGood, color: "#16a34a" }, { id: "OVERSTOCK", label: "📦 " + t.tooMuchStock, color: "#7c3aed" }];
  const filtered = products.filter(p => { if (filter !== "ALL" && p.status !== filter) return false; if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.category.toLowerCase().includes(search.toLowerCase())) return false; return true; });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>{t.allItemsInShop}</h1>
        <button onClick={onAdd} style={{ padding: "8px 12px", borderRadius: 12, border: "none", background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}>➕ {t.addProduct}</button>
      </div>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18 }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchProducts}
          style={{ width: "100%", padding: "14px 14px 14px 44px", borderRadius: 14, border: "1px solid #e5e5e5", fontSize: 16, background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }} />
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => { vibrate(); setFilter(f.id); }} style={{ padding: "8px 16px", borderRadius: 20, border: `1.5px solid ${filter === f.id ? f.color : "#e5e5e5"}`, background: filter === f.id ? f.color + "14" : "#fff", color: filter === f.id ? f.color : "#666", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{f.label}</button>
        ))}
      </div>
      {filtered.length === 0 && (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 64 }}>📦</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#999", marginTop: 8 }}>{t.noProductsFound}</div>
          <BigBtn color="#2563eb" style={{ marginTop: 20 }} onClick={onAdd}>➕ {t.addProduct}</BigBtn>
        </Card>
      )}
      {filtered.map((p, i) => {
        const pct = stockPct(p); const c = statusColor(p.status); const isOpen = expanded === p.id;
        const daysLeft = Math.max(1, Math.round(p.current_stock / p.avg_daily));
        const isNew = p.isCustom && (Date.now() - new Date(p.addedAt).getTime()) < 24 * 60 * 60 * 1000;
        const sparkline = Array.from({ length: 7 }, (_, j) => ({ d: j, v: Math.floor(Math.random() * 10 + p.avg_daily - 3) }));

        return (
          <Card key={p.id} onClick={() => { vibrate(); setExpanded(isOpen ? null : p.id); }} style={{ animation: `slideUp 0.3s ${i * 0.05}s both`, borderLeft: `4px solid ${c}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ fontSize: 32 }}>{p.emoji}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>
                    {p.name}
                    {isNew && <span style={{ background: '#2563eb', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 20, marginLeft: 6, verticalAlign: 'middle' }}>NEW</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#999", fontWeight: 700 }}>{p.brand} • {p.category}</div>
                </div>
              </div>
              <Badge label={statusLabel(p.status, t)} color={c} />
            </div>
            <StockBar pct={pct} color={c} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, alignItems: "baseline" }}>
              <div><span style={{ fontSize: 32, fontWeight: 900, color: c }}>{p.current_stock}</span><span style={{ fontSize: 14, color: "#999", marginLeft: 6 }}>{t.units}</span></div>
              <div style={{ fontSize: 12, color: "#999" }}>~{daysLeft} {t.days}</div>
            </div>
            {isOpen && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f0f0f0", animation: "fadeIn 0.3s" }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  {[[t.minStock, p.safety_stock + " " + t.units], [t.bestOrderQty, p.eoq + " " + t.units], [t.orderWhenReaches, p.reorder_point + " " + t.units], [t.supplierDeliversIn, p.lead_time_days + " " + t.days]].map(([l, v]) => (
                    <div key={l} style={{ background: "#f9f9f9", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 11, color: "#999", fontWeight: 600 }}>{l}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#1a1a2e" }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#666", marginBottom: 6 }}>{t.last7DaysSold}</div>
                <ResponsiveContainer width="100%" height={50}><LineChart data={sparkline}><Line type="monotone" dataKey="v" stroke={c} strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ── SALES SCREEN ──────────────────────────────────────────────
function SalesScreen({ products }) {
  const { t } = useLang();

  const ABC = {
    A: products.filter(p => [1, 2, 5].includes(p.id)),
    B: products.filter(p => [3, 4, 7, 8].includes(p.id)),
    C: products.filter(p => [6, 9, 10, 11, 12].includes(p.id)),
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 900 }}>{t.howShopDoing} 📊</h1>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{t.last7DaysSales}</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={SALES_DATA}>
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#999" }} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", fontSize: 13 }} formatter={(v, _, p) => [`${v} ${t.units} — ₹${p.payload.revenue.toLocaleString()}`, ""]} />
            <Bar dataKey="units" radius={[6, 6, 0, 0]}>{SALES_DATA.map((d, i) => <Cell key={i} fill={d.units >= avgUnits ? "#16a34a" : "#ea580c"} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <StatCard icon="📅" value={bestDay.day} label={t.bestDay} color="#2563eb" anim="slideUp 0.4s 0.05s ease both" />
        <StatCard icon="📦" value={totalUnits} label={t.totalThisWeek} color="#16a34a" anim="slideUp 0.4s 0.1s ease both" />
        <StatCard icon="🔮" value={"~" + Math.round(totalUnits * 1.08)} label={t.expectedNextWeek} color="#7c3aed" anim="slideUp 0.4s 0.15s ease both" />
      </div>
      <Card>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 14 }}>{t.mostImportantItems} 🏆</div>
        {[{ key: "A", items: ABC.A, color: "#dc2626", title: t.aItemsTitle, desc: t.aItemsDesc },
        { key: "B", items: ABC.B, color: "#ca8a04", title: t.bItemsTitle, desc: t.bItemsDesc },
        { key: "C", items: ABC.C, color: "#16a34a", title: t.cItemsTitle, desc: t.cItemsDesc },
        ].map(g => (
          <div key={g.key} style={{ marginBottom: 14, padding: 14, background: g.color + "08", borderRadius: 12, borderLeft: `4px solid ${g.color}` }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: g.color }}>{g.key} — {g.title}</div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{g.desc}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {g.items.map(p => <span key={p.id} style={{ background: "#fff", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>{p.emoji} {p.name}</span>)}
            </div>
          </div>
        ))}
      </Card>
      <Card style={{ background: "#FFF3E0", border: "1px solid #FFCC80" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#E65100" }}>{t.deadStockTitle}</div>
        <div style={{ fontSize: 13, color: "#795548", marginTop: 4 }}>{t.deadStockDesc}</div>
      </Card>
    </div>
  );
}

// ── TO-DO SCREEN ──────────────────────────────────────────────
function TodoScreen({ products }) {
  const { t } = useLang();
  const ALERTS = products.filter(p => p.status === "CRITICAL" || p.status === "LOW").map(p => ({
    ...p,
    daysLeft: Math.max(1, Math.round(p.current_stock / p.avg_daily)),
    savings: p.status === "CRITICAL" ? Math.round(p.eoq * p.unit_cost * 0.3) : Math.round(p.eoq * p.unit_cost * 0.15),
  }));
  const [alerts, setAlerts] = useState(ALERTS);
  const [resolved, setResolved] = useState([]);
  const handleDone = (id) => { vibrate([100, 50, 100]); setResolved(r => [...r, id]); setTimeout(() => setAlerts(a => a.filter(x => x.id !== id)), 500); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <h1 style={{ fontSize: 24, fontWeight: 900 }}>{t.todoTitle} ✅</h1>
      {alerts.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 64, animation: "bounceIn 0.5s ease" }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 12, color: "#16a34a" }}>{t.noAlerts}</div>
          <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>{t.noAlertsSubtitle}</div>
        </Card>
      ) : alerts.map((a, i) => (
        <div key={a.id} style={{ animation: resolved.includes(a.id) ? "slideOut 0.5s ease forwards" : `slideUp 0.4s ${i * 0.05}s ease both` }}>
          <Card style={{ borderLeft: `4px solid ${statusColor(a.status)}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 32 }}>{a.emoji}</span>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 18 }}>{a.name}</div><Badge label={statusLabel(a.status, t)} color={statusColor(a.status)} /></div>
            </div>
            <div style={{ fontSize: 15, color: "#333", marginBottom: 4 }}>{t.onlyXDaysLeft} <b style={{ color: statusColor(a.status) }}>{a.daysLeft} {t.days}</b> {t.daysLeftAlert}</div>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 10 }}>{t.orderXUnits} <b>{a.eoq} {t.units}</b> {t.orderBefore} {DAYS_EN[(new Date().getDay() + a.daysLeft) % 7]}</div>
            <div style={{ background: "#FFFDE7", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>💰</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#ca8a04" }}>{t.savesYou} ₹{a.savings.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <BigBtn color="#16a34a" onClick={() => handleDone(a.id)}>{t.markDone}</BigBtn>
              <BigBtn color="#25D366" onClick={() => whatsAppOrder([a], t)} style={{ maxWidth: 56, boxShadow: "0 4px 14px #25D36640" }}>📲</BigBtn>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}

// ── LANGUAGE SELECTOR ─────────────────────────────────────────
function LangModal({ onClose }) {
  const { lang, setLang, t } = useLang();
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)" }} />
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 500, maxHeight: "80vh", background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px", overflowY: "auto", animation: "slideUp 0.3s ease" }}>
        <div style={{ width: 40, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16, textAlign: "center" }}>{t.chooseLanguage}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {LANGUAGE_LIST.map(l => (
            <button key={l.code} onClick={() => { vibrate(); setLang(l.code); onClose(); }} style={{ padding: "12px 8px", borderRadius: 12, border: lang === l.code ? `2px solid ${l.color}` : "2px solid #eee", background: lang === l.code ? l.color + "10" : "#fafafa", cursor: "pointer", textAlign: "center", boxShadow: lang === l.code ? `0 0 0 3px ${l.color}20` : "none", transition: "all 0.2s" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, margin: "0 auto 6px" }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{l.native}</div>
              <div style={{ fontSize: 10, color: "#999" }}>{l.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SALES TRACKER ─────────────────────────────────────────────
function SalesTracker({ onClose, onAddNew, products }) {
  const { t } = useLang();
  const [mode, setMode] = useState(null);
  const [cashAmt, setCashAmt] = useState("");
  const [countData, setCountData] = useState(products.map(p => ({ ...p, newCount: "" })));
  const [done, setDone] = useState(false);
  const [soldQty, setSoldQty] = useState(1);
  const [soldProduct, setSoldProduct] = useState(null);
  const matchingProducts = cashAmt ? products.filter(p => p.selling_price === parseInt(cashAmt)) : [];

  if (done) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1001, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <Card style={{ textAlign: "center", padding: 30, maxWidth: 340, animation: "bounceIn 0.4s" }}>
        <div style={{ fontSize: 64 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 10, color: "#16a34a" }}>{t.youCountedWeDid}</div>
        <BigBtn color="#16a34a" onClick={onClose} style={{ marginTop: 16 }}>{t.close}</BigBtn>
      </Card>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1001, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)" }} />
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 500, maxHeight: "85vh", background: "#fff", borderRadius: "24px 24px 0 0", padding: 24, overflowY: "auto", animation: "slideUp 0.3s ease" }}>
        <div style={{ width: 40, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 16px" }} />
        {!mode && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, textAlign: "center" }}>{t.recordSale}</h2>
            {[{ id: "scan", icon: "📷", label: t.scanAndSell, desc: t.scanDesc, color: "#2563eb" },
            { id: "count", icon: "🌙", label: t.endOfDayCount, desc: t.countDesc, color: "#7c3aed" },
            { id: "cash", icon: "💵", label: t.cashSale, desc: t.cashDesc, color: "#16a34a" },
            ].map(o => (
              <button key={o.id} onClick={() => { vibrate(); setMode(o.id); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, border: "1px solid #eee", background: "#fff", cursor: "pointer", textAlign: "left", width: "100%", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 32, width: 48, textAlign: "center" }}>{o.icon}</div>
                <div><div style={{ fontWeight: 700, fontSize: 15, color: o.color }}>{o.label}</div><div style={{ fontSize: 12, color: "#999" }}>{o.desc}</div></div>
              </button>
            ))}
            <div style={{ height: 1, background: "#eee", margin: "8px 0" }} />
            <button onClick={() => { vibrate(); onClose(); onAddNew(); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, border: "1.5px dashed #2563eb", background: "#f0f7ff", cursor: "pointer", textAlign: "left", width: "100%" }}>
              <div style={{ fontSize: 32, width: 48, textAlign: "center" }}>➕</div>
              <div><div style={{ fontWeight: 800, fontSize: 15, color: "#2563eb" }}>{t.addProduct}</div><div style={{ fontSize: 12, color: "#666" }}>Scan product barcode</div></div>
            </button>
          </div>
        )}
        {mode === "cash" && (<div>
          <h2 style={{ fontSize: 20, fontWeight: 900, textAlign: "center", marginBottom: 16 }}>💵 {t.cashSale}</h2>
          <div style={{ textAlign: "center", fontSize: 36, fontWeight: 900, color: "#16a34a", marginBottom: 16, fontFamily: "monospace" }}>₹ {cashAmt || "0"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, maxWidth: 280, margin: "0 auto" }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((n, i) => (
              <button key={i} onClick={() => { vibrate(30); n === "⌫" ? setCashAmt(a => a.slice(0, -1)) : n !== "" && setCashAmt(a => a + n); }} style={{ height: 52, borderRadius: 12, border: "1px solid #eee", background: n === "" ? "transparent" : "#f9f9f9", fontSize: 20, fontWeight: 700, cursor: n === "" ? "default" : "pointer" }}>{n}</button>
            ))}
          </div>
          {matchingProducts.length > 0 && (<div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#666", marginBottom: 8 }}>{t.whichDidYouSell}</div>
            {matchingProducts.map(p => (<button key={p.id} onClick={() => { setSoldProduct(p); setDone(true); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: 12, borderRadius: 12, border: "1px solid #e5e5e5", background: "#fff", cursor: "pointer", marginBottom: 8, textAlign: "left" }}>
              <span style={{ fontSize: 24 }}>{p.emoji}</span><span style={{ fontWeight: 700 }}>{p.name} — ₹{p.selling_price}</span>
            </button>))}
          </div>)}
          {cashAmt && matchingProducts.length === 0 && parseInt(cashAmt) <= 20 && (<div style={{ marginTop: 12, textAlign: "center", color: "#999", fontSize: 13 }}>{t.smallItemNote}</div>)}
        </div>)}
        {mode === "count" && (<div>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>🌙 {t.countYourShelves}</h2>
          <div style={{ fontSize: 12, color: "#999", marginBottom: 14 }}>{t.howManyNow}</div>
          {countData.map((p, i) => (<div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
            <span style={{ fontSize: 20 }}>{p.emoji}</span>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div><div style={{ fontSize: 11, color: "#999" }}>{t.was}: {p.current_stock}</div></div>
            <input type="number" placeholder="?" value={p.newCount} onChange={e => { const v = e.target.value; setCountData(d => d.map((x, j) => j === i ? { ...x, newCount: v } : x)); }}
              style={{ width: 60, padding: 8, borderRadius: 8, border: "1px solid #ddd", textAlign: "center", fontSize: 16, fontWeight: 700 }} />
          </div>))}
          <BigBtn color="#7c3aed" onClick={() => setDone(true)} style={{ marginTop: 16 }}>✅ {t.done}</BigBtn>
        </div>)}
        {mode === "scan" && (<div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>📷 {t.scanAndSell}</h2>
          {!soldProduct ? (<div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
            {products.map(p => (<button key={p.id} onClick={() => { vibrate(); setSoldProduct(p); }} style={{ padding: 10, borderRadius: 10, border: "1px solid #eee", background: "#fff", cursor: "pointer", textAlign: "center" }}>
              <span style={{ fontSize: 24 }}>{p.emoji}</span><div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>{p.name}</div>
            </button>))}
          </div>) : (<div>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{soldProduct.emoji}</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{soldProduct.name}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, margin: "16px 0" }}>
              <button onClick={() => setSoldQty(q => Math.max(1, q - 1))} style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid #ddd", background: "#fff", fontSize: 20, cursor: "pointer" }}>−</button>
              <span style={{ fontSize: 40, fontWeight: 900, color: "#2563eb", minWidth: 50, textAlign: "center" }}>{soldQty}</span>
              <button onClick={() => setSoldQty(q => q + 1)} style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid #ddd", background: "#fff", fontSize: 20, cursor: "pointer" }}>+</button>
            </div>
            <BigBtn color="#16a34a" onClick={() => setDone(true)}>✅ {t.sold} — {soldQty} {soldQty > 1 ? t.units : t.units}</BigBtn>
          </div>)}
        </div>)}
      </div>
    </div>
  );
}

// ── INSTALL PROMPT ────────────────────────────────────────────
function InstallBanner() {
  const { t } = useLang();
  const [prompt, setPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(() => { const d = localStorage.getItem("retailai-install-dismissed"); return d && Date.now() - parseInt(d) < 3 * 24 * 60 * 60 * 1000; });
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const h = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener("beforeinstallprompt", h);
    window.addEventListener("appinstalled", () => setInstalled(true));
    if (window.matchMedia("(display-mode:standalone)").matches) setInstalled(true);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  if (!prompt || dismissed || installed) return null;
  const handleInstall = async () => { prompt.prompt(); const { outcome } = await prompt.userChoice; if (outcome === "accepted") setInstalled(true); setPrompt(null); };
  const handleDismiss = () => { localStorage.setItem("retailai-install-dismissed", Date.now().toString()); setDismissed(true); };
  return (
    <div style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", padding: "12px 16px", borderRadius: 14, margin: "0 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, animation: "slideUp 0.4s ease", boxShadow: "0 4px 20px rgba(37,99,235,0.3)" }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.installTitle}</div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button onClick={handleInstall} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#fff", color: "#2563eb", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>{t.installNow}</button>
        <button onClick={handleDismiss} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff", fontSize: 12, cursor: "pointer" }}>{t.later}</button>
      </div>
    </div>
  );
}

// ── OFFLINE BANNER ────────────────────────────────────────────
function OfflineBanner() {
  const { t } = useLang();
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  useEffect(() => {
    const on = () => { setOnline(true); setSyncing(true); setTimeout(() => setSyncing(false), 2000); };
    const off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  if (online && !syncing) return null;
  return <div style={{ background: online ? "#16a34a" : "#ea580c", color: "#fff", padding: "8px 16px", textAlign: "center", fontSize: 13, fontWeight: 600, animation: "slideUp 0.3s ease" }}>{online ? t.backOnline : t.noInternet}</div>;
}

// ── ROOT APP ──────────────────────────────────────────────────
function AppContent() {
  const { t, isRTL } = useLang();
  const [tab, setTab] = useState("home");
  const [showLang, setShowLang] = useState(false);
  const [showTracker, setShowTracker] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [prodFilter, setProdFilter] = useState("ALL");
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const refreshProducts = async () => {
    const products = await fetchProductsFromAPI();
    setAllProducts(products);
    setProductsLoading(false);
  };

  useEffect(() => { refreshProducts(); }, []);

  const ALERTS_COUNT = allProducts.filter(p => p.status === "CRITICAL" || p.status === "LOW").length;

  const tabs = [
    { id: "home", icon: "🏠", label: t.home },
    { id: "stock", icon: "🛒", label: t.stock },
    { id: "products", icon: "📦", label: t.products },
    { id: "sales", icon: "📊", label: t.sales },
    { id: "alerts", icon: "✅", label: t.todo, badge: ALERTS_COUNT }
  ];
  const handleNav = (id) => { vibrate(); setTab(id); };
  const handleFilter = (f) => { vibrate(); setProdFilter(f); setTab("products"); };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: "var(--bg)", paddingTop: "env(safe-area-inset-top,0px)", paddingBottom: "calc(72px + env(safe-area-inset-bottom,0px))" }}>
      <OfflineBanner />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", position: "sticky", top: 0, zIndex: 50, background: "var(--bg)" }}>
        <div style={{ fontWeight: 900, fontSize: 20, color: "var(--text)" }}>{t.appName}</div>
        <button onClick={() => setShowLang(true)} style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid #e5e5e5", background: "#fff", fontSize: 18, cursor: "pointer", boxShadow: "var(--shadow)" }}>🌐</button>
      </div>
      <InstallBanner />
      <div style={{ padding: "0 16px 16px", maxWidth: 500, margin: "0 auto", animation: "fadeIn 0.3s ease" }}>
        {tab === "home" && <HomeScreen onNav={handleNav} onFilter={handleFilter} products={allProducts} />}
        {tab === "stock" && <StockManager />}
        {tab === "products" && <ProductsScreen initialFilter={prodFilter} onAdd={() => setShowAddProduct(true)} products={allProducts} />}
        {tab === "sales" && <SalesScreen products={allProducts} />}
        {tab === "alerts" && <TodoScreen products={allProducts} />}
      </div>
      <button onClick={() => { vibrate(); setShowTracker(true); }} style={{ position: "fixed", bottom: `calc(84px + env(safe-area-inset-bottom,0px))`, right: 20, width: 56, height: 56, borderRadius: "50%", border: "none", background: "linear-gradient(135deg,#2563eb,#16a34a)", color: "#fff", fontSize: 28, fontWeight: 900, cursor: "pointer", boxShadow: "0 4px 20px rgba(37,99,235,0.4)", zIndex: 40, animation: "pulse 2s infinite" }}>+</button>
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: `calc(68px + env(safe-area-inset-bottom,0px))`, paddingBottom: "env(safe-area-inset-bottom,0px)", background: "#fff", boxShadow: "0 -2px 12px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-around", alignItems: "flex-start", paddingTop: 8, zIndex: 50, borderTop: "1px solid #f0f0f0" }}>
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => handleNav(tb.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 16px", background: "none", border: "none", cursor: "pointer", position: "relative", minWidth: 48, minHeight: 48 }}>
            <span style={{ fontSize: 22, filter: tab === tb.id ? "none" : "grayscale(1) opacity(0.5)" }}>{tb.icon}</span>
            <span style={{ fontSize: 11, fontWeight: tab === tb.id ? 800 : 600, color: tab === tb.id ? "#2563eb" : "#999" }}>{tb.label}</span>
            {tb.badge > 0 && <span style={{ position: "absolute", top: 0, right: 8, width: 18, height: 18, borderRadius: "50%", background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{tb.badge}</span>}
          </button>
        ))}
      </div>
      {showLang && <LangModal onClose={() => setShowLang(false)} />}
      {showTracker && <SalesTracker onClose={() => setShowTracker(false)} onAddNew={() => setShowAddProduct(true)} products={allProducts} />}
      {showAddProduct && <AddProduct onClose={() => setShowAddProduct(false)} t={t} products={allProducts} vibrate={vibrate} onAdded={refreshProducts} />}
    </div>
  );
}

export default function App() {
  return <LangProvider><AppContent /></LangProvider>;
}
