/**
 * API Models and Interfaces for RTO Dashboard
 */

export interface SystemHealth {
  status: string;
  model_loaded: boolean;
  model_status: string;
  timestamp: string;
  version: string;
  details?: any;
}

export interface SystemMetrics {
  memory_usage_mb: number;
  cpu_percent: number;
  disk_usage_percent?: number;
  predictions_count: number;
  error_count: number;
  circuit_breaker_state: string;
  api_metrics?: {
    uptime_seconds: number;
    total_predictions: number;
    total_errors: number;
    error_rate: number;
  };
  timestamp: string;
}

export interface SystemStatus {
  pipeline_initialized: boolean;
  model_loaded: boolean;
  status: string;
  health_status?: any;
  timestamp: string;
}

export interface ModelInfo {
  model_loaded: boolean;
  model_type: string;
  model_version: string;
  feature_count: number;
  last_training?: string;
  training_score?: number;
  feature_importance?: { [key: string]: number };
  timestamp: string;
}

export interface CourierPerformance {
  courier_name: string;
  success_rate: number;
  total_deliveries: number;
  rto_count: number;
  avg_delivery_time?: number;
  grade?: string;
  trend?: string;
}

export interface CourierPerformanceResponse {
  courier_performance: {
    [courierName: string]: {
      total_deliveries: number;
      successful_deliveries: number;
      rto_count: number;
      success_rate: number;
      rto_rate: number;
    };
  };
  timestamp: string;
}

export interface PincodeAnalysis {
  pincode: string;
  total_orders: number;
  rto_count: number;
  success_count: number;
  rto_rate: number;
  success_rate: number;
  city?: string;
  state?: string;
  risk_level?: string;
}

export interface PincodeAnalysisResponse {
  pincode_analysis: {
    [pincode: string]: {
      total_orders: number;
      rto_count: number;
      success_count: number;
      rto_rate: number;
      success_rate: number;
    };
  };
  pincode?: string;
  timestamp: string;
}

export interface PerformanceReport {
  model_performance?: any;
  system_metrics?: any;
  courier_performance?: any;
  geographic_analysis?: any;
  timestamp: string;
}

export interface RootInfo {
  service: string;
  version: string;
  status: string;
  model_loaded: boolean;
  uptime_seconds: number;
  predictions_made: number;
  errors: number;
  timestamp: string;
  endpoints?: any;
}

export interface DashboardMetrics {
  modelAccuracy: number;
  rtoRate: number;
  costSavings: number;
  riskDetection: number;
  avgResponseTime: number;
  customerSatisfaction: number;
}

export interface RiskLevel {
  label: string;
  value: number;
  color: string;
}

export interface AlertItem {
  type: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  message: string;
  details: string;
  timestamp?: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string | string[];
  tension?: number;
  fill?: boolean;
  type?: string;
  yAxisID?: string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}
