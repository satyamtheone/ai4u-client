import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-geography',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="geography-page">
      <div class="content-grid">
        <div class="performance-card">
          <h3>🗺️ Geographic Risk Intelligence</h3>
          <p style="color: #666; margin: 15px 0;">AI-powered risk assessment across pincodes nationwide</p>

          <div style="margin: 25px 0;">
            <h4 style="margin-bottom: 15px;">🏛️ State Risk Overview</h4>
            <div class="risk-heatmap">
              <div *ngFor="let state of stateRisks"
                   class="heatmap-cell"
                   [ngClass]="'risk-' + state.level">
                {{ state.name }}<br>{{ state.rtoRate }}%
              </div>
            </div>
          </div>

          <div style="margin-top: 25px;">
            <h4 style="color: #ef4444; margin-bottom: 15px;">🚨 Critical Risk Zones</h4>
            <div *ngFor="let zone of criticalZones" class="prediction-card prediction-critical">
              <div style="display: flex; justify-content: space-between;">
                <span><strong>{{ zone.pincode }}</strong> ({{ zone.region }})</span>
                <span style="color: #dc2626; font-weight: 600;">{{ zone.rtoRate }}% RTO</span>
              </div>
              <div style="font-size: 0.8rem; color: #666; margin-top: 5px;">
                {{ zone.reasons }}
              </div>
            </div>
          </div>
        </div>

        <div class="chart-container">
          <h3 style="margin-bottom: 20px;">Geographic Risk Heatmap</h3>
          <div class="chart-placeholder">
            <p>📍 Geographic scatter plot will be rendered here</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .geography-page {
      animation: fadeIn 0.5s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .chart-placeholder {
      min-height: 300px;
      background: rgba(102, 126, 234, 0.05);
      border: 2px dashed #667eea;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      text-align: center;
      color: #667eea;
      font-weight: 600;
    }
  `]
})
export class GeographyComponent implements OnInit {
  stateRisks: any[] = [
    { name: 'Maharashtra', rtoRate: 8.2, level: 0 },
    { name: 'Karnataka', rtoRate: 11.5, level: 1 },
    { name: 'Delhi NCR', rtoRate: 16.8, level: 2 },
    { name: 'UP East', rtoRate: 23.4, level: 3 },
    { name: 'Bihar', rtoRate: 31.7, level: 4 },
    { name: 'J&K', rtoRate: 42.3, level: 5 }
  ];

  criticalZones: any[] = [
    {
      pincode: '191XXX',
      region: 'Srinagar Region',
      rtoRate: 68.7,
      reasons: 'Weather disruptions • Remote locations • Limited courier access'
    },
    {
      pincode: '248XXX',
      region: 'Dehradun Hills',
      rtoRate: 54.2,
      reasons: 'Monsoon impact • Hill station challenges • Address accuracy issues'
    }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadGeographicData();
  }

  private loadGeographicData(): void {
    this.apiService.getPincodeAnalysis().subscribe({
      next: (data) => {
        console.log('Pincode data:', data);
        // Process and update the view
      },
      error: (error) => {
        console.error('Failed to load geographic data:', error);
      }
    });
  }
}
