import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from './services/api.service';
import { interval, Subscription } from 'rxjs';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="dashboard">
      <!-- Header -->
      <div class="header">
        <h1>RTO Prediction Intelligence</h1>
        <p class="subtitle">AI-powered logistics optimization and risk assessment platform</p>

        <div class="system-status">
          <div class="status-item" [ngClass]="{'status-warning': apiService.connectionStatus() !== 'connected'}">
            <div class="status-dot"></div>
            <span>API: {{ apiService.connectionStatus() === 'connected' ? 'Healthy' : 'Disconnected' }}</span>
          </div>
          <div class="status-item" *ngIf="systemInfo">
            <div class="status-dot"></div>
            <span>Model: {{ systemInfo.model_loaded ? 'Active' : 'Inactive' }}</span>
          </div>
          <div class="status-item" *ngIf="systemInfo">
            <div class="status-dot"></div>
            <span>Predictions: {{ formatNumber(systemInfo.predictions_made) }}</span>
          </div>
          <div class="status-item">
            <div class="status-dot"></div>
            <span>Version: 2.0.0</span>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-container">
        <div class="tab-buttons">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="tab-button">
            📊 Overview
          </a>
          <a routerLink="/couriers" routerLinkActive="active" class="tab-button">
            🚚 Courier Intelligence
          </a>
          <a routerLink="/geography" routerLinkActive="active" class="tab-button">
            🗺️ Geographic Risk
          </a>
          <a routerLink="/predictions" routerLinkActive="active" class="tab-button">
            🎯 Live Predictions
          </a>
          <a routerLink="/analytics" routerLinkActive="active" class="tab-button">
            📈 Advanced Analytics
          </a>
          <a routerLink="/ai-insights" routerLinkActive="active" class="tab-button">
            🤖 AI Insights
          </a>
        </div>

        <!-- Router Outlet for Page Components -->
        <div class="content-container">
          <router-outlet></router-outlet>
        </div>
      </div>

      <!-- Loading Indicator -->
      <div class="loading-overlay" *ngIf="apiService.loading()">
        <div class="loading-spinner"></div>
      </div>

      <!-- Error Message -->
      <div class="error-banner" *ngIf="apiService.error()">
        <span>⚠️ {{ apiService.error() }}</span>
        <button (click)="apiService.error.set(null)">✕</button>
      </div>
    </div>
  `,
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit, OnDestroy {
  systemInfo: any = null;
  private refreshSubscription?: Subscription;

  constructor(public apiService: ApiService) {}

  ngOnInit(): void {
    // Load initial data
    this.loadSystemInfo();

    // Set up auto-refresh
    if (environment.refreshInterval > 0) {
      this.refreshSubscription = interval(environment.refreshInterval).subscribe(() => {
        this.loadSystemInfo();
      });
    }

    // Listen for keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  private loadSystemInfo(): void {
    this.apiService.getRootInfo().subscribe({
      next: (data) => {
        this.systemInfo = data;
      },
      error: (error) => {
        console.error('Failed to load system info:', error);
      }
    });
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      if (event.altKey) {
        switch (event.key) {
          case '1':
            window.location.hash = '/';
            break;
          case '2':
            window.location.hash = '/couriers';
            break;
          case '3':
            window.location.hash = '/geography';
            break;
          case '4':
            window.location.hash = '/predictions';
            break;
          case '5':
            window.location.hash = '/analytics';
            break;
          case '6':
            window.location.hash = '/ai-insights';
            break;
        }
      }
    });
  }

  formatNumber(value: number | undefined): string {
    if (!value) return '0';
    return value.toLocaleString('en-IN');
  }
}
