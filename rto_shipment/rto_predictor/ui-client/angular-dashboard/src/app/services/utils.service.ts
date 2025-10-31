import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  /**
   * Format currency in Indian Rupees
   */
  formatCurrency(value: number): string {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value.toFixed(0)}`;
  }

  /**
   * Format percentage
   */
  formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  /**
   * Format number with commas
   */
  formatNumber(value: number): string {
    return value.toLocaleString('en-IN');
  }

  /**
   * Calculate risk level based on RTO probability
   */
  getRiskLevel(rtoProbability: number): { label: string; color: string; } {
    if (rtoProbability >= 0.8) {
      return { label: 'Critical', color: '#dc2626' };
    } else if (rtoProbability >= 0.6) {
      return { label: 'High', color: '#ef4444' };
    } else if (rtoProbability >= 0.4) {
      return { label: 'Medium', color: '#f59e0b' };
    } else if (rtoProbability >= 0.2) {
      return { label: 'Low', color: '#84cc16' };
    } else {
      return { label: 'Very Low', color: '#10b981' };
    }
  }

  /**
   * Assign grade based on success rate
   */
  getGrade(successRate: number): { grade: string; color: string; } {
    if (successRate >= 90) {
      return { grade: 'A+', color: '#10b981' };
    } else if (successRate >= 80) {
      return { grade: 'A', color: '#10b981' };
    } else if (successRate >= 70) {
      return { grade: 'B+', color: '#f59e0b' };
    } else if (successRate >= 60) {
      return { grade: 'B', color: '#f59e0b' };
    } else if (successRate >= 50) {
      return { grade: 'C+', color: '#ef4444' };
    } else {
      return { grade: 'C', color: '#ef4444' };
    }
  }

  /**
   * Get time ago string
   */
  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  /**
   * Format duration in seconds to human readable
   */
  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds.toFixed(0)}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
  }

  /**
   * Calculate trend indicator
   */
  getTrend(current: number, previous: number): { value: number; direction: 'up' | 'down' | 'neutral'; isPositive: boolean } {
    const diff = current - previous;
    const percentChange = previous !== 0 ? (diff / previous) * 100 : 0;

    return {
      value: Math.abs(percentChange),
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
      isPositive: diff < 0 // For RTO, decrease is positive
    };
  }

  /**
   * Debounce function
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        func(...args);
      }, wait);
    };
  }

  /**
   * Export data to CSV
   */
  exportToCSV(data: any[], filename: string): void {
    if (!data || data.length === 0) {
      console.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Download JSON
   */
  downloadJSON(data: any, filename: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Show notification (for now, using console, but can be replaced with toast)
   */
  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // This can be enhanced with a toast notification service
  }

  /**
   * Deep clone object
   */
  deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Check if object is empty
   */
  isEmpty(obj: any): boolean {
    if (obj === null || obj === undefined) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
  }

  /**
   * Generate random ID
   */
  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Safe divide (avoid division by zero)
   */
  safeDivide(numerator: number, denominator: number, defaultValue: number = 0): number {
    return denominator !== 0 ? numerator / denominator : defaultValue;
  }

  /**
   * Clamp value between min and max
   */
  clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Group array by key
   */
  groupBy<T>(array: T[], key: keyof T): { [key: string]: T[] } {
    return array.reduce((result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {} as { [key: string]: T[] });
  }
}
