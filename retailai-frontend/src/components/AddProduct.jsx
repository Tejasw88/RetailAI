import { useState, useEffect, useRef } from "react";
import Scanner from "./Scanner";

const CATEGORIES = ["Staples", "Cooking", "Dairy", "Snacks", "Instant Food", "Household", "Personal Care", "Beverages", "Other"];

function mapCategory(tags) {
    if (!tags) return 'Other';
    const t = tags.join(' ').toLowerCase();
    if (t.includes('rice') || t.includes('dal') || t.includes('atta') || t.includes('flour')) return 'Staples';
    if (t.includes('oil') || t.includes('spice')) return 'Cooking';
    if (t.includes('milk') || t.includes('butter') || t.includes('dairy')) return 'Dairy';
    if (t.includes('biscuit') || t.includes('snack') || t.includes('chips')) return 'Snacks';
    if (t.includes('noodle') || t.includes('instant')) return 'Instant Food';
    if (t.includes('soap') || t.includes('detergent')) return 'Household';
    if (t.includes('toothpaste') || t.includes('shampoo')) return 'Personal Care';
    if (t.includes('tea') || t.includes('coffee') || t.includes('drink')) return 'Beverages';
    return 'Other';
}

const BigBtn = ({ children, color, onClick, style, disabled }) => (
    <button disabled={disabled} onClick={onClick} style={{ width: "100%", minHeight: 52, borderRadius: 14, border: "none", fontSize: 16, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#ccc" : (color || "#2563eb"), color: "#fff", boxShadow: disabled ? "none" : `0 4px 14px ${color || "#2563eb"}40`, opacity: disabled ? 0.7 : 1, transition: "all 0.2s", ...style }}>{children}</button>
);

const Card = ({ children, style, onClick }) => (
    <div onClick={onClick} style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", cursor: onClick ? "pointer" : "default", ...style }}>{children}</div>
);

export default function AddProduct({ onClose, t, products, onAdded, vibrate }) {
    const [step, setStep] = useState("method"); // method, scanner, manual, lookup, confirm, form, success, restock
    const [barcode, setBarcode] = useState("");
    const [productInfo, setProductInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: "", category: "Other", stock: 1, unit_cost: "", selling_price: "", brand: "", image_url: "" });
    const [successData, setSuccessData] = useState(null);
    const [bulkCounter, setBulkCounter] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [useCustomPrice, setUseCustomPrice] = useState(false);
    const [customPrice, setCustomPrice] = useState("");
    const [confirmStock, setConfirmStock] = useState(1);

    const fetchProductInfo = async (code) => {
        setLoading(true);
        setStep("lookup");
        try {
            // 1. Check backend DB by barcode
            const dbRes = await fetch(`/api/products/barcode/${code}`);
            const dbData = await dbRes.json();
            if (dbData.found) {
                const p = dbData.product;
                // If product has inventory (current_stock exists and > 0), show restock
                if (p.current_stock && parseInt(p.current_stock) > 0) {
                    setProductInfo(p);
                    setStep("restock");
                    setLoading(false);
                    return;
                }
                // Product exists in DB but no stock yet → show confirm with MRP
                const info = {
                    ...p,
                    barcode: code,
                    mrp: parseFloat(p.mrp) || parseFloat(p.selling_price) || 0,
                    emoji: p.emoji || '📦',
                };
                setProductInfo(info);
                setFormData(prev => ({ ...prev, ...info, unit_cost: info.mrp ? Math.round(info.mrp * 0.8) : "", selling_price: info.mrp || "" }));
                setUseCustomPrice(false);
                setCustomPrice("");
                setConfirmStock(1);
                setStep("confirm");
                setLoading(false);
                return;
            }

            // 2. Try External API (Open Food Facts)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await res.json();

            if (data.status === 1) {
                const p = data.product;
                const info = {
                    barcode: code,
                    name: p.product_name_en || p.product_name || p.abbreviated_product_name || '',
                    brand: p.brands ? p.brands.split(',')[0] : '',
                    category: mapCategory(p.categories_tags),
                    image_url: p.image_front_url || null,
                };
                setProductInfo(info);
                setFormData(prev => ({ ...prev, ...info }));
                setStep("form");
            } else {
                throw new Error("Not found");
            }
        } catch (e) {
            // Manual entry fallback
            setProductInfo({ barcode: code });
            setFormData(prev => ({ ...prev, barcode: code, name: "", brand: "", category: "Other" }));
            setStep("form");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (term) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await fetch(`/api/products/search?q=${encodeURIComponent(term)}`);
            const data = await res.json();
            setSearchResults(data.slice(0, 8));
        } catch (e) {
            setSearchResults([]);
        }
    };

    const selectSearchResult = (product) => {
        const info = {
            ...product,
            mrp: parseFloat(product.mrp) || parseFloat(product.selling_price) || 0,
            emoji: product.emoji || '📦',
        };
        setProductInfo(info);
        setFormData(prev => ({ ...prev, ...info, unit_cost: info.mrp ? Math.round(info.mrp * 0.8) : "", selling_price: info.mrp || "" }));
        setSearchTerm("");
        setSearchResults([]);
        setUseCustomPrice(false);
        setCustomPrice("");
        setConfirmStock(1);
        setStep("confirm");
    };

    const handleManualLookup = () => {
        if (barcode.length >= 8) fetchProductInfo(barcode);
    };

    const calculateStockMetrics = (unitCost) => {
        const avgDailyDemand = 10;
        const leadTime = 5;
        const holdingCostRate = 0.25;
        const orderingCost = 500;
        const safetyStock = Math.round(1.65 * 3 * Math.sqrt(leadTime));
        const reorderPoint = Math.round(avgDailyDemand * leadTime + safetyStock);
        const annualDemand = avgDailyDemand * 365;
        const holdingCost = parseFloat(unitCost) * holdingCostRate;
        const eoq = Math.round(Math.sqrt((2 * annualDemand * orderingCost) / (holdingCost || 1)));
        return { safetyStock, reorderPoint, eoq, leadTime };
    };

    const getCategoryEmoji = (category) => {
        const map = {
            'Staples': '🌾',
            'Cooking': '🫙',
            'Dairy': '🧈',
            'Snacks': '🍪',
            'Instant Food': '🍜',
            'Household': '🧺',
            'Personal Care': '🪥',
            'Beverages': '🍵',
            'Other': '📦',
        };
        return map[category] || '📦';
    };

    const saveProductToAPI = async (product) => {
        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: product.name,
                    category: product.category,
                    barcode: product.barcode || null,
                    unit_cost: parseFloat(product.unit_cost),
                    selling_price: parseFloat(product.selling_price),
                    initial_stock: parseInt(product.stock) || 0,
                    brand: product.brand || null,
                    emoji: product.emoji || getCategoryEmoji(product.category),
                    mrp: parseFloat(product.mrp) || parseFloat(product.selling_price) || 0,
                })
            });
            const data = await res.json();
            return data;
        } catch (e) {
            console.warn('API save failed:', e);
            return { success: false };
        }
    };

    const handleSave = async () => {
        setLoading(true);
        const metrics = calculateStockMetrics(formData.unit_cost);
        const result = await saveProductToAPI({ ...formData, ...metrics });
        vibrate([100, 50, 100]);
        setSuccessData({ ...formData, ...metrics, ...result });
        setBulkCounter(c => c + 1);
        setStep("success");
        onAdded && onAdded();
        setLoading(false);
    };

    const handleRestock = async (qty) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/inventory/${productInfo.id}/restock`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: qty })
            });
            const data = await res.json();
            if (data.success) {
                vibrate([100, 50, 100]);
                onAdded && onAdded();
                onClose();
                return;
            }
        } catch (e) {
            console.warn("Restock API fail:", e);
        }
        vibrate([100, 50, 100]);
        onAdded && onAdded();
        onClose();
        setLoading(false);
    };

    if (step === "scanner") {
        return <Scanner onCancel={() => setStep("method")} onDetected={fetchProductInfo} t={t} />;
    }

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={onClose} />
            <div style={{ position: "relative", width: "100%", maxWidth: 500, background: "#FFFBF5", borderRadius: "24px 24px 0 0", padding: "24px 20px", maxHeight: "90vh", overflowY: "auto", animation: "slideUp 0.3s ease" }}>
                <div style={{ width: 40, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 20px" }} />

                {step === "method" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ fontSize: 20, fontWeight: 900 }}>{t.addProduct}</h2>
                            {bulkCounter > 0 && <span style={{ background: "#16a34a", color: "#fff", padding: "4px 8px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{bulkCounter} Added</span>}
                        </div>

                        {/* Search Bar */}
                        <div style={{ position: "relative" }}>
                            <input
                                type="text"
                                placeholder="🔍 Search product by name..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "2px solid #eee", fontSize: 16, outline: "none", background: "#fff" }}
                            />
                            {searchResults.length > 0 && (
                                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", borderRadius: 14, boxShadow: "0 10px 30px rgba(0,0,0,0.2)", zIndex: 100, marginTop: 8, overflow: "hidden", border: "1px solid #eee" }}>
                                    {searchResults.map(p => (
                                        <div
                                            key={p.barcode}
                                            onClick={() => selectSearchResult(p)}
                                            style={{ padding: "14px 16px", cursor: "pointer", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", gap: 12, transition: "background 0.2s" }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = "#f9f9f9"}
                                            onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                                        >
                                            <span style={{ fontSize: 24 }}>{p.emoji}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 800, fontSize: 15 }}>{p.name}</div>
                                                <div style={{ fontSize: 13, color: "#666" }}>{p.brand} • MRP: ₹{p.mrp}</div>
                                            </div>
                                            <div style={{ color: "#2563eb", fontWeight: 700, fontSize: 20 }}>+</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <Card onClick={() => setStep("scanner")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "20px 10px", textAlign: "center" }}>
                                <div style={{ fontSize: 40 }}>📷</div>
                                <div style={{ fontWeight: 800, fontSize: 15 }}>{t.scanBarcode}</div>
                            </Card>
                            <Card onClick={() => setStep("manual")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "20px 10px", textAlign: "center" }}>
                                <div style={{ fontSize: 40 }}>⌨️</div>
                                <div style={{ fontWeight: 800, fontSize: 15 }}>{t.enterBarcode}</div>
                            </Card>
                        </div>
                        <BigBtn color="transparent" style={{ color: "#666", boxShadow: "none" }} onClick={onClose}>{t.close}</BigBtn>
                    </div>
                )}

                {step === "manual" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <button onClick={() => setStep("method")} style={{ background: "none", border: "none", fontSize: 20 }}>←</button>
                            <h2 style={{ fontSize: 20, fontWeight: 900 }}>{t.typeBarcode}</h2>
                        </div>
                        <div style={{ position: "relative" }}>
                            <input
                                autoFocus
                                type="text"
                                inputMode="numeric"
                                placeholder="8901234..."
                                value={barcode}
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 13);
                                    setBarcode(val);
                                    if (val.length === 13) fetchProductInfo(val);
                                }}
                                style={{ width: "100%", padding: 16, borderRadius: 14, border: "2px solid #2563eb", fontSize: 24, fontWeight: 800, textAlign: "center", letterSpacing: 2 }}
                            />
                        </div>
                        <BigBtn onClick={handleManualLookup} disabled={barcode.length < 8}>{t.lookUpProduct}</BigBtn>
                    </div>
                )}

                {step === "lookup" && (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <div className="spinner" style={{ width: 50, height: 50, border: "4px solid #f3f3f3", borderTop: "4px solid #2563eb", borderRadius: "50%", margin: "0 auto 20px", animation: "spin 1s linear infinite" }} />
                        <div style={{ fontWeight: 800, color: "#666" }}>{t.lookUpProduct}...</div>
                    </div>
                )}

                {/* ═══ CONFIRM STEP: Local DB product found ═══ */}
                {step === "confirm" && productInfo && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: "#16a34a" }}>✅ Product Found!</h2>

                        {/* Product Card */}
                        <Card style={{ background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", border: "2px solid #bbf7d0" }}>
                            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                                <div style={{ fontSize: 48, lineHeight: 1 }}>{productInfo.emoji || "📦"}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 900, fontSize: 17 }}>{productInfo.name}</div>
                                    <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{productInfo.brand} • {productInfo.category}</div>
                                    <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>Barcode: {productInfo.barcode}</div>
                                </div>
                            </div>
                        </Card>

                        {/* MRP Display */}
                        <Card style={{ textAlign: "center", background: "#fff" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#666", marginBottom: 4 }}>Market Price (MRP)</div>
                            <div style={{ fontSize: 42, fontWeight: 900, color: "#2563eb" }}>₹{productInfo.mrp}</div>
                        </Card>

                        {/* Custom Price Toggle */}
                        <Card style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ fontWeight: 800, fontSize: 15 }}>Sell at a different price?</div>
                                <button
                                    onClick={() => { setUseCustomPrice(!useCustomPrice); setCustomPrice(""); }}
                                    style={{ width: 52, height: 30, borderRadius: 15, border: "none", background: useCustomPrice ? "#2563eb" : "#ddd", position: "relative", cursor: "pointer", transition: "background 0.3s" }}
                                >
                                    <div style={{ width: 24, height: 24, borderRadius: 12, background: "#fff", position: "absolute", top: 3, left: useCustomPrice ? 25 : 3, transition: "left 0.3s", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
                                </button>
                            </div>
                            {useCustomPrice && (
                                <div style={{ marginTop: 14 }}>
                                    <label style={{ fontSize: 13, fontWeight: 700, color: "#666", display: "block", marginBottom: 6 }}>Your Selling Price</label>
                                    <input
                                        autoFocus
                                        type="number"
                                        value={customPrice}
                                        onChange={e => setCustomPrice(e.target.value)}
                                        placeholder={`₹${productInfo.mrp}`}
                                        style={{ width: "100%", padding: 14, borderRadius: 12, border: "2px solid #2563eb", fontSize: 20, fontWeight: 800, textAlign: "center" }}
                                    />
                                    {customPrice && parseFloat(customPrice) !== productInfo.mrp && (
                                        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: parseFloat(customPrice) > productInfo.mrp ? "#ea580c" : "#16a34a" }}>
                                            {parseFloat(customPrice) > productInfo.mrp
                                                ? `⬆️ ₹${(parseFloat(customPrice) - productInfo.mrp).toFixed(0)} above MRP`
                                                : `⬇️ ₹${(productInfo.mrp - parseFloat(customPrice)).toFixed(0)} discount from MRP`
                                            }
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>

                        {/* Stock Counter */}
                        <Card style={{ padding: "14px 16px" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#666", marginBottom: 10 }}>How many in stock?</div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
                                <button onClick={() => setConfirmStock(Math.max(1, confirmStock - 1))} style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid #ddd", fontSize: 22, background: "#fff", cursor: "pointer" }}>−</button>
                                <span style={{ fontSize: 40, fontWeight: 900, color: "#1a1a2e", minWidth: 60, textAlign: "center" }}>{confirmStock}</span>
                                <button onClick={() => setConfirmStock(confirmStock + 1)} style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid #ddd", fontSize: 22, background: "#fff", cursor: "pointer" }}>+</button>
                            </div>
                        </Card>

                        {/* Add Button */}
                        <BigBtn
                            disabled={loading || (useCustomPrice && !customPrice)}
                            onClick={async () => {
                                setLoading(true);
                                const sellingPrice = useCustomPrice ? parseFloat(customPrice) : productInfo.mrp;
                                const unitCost = Math.round(sellingPrice * 0.8);
                                const productToSave = {
                                    ...productInfo,
                                    stock: confirmStock,
                                    unit_cost: unitCost,
                                    selling_price: sellingPrice,
                                    mrp: productInfo.mrp,
                                };
                                // If the product already exists in DB (has an id), just restock
                                if (productInfo.id) {
                                    try {
                                        await fetch(`/api/inventory/${productInfo.id}/restock`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ quantity: confirmStock })
                                        });
                                    } catch (e) { console.warn('Restock failed:', e); }
                                } else {
                                    await saveProductToAPI(productToSave);
                                }
                                vibrate([100, 50, 100]);
                                setSuccessData({ ...productToSave, selling_price: sellingPrice, unit_cost: unitCost });
                                setFormData(prev => ({ ...prev, stock: confirmStock, selling_price: sellingPrice, unit_cost: unitCost }));
                                setBulkCounter(c => c + 1);
                                setStep("success");
                                setLoading(false);
                                onAdded && onAdded();
                            }}
                        >
                            {loading ? "..." : `✅ Add to My Shop — ₹${useCustomPrice && customPrice ? customPrice : productInfo.mrp}`}
                        </BigBtn>
                        <BigBtn color="transparent" style={{ color: "#2563eb", boxShadow: "none" }} onClick={() => setStep("method")}>← Back</BigBtn>
                    </div>
                )}

                {/* ═══ FORM STEP: Manual/Unknown barcode ═══ */}
                {step === "form" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: productInfo?.name ? "#16a34a" : "#1a1a2e" }}>
                            {productInfo?.name ? `✅ ${t.productFound}` : t.productNotFound}
                        </h2>
                        {productInfo?.image_url && <img src={productInfo.image_url} alt="" style={{ height: 120, objectFit: "contain", borderRadius: 12, background: "#fff", padding: 8, alignSelf: "center" }} />}

                        <div style={{ fontSize: 14, fontWeight: 700, color: "#999" }}>Barcode: {barcode || productInfo?.barcode} ✓</div>

                        <div>
                            <label style={{ fontSize: 13, fontWeight: 700, color: "#666", display: "block", marginBottom: 6 }}>{t.productName} *</label>
                            <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: "100%", padding: 14, borderRadius: 12, border: "1px solid #ddd", fontSize: 16 }} />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 700, color: "#666", display: "block", marginBottom: 6 }}>{t.youPaidPer} *</label>
                                <input type="number" value={formData.unit_cost} onChange={e => setFormData({ ...formData, unit_cost: e.target.value })} style={{ width: "100%", padding: 14, borderRadius: 12, border: "1px solid #ddd", fontSize: 16 }} placeholder="₹" />
                            </div>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 700, color: "#666", display: "block", marginBottom: 6 }}>{t.youSellFor} *</label>
                                <input type="number" value={formData.selling_price} onChange={e => setFormData({ ...formData, selling_price: e.target.value })} style={{ width: "100%", padding: 14, borderRadius: 12, border: "1px solid #ddd", fontSize: 16 }} placeholder="₹" />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 700, color: "#666", display: "block", marginBottom: 6 }}>{t.howManyHave} *</label>
                                <div style={{ display: "flex", alignItems: "center", background: "#f5f5f5", borderRadius: 12 }}>
                                    <button onClick={() => setFormData({ ...formData, stock: Math.max(0, formData.stock - 1) })} style={{ width: 44, height: 44, border: "none", background: "none", fontSize: 20 }}>-</button>
                                    <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} style={{ flex: 1, border: "none", background: "none", textAlign: "center", fontWeight: 800, fontSize: 16 }} />
                                    <button onClick={() => setFormData({ ...formData, stock: formData.stock + 1 })} style={{ width: 44, height: 44, border: "none", background: "none", fontSize: 20 }}>+</button>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 700, color: "#666", display: "block", marginBottom: 6 }}>Category</label>
                                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ width: "100%", padding: 14, borderRadius: 12, border: "1px solid #ddd", fontSize: 14, background: "#fff" }}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <BigBtn disabled={!formData.name || !formData.unit_cost || !formData.selling_price || loading} onClick={handleSave}>
                            {loading ? "..." : `✓ ${t.addToShop}`}
                        </BigBtn>
                        <BigBtn color="transparent" style={{ color: "#2563eb", boxShadow: "none" }} onClick={() => setStep("method")}>{t.scanAnother}</BigBtn>
                    </div>
                )}

                {step === "restock" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: "#16a34a" }}>📦 {t.alreadyInShop}</h2>
                        <Card style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                <div style={{ fontSize: 40 }}>{productInfo.emoji || "📦"}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 800 }}>{productInfo.name}</div>
                                    <div style={{ fontSize: 13, color: "#666" }}>Stock: {productInfo.current_stock} {t.units}</div>
                                </div>
                            </div>
                        </Card>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#666", marginBottom: 12 }}>{t.addMoreStock}</div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 20 }}>
                                <button onClick={() => setFormData({ ...formData, stock: Math.max(1, formData.stock - 1) })} style={{ width: 50, height: 50, borderRadius: "50%", border: "2px solid #ddd", fontSize: 24, background: "#fff" }}>-</button>
                                <span style={{ fontSize: 48, fontWeight: 900, color: "#16a34a", minWidth: 60 }}>{formData.stock}</span>
                                <button onClick={() => setFormData({ ...formData, stock: formData.stock + 1 })} style={{ width: 50, height: 50, borderRadius: "50%", border: "2px solid #ddd", fontSize: 24, background: "#fff" }}>+</button>
                            </div>
                            <BigBtn color="#16a34a" onClick={() => handleRestock(formData.stock)}>✓ {t.addMoreStock}</BigBtn>
                            <BigBtn color="transparent" style={{ color: "#666", boxShadow: "none", marginTop: 8 }} onClick={onClose}>{t.close}</BigBtn>
                        </div>
                    </div>
                )}

                {step === "success" && (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{ fontSize: 80, animation: "bounceIn 0.5s ease" }}>✅</div>
                        <h2 style={{ fontSize: 22, fontWeight: 900, margin: "16px 0 8px" }}>{successData.name}</h2>
                        <div style={{ fontSize: 16, color: "#16a34a", fontWeight: 700 }}>{t.addedSuccess} 🎉</div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, margin: "24px 0" }}>
                            {[
                                { ic: "📦", val: `${formData.stock} ${t.units}`, lab: "in stock", col: "#2563eb" },
                                { ic: "⚠️", val: `${successData.reorderPoint} ${t.units}`, lab: `Order when reaching`, col: "#ea580c" },
                                { ic: "💰", val: `₹${formData.selling_price - formData.unit_cost}`, lab: "Profit per unit", col: "#16a34a" }
                            ].map((s, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", padding: 14, borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", animation: `slideUp 0.4s ${0.2 + i * 0.1}s both` }}>
                                    <div style={{ fontSize: 24 }}>{s.ic}</div>
                                    <div style={{ textAlign: "left" }}>
                                        <div style={{ fontSize: 17, fontWeight: 900, color: s.col }}>{s.val}</div>
                                        <div style={{ fontSize: 12, color: "#999", fontWeight: 700 }}>{s.lab}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <BigBtn onClick={() => { setBarcode(""); setStep("scanner"); }}>📷 {t.scanAnother}</BigBtn>
                        <BigBtn color="transparent" style={{ color: "#666", boxShadow: "none", marginTop: 10 }} onClick={onClose}>{t.close}</BigBtn>
                    </div>
                )}
            </div>
            <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
      `}</style>
        </div>
    );
}

const Badge = ({ label, color }) => (
    <span style={{ background: color + "18", color, border: `1px solid ${color}40`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>{label}</span>
);
