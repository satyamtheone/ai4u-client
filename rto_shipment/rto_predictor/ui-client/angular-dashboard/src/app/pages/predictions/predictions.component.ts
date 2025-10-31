import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { UtilsService } from '../../services/utils.service';

interface PredictionResult {
  order_number: string;
  rto_prediction: boolean;
  rto_probability: number;
  risk_level: string;
  recommendations?: string[];
  risk_factors?: string[];
}

@Component({
  selector: 'app-predictions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './predictions.component.html',
  styleUrl: './predictions.component.css'
})
export class PredictionsComponent implements OnInit {
  activeTab: 'single' | 'batch' | 'csv' = 'single';

  // Single prediction
  singleOrderData: string = '';
  singleResult: any = null;

  // Batch prediction
  batchOrdersData: string = '';
  batchResults: any = null;

  // CSV prediction
  selectedFile: File | null = null;
  csvResults: any = null;

  // UI state
  loading = false;
  error: string | null = null;

  // Sample data
  sampleSingleOrder = {
    "ORDER_NUMBER": "ORD123456",
    "CUSTOMER_NAME": "John Doe",
    "CUSTOMER_PHONE": "9876543210",
    "CUSTOMER_ADDRESS": "123 Main St, Sector 15",
    "CUSTOMER_CITY": "GURGAON",
    "CUSTOMER_STATE": "HARYANA",
    "PINCODE": "122001",
    "PAYMENT_MODE": "COD",
    "COURIER_NAME": "DELHIVERY",
    "WEIGHT": 1.5,
    "QTY": 2,
    "INVOICE_VALUE": 2499.50
  };

  sampleBatchOrders = [
    {
      "ORDER_NUMBER": "ORD001",
      "CUSTOMER_NAME": "Alice Smith",
      "CUSTOMER_PHONE": "9876543211",
      "CUSTOMER_ADDRESS": "456 Park Ave",
      "CUSTOMER_CITY": "MUMBAI",
      "CUSTOMER_STATE": "MAHARASHTRA",
      "PINCODE": "400001",
      "PAYMENT_MODE": "PREPAID",
      "COURIER_NAME": "DTDC",
      "WEIGHT": 0.5,
      "QTY": 1,
      "INVOICE_VALUE": 999.00
    },
    {
      "ORDER_NUMBER": "ORD002",
      "CUSTOMER_NAME": "Bob Johnson",
      "CUSTOMER_PHONE": "9876543212",
      "CUSTOMER_ADDRESS": "789 Lake Road",
      "CUSTOMER_CITY": "BANGALORE",
      "CUSTOMER_STATE": "KARNATAKA",
      "PINCODE": "560001",
      "PAYMENT_MODE": "COD",
      "COURIER_NAME": "DELHIVERY",
      "WEIGHT": 2.0,
      "QTY": 3,
      "INVOICE_VALUE": 3499.00
    }
  ];

  constructor(
    private apiService: ApiService,
    public utils: UtilsService
  ) {}

  ngOnInit(): void {
    // Initialize with sample data
    this.singleOrderData = JSON.stringify(this.sampleSingleOrder, null, 2);
    this.batchOrdersData = JSON.stringify(this.sampleBatchOrders, null, 2);
  }

  switchTab(tab: 'single' | 'batch' | 'csv'): void {
    this.activeTab = tab;
    this.error = null;
  }

  // Single Prediction
  predictSingleOrder(): void {
    this.loading = true;
    this.error = null;
    this.singleResult = null;

    try {
      const orderData = JSON.parse(this.singleOrderData);

      this.apiService.predictOrder(orderData).subscribe({
        next: (result) => {
          this.singleResult = result;
          this.loading = false;
        },
        error: (error) => {
          this.error = error.message || 'Failed to predict. Please check your input.';
          this.loading = false;
        }
      });
    } catch (e) {
      this.error = 'Invalid JSON format. Please check your input.';
      this.loading = false;
    }
  }

  // Batch Prediction
  predictBatchOrders(): void {
    this.loading = true;
    this.error = null;
    this.batchResults = null;

    try {
      const orders = JSON.parse(this.batchOrdersData);

      if (!Array.isArray(orders)) {
        throw new Error('Batch data must be an array of orders');
      }

      this.apiService.predictBatch(orders).subscribe({
        next: (result) => {
          this.batchResults = result;
          this.loading = false;
        },
        error: (error) => {
          this.error = error.message || 'Failed to predict batch. Please check your input.';
          this.loading = false;
        }
      });
    } catch (e: any) {
      this.error = e.message || 'Invalid JSON format. Please check your input.';
      this.loading = false;
    }
  }

  // CSV Upload
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        this.error = 'Please select a CSV file';
        return;
      }
      this.selectedFile = file;
      this.error = null;
    }
  }

  predictFromCSV(): void {
    if (!this.selectedFile) {
      this.error = 'Please select a CSV file first';
      return;
    }

    this.loading = true;
    this.error = null;
    this.csvResults = null;

    this.apiService.predictFromCSV(this.selectedFile).subscribe({
      next: (result) => {
        this.csvResults = result;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message || 'Failed to process CSV file.';
        this.loading = false;
      }
    });
  }

  // Helper methods
  loadSampleSingle(): void {
    this.singleOrderData = JSON.stringify(this.sampleSingleOrder, null, 2);
  }

  loadSampleBatch(): void {
    this.batchOrdersData = JSON.stringify(this.sampleBatchOrders, null, 2);
  }

  clearSingleResult(): void {
    this.singleResult = null;
    this.error = null;
  }

  clearBatchResults(): void {
    this.batchResults = null;
    this.error = null;
  }

  clearCSVResults(): void {
    this.csvResults = null;
    this.selectedFile = null;
    this.error = null;
  }

  getRiskLevelClass(riskLevel: string): string {
    const level = riskLevel?.toLowerCase() || '';
    if (level.includes('critical') || level.includes('very high')) return 'risk-critical';
    if (level.includes('high')) return 'risk-high';
    if (level.includes('medium')) return 'risk-medium';
    return 'risk-low';
  }

  getRiskLevelColor(riskLevel: string): string {
    const level = riskLevel?.toLowerCase() || '';
    if (level.includes('critical') || level.includes('very high')) return '#dc2626';
    if (level.includes('high')) return '#ef4444';
    if (level.includes('medium')) return '#f59e0b';
    return '#10b981';
  }

  downloadResults(data: any, filename: string): void {
    this.utils.downloadJSON(data, filename);
  }

  exportCSVResults(): void {
    if (this.csvResults?.results?.predictions) {
      this.utils.exportToCSV(this.csvResults.results.predictions, 'csv_predictions');
    }
  }

  formatJSON(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }
}
