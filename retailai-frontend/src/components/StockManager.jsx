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
        setMessage({ type: "info", text: "Scanning barcode..." });
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
                    barcode: data.product.barcode,
                    productName: data.product.productName || data.product.name || "",
                    brand: data.product.brand || "",
                    category: data.product.category || "",
                    sellingPrice: data.product.sellingPrice || "",
                    mrp: data.product.mrp || "",
                });
                setMessage({
                    type: "success",
                    text: data.source === "db" ? "Product found in database!" : "Product found on OpenFoodFacts!",
                });
            } else {
                setEditingProduct({ ...editingProduct, barcode: decodedText });
                setMessage({ type: "warning", text: "Product not found. Please enter details manually." });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Error during scan lookup." });
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
            // Reset form partly
            setEditingProduct({ ...editingProduct, barcode: "", productName: "", quantity: "1" });
        } catch (err) {
            setMessage({ type: "error", text: "Failed to add product to stock." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Stock Management</h1>
                    <p className="text-slate-500">Scan barcodes to update inventory in real-time</p>
                </div>
                <button
                    onClick={() => setShowScanner(!showScanner)}
                    className={`px-6 py-3 rounded-full font-semibold transition-all shadow-lg active:scale-95 ${showScanner ? "bg-red-500 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                >
                    {showScanner ? "Close Scanner" : "Open Barcode Scanner"}
                </button>
            </div>

            {showScanner && (
                <div className="flex justify-center">
                    <div className="w-full max-w-md">
                        <Scanner onScanSuccess={handleScanSuccess} onScanError={(err) => console.log(err)} />
                    </div>
                </div>
            )}

            {message.text && (
                <div
                    className={`p-4 rounded-xl border ${message.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                        message.type === "warning" ? "bg-amber-50 border-amber-200 text-amber-800" :
                            message.type === "info" ? "bg-blue-50 border-blue-200 text-blue-800" :
                                "bg-rose-50 border-rose-200 text-rose-800"
                        } animate-in slide-in-from-top-2 duration-300`}
                >
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Entry Form */}
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                    <h2 className="text-xl font-semibold mb-6 text-slate-700">Product Details</h2>
                    <form onSubmit={handleAddProduct} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-600">Barcode</label>
                                <input
                                    type="text"
                                    required
                                    value={editingProduct.barcode}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                    placeholder="Scan or enter barcode"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-600">Quantity to Add</label>
                                <input
                                    type="number"
                                    required
                                    value={editingProduct.quantity}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, quantity: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-600">Product Name</label>
                            <input
                                type="text"
                                required
                                value={editingProduct.productName}
                                onChange={(e) => setEditingProduct({ ...editingProduct, productName: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                placeholder="Name"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-600">Brand</label>
                                <input
                                    type="text"
                                    value={editingProduct.brand}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                    placeholder="Brand"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-600">Category</label>
                                <input
                                    type="text"
                                    value={editingProduct.category}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                    placeholder="Category"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-600">Selling Price (₹)</label>
                                <input
                                    type="number"
                                    required
                                    value={editingProduct.sellingPrice}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, sellingPrice: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-600">MRP (₹)</label>
                                <input
                                    type="number"
                                    value={editingProduct.mrp}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, mrp: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-600">GST (%)</label>
                                <input
                                    type="number"
                                    value={editingProduct.gstPercent}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, gstPercent: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all mt-4 ${loading ? "bg-slate-300 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"
                                }`}
                        >
                            {loading ? "Processing..." : "Add to Stock / Update"}
                        </button>
                    </form>
                </div>

                {/* Recent Updates List */}
                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
                    <h2 className="text-xl font-semibold mb-6 text-slate-700">Recently Updated</h2>
                    {recentProducts.length === 0 ? (
                        <p className="text-slate-400 italic">No products added yet.</p>
                    ) : (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                            {recentProducts.map((p) => (
                                <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-indigo-200 transition-colors">
                                    <div>
                                        <h3 className="font-bold text-slate-800">{p.productName}</h3>
                                        <div className="flex gap-2 text-xs text-slate-500">
                                            <span>{p.brand}</span>
                                            <span>•</span>
                                            <span>{p.barcode}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-indigo-600 font-bold">₹{p.sellingPrice}</div>
                                        <div className="text-xs text-slate-400">Qty: {p.quantity}</div>
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

export default StockManager;
