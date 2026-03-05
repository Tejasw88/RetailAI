-- RetailAI: Demand Forecasting & Stock Optimization
-- Run this first to set up your Neon database

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  unit_cost NUMERIC(10,2) NOT NULL,
  selling_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Current inventory
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(10) REFERENCES products(id),
  current_stock INT NOT NULL DEFAULT 0,
  safety_stock INT NOT NULL DEFAULT 0,
  reorder_point INT NOT NULL DEFAULT 0,
  eoq INT NOT NULL DEFAULT 0,
  lead_time_days INT NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily sales history (last 30 days)
CREATE TABLE IF NOT EXISTS sales_history (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(10) REFERENCES products(id),
  sale_date DATE NOT NULL,
  units_sold INT NOT NULL,
  revenue NUMERIC(10,2) NOT NULL,
  UNIQUE(product_id, sale_date)
);

-- 7-day ML forecast
CREATE TABLE IF NOT EXISTS forecasts (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(10) REFERENCES products(id),
  forecast_date DATE NOT NULL,
  predicted_units INT NOT NULL,
  lower_bound INT NOT NULL,
  upper_bound INT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, forecast_date)
);

-- Alerts log
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(10) REFERENCES products(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('CRITICAL','LOW','OVERSTOCK','OPTIMAL')),
  potential_savings NUMERIC(10,2) DEFAULT 0,
  recommended_order INT DEFAULT 0,
  message TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SEED DATA ─────────────────────────────────────────────────────────────────

INSERT INTO products VALUES
  ('P001','Basmati Rice 5kg','Staples',280,350,NOW()),
  ('P002','Sunflower Oil 1L','Cooking',130,165,NOW()),
  ('P003','Toor Dal 1kg','Staples',110,140,NOW()),
  ('P004','Amul Butter 500g','Dairy',220,270,NOW()),
  ('P005','Parle-G Biscuits','Snacks',28,35,NOW()),
  ('P006','Colgate Toothpaste','Personal Care',80,100,NOW()),
  ('P007','Maggi Noodles 12pk','Instant Food',145,180,NOW()),
  ('P008','Surf Excel 1kg','Household',185,230,NOW()),
  ('P009','Haldiram Namkeen','Snacks',55,70,NOW()),
  ('P010','Aashirvaad Atta 5kg','Staples',230,285,NOW()),
  ('P011','Red Label Tea 500g','Beverages',170,210,NOW()),
  ('P012','Dettol Soap 4pk','Personal Care',120,150,NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO inventory (product_id, current_stock, safety_stock, reorder_point, eoq, lead_time_days) VALUES
  ('P001', 12,  18, 45, 120, 5),
  ('P002', 67,  10, 28,  95, 4),
  ('P003', 8,   12, 32,  88, 6),
  ('P004', 180, 15, 38, 105, 3),
  ('P005', 34,  22, 55,  75, 5),
  ('P006', 55,  8,  22,  60, 4),
  ('P007', 92,  14, 35,  82, 5),
  ('P008', 15,  9,  24,  70, 7),
  ('P009', 210, 16, 42,  90, 4),
  ('P010', 48,  20, 50, 115, 5),
  ('P011', 6,   11, 29,  78, 6),
  ('P012', 73,  7,  19,  55, 3)
ON CONFLICT DO NOTHING;

-- Generate 30 days of sales history
INSERT INTO sales_history (product_id, sale_date, units_sold, revenue)
SELECT p.id,
       CURRENT_DATE - (gs.day || ' days')::INTERVAL,
       (RANDOM() * 60 + 15)::INT,
       ((RANDOM() * 60 + 15)::INT * p.selling_price)
FROM products p
CROSS JOIN generate_series(1,30) AS gs(day)
ON CONFLICT (product_id, sale_date) DO NOTHING;

-- Generate 7-day forecast
INSERT INTO forecasts (product_id, forecast_date, predicted_units, lower_bound, upper_bound)
SELECT p.id,
       CURRENT_DATE + (gs.day || ' days')::INTERVAL,
       (RANDOM() * 55 + 20)::INT,
       (RANDOM() * 40 + 15)::INT,
       (RANDOM() * 75 + 30)::INT
FROM products p
CROSS JOIN generate_series(1,7) AS gs(day)
ON CONFLICT (product_id, forecast_date) DO NOTHING;

-- Generate alerts for low/critical/overstock items
INSERT INTO alerts (product_id, status, potential_savings, recommended_order, message)
VALUES
  ('P001','CRITICAL',8400,120,'Stock critically low — 2.8 days remaining. Order immediately.'),
  ('P003','CRITICAL',5200,88,'Below safety stock. Stockout imminent in under 3 days.'),
  ('P011','CRITICAL',4600,78,'Only 1.4 days of stock left. Emergency reorder required.'),
  ('P008','LOW',3100,70,'Approaching reorder point. Order within 2 days.'),
  ('P004','OVERSTOCK',6300,0,'180 units vs EOQ of 105. Reduce future orders to cut holding costs.'),
  ('P009','OVERSTOCK',5800,0,'210 units on hand — 2.3x EOQ. Consider promotional pricing.')
ON CONFLICT DO NOTHING;
