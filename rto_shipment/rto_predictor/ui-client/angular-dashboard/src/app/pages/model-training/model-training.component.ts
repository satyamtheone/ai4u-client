import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface TrainingResult {
  best_model?: string;
  model?: string;
  best_score?: number;
  accuracy?: number;
  training_samples?: number;
  model_version?: string;
  timestamp?: string;
  message?: string;
}

@Component({
  selector: 'app-model-training',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './model-training.component.html',
  styleUrl: './model-training.component.css'
})
export class ModelTrainingComponent {
  // File upload
  selectedFile: File | null = null;
  fileInfo: { name: string; size: string } | null = null;
  dragOver = false;

  // Training state
  training = false;
  progress = 0;
  statusMessage = '';
  statusType: 'info' | 'success' | 'error' = 'info';

  // Results
  trainingResult: TrainingResult | null = null;
  trainingStartTime: number | null = null;
  trainingTime: string | null = null;

  constructor(private apiService: ApiService) {}

  // Drag and drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  // File selection handler
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  // Validate and process file
  handleFile(file: File): void {
    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    this.selectedFile = file;
    this.fileInfo = {
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
    };
  }

  // Start training
  startTraining(): void {
    if (!this.selectedFile) {
      alert('Please select a file first');
      return;
    }

    this.training = true;
    this.progress = 0;
    this.trainingResult = null;
    this.trainingStartTime = Date.now();
    this.updateStatus('Uploading training data...', 'info');

    // Simulate progress
    const progressInterval = setInterval(() => {
      this.progress += Math.random() * 15;
      if (this.progress > 90) this.progress = 90;
    }, 500);

    // Call training API
    this.apiService.trainModel(this.selectedFile).subscribe({
      next: (result) => {
        clearInterval(progressInterval);
        this.progress = 100;

        // Calculate training time
        if (this.trainingStartTime) {
          const duration = (Date.now() - this.trainingStartTime) / 1000;
          this.trainingTime = duration.toFixed(1) + 's';
        }

        this.trainingResult = result;
        this.updateStatus('Training completed successfully!', 'success');
        this.training = false;
      },
      error: (error) => {
        clearInterval(progressInterval);
        this.updateStatus('Training failed: ' + error.message, 'error');
        this.training = false;
      }
    });
  }

  // Update status message
  updateStatus(message: string, type: 'info' | 'success' | 'error'): void {
    this.statusMessage = message;
    this.statusType = type;
  }

  // Reset form
  resetForm(): void {
    this.selectedFile = null;
    this.fileInfo = null;
    this.training = false;
    this.progress = 0;
    this.statusMessage = '';
    this.trainingResult = null;
    this.trainingTime = null;
  }

  // Get model name
  getModelName(): string {
    if (!this.trainingResult) return 'N/A';
    return this.trainingResult.best_model || this.trainingResult.model || 'N/A';
  }

  // Get test score
  getTestScore(): string {
    if (!this.trainingResult) return 'N/A';
    const score = this.trainingResult.best_score || this.trainingResult.accuracy;
    return score ? (score * 100).toFixed(2) + '%' : 'N/A';
  }

  // Get training samples
  getTrainingSamples(): string {
    if (!this.trainingResult) return 'N/A';
    return this.trainingResult.training_samples?.toString() || 'N/A';
  }

  // Get model version
  getModelVersion(): string {
    if (!this.trainingResult) return new Date().toISOString().split('T')[0];
    return this.trainingResult.model_version || new Date().toISOString().split('T')[0];
  }

  // Get timestamp
  getTimestamp(): string {
    if (!this.trainingResult) return new Date().toLocaleString();
    return this.trainingResult.timestamp || new Date().toLocaleString();
  }
}
