import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="alert-item" [ngClass]="'alert-' + type">
      <div class="alert-title" [style.color]="titleColor">{{ icon }} {{ title }}</div>
      <div class="alert-message">{{ message }}</div>
      <div class="alert-details" *ngIf="details">{{ details }}</div>
    </div>
  `,
  styles: [`
    .alert-item {
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 10px;
      border-left: 4px solid;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .alert-item:hover {
      transform: translateX(5px);
    }

    .alert-critical {
      background: rgba(220, 38, 38, 0.1);
      border-color: #dc2626;
    }

    .alert-high {
      background: rgba(239, 68, 68, 0.1);
      border-color: #ef4444;
    }

    .alert-medium {
      background: rgba(245, 158, 11, 0.1);
      border-color: #f59e0b;
    }

    .alert-low {
      background: rgba(16, 185, 129, 0.1);
      border-color: #10b981;
    }

    .alert-info {
      background: rgba(59, 130, 246, 0.1);
      border-color: #3b82f6;
    }

    .alert-title {
      font-weight: 600;
      margin-bottom: 5px;
    }

    .alert-message {
      font-size: 0.9rem;
      margin-top: 5px;
    }

    .alert-details {
      font-size: 0.8rem;
      color: #666;
      margin-top: 5px;
    }
  `]
})
export class AlertItemComponent {
  @Input() type: 'critical' | 'high' | 'medium' | 'low' | 'info' = 'info';
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() details?: string;

  get icon(): string {
    const icons = {
      critical: '🔴',
      high: '⚠️',
      medium: '⚡',
      info: '📊',
      low: '✅'
    };
    return icons[this.type];
  }

  get titleColor(): string {
    const colors = {
      critical: '#dc2626',
      high: '#ef4444',
      medium: '#f59e0b',
      info: '#3b82f6',
      low: '#10b981'
    };
    return colors[this.type];
  }
}
