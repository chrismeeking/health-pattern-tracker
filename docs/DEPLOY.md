# Deploy for phone testing

Deploy once to the cloud so you and Jenny can open the app on your phones **without your laptop running**.

## Fastest path: Render (free)

### 1. Push the project to GitHub

If you do not have a repo yet:

```bash
cd C:\Users\chris\Projects\health-pattern-tracker
git add .
git commit -m "Prepare for cloud deployment"
gh repo create health-pattern-tracker --private --source=. --push
```

(Or create a repo on github.com and push manually.)

### 2. Create the web service on Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com) and sign in (GitHub login is easiest).
2. **New → Blueprint** (or **New → Web Service**).
3. Connect your `health-pattern-tracker` repository.
4. Render reads `render.yaml` automatically:
   - **Build:** `npm install && npm run build`
   - **Start:** `npm run start`
   - **Plan:** Free
5. Optional environment variables (Render dashboard → Environment):
   - `OPENAI_API_KEY` — real AI meal analysis (otherwise mock/local estimates)
   - `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` — shared cloud sync between phones (see below)
6. Click **Deploy**. First build takes ~3–5 minutes.

You get a URL like:

`https://health-pattern-tracker.onrender.com`

Open that on each phone.

### 3. Install on your phone (PWA)

**iPhone (Safari):**

1. Open your Render URL.
2. Share → **Add to Home Screen**.
3. Open from the home screen icon (full-screen app feel).

**Android (Chrome):**

1. Open your Render URL.
2. Menu → **Install app** or **Add to Home screen**.

---

## Important: data on two phones

| Mode | What happens |
|------|----------------|
| **Default (no Supabase)** | Each phone keeps its **own** data in the browser. Chris and Jenny can both test, but meals do not sync between devices. Use **Settings → Reload demo data** on each phone to get Chris/Jenny demo profiles. |
| **With Supabase sync** | Sign in on both phones → same household → meals/favourites sync. See `docs/supabase-schema.md`. |

For quick UI testing, default is fine. For **shared household logging**, set up Supabase and add the two `VITE_` keys in Render **before** redeploying (they are baked in at build time).

---

## Verify deployment

- App loads at your Render URL.
- **Settings → AI status** should show the backend is running.
- Try **Add Meal → type “All Day Breakfast”** for a nutrition suggestion.

Health check: `https://YOUR-URL.onrender.com/api/health`

---

## Free tier notes

- Render free services **sleep after ~15 minutes** of no use. First open after sleep may take 30–60 seconds to wake.
- For heavier testing later, consider a paid plan or Railway/Fly.io.

---

## Local production test (optional)

```powershell
cd C:\Users\chris\Projects\health-pattern-tracker
npm run build
$env:NODE_ENV="production"
npm run start
```

Then open `http://localhost:3001` on the same machine (not useful for Jenny’s phone unless you tunnel).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank page after deploy | Check Render build logs; ensure `npm run build` succeeded. |
| AI always mock | Add `OPENAI_API_KEY` in Render env and redeploy. |
| Sync not available | Add Supabase env vars and **trigger a new deploy** (Vite embeds `VITE_*` at build). |
| Camera/barcode on phone | Requires HTTPS — Render provides this automatically. |
