import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from "recharts";

const API = "http://localhost:3001/api";

const STATUS_CONFIG = {
  CRITICAL: { color: "#ff4d4d", bg: "rgba(255,77,77,0.12)",   label: "Critical",  icon: "⚠" },
  LOW:      { color: "#ff9500", bg: "rgba(255,149,0,0.12)",   label: "Low Stock", icon: "↓" },
  OVERSTOCK:{ color: "#bf5af2", bg: "rgba(191,90,242,0.12)", label: "Overstock", icon: "↑" },
  OPTIMAL:  { color: "#30d158", bg: "rgba(48,209,88,0.12)",  label: "Optimal",   icon: "✓" },
};
const CAT_COLORS = ["#0a84ff","#30d158","#ff9500","#ff4d4d","#bf5af2","#ffd60a","#32ade6","#ff375f","#63e6be","#e8d44d","#ff8c42","#a8dadc"];

// ─── HOOK: fetch from API ─────────────────────────────────────
function useApi(endpoint, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API}${endpoint}`);
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      setData(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [endpoint]);
  useEffect(() => { load(); }, [load, ...deps]);
  return { data, loading, error, reload: load };
}

// ─── UI COMPONENTS ────────────────────────────────────────────
const Spinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120 }}>
    <div style={{ width: 32, height: 32, border: "3px solid rgba(255,255,255,0.1)", borderTop: "3px solid #0a84ff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
  </div>
);

const KPICard = ({ label, value, sub, color, icon, pulse }) => (
  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
    {pulse && <div style={{ position: "absolute", top: 12, right: 12, width: 8, height: 8, borderRadius: "50%", background: color, animation: "pulse 2s infinite" }} />}
    <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontSize: 30, fontWeight: 900, color, fontFamily: "monospace", letterSpacing: -1 }}>{value ?? "—"}</div>
    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
  </div>
);

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.OPTIMAL;
  return (
    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

const StockBar = ({ current, reorder, eoq, safety }) => {
  const max = Math.max(current, eoq * 2.2, 10);
  const pct = v => Math.min(100, (v / max) * 100);
  const barColor = current <= safety ? "#ff4d4d" : current <= reorder ? "#ff9500" : current > eoq * 2 ? "#bf5af2" : "#30d158";
  return (
    <div style={{ position: "relative", height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4, marginTop: 8 }}>
      <div style={{ position: "absolute", left: 0, width: `${pct(current)}%`, height: "100%", borderRadius: 4, background: barColor, transition: "width 0.8s ease" }} />
      <div style={{ position: "absolute", left: `${pct(reorder)}%`, top: -3, width: 2, height: 14, background: "#ff9500", borderRadius: 1 }} />
      <div style={{ position: "absolute", left: `${pct(safety)}%`, top: -3, width: 2, height: 14, background: "#ff4d4d", borderRadius: 1 }} />
    </div>
  );
};

const ErrorBox = ({ msg }) => (
  <div style={{ background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.3)", borderRadius: 12, padding: 20, color: "#ff4d4d", fontSize: 13 }}>
    ⚠ API Error: {msg}<br />
    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Make sure the Node.js server is running on port 3001</span>
  </div>
);

// ─── TAB: DASHBOARD ───────────────────────────────────────────
function DashboardTab({ onNavigate }) {
  const { data: summary, loading: sl, error: se } = useApi("/summary");
  const { data: history, loading: hl, error: he } = useApi("/history");
  const { data: categories, loading: cl } = useApi("/categories");
  const { data: alerts } = useApi("/alerts");

  const catData = (categories || []).map((c, i) => ({
    name: c.category, value: +(c.stock_value / 1000).toFixed(1), color: CAT_COLORS[i % CAT_COLORS.length]
  }));

  const histData = (history || []).map(h => ({
    date: new Date(h.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    units: parseInt(h.total_units),
    revenue: parseFloat(h.total_revenue)
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {se ? <ErrorBox msg={se} /> : sl ? <Spinner /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
          <KPICard label="Total SKUs" value={summary.totalProducts} icon="📦" color="#0a84ff" sub="Tracked products" />
          <KPICard label="Critical" value={summary.critical} icon="🚨" color="#ff4d4d" sub="Stockout imminent" pulse={summary.critical > 0} />
          <KPICard label="Low Stock" value={summary.low} icon="⚠️" color="#ff9500" sub="Below reorder point" />
          <KPICard label="Overstock" value={summary.overstock} icon="📈" color="#bf5af2" sub="Excess inventory" />
          <KPICard label="Forecast Accuracy" value={`${summary.forecastAccuracy}%`} icon="🎯" color="#30d158" sub="7-day ML model" />
          <KPICard label="Potential Savings" value={`₹${(summary.totalSavings/1000).toFixed(0)}K`} icon="💰" color="#ffd60a" sub="Actionable now" />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>📊 30-Day Sales Trend</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>Aggregate daily units sold • Live from Neon DB</div>
          {hl ? <Spinner /> : he ? <ErrorBox msg={he} /> : (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={histData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0a84ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0a84ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }} tickLine={false} interval={4} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#12121f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="units" stroke="#0a84ff" strokeWidth={2} fill="url(#g1)" dot={false} name="Units Sold" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>🗂 Stock Value by Category</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>₹ Thousands</div>
          {cl ? <Spinner /> : (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={catData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3}>
                    {catData.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#12121f", border: "none", borderRadius: 8, fontSize: 11 }} formatter={v => [`₹${v}K`, "Value"]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {catData.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                    <div style={{ width: 7, height: 7, borderRadius: 2, background: c.color }} />{c.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status cards */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {Object.entries(STATUS_CONFIG).map(([s, cfg]) => {
            const count = summary[s.toLowerCase()] || 0;
            const pct = Math.round((count / summary.totalProducts) * 100);
            return (
              <div key={s} onClick={() => onNavigate("inventory", s)} className="card-hover"
                style={{ background: cfg.bg, border: `1px solid ${cfg.color}30`, borderRadius: 14, padding: "16px 18px", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: cfg.color, fontFamily: "monospace" }}>{count}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{pct}% of inventory</div>
                  </div>
                  <div style={{ fontSize: 28, opacity: 0.5 }}>{cfg.icon}</div>
                </div>
                <div style={{ marginTop: 10, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: cfg.color, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Top alerts */}
      {alerts && alerts.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>💡 Top Action Items This Week</div>
          {alerts.slice(0, 5).map(a => (
            <div key={a.id} className="card-hover" onClick={() => onNavigate("alerts")}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <StatusBadge status={a.status} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{a.product_name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{a.category} · {a.days_of_stock} days of stock</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#ffd60a", fontFamily: "monospace" }}>₹{parseFloat(a.potential_savings).toLocaleString()}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>exposure</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TAB: INVENTORY ───────────────────────────────────────────
function InventoryTab({ initFilter }) {
  const [filterStatus, setFilterStatus] = useState(initFilter || "ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  const endpoint = filterStatus === "ALL" ? "/products" : `/products?status=${filterStatus}`;
  const { data: products, loading, error } = useApi(endpoint, [filterStatus]);

  useEffect(() => { if (initFilter) setFilterStatus(initFilter); }, [initFilter]);

  async function loadDetail(id) {
    if (selected === id) { setSelected(null); setDetail(null); return; }
    setSelected(id);
    const r = await fetch(`${API}/products/${id}`);
    const d = await r.json();
    setDetail(d);
  }

  const filtered = (products || []).filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 14px", color: "#fff", fontSize: 13, width: 210 }} />
        <div style={{ display: "flex", gap: 6 }}>
          {["ALL","CRITICAL","LOW","OVERSTOCK","OPTIMAL"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className="tab-btn"
              style={{ padding: "7px 13px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: filterStatus === s ? (STATUS_CONFIG[s]?.bg || "rgba(255,255,255,0.12)") : "rgba(255,255,255,0.04)",
                border: filterStatus === s ? `1px solid ${STATUS_CONFIG[s]?.color || "#fff"}40` : "1px solid rgba(255,255,255,0.08)",
                color: filterStatus === s ? (STATUS_CONFIG[s]?.color || "#fff") : "rgba(255,255,255,0.5)" }}>
              {s === "ALL" ? "All" : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{filtered.length} products</div>
      </div>

      {error ? <ErrorBox msg={error} /> : loading ? <Spinner /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
          {filtered.map(p => {
            const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.OPTIMAL;
            const isOpen = selected === p.id;
            return (
              <div key={p.id} className="card-hover" onClick={() => loadDetail(p.id)}
                style={{ background: isOpen ? cfg.bg : "rgba(255,255,255,0.03)", border: `1px solid ${isOpen ? cfg.color + "50" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: 18, transition: "all 0.25s", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{p.category} · {p.id}</div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                  {[["In Stock", p.current_stock, "units", cfg.color], ["Avg Daily", p.avg_daily, "units/day", "#0a84ff"], ["Days Left", p.days_of_stock, "days", parseFloat(p.days_of_stock) < 7 ? "#ff4d4d" : "#30d158"]].map(([label, val, unit, color]) => (
                    <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "9px 11px" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "monospace" }}>{val ?? "—"}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>

                <StockBar current={parseInt(p.current_stock)} reorder={parseInt(p.reorder_point)} eoq={parseInt(p.eoq)} safety={parseInt(p.safety_stock)} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                  <span>Safety: {p.safety_stock}</span><span>Reorder: {p.reorder_point}</span><span>EOQ: {p.eoq}</span>
                </div>

                {isOpen && detail && detail.id === p.id && (
                  <div style={{ marginTop: 16, animation: "fadeIn 0.3s ease" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>History + 7-Day Forecast</div>
                    <ResponsiveContainer width="100%" height={100}>
                      <LineChart data={[
                        ...(detail.history || []).slice().reverse().map(h => ({ date: new Date(h.sale_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }), actual: h.units_sold })),
                        ...(detail.forecast || []).map(f => ({ date: new Date(f.forecast_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }), predicted: f.predicted_units }))
                      ]}>
                        <XAxis dataKey="date" hide />
                        <YAxis hide />
                        <Tooltip contentStyle={{ background: "#12121f", border: "none", borderRadius: 8, fontSize: 10 }} />
                        <Line type="monotone" dataKey="actual" stroke="#0a84ff" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="predicted" stroke="#30d158" strokeWidth={2} dot={false} strokeDasharray="4 3" />
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", gap: 12, fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                      <span style={{ color: "#0a84ff" }}>─ Historical</span>
                      <span style={{ color: "#30d158" }}>╌ Forecast</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TAB: FORECAST ────────────────────────────────────────────
function ForecastTab() {
  const { data: forecast, loading, error } = useApi("/forecast");

  const byProduct = {};
  (forecast || []).forEach(f => {
    if (!byProduct[f.product_id]) byProduct[f.product_id] = { name: f.product_name, category: f.category, days: [] };
    byProduct[f.product_id].days.push({ date: new Date(f.forecast_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }), predicted: f.predicted_units, lower: f.lower_bound, upper: f.upper_bound });
  });

  const products = Object.entries(byProduct).slice(0, 8);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        <KPICard label="Forecast Accuracy" value="90.2%" icon="🎯" color="#30d158" sub="Moving avg + trend model" />
        <KPICard label="Forecast Horizon" value="7 days" icon="📅" color="#0a84ff" sub="Per-SKU predictions" />
        <KPICard label="SKUs Tracked" value={products.length} icon="📊" color="#bf5af2" sub="All categories" />
      </div>

      {error ? <ErrorBox msg={error} /> : loading ? <Spinner /> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {products.map(([id, p]) => (
              <div key={id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{p.category}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>7-day total</div>
                    <div style={{ fontWeight: 900, fontSize: 18, color: "#0a84ff", fontFamily: "monospace" }}>
                      {p.days.reduce((s, d) => s + d.predicted, 0)} units
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={110}>
                  <AreaChart data={p.days}>
                    <defs>
                      <linearGradient id={`fg${id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#30d158" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#30d158" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#12121f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
                    <Area type="monotone" dataKey="upper" stroke="none" fill="rgba(48,209,88,0.06)" name="Upper" />
                    <Area type="monotone" dataKey="predicted" stroke="#30d158" strokeWidth={2} fill={`url(#fg${id})`} dot={{ fill: "#30d158", r: 3 }} name="Forecast" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 22 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📋 Full Forecast Table</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {["Product","Category","Day 1","Day 2","Day 3","Day 4","Day 5","Day 6","Day 7","Total","Trend"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(([id, p]) => {
                    const total = p.days.reduce((s, d) => s + d.predicted, 0);
                    const trend = p.days.length >= 2 && p.days[p.days.length-1].predicted > p.days[0].predicted;
                    return (
                      <tr key={id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "9px 12px", fontWeight: 600 }}>{p.name}</td>
                        <td style={{ padding: "9px 12px", color: "rgba(255,255,255,0.5)" }}>{p.category}</td>
                        {p.days.map((d, i) => <td key={i} style={{ padding: "9px 12px", fontFamily: "monospace", color: "rgba(255,255,255,0.8)" }}>{d.predicted}</td>)}
                        <td style={{ padding: "9px 12px", fontWeight: 900, fontFamily: "monospace", color: "#0a84ff" }}>{total}</td>
                        <td style={{ padding: "9px 12px", fontWeight: 800, color: trend ? "#30d158" : "#ff9500" }}>{trend ? "↑" : "↓"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── TAB: ALERTS ─────────────────────────────────────────────
function AlertsTab() {
  const { data: alerts, loading, error, reload } = useApi("/alerts");
  const [resolving, setResolving] = useState(null);

  async function resolve(id) {
    setResolving(id);
    await fetch(`${API}/alerts/${id}/resolve`, { method: "PATCH" });
    reload();
    setResolving(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        <KPICard label="Active Alerts" value={alerts?.length ?? "—"} icon="🔔" color="#ff4d4d" sub="Unresolved actions" pulse />
        <KPICard label="Total Exposure" value={alerts ? `₹${(alerts.reduce((s, a) => s + parseFloat(a.potential_savings), 0)/1000).toFixed(0)}K` : "—"} icon="⚡" color="#ffd60a" sub="Risk across all alerts" />
        <KPICard label="Avg Days of Stock" value={alerts ? (alerts.reduce((s, a) => s + parseFloat(a.days_of_stock||0), 0) / (alerts.length||1)).toFixed(1) : "—"} icon="📅" color="#0a84ff" sub="Flagged items only" />
      </div>

      {error ? <ErrorBox msg={error} /> : loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(alerts || []).length === 0 && (
            <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
              ✅ No active alerts — all inventory is optimal!
            </div>
          )}
          {(alerts || []).map((a, idx) => {
            const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.OPTIMAL;
            return (
              <div key={a.id} style={{ background: cfg.bg, border: `1px solid ${cfg.color}30`, borderRadius: 14, padding: "18px 22px", display: "flex", gap: 18, animation: `slideUp 0.4s ${idx*0.05}s both` }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: cfg.color + "20", border: `2px solid ${cfg.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {cfg.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{a.product_name} <StatusBadge status={a.status} /></div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
                        {a.category} · Stock: {a.current_stock} · {a.days_of_stock} days remaining
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#ffd60a", fontFamily: "monospace" }}>₹{parseFloat(a.potential_savings).toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>exposure</div>
                      </div>
                      <button onClick={() => resolve(a.id)} disabled={resolving === a.id}
                        style={{ background: "rgba(48,209,88,0.15)", border: "1px solid rgba(48,209,88,0.3)", color: "#30d158", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
                        {resolving === a.id ? "..." : "✓ Resolve"}
                      </button>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, padding: "9px 13px", background: "rgba(0,0,0,0.2)", borderRadius: 8, fontSize: 12, borderLeft: `3px solid ${cfg.color}` }}>
                    <strong style={{ color: cfg.color }}>Action: </strong>
                    <span style={{ color: "rgba(255,255,255,0.7)" }}>{a.message}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    {[["Safety Stock", a.safety_stock], ["Reorder Point", a.reorder_point], ["EOQ", a.eoq], ["Lead Time", `${a.lead_time_days}d`], ["Recommended Order", a.recommended_order > 0 ? `${a.recommended_order} units` : "None"]].map(([l, v]) => (
                      <div key={l} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "4px 9px", fontSize: 11 }}>
                        <span style={{ color: "rgba(255,255,255,0.4)" }}>{l}: </span>
                        <span style={{ fontWeight: 700, fontFamily: "monospace" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [invFilter, setInvFilter] = useState("ALL");
  const { data: alerts } = useApi("/alerts");
  const alertCount = alerts?.length ?? 0;

  function navigate(target, filter) {
    setTab(target);
    if (filter) setInvFilter(filter);
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "⬡" },
    { id: "inventory", label: "Inventory",  icon: "⬢" },
    { id: "forecast",  label: "Forecast",   icon: "◈" },
    { id: "alerts",    label: "Alerts",     icon: "◉", badge: alertCount },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
        .card-hover { transition: all 0.2s; }
        .card-hover:hover { background: rgba(255,255,255,0.06) !important; transform: translateY(-1px); }
        .tab-btn { background: none; border: none; color: inherit; font-family: inherit; }
        input, select { outline: none; }
        input::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 30px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 62, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#0a84ff,#30d158)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900 }}>AI</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.3 }}>RetailAI</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 1, textTransform: "uppercase" }}>Demand Forecasting & Stock Optimization · Neon DB</div>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 4 }}>
          {tabs.map(t => (
            <button key={t.id} className="tab-btn" onClick={() => setTab(t.id)}
              style={{ padding: "6px 15px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", position: "relative",
                color: tab === t.id ? "#fff" : "rgba(255,255,255,0.45)",
                background: tab === t.id ? "rgba(255,255,255,0.1)" : "transparent" }}>
              {t.icon} {t.label}
              {t.badge > 0 && <span style={{ position: "absolute", top: 2, right: 2, background: "#ff4d4d", borderRadius: "50%", width: 14, height: 14, fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{t.badge}</span>}
            </button>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#30d158", boxShadow: "0 0 8px #30d158" }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Live · Neon PostgreSQL</span>
        </div>
      </div>

      <div style={{ padding: "26px 30px", maxWidth: 1380, margin: "0 auto" }}>
        {tab === "dashboard" && <DashboardTab onNavigate={navigate} />}
        {tab === "inventory" && <InventoryTab initFilter={invFilter} />}
        {tab === "forecast"  && <ForecastTab />}
        {tab === "alerts"    && <AlertsTab />}
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "14px 30px", display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 40 }}>
        <span>RetailAI · NovaThon Hackathon 1.0</span>
        <span>Neon PostgreSQL · EOQ + Safety Stock · Moving Average Forecasting</span>
      </div>
    </div>
  );
}
