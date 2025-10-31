import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/overview/overview.component').then(m => m.OverviewComponent)
  },
  {
    path: 'couriers',
    loadComponent: () => import('./pages/couriers/couriers.component').then(m => m.CouriersComponent)
  },
  {
    path: 'geography',
    loadComponent: () => import('./pages/geography/geography.component').then(m => m.GeographyComponent)
  },
  {
    path: 'predictions',
    loadComponent: () => import('./pages/predictions/predictions.component').then(m => m.PredictionsComponent)
  },
  {
    path: 'analytics',
    loadComponent: () => import('./pages/analytics/analytics.component').then(m => m.AnalyticsComponent)
  },
  {
    path: 'ai-insights',
    loadComponent: () => import('./pages/ai-insights/ai-insights.component').then(m => m.AiInsightsComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
