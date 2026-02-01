# Update Instructions After Backend Deployment

## Step 1: Deploy Backend to Render

Follow the instructions in `DEPLOYMENT.md` to:
1. Set up Supabase database (free)
2. Deploy backend to Render ($7/month or free)
3. Get your backend URL (e.g., `https://pvpai-backend-abc123.onrender.com`)

## Step 2: Update Config File

Edit `/Users/sudo/Desktop/pvpai/config.js`:

```javascript
const CONFIG = {
    // Replace with your actual Render backend URL
    BACKEND_URL: 'https://pvpai-backend-abc123.onrender.com',
    // ... rest stays the same
};
```

## Step 3: Deploy Updated Frontend to Vercel

```bash
cd /Users/sudo/Desktop/pvpai
git add config.js
git commit -m "Add backend URL"
git push origin main
```

Vercel will auto-deploy in ~1 minute.

## Step 4: Test It

1. Go to https://pvpai.vercel.app
2. Connect your wallet
3. Try to create/join a lobby
4. Check browser console for any errors

If you see errors:
- Check backend is running: `curl https://your-backend.onrender.com/health`
- Check CORS is configured: Backend should allow `https://pvpai.vercel.app`

## Step 5: Add Backend URL to Render Environment

In Render dashboard, make sure you have:

```bash
FRONTEND_URL=https://pvpai.vercel.app
```

This allows WebSocket connections from your Vercel frontend.

---

## Quick Test Checklist

After updating config:

- [ ] Backend health endpoint works
- [ ] Frontend loads without errors
- [ ] Can connect wallet
- [ ] Can see lobby list
- [ ] Can create new lobby
- [ ] Can join existing lobby
- [ ] WebSocket connection established
- [ ] Game starts with real players
- [ ] Winner receives payout

---

## Troubleshooting

**"Failed to connect to backend"**
- Check `config.js` has correct backend URL
- Verify backend is running on Render
- Check browser console for CORS errors

**"WebSocket connection failed"**
- Render free tier may be sleeping (30sec wake up)
- Upgrade to Starter plan ($7/month) for always-on
- Check FRONTEND_URL in Render env vars

**"Lobbies not loading"**
- Backend may still be deploying (wait 2-3 min)
- Check Render logs for errors
- Verify database connection in Render env vars

---

## For Local Testing

If you want to test locally before deploying:

1. Start backend locally:
```bash
cd server
npm install
npm start
```

2. Keep `config.js` as:
```javascript
BACKEND_URL: 'http://localhost:3000'
```

3. Open `index.html` in browser

4. When ready for production, change to Render URL

---

**Need help?** Let me know which step you're stuck on!
