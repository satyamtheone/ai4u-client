import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-page">
      <div class="performance-grid">
        <div class="performance-card">
          <h3 style="margin-bottom: 20px;">📊 Predictive Analytics</h3>
          <div class="chart-placeholder">
            <p>📈 Trend analysis chart will be rendered here</p>
          </div>
        </div>

        <div class="performance-card">
          <h3 style="margin-bottom: 20px;">🎯 Business Impact</h3>

          <div style="background: rgba(16, 185, 129, 0.1); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h4 style="color: #10b981; margin-bottom: 15px;">💰 Financial Impact</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <div style="font-size: 1.8rem; font-weight: 700; color: #10b981;">₹127.4L</div>
                <div style="font-size: 0.8rem; color: #666;">Total Savings (YTD)</div>
              </div>
              <div>
                <div style="font-size: 1.8rem; font-weight: 700; color: #667eea;">₹847</div>
                <div style="font-size: 0.8rem; color: #666;">Avg Cost per RTO</div>
              </div>
            </div>
          </div>

          <div style="background: rgba(59, 130, 246, 0.1); padding: 20px; border-radius: 10px;">
            <h4 style="color: #3b82f6; margin-bottom: 15px;">⚙️ Operational Excellence</h4>
            <div style="font-size: 0.9rem; line-height: 1.6;">
              <div><strong>Customer Satisfaction:</strong> 94.2% (+3.1%)</div>
              <div><strong>Delivery Success Rate:</strong> 87.4% (+5.7%)</div>
              <div><strong>Average TAT:</strong> 2.3 days (-0.8 days)</div>
              <div><strong>Complaint Reduction:</strong> -34% this quarter</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-page {
      animation: fadeIn 0.5s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .chart-placeholder {
      min-height: 250px;
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
export class AnalyticsComponent {}
