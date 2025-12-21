/**
 * SharePoint Batch Upload System for PropEase
 * Handles SharePoint file imports by splitting them into manageable batches
 */

import { importSharePointFilesBatch } from './request/request-utils';
import { reportUploadError } from './sentry';
import { SharePointFile } from './sharepoint/api';

export interface SharePointBatchUploadProgress {
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

export interface SharePointBatchUploadResult {
  success: boolean;
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  duplicateFiles: number;
  failedBatches: SharePointFile[][];
  duplicateBatches: SharePointFile[][];
  errors: string[];
  duplicates: string[];
  // Detailed information from backend
  failedImports?: Array<{
    fileId: string;
    error: string;
    errorType?: string;
  }>;
  duplicateImports?: Array<{
    fileId: string;
    filename: string;
    error: string;
  }>;
}

export interface SharePointBatchUploadOptions {
  batchSize: number;
  maxConcurrentBatches: number;
  retryAttempts: number;
  retryDelay: number; // milliseconds
  onProgress?: (progress: SharePointBatchUploadProgress) => void;
  onBatchComplete?: (batchIndex: number, files: SharePointFile[]) => void;
  onError?: (error: string, batch?: SharePointFile[]) => void;
}

export class SharePointBatchUploader {
  private options: SharePointBatchUploadOptions;
  private cancelled = false;
  private currentProgress: SharePointBatchUploadProgress;

  constructor(options: Partial<SharePointBatchUploadOptions> = {}) {
    this.options = {
      batchSize: 25,
      maxConcurrentBatches: 1, // Sequential for now to avoid backend overload
      retryAttempts: 3,
      retryDelay: 2000,
      ...options
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
      message: 'Preparing SharePoint import...'
    };
  }

  /**
   * Import SharePoint files in batches
   */
  async importFiles(
    dataroomId: string,
    files: SharePointFile[]
  ): Promise<SharePointBatchUploadResult> {
    this.cancelled = false;
    
    // Initialize progress
    this.currentProgress = {
      ...this.currentProgress,
      totalFiles: files.length,
      processedFiles: 0,
      currentBatch: 0,
      totalBatches: Math.ceil(files.length / this.options.batchSize),
      status: 'preparing',
      message: `Preparing to import ${files.length} files in ${Math.ceil(files.length / this.options.batchSize)} batches...`
    };

    this.notifyProgress();

    // Group files by site and library for efficient processing
    const fileGroups = this.groupFilesBySiteAndLibrary(files);
    const failedBatches: SharePointFile[][] = [];
    const duplicateBatches: SharePointFile[][] = [];
    const errors: string[] = [];
    const duplicates: string[] = [];
    let successfulFiles = 0;
    let duplicateFiles = 0;
    let failedFiles = 0;

    // Collect detailed information
    const allFailedImports: Array<{fileId: string; error: string; errorType?: string}> = [];
    const allDuplicateImports: Array<{fileId: string; filename: string; error: string}> = [];

    this.currentProgress.status = 'uploading';
    this.currentProgress.message = 'Importing files from SharePoint...';
    this.notifyProgress();

    try {
      // Process each group
      for (const [groupKey, groupFiles] of Object.entries(fileGroups)) {
        if (this.cancelled) {
          this.currentProgress.status = 'cancelled';
          this.currentProgress.message = 'Import cancelled by user';
          this.notifyProgress();
          break;
        }

        // Create batches for this group
        const batches = this.createBatches(groupFiles.files);
        
        // Process batches sequentially
        for (let i = 0; i < batches.length; i++) {
          if (this.cancelled) break;

          const batch = batches[i];
          this.currentProgress.currentBatch = i + 1;
          this.currentProgress.currentBatchTotal = batch.length;
          this.currentProgress.currentBatchFiles = 0;
          this.currentProgress.currentBatchProgress = 0;
          this.currentProgress.message = `Processing batch ${i + 1} of ${batches.length} for ${groupKey}...`;
          this.notifyProgress();

          try {
            const batchResult = await this.importBatch(dataroomId, groupFiles.siteId, groupFiles.libraryId, batch);

            // Handle batch results with duplicates and failures
            successfulFiles += batchResult.successCount;
            duplicateFiles += batchResult.duplicateCount || 0;
            failedFiles += batchResult.failureCount || 0;

            // Collect detailed information
            if (batchResult.failedImports) {
              allFailedImports.push(...batchResult.failedImports);
            }
            if (batchResult.duplicateImports) {
              allDuplicateImports.push(...batchResult.duplicateImports);
            }

            // Track duplicates if any
            if (batchResult.duplicateCount && batchResult.duplicateCount > 0) {
              duplicateBatches.push(batch);
              duplicates.push(`Batch ${i + 1}: ${batchResult.duplicateCount} duplicates found`);
            }

            // Track failed files if any
            if (batchResult.failureCount && batchResult.failureCount > 0) {
              failedBatches.push(batch);
              errors.push(`Batch ${i + 1}: ${batchResult.failureCount} files failed`);
            }

            // Update progress after batch completion
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
            failedFiles += batch.length; // Count all files in failed batch as failed
            errors.push(`Batch ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);

            this.options.onError?.(
              `Batch ${i + 1} failed: ${error instanceof Error ? error.message : String(error)}`,
              batch
            );

            // Update progress for failed batch
            this.currentProgress.processedFiles += batch.length;
            this.currentProgress.overallProgress = Math.round(
              (this.currentProgress.processedFiles / this.currentProgress.totalFiles) * 100
            );
          }
        }
      }

      // Final status
      if (this.cancelled) {
        this.currentProgress.status = 'cancelled';
        this.currentProgress.message = 'Import cancelled';
      } else if (failedFiles > 0) {
        this.currentProgress.status = 'error';
        this.currentProgress.message = `Import completed: ${successfulFiles} successful, ${failedFiles} failed, ${duplicateFiles} duplicates`;
      } else if (duplicateFiles > 0) {
        this.currentProgress.status = 'completed';
        this.currentProgress.message = `Import completed: ${successfulFiles} successful, ${duplicateFiles} duplicates`;
      } else {
        this.currentProgress.status = 'completed';
        this.currentProgress.message = `Import completed: ${successfulFiles} files imported successfully`;
      }
      
      this.notifyProgress();

      return {
        success: failedFiles === 0,
        totalFiles: files.length,
        successfulFiles,
        failedFiles,
        duplicateFiles,
        failedBatches,
        duplicateBatches,
        errors,
        duplicates,
        failedImports: allFailedImports,
        duplicateImports: allDuplicateImports
      };

    } catch (error) {
      this.currentProgress.status = 'error';
      this.currentProgress.message = `Import failed: ${error instanceof Error ? error.message : String(error)}`;
      this.notifyProgress();
      
      throw error;
    }
  }

  /**
   * Cancel the current import
   */
  cancel(): void {
    this.cancelled = true;
  }

  /**
   * Retry failed batches (excluding duplicates)
   */
  async retryFailedBatches(
    dataroomId: string,
    failedBatches: SharePointFile[][]
  ): Promise<SharePointBatchUploadResult> {
    if (!failedBatches.length) {
      return {
        success: true,
        totalFiles: 0,
        successfulFiles: 0,
        failedFiles: 0,
        duplicateFiles: 0,
        failedBatches: [],
        duplicateBatches: [],
        errors: [],
        duplicates: []
      };
    }

    // Flatten failed batches into a single array
    const failedFiles = failedBatches.flat();

    // Use sequential processing for retries to avoid session conflicts
    const originalMaxConcurrent = this.options.maxConcurrentBatches;
    this.options.maxConcurrentBatches = 1;

    try {
      const result = await this.importFiles(dataroomId, failedFiles);
      return result;
    } finally {
      // Restore original concurrency setting
      this.options.maxConcurrentBatches = originalMaxConcurrent;
    }
  }

  /**
   * Get current progress
   */
  getProgress(): SharePointBatchUploadProgress {
    return { ...this.currentProgress };
  }

  /**
   * Group files by site and library for efficient processing
   */
  private groupFilesBySiteAndLibrary(files: SharePointFile[]): Record<string, {
    siteId: string;
    libraryId: string;
    files: SharePointFile[];
  }> {
    return files.reduce((groups, file) => {
      const key = `${file.siteId}-${file.libraryId}`;
      if (!groups[key]) {
        groups[key] = {
          siteId: file.siteId || '',
          libraryId: file.libraryId || '',
          files: []
        };
      }
      groups[key].files.push(file);
      return groups;
    }, {} as Record<string, { siteId: string; libraryId: string; files: SharePointFile[] }>);
  }

  /**
   * Create batches from files
   */
  private createBatches(files: SharePointFile[]): SharePointFile[][] {
    const batches: SharePointFile[][] = [];
    
    for (let i = 0; i < files.length; i += this.options.batchSize) {
      batches.push(files.slice(i, i + this.options.batchSize));
    }
    
    return batches;
  }

  /**
   * Import a single batch of files
   */
  private async importBatch(
    dataroomId: string,
    siteId: string,
    libraryId: string,
    batch: SharePointFile[]
  ): Promise<{
    successCount: number;
    failureCount: number;
    duplicateCount: number;
    totalRequested: number;
    failedImports?: Array<{fileId: string; error: string; errorType?: string}>;
    duplicateImports?: Array<{fileId: string; filename: string; error: string}>;
  }> {
    const fileIds = batch.map(f => f.fileId);

    try {
      const result = await importSharePointFilesBatch(siteId, libraryId, fileIds, dataroomId);

      // Return detailed results including duplicates
      return {
        successCount: result.successCount,
        failureCount: result.failureCount,
        duplicateCount: result.duplicateCount || 0,
        totalRequested: result.totalRequested,
        failedImports: result.failedImports || [],
        duplicateImports: result.duplicateImports || []
      };

    } catch (error) {
      console.error('Batch import failed:', error);

      // Report SharePoint import error to Sentry
      const errorObj = error instanceof Error ? error : new Error(String(error));
      reportUploadError(errorObj, {
        operation: 'sharepoint_import',
        fileCount: batch.length,
        fileNames: batch.map(f => f.name)
      });

      throw error;
    }
  }

  /**
   * Notify progress callback
   */
  private notifyProgress(): void {
    this.options.onProgress?.(this.currentProgress);
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
