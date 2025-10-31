import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-couriers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="couriers-page">
      <input type="text" class="search-bar"
             placeholder="🔍 Search couriers, cities, or performance metrics..."
             [(ngModel)]="searchTerm"
             (ngModelChange)="filterCouriers()">

      <div class="performance-grid">
        <!-- Top Performers -->
        <div class="performance-card">
          <h3 style="margin-bottom: 20px;">🏆 Top Performing Partners</h3>
          <div *ngFor="let courier of topPerformers" class="courier-item">
            <div class="courier-name">{{ courier.name }}</div>
            <div class="courier-stats">
              <span style="font-weight: 600;">{{ courier.successRate }}%</span>
              <div class="grade-badge" [ngClass]="'grade-' + courier.grade.toLowerCase()">{{ courier.grade }}</div>
            </div>
          </div>
        </div>

        <!-- Needs Attention -->
        <div class="performance-card">
          <h3 style="margin-bottom: 20px;">⚠️ Needs Attention</h3>
          <div *ngFor="let courier of needsAttention" class="courier-item">
            <div class="courier-name">{{ courier.name }}</div>
            <div class="courier-stats">
              <span style="font-weight: 600;">{{ courier.successRate }}%</span>
              <div class="grade-badge" [ngClass]="'grade-' + courier.grade.toLowerCase()">{{ courier.grade }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-container">
        <h3 style="margin-bottom: 20px;">Courier Performance Trends</h3>
        <div class="chart-placeholder">
          <p>📊 Courier performance chart will be rendered here</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .couriers-page {
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
export class CouriersComponent implements OnInit {
  searchTerm: string = '';
  allCouriers: any[] = [];
  topPerformers: any[] = [];
  needsAttention: any[] = [];

  constructor(
    private apiService: ApiService,
    public utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.loadCourierData();
  }

  private loadCourierData(): void {
    this.apiService.getCourierPerformance().subscribe({
      next: (data) => {
        this.processСourierData(data);
      },
      error: (error) => {
        console.error('Failed to load courier data:', error);
        this.loadSampleData();
      }
    });
  }

  private processСourierData(data: any): void {
    const couriers = Object.entries(data.courier_performance || {}).map(([name, stats]: [string, any]) => ({
      name,
      successRate: stats.success_rate ? (stats.success_rate * 100).toFixed(1) : '0.0',
      grade: this.utils.getGrade(stats.success_rate * 100).grade,
      totalDeliveries: stats.total_deliveries || 0
    }));

    this.allCouriers = couriers;
    this.topPerformers = couriers.filter((c: any) => parseFloat(c.successRate) >= 90);
    this.needsAttention = couriers.filter((c: any) => parseFloat(c.successRate) < 90);
  }

  private loadSampleData(): void {
    this.topPerformers = [
      { name: 'DTDC Standard', successRate: '96.8', grade: 'A' },
      { name: 'PiknDel Express', successRate: '94.7', grade: 'A' },
      { name: 'Shiplog Premium', successRate: '93.2', grade: 'A' }
    ];
    this.needsAttention = [
      { name: 'DELHIVERY', successRate: '84.1', grade: 'B' },
      { name: 'Shadowfax', successRate: '76.8', grade: 'B' },
      { name: 'Amazon Logistics', successRate: '68.2', grade: 'C' }
    ];
  }

  filterCouriers(): void {
    // Implement search filtering
    console.log('Searching for:', this.searchTerm);
  }
}
