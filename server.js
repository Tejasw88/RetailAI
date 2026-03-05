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
  .then(() => console.log("✅ Connected to Neon PostgreSQL"))
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
      else if (s === "LOW")  where.push("i.current_stock > i.safety_stock AND i.current_stock <= i.reorder_point");
      else if (s === "OVERSTOCK") where.push("i.current_stock > i.eoq * 2");
      else if (s === "OPTIMAL")   where.push("i.current_stock > i.reorder_point AND i.current_stock <= i.eoq * 2");
    }
    const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";

    const result = await pool.query(`
      SELECT
        p.*,
        i.current_stock, i.safety_stock, i.reorder_point, i.eoq, i.lead_time_days,
        ROUND(i.current_stock::numeric / NULLIF(
          (SELECT AVG(s.units_sold) FROM sales_history s WHERE s.product_id = p.id AND s.sale_date >= CURRENT_DATE - 30),
          0), 1) AS days_of_stock,
        (SELECT ROUND(AVG(s.units_sold),1) FROM sales_history s WHERE s.product_id = p.id AND s.sale_date >= CURRENT_DATE - 30) AS avg_daily,
        CASE
          WHEN i.current_stock <= i.safety_stock THEN 'CRITICAL'
          WHEN i.current_stock <= i.reorder_point THEN 'LOW'
          WHEN i.current_stock > i.eoq * 2 THEN 'OVERSTOCK'
          ELSE 'OPTIMAL'
        END AS status
      FROM products p
      JOIN inventory i ON i.product_id = p.id
      ${whereClause}
      ORDER BY p.name`);
    res.json(result.rows);
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 RetailAI API running → http://localhost:${PORT}`));
