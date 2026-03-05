import { useState, useEffect } from "react";
import Scanner from "./Scanner";
import { apiUrl } from "../api";

const StockManager = () => {
    const [editingProduct, setEditingProduct] = useState({
        barcode: "",
        productName: "",
        brand: "",
        category: "",
        sellingPrice: "",
        mrp: "",
        quantity: "1",
        gstPercent: "18",
    });

    const [scanResult, setScanResult] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [recentProducts, setRecentProducts] = useState([]);

    useEffect(() => {
        fetchRecentProducts();
    }, []);

    const fetchRecentProducts = async () => {
        try {
            const res = await fetch(apiUrl("/api/barcode-products"));
            const data = await res.json();
            setRecentProducts(data || []);
        } catch (err) {
            console.error("Failed to fetch products:", err);
        }
    };

    const handleScanSuccess = async (decodedText) => {
        setMessage({ type: "info", text: "Looking up barcode..." });
        setShowScanner(false);
        setLoading(true);

        try {
            const response = await fetch(apiUrl("/api/scan"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ barcode: decodedText }),
            });
            const data = await response.json();

            if (data.source === "db" || data.source === "api") {
                setEditingProduct({
                    ...editingProduct,
                    barcode: data.product.barcode || decodedText,
                    productName: data.product.productName || data.product.name || "",
                    brand: data.product.brand || "",
                    category: data.product.category || "",
                    sellingPrice: data.product.sellingPrice || "",
                    mrp: data.product.mrp || "",
                });
                setMessage({
                    type: "success",
                    text: data.source === "db" ? `Found in database: ${data.product.productName || data.product.name}` : "Product found globally, fetched details!",
                });
            } else {
                setEditingProduct({ ...editingProduct, barcode: decodedText });
                setMessage({ type: "warning", text: "New barcode detected. Please enter details manually." });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Error during network request." });
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(apiUrl("/api/add-product"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingProduct),
            });
            const data = await response.json();
            setMessage({ type: "success", text: "Successfully added to stock!" });
            fetchRecentProducts();

            // Keep barcode so they can see what was added, but reset quantity and name for the next scan
            // Actually, best to reset barcode so they know it's ready for next
            setEditingProduct({
                ...editingProduct,
                barcode: "",
                productName: "",
                quantity: "1"
            });

            // Clear message after 3 seconds
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (err) {
            setMessage({ type: "error", text: "Failed to add product to stock." });
        } finally {
            setLoading(false);
        }
    };

    const msgStyles = {
        success: { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
        warning: { bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
        info: { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
        error: { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" }
    };

    const currentMsgStyle = message.type ? msgStyles[message.type] : null;

    return (
        <div style={{ paddingBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "var(--text)" }}>Stock Manager</h2>
                    <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>Scan barcodes to update inventory</p>
                </div>
                <button
                    onClick={() => setShowScanner(!showScanner)}
                    style={{
                        padding: "10px 16px",
                        borderRadius: 12,
                        border: "none",
                        background: showScanner ? "#ef4444" : "#2563eb",
                        color: "#fff",
                        fontWeight: 700,
                        boxShadow: showScanner ? "0 4px 12px rgba(239, 68, 68, 0.3)" : "0 4px 12px rgba(37,99,235,0.3)",
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    {showScanner ? "Close Scanner" : "Scan Barcode"}
                </button>
            </div>

            {showScanner && (
                <div style={{ background: "#000", borderRadius: 16, overflow: "hidden", marginBottom: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                    <Scanner onScanSuccess={handleScanSuccess} onScanError={(err) => console.log(err)} />
                </div>
            )}

            {message.text && (
                <div style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: currentMsgStyle.bg,
                    color: currentMsgStyle.color,
                    border: `1px solid ${currentMsgStyle.border}`,
                    marginBottom: 20,
                    fontWeight: 600,
                    fontSize: 14,
                    animation: "fadeIn 0.3s ease"
                }}>
                    {message.text}
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Entry Form */}
                <div style={{ background: "#fff", padding: 20, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "var(--text)" }}>Add / Update Product</h3>

                    <form onSubmit={handleAddProduct} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{ display: "flex", gap: 12 }}>
                            <div style={{ flex: 2 }}>
                                <label style={labelStyle}>Barcode</label>
                                <input
                                    type="text"
                                    required
                                    value={editingProduct.barcode}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                                    style={inputStyle}
                                    placeholder="Enter or scan"
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Qty</label>
                                <input
                                    type="number"
                                    required
                                    value={editingProduct.quantity}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, quantity: e.target.value })}
                                    style={inputStyle}
                                    min="1"
                                />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Product Name</label>
                            <input
                                type="text"
                                required
                                value={editingProduct.productName}
                                onChange={(e) => setEditingProduct({ ...editingProduct, productName: e.target.value })}
                                style={inputStyle}
                                placeholder="E.g., Parle-G 250g"
                            />
                        </div>

                        <div style={{ display: "flex", gap: 12 }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Brand</label>
                                <input
                                    type="text"
                                    value={editingProduct.brand}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Category</label>
                                <input
                                    type="text"
                                    value={editingProduct.category}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 12 }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Price (₹)</label>
                                <input
                                    type="number"
                                    required
                                    value={editingProduct.sellingPrice}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, sellingPrice: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>MRP (₹)</label>
                                <input
                                    type="number"
                                    value={editingProduct.mrp}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, mrp: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "16px",
                                borderRadius: 14,
                                border: "none",
                                background: loading ? "#94a3b8" : "#2563eb",
                                color: "#fff",
                                fontWeight: 800,
                                fontSize: 16,
                                marginTop: 8,
                                cursor: loading ? "not-allowed" : "pointer",
                                boxShadow: loading ? "none" : "0 4px 14px rgba(37,99,235,0.4)"
                            }}
                        >
                            {loading ? "Saving..." : "Add to Inventory"}
                        </button>
                    </form>
                </div>

                {/* Recent Updates List */}
                <div style={{ background: "#fff", padding: 20, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "var(--text)" }}>Recently Scanned</h3>
                    {recentProducts.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "20px 0", color: "#999", fontSize: 14 }}>
                            No items added recently.
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {recentProducts.map((p) => (
                                <div key={p.id} style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    paddingBottom: 12,
                                    borderBottom: "1px solid #f1f5f9"
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 15 }}>{p.productName}</div>
                                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                                            {p.barcode} • {p.category || "General"}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontWeight: 800, color: "#10b981" }}>₹{p.sellingPrice}</div>
                                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: 600 }}>Qty: {p.quantity}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.5px"
};

const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    fontSize: 15,
    outline: "none",
    background: "#f8fafc",
    boxSizing: "border-box",
    transition: "border 0.2s"
};

export default StockManager;

