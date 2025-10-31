import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ai-insights',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ai-insights-page">
      <div class="ai-insights">
        <h2 style="margin-bottom: 25px;">🤖 AI-Powered Business Intelligence</h2>

        <div class="insight-item">
          <div class="insight-icon">🎯</div>
          <div>
            <h4>Smart Courier Routing Recommendation</h4>
            <p style="margin-top: 8px; font-size: 0.9rem; opacity: 0.9;">
              AI detected that switching 2,847 high-risk orders from Amazon to DTDC could reduce RTO by 23% and save ₹24.7L monthly. Implementation complexity: Low.
            </p>
          </div>
        </div>

        <div class="insight-item">
          <div class="insight-icon">📊</div>
          <div>
            <h4>Seasonal Pattern Detection</h4>
            <p style="margin-top: 8px; font-size: 0.9rem; opacity: 0.9;">
              ML models predict 43% RTO spike during monsoon (July-September) in Northern states. Recommend building inventory buffers and adjusting courier mix 2 weeks prior.
            </p>
          </div>
        </div>

        <div class="insight-item">
          <div class="insight-icon">💡</div>
          <div>
            <h4>Customer Behavior Insights</h4>
            <p style="margin-top: 8px; font-size: 0.9rem; opacity: 0.9;">
              Orders placed between 6-9 PM show 34% higher RTO rates. Implementing smart timing nudges and delivery slot preferences could improve success rates by 12%.
            </p>
          </div>
        </div>

        <div class="insight-item">
          <div class="insight-icon">🎪</div>
          <div>
            <h4>Pricing Strategy Optimization</h4>
            <p style="margin-top: 8px; font-size: 0.9rem; opacity: 0.9;">
              Dynamic COD fees based on risk scores (₹25-₹150) could reduce high-risk COD orders by 67% while maintaining conversion rates. Projected impact: +₹18.2L quarterly revenue.
            </p>
          </div>
        </div>
      </div>

      <div class="performance-card" style="margin-top: 20px;">
        <h3 style="margin-bottom: 20px;">🔮 Future Predictions</h3>

        <div class="predictive-section">
          <h4 style="margin-bottom: 15px;">📅 Next 30 Days Forecast</h4>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
              <div style="font-size: 2rem; margin-bottom: 10px;">📈</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">-8.4%</div>
              <div style="font-size: 0.8rem; color: #666;">Predicted RTO Reduction</div>
              <div style="font-size: 0.7rem; color: #999; margin-top: 5px;">Post-monsoon effect</div>
            </div>

            <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
              <div style="font-size: 2rem; margin-bottom: 10px;">💰</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #667eea;">₹31.7L</div>
              <div style="font-size: 0.8rem; color: #666;">Projected Savings</div>
              <div style="font-size: 0.7rem; color: #999; margin-top: 5px;">Model confidence: 87%</div>
            </div>

            <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
              <div style="font-size: 2rem; margin-bottom: 10px;">⚡</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">2.1 days</div>
              <div style="font-size: 0.8rem; color: #666;">Avg Delivery Time</div>
              <div style="font-size: 0.7rem; color: #999; margin-top: 5px;">-0.2 days improvement</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-insights-page {
      animation: fadeIn 0.5s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AiInsightsComponent {}
