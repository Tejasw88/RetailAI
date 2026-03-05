// RetailAI — Node.js API connected to Neon PostgreSQL
// npm install express cors pg dotenv
// node server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.connect()
  .then(async () => {
    console.log("✅ Connected to Neon PostgreSQL");
    // Migration: add new columns if they don't exist
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(50)`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100)`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS emoji VARCHAR(10)`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS mrp NUMERIC(10,2)`);
    console.log("✅ All columns ready (barcode, brand, emoji, mrp)");
  })
  .catch(err => { console.error("❌ DB connection failed:", err.message); process.exit(1); });

// ── GET /api/summary ──────────────────────────────────────────
app.get("/api/summary", async (req, res) => {
  try {
    const [statusRes, savingsRes, accuracyRes, stockRes] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE i.current_stock <= i.safety_stock)                        AS critical,
          COUNT(*) FILTER (WHERE i.current_stock > i.safety_stock AND i.current_stock <= i.reorder_point) AS low,
          COUNT(*) FILTER (WHERE i.current_stock > i.eoq * 2)                              AS overstock,
          COUNT(*) FILTER (WHERE i.current_stock > i.reorder_point AND i.current_stock <= i.eoq * 2) AS optimal,
          COUNT(*)                                                                          AS total
        FROM inventory i`),
      pool.query(`SELECT COALESCE(SUM(potential_savings),0) AS total_savings FROM alerts WHERE resolved = FALSE`),
      pool.query(`SELECT 90.2 AS accuracy`),  // would come from model evaluation table in prod
      pool.query(`SELECT SUM(i.current_stock * p.unit_cost) AS total_stock_value FROM inventory i JOIN products p ON p.id = i.product_id`),
    ]);

    res.json({
      totalProducts: parseInt(statusRes.rows[0].total),
      critical: parseInt(statusRes.rows[0].critical),
      low: parseInt(statusRes.rows[0].low),
      overstock: parseInt(statusRes.rows[0].overstock),
      optimal: parseInt(statusRes.rows[0].optimal),
      totalSavings: parseFloat(savingsRes.rows[0].total_savings),
      forecastAccuracy: parseFloat(accuracyRes.rows[0].accuracy),
      totalStockValue: parseFloat(stockRes.rows[0].total_stock_value),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/products ─────────────────────────────────────────
app.get("/api/products", async (req, res) => {
  try {
    const { status, category } = req.query;
    let where = [];
    if (category) where.push(`p.category = '${category}'`);
    if (status) {
      const s = status.toUpperCase();
      if (s === "CRITICAL") where.push("i.current_stock <= i.safety_stock");
      else if (s === "LOW") where.push("i.current_stock > i.safety_stock AND i.current_stock <= i.reorder_point");
      else if (s === "OVERSTOCK") where.push("i.current_stock > i.eoq * 2");
      else if (s === "OPTIMAL") where.push("i.current_stock > i.reorder_point AND i.current_stock <= i.eoq * 2");
    }
    const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";

    const result = await pool.query(`
      SELECT
        p.id, p.name, p.category, p.unit_cost, p.selling_price, p.barcode, p.brand, p.emoji, p.mrp,
        COALESCE(i.current_stock, 0) AS current_stock,
        COALESCE(i.safety_stock, 0) AS safety_stock,
        COALESCE(i.reorder_point, 0) AS reorder_point,
        COALESCE(i.eoq, 0) AS eoq,
        COALESCE(i.lead_time_days, 5) AS lead_time_days,
        ROUND(COALESCE(i.current_stock, 0)::numeric / NULLIF(
          (SELECT AVG(s.units_sold) FROM sales_history s WHERE s.product_id = p.id AND s.sale_date >= CURRENT_DATE - 30),
          0), 1) AS days_of_stock,
        (SELECT ROUND(AVG(s.units_sold),1) FROM sales_history s WHERE s.product_id = p.id AND s.sale_date >= CURRENT_DATE - 30) AS avg_daily,
        CASE
          WHEN i.current_stock IS NULL THEN 'OPTIMAL'
          WHEN i.current_stock <= i.safety_stock THEN 'CRITICAL'
          WHEN i.current_stock <= i.reorder_point THEN 'LOW'
          WHEN i.current_stock > i.eoq * 2 THEN 'OVERSTOCK'
          ELSE 'OPTIMAL'
        END AS status
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.id
      ${whereClause}
      ORDER BY p.name`);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/products/search?q=term ──────────────────────────
app.get("/api/products/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || q.length < 2) return res.json([]);
    const result = await pool.query(
      `SELECT p.id, p.name, p.brand, p.category, p.emoji, p.mrp, p.barcode, p.selling_price, p.unit_cost
       FROM products p
       WHERE LOWER(p.name) LIKE $1 OR LOWER(p.brand) LIKE $1
       ORDER BY p.name
       LIMIT 10`,
      [`%${q.toLowerCase()}%`]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/products/barcode/:barcode ────────────────────────
app.get("/api/products/barcode/:barcode", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, i.current_stock, i.safety_stock, i.reorder_point, i.eoq, i.lead_time_days
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE p.barcode = $1 LIMIT 1`,
      [req.params.barcode]
    );
    if (!result.rows.length) return res.json({ found: false });
    res.json({ found: true, product: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/products/:id ─────────────────────────────────────
app.get("/api/products/:id", async (req, res) => {
  try {
    const [product, history, forecast] = await Promise.all([
      pool.query(`
        SELECT p.*, i.*, 
          CASE WHEN i.current_stock <= i.safety_stock THEN 'CRITICAL'
               WHEN i.current_stock <= i.reorder_point THEN 'LOW'
               WHEN i.current_stock > i.eoq * 2 THEN 'OVERSTOCK'
               ELSE 'OPTIMAL' END AS status,
          ROUND(i.current_stock::numeric / NULLIF((SELECT AVG(units_sold) FROM sales_history WHERE product_id=$1 AND sale_date >= CURRENT_DATE-30),0),1) AS days_of_stock
        FROM products p JOIN inventory i ON i.product_id=p.id WHERE p.id=$1`, [req.params.id]),
      pool.query(`SELECT sale_date, units_sold, revenue FROM sales_history WHERE product_id=$1 ORDER BY sale_date DESC LIMIT 30`, [req.params.id]),
      pool.query(`SELECT forecast_date, predicted_units, lower_bound, upper_bound FROM forecasts WHERE product_id=$1 AND forecast_date >= CURRENT_DATE ORDER BY forecast_date`, [req.params.id]),
    ]);
    if (!product.rows.length) return res.status(404).json({ error: "Product not found" });
    res.json({ ...product.rows[0], history: history.rows, forecast: forecast.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/alerts ───────────────────────────────────────────
app.get("/api/alerts", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, p.name AS product_name, p.category, i.current_stock,
             i.reorder_point, i.safety_stock, i.eoq, i.lead_time_days,
             ROUND(i.current_stock::numeric / NULLIF(
               (SELECT AVG(units_sold) FROM sales_history s WHERE s.product_id=p.id AND s.sale_date>=CURRENT_DATE-30),0),1) AS days_of_stock
      FROM alerts a
      JOIN products p ON p.id = a.product_id
      JOIN inventory i ON i.product_id = p.id
      WHERE a.resolved = FALSE
      ORDER BY a.potential_savings DESC`);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/history ──────────────────────────────────────────
app.get("/api/history", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sale_date AS date,
             SUM(units_sold) AS total_units,
             SUM(revenue) AS total_revenue
      FROM sales_history
      WHERE sale_date >= CURRENT_DATE - 30
      GROUP BY sale_date
      ORDER BY sale_date ASC`);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/forecast ─────────────────────────────────────────
app.get("/api/forecast", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.forecast_date, f.predicted_units, f.lower_bound, f.upper_bound,
             p.id AS product_id, p.name AS product_name, p.category
      FROM forecasts f
      JOIN products p ON p.id = f.product_id
      WHERE f.forecast_date >= CURRENT_DATE
      ORDER BY p.name, f.forecast_date`);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/categories ───────────────────────────────────────
app.get("/api/categories", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.category,
             COUNT(*) AS product_count,
             SUM(i.current_stock * p.unit_cost) AS stock_value,
             COUNT(*) FILTER (WHERE i.current_stock <= i.safety_stock) AS critical_count
      FROM products p JOIN inventory i ON i.product_id = p.id
      GROUP BY p.category ORDER BY stock_value DESC`);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /api/alerts/:id/resolve ─────────────────────────────
app.patch("/api/alerts/:id/resolve", async (req, res) => {
  try {
    await pool.query("UPDATE alerts SET resolved=TRUE WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});



// ── POST /api/products ────────────────────────────────────────
app.post("/api/products", async (req, res) => {
  try {
    const { name, category, barcode, unit_cost, selling_price, initial_stock, brand, emoji, mrp } = req.body;
    if (!name || !category || !unit_cost || !selling_price) {
      return res.status(400).json({ error: "name, category, unit_cost, selling_price are required" });
    }

    // Auto-generate next product ID
    const maxId = await pool.query(`SELECT id FROM products ORDER BY id DESC LIMIT 1`);
    let nextNum = 1;
    if (maxId.rows.length) {
      const num = parseInt(maxId.rows[0].id.replace(/\D/g, ''));
      nextNum = num + 1;
    }
    const newId = `P${String(nextNum).padStart(3, '0')}`;

    // Insert product
    await pool.query(
      `INSERT INTO products (id, name, category, barcode, unit_cost, selling_price, brand, emoji, mrp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [newId, name, category, barcode || null, parseFloat(unit_cost), parseFloat(selling_price), brand || null, emoji || '📦', mrp ? parseFloat(mrp) : null]
    );

    // Auto-calculate inventory parameters
    const stock = parseInt(initial_stock) || 0;
    const eoq = Math.max(50, Math.round(Math.sqrt((2 * 365 * 30 * parseFloat(unit_cost)) / (parseFloat(unit_cost) * 0.25))));
    const safety = Math.max(5, Math.round(eoq * 0.15));
    const reorder = Math.round(safety + (30 * 5)); // avg_daily * lead_time approx
    const leadTime = 5;

    await pool.query(
      `INSERT INTO inventory (product_id, current_stock, safety_stock, reorder_point, eoq, lead_time_days)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [newId, stock, safety, reorder, eoq, leadTime]
    );

    res.json({ success: true, id: newId, name, current_stock: stock });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /api/inventory/:productId/restock ────────────────────
app.patch("/api/inventory/:productId/restock", async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) return res.status(400).json({ error: "quantity must be > 0" });

    const result = await pool.query(
      `UPDATE inventory SET current_stock = current_stock + $1, updated_at = NOW()
       WHERE product_id = $2
       RETURNING current_stock`,
      [parseInt(quantity), req.params.productId]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Product not found" });

    // Get product info for response
    const product = await pool.query(`SELECT name FROM products WHERE id = $1`, [req.params.productId]);

    res.json({
      success: true,
      product_id: req.params.productId,
      name: product.rows[0]?.name,
      new_stock: result.rows[0].current_stock
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 RetailAI API running → http://localhost:${PORT}`));
