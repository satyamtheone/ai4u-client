import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="metric-card" [style.cursor]="clickable ? 'pointer' : 'default'">
      <div class="metric-value" [style.color]="color">{{ value }}</div>
      <div class="metric-label">{{ label }}</div>
      <div class="metric-trend" *ngIf="trend" [ngClass]="trendClass">
        {{ trend }}
      </div>
    </div>
  `,
  styles: [`
    .metric-card {
      background: rgba(255, 255, 255, 0.95);
      padding: 25px;
      border-radius: 15px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.1);
      backdrop-filter: blur(10px);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      border: 1px solid rgba(255,255,255,0.2);
      position: relative;
      overflow: hidden;
    }

    .metric-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(45deg, #667eea, #764ba2);
    }

    .metric-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.15);
    }

    .metric-value {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .metric-label {
      color: #666;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-trend {
      margin-top: 10px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .trend-up {
      color: #ef4444;
    }

    .trend-down {
      color: #10b981;
    }
  `]
})
export class MetricCardComponent {
  @Input() value: string = '';
  @Input() label: string = '';
  @Input() color: string = '#667eea';
  @Input() trend?: string;
  @Input() trendDirection?: 'up' | 'down';
  @Input() clickable: boolean = false;

  get trendClass(): string {
    return this.trendDirection === 'up' ? 'trend-up' : 'trend-down';
  }
}
