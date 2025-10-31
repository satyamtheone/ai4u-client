# Troubleshooting Guide

## ✅ Fixed: Import Error

**Error**: `TS2305: Module '"./app/app"' has no exported member 'App'`

**Fix Applied**: Updated `src/main.ts` to import `AppComponent` instead of `App`.

The Angular dev server with watch mode should automatically recompile. If you still see the error:

1. Stop the dev server (Ctrl+C)
2. Restart it: `npm start`

---

## Common Issues & Solutions

### 1. Application Won't Start

**Symptom**: Dev server fails to start or shows errors

**Solutions**:

```bash
# Option 1: Clear cache and reinstall
cd /Users/anilkumargupta/Documents/study/ttt/ai4u/rto_shipment/rto_predictor/ui-client/angular-dashboard
rm -rf node_modules package-lock.json .angular
npm install
npm start

# Option 2: Use different port if 4200 is busy
npx ng serve --port 4300
```

### 2. Backend API Not Connected

**Symptom**: Dashboard shows "API: Disconnected"

**Solutions**:

```bash
# Verify backend is running
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy",...}

# If not running, start backend:
cd /Users/anilkumargupta/Documents/study/ttt/ai4u/rto_shipment/rto_predictor
source .venv/bin/activate
python3 src/apis/api_main.py
```

### 3. TypeScript Compilation Errors

**Symptom**: Red squiggly lines in IDE or build errors

**Solutions**:

```bash
# Check for TypeScript errors
npx ng build

# If errors about missing types:
npm install --save-dev @types/node

# If Angular version conflicts:
npm install
```

### 4. Module Not Found Errors

**Symptom**: Cannot find module '@angular/...' or other imports

**Solution**:

```bash
cd /Users/anilkumargupta/Documents/study/ttt/ai4u/rto_shipment/rto_predictor/ui-client/angular-dashboard

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Verify Angular CLI
npx ng version
```

### 5. CORS Errors in Browser Console

**Symptom**: Browser console shows CORS policy errors

**Solution**: The backend already has CORS configured. If you still see errors:

```python
# In src/apis/api_main.py, verify CORS middleware is set:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Already configured
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 6. Chart Placeholders Not Working

**Symptom**: Chart areas show placeholders instead of visualizations

**Expected**: This is normal! Charts need to be integrated.

**Solution**: See README.md section "Next Steps: Chart Integration" for adding Chart.js visualizations.

### 7. Hot Reload Not Working

**Symptom**: Changes not reflected automatically

**Solutions**:

```bash
# Restart dev server
# Press Ctrl+C to stop
npm start

# Or clear Angular cache
rm -rf .angular/cache
npm start
```

### 8. Port 4200 Already in Use

**Symptom**: `Port 4200 is already in use`

**Solutions**:

```bash
# Option 1: Kill the process using port 4200
lsof -ti:4200 | xargs kill -9

# Option 2: Use different port
npx ng serve --port 4300

# Option 3: Find and stop the process manually
lsof -i:4200
# Note the PID and kill it
kill -9 <PID>
```

### 9. Blank Page After Build

**Symptom**: Production build shows blank page

**Solutions**:

```bash
# Build with correct base href
npx ng build --base-href=/

# Serve the built files
cd dist/angular-dashboard
npx http-server -p 8080

# Or with Python
python3 -m http.server 8080
```

### 10. Environment Configuration Not Working

**Symptom**: API calls going to wrong URL

**Solution**: Check `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',  // Verify this matches your backend
  apiTimeout: 30000,
  refreshInterval: 30000,
  cacheEnabled: true,
  cacheTTL: 30000,
};
```

---

## Verification Checklist

Before running the application, verify:

- [ ] Node.js v18+ installed: `node --version`
- [ ] npm installed: `npm --version`
- [ ] Dependencies installed: `npm install` completed successfully
- [ ] Backend API running: `curl http://localhost:8000/health` returns response
- [ ] Port 4200 available: `lsof -i:4200` shows nothing
- [ ] No TypeScript errors: `npx ng build` succeeds

---

## Quick Reset

If all else fails, complete reset:

```bash
cd /Users/anilkumargupta/Documents/study/ttt/ai4u/rto_shipment/rto_predictor/ui-client/angular-dashboard

# Complete cleanup
rm -rf node_modules package-lock.json .angular

# Reinstall
npm install

# Restart
npm start
```

---

## Getting Help

1. **Check Browser Console** (F12): Look for errors
2. **Check Terminal**: Look for compilation errors
3. **Verify Backend**: Ensure API is running and accessible
4. **Check Network Tab**: Verify API calls are being made

---

## Success Indicators

When everything is working:

✅ Terminal shows: `Angular Live Development Server is listening on localhost:4200`
✅ Browser shows: Dashboard with header and navigation
✅ Header shows: "API: Healthy" (green indicator)
✅ Console shows: No errors
✅ Network tab shows: Successful API calls to localhost:8000

---

## Still Having Issues?

1. Check `README.md` for detailed documentation
2. Check `SETUP.md` for configuration options
3. Check `QUICKSTART.md` for basic setup
4. Verify all files were created correctly:

```bash
# Should show 15 TypeScript files
find src/app -name "*.ts" | wc -l
```

---

**Most Common Fix**: Just restart both servers!

```bash
# Terminal 1: Backend
cd /Users/anilkumargupta/Documents/study/ttt/ai4u/rto_shipment/rto_predictor
source .venv/bin/activate
python3 src/apis/api_main.py

# Terminal 2: Frontend (after stopping with Ctrl+C)
cd /Users/anilkumargupta/Documents/study/ttt/ai4u/rto_shipment/rto_predictor/ui-client/angular-dashboard
npm start
```

Open http://localhost:4200 and it should work! 🎉
