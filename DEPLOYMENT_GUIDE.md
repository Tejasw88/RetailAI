# Deployment Guide: RetailAI

Follow these steps to finish bringing your shop manager online.

## 1. Deploy Backend (Railway)
The backend runs on Node.js and connects to your Neon PostgreSQL database.

1. Go to [Railway.app](https://railway.app/) and create a new project.
2. Select **Deploy from GitHub repo**.
3. Connect your repository: `https://github.com/Tejasw88/RetailAI`.
4. Railway will automatically detect the subdirectories. When prompted for the root directory, ensure it's set to `retailai-backend` if possible, or Railway might just build from the root if it sees the root structure.
   - *Better yet*: Railway allows you to add a service and point it to a specific folder. 
5. **Environment Variables**: Add:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
   - `PORT`: 3001
6. Once deployed, copy your backend URL (e.g., `https://retailai-backend-production.up.railway.app`).

---

## 2. Connect Frontend (Cloudflare Pages)
Now tell the frontend where the backend is.

1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages**.
2. Select the `retailai` project.
3. Go to **Settings > Environment variables**.
4. Add a new variable:
   - **Variable name**: `VITE_API_URL`
   - **Value**: Your Render backend URL (e.g., `https://retailai-backend.onrender.com`)
   - *Ensure there is NO trailing slash.*
5. Go to **Deployments** and click **Create new deployment** (or simply push any small change to GitHub) to rebuild with the new URL.

---

## 3. Verify
1. Visit `https://retailai.pages.dev/`.
2. Check if products load from the database.
3. Try searching for "Maggi" to confirm API connectivity.
