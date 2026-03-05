import { useState, useEffect, useRef } from "react";
import Scanner from "./Scanner";
import { apiUrl } from "../api";

const getCategoryEmoji = (cat) => {
    const map = { 'Staples': '🌾', 'Cooking': '🫙', 'Dairy': '🧈', 'Snacks': '🍪', 'Instant Food': '🍜', 'Household': '🧺', 'Personal Care': '🪥', 'Beverages': '🍵', 'Other': '📦' };
    return map[cat] || '📦';
};

const StockManager = () => {
    const [editingProduct, setEditingProduct] = useState({
        barcode: "", productName: "", brand: "", category: "", sellingPrice: "", mrp: "", quantity: "1", gstPercent: "18",
    });
    const [scanResult, setScanResult] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [recentProducts, setRecentProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [scanCount, setScanCount] = useState(0);
    const barcodeInputRef = useRef(null);

    useEffect(() => { fetchRecentProducts(); }, []);

    const fetchRecentProducts = async () => {
        try {
            const res = await fetch(apiUrl("/api/barcode-products"));
            const data = await res.json();
            setRecentProducts(data || []);
        } catch (err) { console.error("Failed to fetch products:", err); }
    };

    const handleScanSuccess = async (decodedText) => {
        setMessage({ type: "info", text: "🔍 Looking up barcode..." });
        setShowScanner(false);
        setLoading(true);
        try {
            const response = await fetch(apiUrl("/api/scan"), {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ barcode: decodedText }),
            });
            const data = await response.json();
            if (data.source === "db") {
                setEditingProduct({
                    ...editingProduct,
                    barcode: data.product.barcode || decodedText,
                    productName: data.product.productName || data.product.name || "",
                    brand: data.product.brand || "",
                    category: data.product.category || "",
                    sellingPrice: data.product.sellingPrice || "",
                    mrp: data.product.mrp || "",
                });
                setScanResult({ type: "found", product: data.product });
                setMessage({ type: "success", text: `✅ Found: ${data.product.productName || data.product.name}` });
            } else if (data.source === "api") {
                setEditingProduct({
                    ...editingProduct,
                    barcode: data.product.barcode || decodedText,
                    productName: data.product.productName || "",
                    brand: data.product.brand || "",
                    category: data.product.category || "",
                });
                setScanResult({ type: "api", product: data.product });
                setMessage({ type: "info", text: "🌐 Found globally — add price & quantity to save" });
            } else if (data.source === "new") {
                setEditingProduct({
                    ...editingProduct,
                    barcode: decodedText,
                    productName: data.product?.productName || "",
                });
                setScanResult({ type: "new" });
                setMessage({ type: "warning", text: "🆕 New barcode! Enter product details below." });
            } else {
                setEditingProduct({ ...editingProduct, barcode: decodedText });
                setScanResult({ type: "new" });
                setMessage({ type: "warning", text: "🆕 New barcode! Enter product details below." });
            }
        } catch (err) {
            setMessage({ type: "error", text: "❌ Network error. Please try again." });
        } finally { setLoading(false); }
    };

    const handleManualBarcodeLookup = () => {
        if (editingProduct.barcode.length >= 4) {
            handleScanSuccess(editingProduct.barcode);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (!editingProduct.barcode || !editingProduct.productName) {
            setMessage({ type: "error", text: "Barcode and product name are required" });
            return;
        }
        setLoading(true);
        try {
            await fetch(apiUrl("/api/add-product"), {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingProduct),
            });
            setScanCount(c => c + 1);
            setMessage({ type: "success", text: `✅ ${editingProduct.productName} added to inventory!` });
            fetchRecentProducts();
            setScanResult(null);
            setEditingProduct({ barcode: "", productName: "", brand: "", category: "", sellingPrice: "", mrp: "", quantity: "1", gstPercent: "18" });
            setTimeout(() => setMessage({ type: "", text: "" }), 4000);
        } catch (err) {
            setMessage({ type: "error", text: "❌ Failed to add product." });
        } finally { setLoading(false); }
    };

    const filtered = searchTerm
        ? recentProducts.filter(p =>
            (p.productName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.barcode || "").includes(searchTerm) ||
            (p.category || "").toLowerCase().includes(searchTerm.toLowerCase())
        )
        : recentProducts;

    const totalValue = recentProducts.reduce((s, p) => s + (parseFloat(p.sellingPrice) || 0) * (parseInt(p.quantity) || 0), 0);

    const msgColors = {
        success: { bg: "linear-gradient(135deg, #ecfdf5, #d1fae5)", color: "#065f46", icon: "✅" },
        warning: { bg: "linear-gradient(135deg, #fffbeb, #fef3c7)", color: "#92400e", icon: "⚠️" },
        info: { bg: "linear-gradient(135deg, #eff6ff, #dbeafe)", color: "#1e40af", icon: "🔍" },
        error: { bg: "linear-gradient(135deg, #fef2f2, #fecaca)", color: "#b91c1c", icon: "❌" },
    };

    return (
        <div style={{ paddingBottom: 24 }}>
            {/* ── HEADER ── */}
            <div style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)", borderRadius: 20, padding: "20px 20px 16px", marginBottom: 20, color: "#fff", boxShadow: "0 8px 32px rgba(37,99,235,0.3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>📦 Stock Manager</h2>
                        <p style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Scan, add & track your inventory</p>
                    </div>
                    {scanCount > 0 && (
                        <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 12, padding: "6px 12px", backdropFilter: "blur(10px)" }}>
                            <div style={{ fontSize: 20, fontWeight: 900 }}>{scanCount}</div>
                            <div style={{ fontSize: 10, opacity: 0.8 }}>added today</div>
                        </div>
                    )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
                    <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 8px", textAlign: "center", backdropFilter: "blur(10px)" }}>
                        <div style={{ fontSize: 22, fontWeight: 900 }}>{recentProducts.length}</div>
                        <div style={{ fontSize: 10, opacity: 0.8 }}>Products</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 8px", textAlign: "center", backdropFilter: "blur(10px)" }}>
                        <div style={{ fontSize: 22, fontWeight: 900 }}>₹{totalValue > 1000 ? (totalValue / 1000).toFixed(1) + "K" : totalValue}</div>
                        <div style={{ fontSize: 10, opacity: 0.8 }}>Stock Value</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 8px", textAlign: "center", backdropFilter: "blur(10px)" }}>
                        <div style={{ fontSize: 22, fontWeight: 900 }}>{recentProducts.filter(p => parseInt(p.quantity) > 0).length}</div>
                        <div style={{ fontSize: 10, opacity: 0.8 }}>In Stock</div>
                    </div>
                </div>
            </div>

            {/* ── SCAN BUTTON ── */}
            <button
                onClick={() => setShowScanner(!showScanner)}
                style={{
                    width: "100%", padding: "18px", borderRadius: 16, border: "none",
                    background: showScanner ? "linear-gradient(135deg, #ef4444, #dc2626)" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: "#fff", fontWeight: 800, fontSize: 17, cursor: "pointer",
                    boxShadow: showScanner ? "0 6px 20px rgba(239,68,68,0.4)" : "0 6px 20px rgba(37,99,235,0.4)",
                    marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    transition: "all 0.3s ease"
                }}
            >
                <span style={{ fontSize: 22 }}>{showScanner ? "✕" : "📷"}</span>
                {showScanner ? "Close Scanner" : "Scan Barcode"}
            </button>

            {/* ── SCANNER ── */}
            {showScanner && (
                <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", animation: "slideDown 0.3s ease" }}>
                    <Scanner onScanSuccess={handleScanSuccess} onScanError={(err) => console.log(err)} />
                </div>
            )}

            {/* ── STATUS MESSAGE ── */}
            {message.text && (
                <div style={{
                    padding: "14px 16px", borderRadius: 14, marginBottom: 16,
                    background: msgColors[message.type]?.bg || "#f5f5f5",
                    color: msgColors[message.type]?.color || "#333",
                    fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8,
                    animation: "slideUp 0.3s ease", boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
                }}>
                    {message.text}
                </div>
            )}

            {/* ── PRODUCT FORM ── */}
            <div style={{ background: "#fff", padding: 20, borderRadius: 18, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", marginBottom: 20, border: scanResult?.type === "found" ? "2px solid #10b981" : scanResult?.type === "new" ? "2px solid #f59e0b" : "1px solid #f0f0f0" }}>
                {scanResult?.type === "found" && (
                    <div style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 28 }}>{getCategoryEmoji(editingProduct.category)}</span>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 15, color: "#065f46" }}>Product Found in Database!</div>
                            <div style={{ fontSize: 12, color: "#047857" }}>Set quantity and tap "Add to Inventory"</div>
                        </div>
                    </div>
                )}
                {scanResult?.type === "new" && (
                    <div style={{ background: "linear-gradient(135deg, #fffbeb, #fef3c7)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 28 }}>🆕</span>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 15, color: "#92400e" }}>New Product Detected</div>
                            <div style={{ fontSize: 12, color: "#a16207" }}>Fill in product details below</div>
                        </div>
                    </div>
                )}

                <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 16, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>📝</span> Add / Update Product
                </h3>

                <form onSubmit={handleAddProduct} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Barcode + Qty Row */}
                    <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ flex: 2 }}>
                            <label style={labelStyle}>Barcode</label>
                            <div style={{ display: "flex", gap: 6 }}>
                                <input type="text" required value={editingProduct.barcode}
                                    ref={barcodeInputRef}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleManualBarcodeLookup(); } }}
                                    style={{ ...inputStyle, flex: 1 }} placeholder="Enter or scan" />
                                <button type="button" onClick={handleManualBarcodeLookup}
                                    style={{ padding: "0 14px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                                    🔍
                                </button>
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Qty</label>
                            <input type="number" required value={editingProduct.quantity} min="1"
                                onChange={(e) => setEditingProduct({ ...editingProduct, quantity: e.target.value })}
                                style={{ ...inputStyle, textAlign: "center", fontWeight: 800, fontSize: 18 }} />
                        </div>
                    </div>

                    {/* Product Name */}
                    <div>
                        <label style={labelStyle}>Product Name</label>
                        <input type="text" required value={editingProduct.productName}
                            onChange={(e) => setEditingProduct({ ...editingProduct, productName: e.target.value })}
                            style={inputStyle} placeholder="E.g., Parle-G Biscuit" />
                    </div>

                    {/* Brand + Category */}
                    <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Brand</label>
                            <input type="text" value={editingProduct.brand}
                                onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                                style={inputStyle} placeholder="Optional" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Category</label>
                            <select value={editingProduct.category}
                                onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                style={{ ...inputStyle, appearance: "none" }}>
                                <option value="">Select</option>
                                {["Staples", "Cooking", "Dairy", "Snacks", "Instant Food", "Household", "Personal Care", "Beverages", "Other"].map(c => (
                                    <option key={c} value={c}>{getCategoryEmoji(c)} {c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Price + MRP */}
                    <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Selling Price (₹)</label>
                            <input type="number" required value={editingProduct.sellingPrice}
                                onChange={(e) => setEditingProduct({ ...editingProduct, sellingPrice: e.target.value })}
                                style={inputStyle} placeholder="₹" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>MRP (₹)</label>
                            <input type="number" value={editingProduct.mrp}
                                onChange={(e) => setEditingProduct({ ...editingProduct, mrp: e.target.value })}
                                style={inputStyle} placeholder="₹" />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} style={{
                        width: "100%", padding: "16px", borderRadius: 14, border: "none",
                        background: loading ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                        color: "#fff", fontWeight: 800, fontSize: 16, marginTop: 4,
                        cursor: loading ? "not-allowed" : "pointer",
                        boxShadow: loading ? "none" : "0 6px 20px rgba(37,99,235,0.4)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        transition: "all 0.2s"
                    }}>
                        {loading ? (
                            <span>⏳ Saving...</span>
                        ) : (
                            <><span style={{ fontSize: 18 }}>✅</span> Add to Inventory</>
                        )}
                    </button>
                </form>
            </div>

            {/* ── INVENTORY LIST ── */}
            <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #f0f0f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 18 }}>📋</span> Inventory
                            <span style={{ background: "#eff6ff", color: "#2563eb", fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{recentProducts.length}</span>
                        </h3>
                    </div>
                    {/* Search */}
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.5 }}>🔍</span>
                        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search products, barcodes..."
                            style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, background: "#f8fafc", boxSizing: "border-box", outline: "none" }} />
                    </div>
                </div>

                <div style={{ maxHeight: 400, overflowY: "auto" }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "32px 20px" }}>
                            <div style={{ fontSize: 48, marginBottom: 8 }}>📦</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#94a3b8" }}>
                                {searchTerm ? "No matches found" : "No products yet"}
                            </div>
                            <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 4 }}>
                                {searchTerm ? "Try a different search" : "Scan a barcode to get started!"}
                            </div>
                        </div>
                    ) : (
                        filtered.map((p, i) => (
                            <div key={p.id || i} style={{
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                padding: "14px 20px", borderBottom: "1px solid #f8fafc",
                                transition: "background 0.2s", cursor: "pointer",
                                animation: `slideUp 0.3s ${i * 0.02}s both`
                            }}
                                onClick={() => {
                                    setEditingProduct({
                                        barcode: p.barcode || "", productName: p.productName || "",
                                        brand: p.brand || "", category: p.category || "",
                                        sellingPrice: p.sellingPrice || "", mrp: p.mrp || "",
                                        quantity: "1", gstPercent: "18"
                                    });
                                    setScanResult({ type: "found", product: p });
                                    setMessage({ type: "info", text: `Loaded ${p.productName} — update quantity and save` });
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                                        {p.emoji || getCategoryEmoji(p.category)}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>{p.productName}</div>
                                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                                            {p.barcode ? `${p.barcode} • ` : ""}{p.category || "General"}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                    {parseFloat(p.sellingPrice) > 0 && (
                                        <div style={{ fontWeight: 800, color: "#2563eb", fontSize: 15 }}>₹{p.sellingPrice}</div>
                                    )}
                                    <div style={{
                                        fontSize: 12, fontWeight: 700, marginTop: 2,
                                        color: parseInt(p.quantity) > 0 ? "#10b981" : "#ef4444"
                                    }}>
                                        {parseInt(p.quantity) > 0 ? `${p.quantity} in stock` : "Out of stock"}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <style>{`
                @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

const labelStyle = {
    display: "block", fontSize: 12, fontWeight: 700, color: "#64748b",
    marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px"
};

const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: "1.5px solid #e2e8f0", fontSize: 15, outline: "none",
    background: "#f8fafc", boxSizing: "border-box", transition: "border 0.2s",
};

export default StockManager;
