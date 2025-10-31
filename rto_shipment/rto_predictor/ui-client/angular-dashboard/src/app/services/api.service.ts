import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  SystemHealth,
  SystemMetrics,
  SystemStatus,
  ModelInfo,
  CourierPerformanceResponse,
  PincodeAnalysisResponse,
  PerformanceReport,
  RootInfo
} from '../models/api.models';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private cache = new Map<string, CacheEntry<any>>();

  // Signals for reactive state management
  public loading = signal(false);
  public error = signal<string | null>(null);
  public connectionStatus = signal<'connected' | 'disconnected' | 'checking'>('checking');

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  constructor(private http: HttpClient) {
    this.checkConnection();
  }

  /**
   * Generic API call method with caching
   */
  private apiCall<T>(
    endpoint: string,
    useCache: boolean = true
  ): Observable<T> {
    const fullUrl = `${this.apiUrl}${endpoint}`;
    const cacheKey = endpoint;

    // Check cache first
    if (useCache && environment.cacheEnabled) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return of(cached);
      }
    }

    this.loading.set(true);

    return this.http.get<T>(fullUrl, this.httpOptions).pipe(
      tap(data => {
        if (useCache && environment.cacheEnabled) {
          this.setCache(cacheKey, data);
        }
        this.loading.set(false);
        this.error.set(null);
        this.connectionStatus.set('connected');
      }),
      catchError(this.handleError.bind(this)),
      shareReplay(1)
    );
  }

  /**
   * Cache management
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > environment.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Error handling
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    this.loading.set(false);
    this.connectionStatus.set('disconnected');

    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error ${error.status}: ${error.message}`;

      if (error.status === 0) {
        errorMessage = 'Unable to connect to API. Please check if the backend is running.';
      }
    }

    console.error('API Error:', errorMessage, error);
    this.error.set(errorMessage);

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Connection check
   */
  public checkConnection(): void {
    this.connectionStatus.set('checking');
    this.getHealth().subscribe({
      next: () => this.connectionStatus.set('connected'),
      error: () => this.connectionStatus.set('disconnected')
    });
  }

  // ============================================================================
  // API ENDPOINTS
  // ============================================================================

  /**
   * Get root API information
   */
  getRootInfo(): Observable<RootInfo> {
    return this.apiCall<RootInfo>('/', true);
  }

  /**
   * Health check endpoint
   */
  getHealth(): Observable<SystemHealth> {
    return this.apiCall<SystemHealth>('/health', false); // Don't cache health
  }

  /**
   * Get system metrics
   */
  getMetrics(): Observable<SystemMetrics> {
    return this.apiCall<SystemMetrics>('/api/v1/metrics', false);
  }

  /**
   * Get system status
   */
  getStatus(): Observable<SystemStatus> {
    return this.apiCall<SystemStatus>('/api/v1/status', false);
  }

  /**
   * Get model information
   */
  getModelInfo(): Observable<ModelInfo> {
    return this.apiCall<ModelInfo>('/api/v1/model/info', true);
  }

  /**
   * Get courier performance analytics
   */
  getCourierPerformance(): Observable<CourierPerformanceResponse> {
    return this.apiCall<CourierPerformanceResponse>(
      '/api/v1/analytics/courier-performance',
      true
    );
  }

  /**
   * Get pincode analysis
   */
  getPincodeAnalysis(pincode?: string): Observable<PincodeAnalysisResponse> {
    const endpoint = pincode
      ? `/api/v1/analytics/pincode/${pincode}`
      : '/api/v1/analytics/pincode';

    return this.apiCall<PincodeAnalysisResponse>(endpoint, true);
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport(): Observable<PerformanceReport> {
    return this.apiCall<PerformanceReport>('/api/v1/reports/performance', true);
  }

  /**
   * Get API information
   */
  getApiInfo(): Observable<any> {
    return this.apiCall<any>('/api/v1/info', true);
  }

  /**
   * Predict single order
   */
  predictOrder(orderData: any): Observable<any> {
    this.loading.set(true);

    return this.http.post(`${this.apiUrl}/api/v1/predict`, orderData, this.httpOptions).pipe(
      tap(() => {
        this.loading.set(false);
        this.error.set(null);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Predict batch orders
   */
  predictBatch(orders: any[]): Observable<any> {
    this.loading.set(true);

    return this.http.post(
      `${this.apiUrl}/api/v1/predict/batch`,
      { orders },
      this.httpOptions
    ).pipe(
      tap(() => {
        this.loading.set(false);
        this.error.set(null);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Upload CSV for prediction
   */
  predictFromCSV(file: File): Observable<any> {
    this.loading.set(true);

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(
      `${this.apiUrl}/api/v1/predict/csv`,
      formData
    ).pipe(
      tap(() => {
        this.loading.set(false);
        this.error.set(null);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Train model
   */
  trainModel(file: File, description?: string): Observable<any> {
    this.loading.set(true);

    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    return this.http.post(
      `${this.apiUrl}/api/v1/train`,
      formData
    ).pipe(
      tap(() => {
        this.loading.set(false);
        this.error.set(null);
        this.clearCache(); // Clear cache after training
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Create backup
   */
  createBackup(): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/v1/backup`, {}).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * List backups
   */
  listBackups(): Observable<any> {
    return this.apiCall<any>('/api/v1/backups', false);
  }
}
