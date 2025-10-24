# Proxy Setup - Bypass CORS During Development

## 🎯 Quick Start

To **bypass CORS** without configuring it on the backend:

### 1. Enable Proxy Mode

**Edit `.env.development`:**
```bash
REACT_APP_USE_PROXY=true
```

### 2. Restart Dev Server
```bash
# Stop server (Ctrl+C)
npm start
```

### 3. Clear Browser Cache
```javascript
// In browser console
clearConfig()
```

**Done!** ✅ CORS is now bypassed. Your app will connect without CORS errors.

---

## 🔄 How It Works

### Without Proxy (Direct Connection)
```
React App (localhost:3000)
    ↓ Direct request
Backend (15.207.0.129:8000)
    ↓
❌ CORS Error: Different origins
```

### With Proxy (CORS Bypassed)
```
React App (localhost:3000)
    ↓ Request to /api/v1/health
React Dev Server (localhost:3000) ← Same origin, no CORS!
    ↓ Proxy forwards to
Backend (15.207.0.129:8000)
    ↓
✅ Success: No CORS check
```

---

## ⚙️ Configuration

### Enable Proxy (Bypass CORS)
```bash
# .env.development
REACT_APP_USE_PROXY=true
```

**Effect:**
- ✅ No CORS errors
- ✅ No backend changes needed
- ✅ Works immediately
- ⚠️ Only for development (doesn't work in production build)

### Disable Proxy (Direct Connection)
```bash
# .env.development
REACT_APP_USE_PROXY=false
```

**Effect:**
- Requests go directly to backend
- ❌ CORS must be configured on backend
- ✅ More realistic (matches production)

---

## 🔍 Verify It's Working

### Check Console Output

After starting dev server with proxy enabled:
```
📡 API Configuration:
  Proxy mode: ✅ ENABLED (bypassing CORS)
  Backend URL: (using proxy)
  API Base URL: /api/v1
  WebSocket URL: ws://15.207.0.129:8000/ws

🔀 Proxy enabled - Bypassing CORS
🔗 Proxying /api to: http://15.207.0.129:8000
```

### Test in Browser Console

```javascript
// This should now work without CORS errors
testBackend()
```

**Expected Output:**
```
✅ Health check passed
✅ Backend is reachable
```

---

## 📂 Files Modified

1. **`src/setupProxy.js`** ✨ NEW
   - Configures proxy middleware
   - Routes `/api/*` requests to backend
   - Only active in development

2. **`src/utils/apiConfig.ts`** ✨ NEW
   - Helper to get correct URLs based on proxy mode
   - Switches between relative and absolute URLs

3. **`src/services/ConfigManager.ts`** ✅ Updated
   - Now uses `getBackendUrl()` helper
   - Automatically adapts to proxy mode

4. **`.env.development`** ✅ Updated
   - Added `REACT_APP_USE_PROXY=true`

---

## 🎛️ Toggle Modes

### Development with CORS Issues?
```bash
# .env.development
REACT_APP_USE_PROXY=true  # ← Bypass CORS
```

### Testing Production-like Setup?
```bash
# .env.development
REACT_APP_USE_PROXY=false  # ← Test with real CORS
```

Then configure CORS on backend:
```python
# Backend (FastAPI)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## ⚠️ Important Notes

### 1. **Proxy Only Works in Development**
```bash
npm start    # ✅ Proxy works
npm build    # ❌ Proxy doesn't exist in production build
```

For production, you MUST:
- Configure CORS on backend
- Or use a reverse proxy (Nginx, Cloudflare)

### 2. **WebSockets Don't Use Proxy**
WebSocket connections bypass the proxy and connect directly.

If you need WebSocket in development:
- Either enable CORS on backend
- Or run frontend and backend on same port

### 3. **Clear Cache After Switching**
When switching between proxy modes:
```javascript
clearConfig()  // In browser console
```

---

## 🐛 Troubleshooting

### Proxy Not Working?

**1. Check if proxy middleware is installed:**
```bash
npm list http-proxy-middleware
```

**2. Check console for proxy logs:**
```
→ Proxying: GET /api/v1/health to http://15.207.0.129:8000
```

**3. Verify proxy is enabled:**
```javascript
// In browser console
console.log(process.env.REACT_APP_USE_PROXY)
// Should show: "true"
```

**4. Restart dev server:**
```bash
# setupProxy.js only loads on server start
npm start
```

### Still Getting CORS Errors?

**Check your API paths:**
```javascript
// ❌ Wrong: Full URL bypasses proxy
fetch('http://15.207.0.129:8000/api/v1/health')

// ✅ Correct: Relative URL uses proxy
fetch('/api/v1/health')
```

The proxy only works with **relative URLs** starting with `/api`.

---

## 📊 Comparison

| Feature | Proxy Mode | Direct Mode |
|---------|-----------|-------------|
| **CORS Errors** | ✅ None | ❌ Need backend config |
| **Setup Time** | ✅ Instant | ❌ Requires backend changes |
| **Production Ready** | ❌ Dev only | ✅ Works in production |
| **WebSockets** | ❌ Direct connection | ✅ Direct connection |
| **Realistic Testing** | ⚠️ Different from prod | ✅ Matches production |

---

## 🎯 Recommended Approach

### For Development (Daily Work)
```bash
REACT_APP_USE_PROXY=true
```
**Why:** No CORS headaches, work faster

### Before Deploying
```bash
REACT_APP_USE_PROXY=false
```
**Why:** Test with real CORS, ensure backend is configured correctly

### Production
```bash
# No proxy in production builds
# Ensure backend CORS is configured
```

---

## ✅ Summary

**To bypass CORS immediately:**

1. Set `REACT_APP_USE_PROXY=true` in `.env.development`
2. Restart dev server: `npm start`
3. Clear cache: `clearConfig()` in console
4. Done! ✅

**No backend changes needed!**

---

**Last Updated:** 2025-10-24
**Related Issue:** #1 - Backend URL & CORS Configuration
