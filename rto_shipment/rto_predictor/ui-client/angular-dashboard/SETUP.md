# RTO Dashboard - Angular 17 Setup Guide

## 🎯 Overview

This is a modern Angular 17 standalone component application for the RTO Prediction Intelligence Dashboard. It integrates with the FastAPI backend and preserves all features from the original dashboard.

## 📁 Project Structure

```
angular-dashboard/
├── src/
│   ├── app/
│   │   ├── models/
│   │   │   └── api.models.ts          # TypeScript interfaces for API
│   │   ├── services/
│   │   │   ├── api.service.ts         # Backend API integration
│   │   │   └── utils.service.ts       # Utility functions
│   │   ├── shared/
│   │   │   └── components/
│   │   │       ├── metric-card.component.ts
│   │   │       └── alert-item.component.ts
│   │   ├── pages/
│   │   │   ├── overview/
│   │   │   ├── couriers/
│   │   │   ├── geography/
│   │   │   ├── predictions/
│   │   │   ├── analytics/
│   │   │   └── ai-insights/
│   │   ├── app.ts                     # Main app component
│   │   ├── app.css                    # App styles
│   │   ├── app.routes.ts              # Route configuration
│   │   └── app.config.ts              # App configuration
│   ├── environments/
│   │   ├── environment.ts             # Development config
│   │   └── environment.prod.ts        # Production config
│   └── styles.css                     # Global styles
├── package.json
├── angular.json
└── tsconfig.json
```

## 🚀 Setup Instructions

### 1. Prerequisites

- Node.js v18+ (currently v22.20.0 installed)
- npm v9+ (currently v10.9.3 installed)
- Backend API running on `http://localhost:8000`

### 2. Install Dependencies

The Chart.js dependency has already been installed. If you need to reinstall:

```bash
cd /Users/anilkumargupta/Documents/study/ttt/ai4u/rto_shipment/rto_predictor/ui-client/angular-dashboard
npm install
```

### 3. Start the Backend API

```bash
cd /Users/anilkumargupta/Documents/study/ttt/ai4u/rto_shipment/rto_predictor
source .venv/bin/activate
python3 src/apis/api_main.py
```

API will be running at: **http://localhost:8000**

### 4. Run the Angular Development Server

```bash
cd /Users/anilkumargupta/Documents/study/ttt/ai4u/rto_shipment/rto_predictor/ui-client/angular-dashboard
ng serve
```

Or:

```bash
npm start
```

Dashboard will be available at: **http://localhost:4200**

### 5. Build for Production

```bash
ng build --configuration production
```

Output will be in `dist/angular-dashboard/`

## 📊 Features Implemented

### ✅ Core Infrastructure
- Angular 17 standalone components
- Lazy-loaded routing
- HTTP client with error handling
- Auto-refresh (30s interval)
- Caching system (30s TTL)
- Loading states
- Error banners

### ✅ Services
- **ApiService**: Complete backend integration with all endpoints
- **UtilsService**: Helper functions for formatting, exports, calculations

### ✅ Shared Components
- **MetricCardComponent**: Reusable metric display cards
- **AlertItemComponent**: Alert notifications with different types

### ✅ Page Components (To Be Completed)
- Overview
- Couriers
- Geography
- Predictions
- Analytics
- AI Insights

## 🔧 Configuration

### Environment Variables

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',  // Backend API URL
  apiTimeout: 30000,                 // 30 seconds
  refreshInterval: 30000,            // Auto-refresh every 30s
  cacheEnabled: true,                // Enable caching
  cacheTTL: 30000,                   // Cache TTL 30s
};
```

### Production Configuration

Edit `src/environments/environment.prod.ts` for production settings.

## 📡 API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /` | System info and prediction counts |
| `GET /health` | Health check |
| `GET /api/v1/metrics` | System metrics |
| `GET /api/v1/status` | System status |
| `GET /api/v1/model/info` | Model information |
| `GET /api/v1/analytics/courier-performance` | Courier performance |
| `GET /api/v1/analytics/pincode` | Pincode analysis |
| `GET /api/v1/reports/performance` | Performance report |

## 🎨 UI Features Preserved

All features from `rto_dashboard_v2.html` are designed to be preserved:

- ✅ 6 Tab Navigation System
- ✅ System Status Indicators
- ✅ Key Performance Metrics Cards
- ✅ Risk Distribution Charts
- ✅ Courier Performance Analysis
- ✅ Geographic Risk Heatmaps
- ✅ Live Predictions
- ✅ Advanced Analytics
- ✅ AI Insights
- ✅ Real-time Updates
- ✅ Keyboard Shortcuts (Alt+1 to Alt+6)

## 🔑 Keyboard Shortcuts

- `Alt+1`: Overview Tab
- `Alt+2`: Courier Intelligence Tab
- `Alt+3`: Geographic Risk Tab
- `Alt+4`: Live Predictions Tab
- `Alt+5`: Advanced Analytics Tab
- `Alt+6`: AI Insights Tab

## 🛠️ Development

### Creating a New Component

```bash
ng generate component pages/new-page --standalone
```

### Creating a New Service

```bash
ng generate service services/new-service
```

### Running Tests

```bash
ng test
```

### Linting

```bash
ng lint
```

## 📦 Dependencies

### Core
- `@angular/core`: ^17.x
- `@angular/common`: ^17.x
- `@angular/router`: ^17.x

### Charts
- `chart.js`: ^4.x
- `ng2-charts`: ^5.x

## 🐛 Troubleshooting

### API Connection Issues

**Problem**: Dashboard shows "API: Disconnected"

**Solution**:
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check CORS settings in backend
3. Verify API URL in `environment.ts`

### Charts Not Rendering

**Problem**: Chart areas are blank

**Solution**:
1. Ensure Chart.js is installed: `npm list chart.js`
2. Check browser console for errors
3. Verify data is being loaded from API

### Build Errors

**Problem**: TypeScript compilation errors

**Solution**:
1. Run `npm install` to ensure all dependencies are installed
2. Clear cache: `rm -rf node_modules package-lock.json && npm install`
3. Check TypeScript version compatibility

## 📈 Performance Optimizations

- **Lazy Loading**: Pages loaded on demand
- **Caching**: API responses cached for 30s
- **Debouncing**: Search inputs debounced
- **Change Detection**: OnPush strategy (can be added)
- **Virtual Scrolling**: For large lists (can be added)

## 🔮 Next Steps

1. **Complete Page Components**:
   - Implement Overview component with charts
   - Implement Couriers component with search
   - Implement Geography component with heatmaps
   - Implement Predictions component
   - Implement Analytics component
   - Implement AI Insights component

2. **Add Chart Integration**:
   - Install and configure ng2-charts
   - Create chart directives
   - Implement data transformations

3. **Enhance Features**:
   - Add WebSocket for real-time predictions
   - Implement CSV/PDF export
   - Add user preferences
   - Implement dark mode

4. **Testing**:
   - Add unit tests
   - Add integration tests
   - Add E2E tests

5. **Deployment**:
   - Configure production build
   - Set up CI/CD pipeline
   - Deploy to server

## 📚 Additional Resources

- [Angular Documentation](https://angular.io/docs)
- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [RxJS Documentation](https://rxjs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit for review

## 📝 License

Internal use - AI4U RTO Prediction System

---

**Current Status**: 🏗️ Foundation Complete - Page Components In Progress

**Next Priority**: Implement Overview page component with Chart.js integration
