/**
 * Batch Upload System for PropEase
 * Handles large file uploads by splitting them into manageable batches
 */

import { uploadAndAddDocumentsToDataroom } from './request/request-utils';

export interface BatchUploadFile {
  id: string;
  name: string;
  size: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface BatchUploadProgress {
  totalFiles: number;
  processedFiles: number;
  currentBatch: number;
  totalBatches: number;
  currentBatchFiles: number;
  currentBatchTotal: number;
  overallProgress: number; // 0-100
  currentBatchProgress: number; // 0-100
  status: 'preparing' | 'uploading' | 'completed' | 'error' | 'cancelled';
  message: string;
}

export interface BatchUploadResult {
  success: boolean;
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  failedBatches: BatchUploadFile[][];
  errors: string[];
}

export interface FileSizeConfig {
  maxFileSizeMB: number;        // Hard limit per file (reject above this)
  warningFileSizeMB: number;    // Show warning above this size
  batchTriggerSizeMB: number;   // Trigger batch upload above this total size
  batchTriggerCount: number;    // Trigger batch upload above this file count
}

export interface BatchUploadOptions {
  batchSize: number;
  maxConcurrentBatches: number;
  retryAttempts: number;
  retryDelay: number; // milliseconds
  fileSizeConfig: FileSizeConfig;
  onProgress?: (progress: BatchUploadProgress) => void;
  onBatchComplete?: (batchIndex: number, files: BatchUploadFile[]) => void;
  onError?: (error: string, batch?: BatchUploadFile[]) => void;
  onLargeFileWarning?: (largeFiles: BatchUploadFile[]) => void;
}

export class BatchUploader {
  private options: BatchUploadOptions;
  private cancelled = false;
  private currentProgress: BatchUploadProgress;

  constructor(options: Partial<BatchUploadOptions> = {}) {
    const defaultFileSizeConfig: FileSizeConfig = {
      maxFileSizeMB: 50,          // Backend limit
      warningFileSizeMB: 25,      // Show warning above 25MB
      batchTriggerSizeMB: 100,    // Trigger batch upload above 100MB total
      batchTriggerCount: 50       // Trigger batch upload above 50 files
    };

    this.options = {
      batchSize: 25,
      maxConcurrentBatches: 1, // Sequential for now to avoid backend overload
      retryAttempts: 3,
      retryDelay: 2000,
      ...options,
      // Ensure fileSizeConfig is properly merged
      fileSizeConfig: {
        ...defaultFileSizeConfig,
        ...(options.fileSizeConfig || {})
      }
    };

    this.currentProgress = {
      totalFiles: 0,
      processedFiles: 0,
      currentBatch: 0,
      totalBatches: 0,
      currentBatchFiles: 0,
      currentBatchTotal: 0,
      overallProgress: 0,
      currentBatchProgress: 0,
      status: 'preparing',
      message: 'Preparing upload...'
    };
  }

  /**
   * Validate file sizes and return validation results
   */
  validateFileSizes(files: BatchUploadFile[]): {
    validFiles: BatchUploadFile[];
    oversizedFiles: BatchUploadFile[];
    largeFiles: BatchUploadFile[];
    shouldUseBatchUpload: boolean;
    totalSizeMB: number;
  } {
    const config = this.options.fileSizeConfig;
    const maxSizeBytes = config.maxFileSizeMB * 1024 * 1024;
    const warningSizeBytes = config.warningFileSizeMB * 1024 * 1024;
    const batchTriggerSizeBytes = config.batchTriggerSizeMB * 1024 * 1024;

    const validFiles: BatchUploadFile[] = [];
    const oversizedFiles: BatchUploadFile[] = [];
    const largeFiles: BatchUploadFile[] = [];
    let totalSizeBytes = 0;

    files.forEach(file => {
      const fileSizeBytes = file.file.size;
      totalSizeBytes += fileSizeBytes;

      if (fileSizeBytes > maxSizeBytes) {
        oversizedFiles.push({
          ...file,
          status: 'error',
          error: `File size (${Math.round(fileSizeBytes / (1024 * 1024))}MB) exceeds maximum limit of ${config.maxFileSizeMB}MB`
        });
      } else {
        validFiles.push(file);

        if (fileSizeBytes > warningSizeBytes) {
          largeFiles.push(file);
        }
      }
    });

    const shouldUseBatchUpload =
      validFiles.length >= config.batchTriggerCount ||
      totalSizeBytes >= batchTriggerSizeBytes ||
      largeFiles.length > 0; // Use batch upload if any files are large

    return {
      validFiles,
      oversizedFiles,
      largeFiles,
      shouldUseBatchUpload,
      totalSizeMB: Math.round(totalSizeBytes / (1024 * 1024))
    };
  }

  /**
   * Upload files in batches
   */
  async uploadFiles(
    dataroomId: string,
    files: BatchUploadFile[],
    folderMetadata?: Record<string, any>
  ): Promise<BatchUploadResult> {
    this.cancelled = false;
    
    // Initialize progress
    this.currentProgress = {
      ...this.currentProgress,
      totalFiles: files.length,
      processedFiles: 0,
      currentBatch: 0,
      totalBatches: Math.ceil(files.length / this.options.batchSize),
      status: 'preparing',
      message: `Preparing to upload ${files.length} files in ${Math.ceil(files.length / this.options.batchSize)} batches...`
    };

    this.notifyProgress();

    // Create batches
    const batches = this.createBatches(files);
    const failedBatches: BatchUploadFile[][] = [];
    const errors: string[] = [];
    let successfulFiles = 0;

    try {
      this.currentProgress.status = 'uploading';
      this.currentProgress.message = 'Starting batch upload...';
      this.notifyProgress();

      // Process batches sequentially for now
      for (let i = 0; i < batches.length; i++) {
        if (this.cancelled) {
          this.currentProgress.status = 'cancelled';
          this.currentProgress.message = 'Upload cancelled by user';
          this.notifyProgress();
          break;
        }

        const batch = batches[i];
        this.currentProgress.currentBatch = i + 1;
        this.currentProgress.currentBatchTotal = batch.length;
        this.currentProgress.currentBatchFiles = 0;
        this.currentProgress.message = `Uploading batch ${i + 1} of ${batches.length} (${batch.length} files)...`;
        this.notifyProgress();

        try {
          await this.uploadBatch(dataroomId, batch, folderMetadata);
          successfulFiles += batch.length;
          
          // Update progress after successful batch
          this.currentProgress.processedFiles += batch.length;
          this.currentProgress.overallProgress = Math.round(
            (this.currentProgress.processedFiles / this.currentProgress.totalFiles) * 100
          );
          this.currentProgress.currentBatchProgress = 100;
          
          this.options.onBatchComplete?.(i, batch);
          
          // Brief pause between batches to prevent overwhelming the backend
          if (i < batches.length - 1) {
            await this.delay(500);
          }
          
        } catch (error) {
          console.error(`Batch ${i + 1} failed:`, error);
          failedBatches.push(batch);
          errors.push(`Batch ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
          
          // Mark batch files as failed
          batch.forEach(file => {
            file.status = 'error';
            file.error = error instanceof Error ? error.message : String(error);
          });
          
          this.options.onError?.(
            `Batch ${i + 1} failed: ${error instanceof Error ? error.message : String(error)}`,
            batch
          );
        }

        // Release memory for processed batch
        this.releaseBatchMemory(batch);
      }

      // Final status
      if (!this.cancelled) {
        if (failedBatches.length === 0) {
          this.currentProgress.status = 'completed';
          this.currentProgress.message = `Successfully uploaded all ${files.length} files!`;
        } else {
          this.currentProgress.status = 'error';
          this.currentProgress.message = `Upload completed with errors. ${successfulFiles}/${files.length} files uploaded successfully.`;
        }
        this.notifyProgress();
      }

      return {
        success: failedBatches.length === 0 && !this.cancelled,
        totalFiles: files.length,
        successfulFiles,
        failedFiles: files.length - successfulFiles,
        failedBatches,
        errors
      };

    } catch (error) {
      this.currentProgress.status = 'error';
      this.currentProgress.message = `Upload failed: ${error instanceof Error ? error.message : String(error)}`;
      this.notifyProgress();
      
      throw error;
    }
  }

  /**
   * Cancel the current upload
   */
  cancel(): void {
    this.cancelled = true;
  }

  /**
   * Get current progress
   */
  getProgress(): BatchUploadProgress {
    return { ...this.currentProgress };
  }

  /**
   * Create batches from files
   */
  private createBatches(files: BatchUploadFile[]): BatchUploadFile[][] {
    const batches: BatchUploadFile[][] = [];
    
    for (let i = 0; i < files.length; i += this.options.batchSize) {
      batches.push(files.slice(i, i + this.options.batchSize));
    }
    
    return batches;
  }

  /**
   * Upload a single batch with retry logic
   */
  private async uploadBatch(
    dataroomId: string,
    batch: BatchUploadFile[],
    folderMetadata?: Record<string, any>
  ): Promise<void> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      if (this.cancelled) {
        throw new Error('Upload cancelled');
      }

      try {
        // Mark files as uploading
        batch.forEach(file => {
          file.status = 'uploading';
        });

        // Extract File objects for the API call
        const fileObjects = batch.map(batchFile => batchFile.file);
        
        // Update progress
        this.currentProgress.currentBatchProgress = 0;
        this.currentProgress.message = `Uploading batch ${this.currentProgress.currentBatch} (attempt ${attempt}/${this.options.retryAttempts})...`;
        this.notifyProgress();

        // Call the existing API
        await uploadAndAddDocumentsToDataroom(dataroomId, fileObjects, folderMetadata);
        
        // Mark files as successful
        batch.forEach(file => {
          file.status = 'success';
        });

        this.currentProgress.currentBatchProgress = 100;
        this.notifyProgress();
        
        return; // Success, exit retry loop
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Mark files as error for this attempt
        batch.forEach(file => {
          file.status = 'error';
          file.error = lastError?.message;
        });

        if (attempt < this.options.retryAttempts) {
          this.currentProgress.message = `Batch ${this.currentProgress.currentBatch} failed (attempt ${attempt}), retrying in ${this.options.retryDelay/1000}s...`;
          this.notifyProgress();
          
          await this.delay(this.options.retryDelay);
        }
      }
    }
    
    // All retry attempts failed
    throw lastError || new Error('Upload failed after all retry attempts');
  }

  /**
   * Release memory for processed batch
   */
  private releaseBatchMemory(batch: BatchUploadFile[]): void {
    // Clear file references to help garbage collection
    batch.forEach(file => {
      // Don't actually delete the file reference as it might be needed for retry
      // Just mark it as processed
      if (file.status === 'success') {
        // Could potentially clear the file reference here if needed
        // file.file = null as any;
      }
    });
  }

  /**
   * Notify progress callback
   */
  private notifyProgress(): void {
    this.options.onProgress?.(this.currentProgress);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Convert regular files to BatchUploadFile format
 */
export function convertToBatchUploadFiles(files: File[]): BatchUploadFile[] {
  return files.map((file, index) => ({
    id: `batch-${Date.now()}-${index}`,
    name: file.name,
    size: `${Math.round(file.size / 1024)}KB`,
    file,
    status: 'pending' as const
  }));
}
