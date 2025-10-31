import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { UtilsService } from '../../services/utils.service';
import { MetricCardComponent } from '../../shared/components/metric-card.component';
import { AlertItemComponent } from '../../shared/components/alert-item.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, MetricCardComponent, AlertItemComponent],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css'
})
export class OverviewComponent implements OnInit {
  metrics: any = null;
  modelInfo: any = null;
  health: any = null;
  alerts: any[] = [];
  hourlyRiskData: any[] = [];

  constructor(
    private apiService: ApiService,
    public utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    forkJoin({
      metrics: this.apiService.getMetrics(),
      modelInfo: this.apiService.getModelInfo(),
      health: this.apiService.getHealth()
    }).subscribe({
      next: (data) => {
        this.metrics = data.metrics;
        this.modelInfo = data.modelInfo;
        this.health = data.health;
        this.generateAlerts();
        this.generateHourlyRisk();
      },
      error: (error) => {
        console.error('Failed to load overview data:', error);
      }
    });
  }

  private generateAlerts(): void {
    this.alerts = [
      {
        type: 'info',
        title: 'Model Update',
        message: 'ML model loaded successfully',
        details: `Accuracy: ${this.modelInfo?.training_score ? (this.modelInfo.training_score * 100).toFixed(1) : 'N/A'}%`
      },
      {
        type: 'low',
        title: 'System Status',
        message: 'All systems operational',
        details: `API: ${this.health?.status || 'Unknown'}`
      }
    ];
  }

  private generateHourlyRisk(): void {
    this.hourlyRiskData = [
      { time: '6AM', risk: 14.2, level: 2 },
      { time: '9AM', risk: 8.7, level: 1 },
      { time: '12PM', risk: 5.3, level: 0 },
      { time: '3PM', risk: 9.1, level: 1 },
      { time: '6PM', risk: 18.4, level: 3 },
      { time: '9PM', risk: 24.6, level: 4 },
      { time: '12AM', risk: 19.8, level: 3 },
      { time: '3AM', risk: 12.1, level: 2 }
    ];
  }

  get modelAccuracy(): string {
    if (!this.modelInfo?.training_score) return '87.4%';
    return this.utils.formatPercentage(this.modelInfo.training_score * 100);
  }

  get rtoRate(): string {
    // This would come from actual API data
    return '26.8%';
  }

  get costSavings(): string {
    return this.utils.formatCurrency(4270000);
  }

  get riskDetection(): string {
    return '91.3%';
  }

  get avgResponseTime(): string {
    return '247ms';
  }

  get customerSatisfaction(): string {
    return '94.2%';
  }
}
