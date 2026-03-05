# RetailAI — Setup Guide (Run in < 5 minutes)

## 📁 Folder Structure
```
retailai-backend/
  ├── schema.sql      ← Run this on Neon first
  ├── server.js       ← Node.js API
  └── .env            ← Your DB connection string

retailai-frontend/
  └── src/App.jsx     ← React dashboard
```

---

## STEP 1 — Setup Neon Database (2 min)

Go to https://console.neon.tech → open your project → SQL Editor

Copy & paste the entire contents of `schema.sql` and run it.
This creates tables + seeds 12 products with 30 days of sales history.

---

## STEP 2 — Start the API (1 min)

```bash
cd retailai-backend
npm init -y
npm install express cors pg dotenv
node server.js
```

You should see:
```
✅ Connected to Neon PostgreSQL
🚀 RetailAI API running → http://localhost:3001
```

Test it: http://localhost:3001/api/summary

---

## STEP 3 — Start the React App (2 min)

```bash
cd retailai-frontend
npx create-react-app . --template minimal   # or use Vite
npm install recharts
# Replace src/App.js with src/App.jsx content
npm start
```

Or with Vite (faster):
```bash
npm create vite@latest retailai-frontend -- --template react
cd retailai-frontend
npm install recharts
# Replace src/App.jsx with the provided file
npm run dev
```

Open http://localhost:5173 (Vite) or http://localhost:3000 (CRA)

---

## API Endpoints

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| GET    | /api/summary          | Dashboard KPIs                 |
| GET    | /api/products         | All products + stock status    |
| GET    | /api/products?status= | Filter by CRITICAL/LOW/etc     |
| GET    | /api/products/:id     | Single product + history       |
| GET    | /api/alerts           | Active alerts sorted by risk   |
| GET    | /api/forecast         | 7-day forecast all products    |
| GET    | /api/history          | 30-day aggregate sales         |
| GET    | /api/categories       | Category breakdown             |
| PATCH  | /api/alerts/:id/resolve | Mark alert as resolved       |

---

## 🏆 Hackathon Demo Flow (3 minutes)

1. **Dashboard** → "Our system identified ₹X in preventable losses"
2. **Alerts tab** → Show critical items, click Resolve live
3. **Inventory** → Filter by CRITICAL, expand a product to show sparkline
4. **Forecast** → Show 7-day prediction charts per SKU
5. **Closing** → "All data is live from Neon PostgreSQL — production ready"
