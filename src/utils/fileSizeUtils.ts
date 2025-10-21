/**
 * File Size Utilities for PropEase
 * Handles file size validation, formatting, and user guidance
 */

export interface FileSizeValidationResult {
  isValid: boolean;
  errorMessage?: string;
  warningMessage?: string;
  sizeMB: number;
  sizeFormatted: string;
}

export interface FileSizeLimits {
  maxFileSizeMB: number;
  warningFileSizeMB: number;
  recommendedMaxMB: number;
}

// Default file size configuration based on backend limits
export const DEFAULT_FILE_SIZE_LIMITS: FileSizeLimits = {
  maxFileSizeMB: 50,        // Backend hard limit
  warningFileSizeMB: 25,    // Show warning above this
  recommendedMaxMB: 10      // Recommended max for optimal performance
};

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const size = bytes / Math.pow(k, i);
  const formatted = i >= 2 ? size.toFixed(1) : Math.round(size);
  
  return `${formatted} ${sizes[i]}`;
}

/**
 * Convert bytes to MB with specified decimal places
 */
export function bytesToMB(bytes: number, decimals: number = 1): number {
  return Math.round((bytes / (1024 * 1024)) * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Validate individual file size
 */
export function validateFileSize(
  file: File, 
  limits: FileSizeLimits = DEFAULT_FILE_SIZE_LIMITS
): FileSizeValidationResult {
  const sizeMB = bytesToMB(file.size);
  const sizeFormatted = formatFileSize(file.size);
  
  if (sizeMB > limits.maxFileSizeMB) {
    return {
      isValid: false,
      sizeMB,
      sizeFormatted,
      errorMessage: `File "${file.name}" (${sizeFormatted}) exceeds the maximum size limit of ${limits.maxFileSizeMB}MB. Please compress or split the file.`
    };
  }
  
  if (sizeMB > limits.warningFileSizeMB) {
    return {
      isValid: true,
      sizeMB,
      sizeFormatted,
      warningMessage: `File "${file.name}" (${sizeFormatted}) is large and may take longer to upload. Consider compressing if possible.`
    };
  }
  
  return {
    isValid: true,
    sizeMB,
    sizeFormatted
  };
}

/**
 * Validate multiple files and return categorized results
 */
export function validateMultipleFiles(
  files: File[],
  limits: FileSizeLimits = DEFAULT_FILE_SIZE_LIMITS
): {
  validFiles: File[];
  oversizedFiles: { file: File; validation: FileSizeValidationResult }[];
  largeFiles: { file: File; validation: FileSizeValidationResult }[];
  totalSizeMB: number;
  totalSizeFormatted: string;
} {
  const validFiles: File[] = [];
  const oversizedFiles: { file: File; validation: FileSizeValidationResult }[] = [];
  const largeFiles: { file: File; validation: FileSizeValidationResult }[] = [];
  
  let totalSizeBytes = 0;
  
  files.forEach(file => {
    const validation = validateFileSize(file, limits);
    totalSizeBytes += file.size;
    
    if (!validation.isValid) {
      oversizedFiles.push({ file, validation });
    } else {
      validFiles.push(file);
      
      if (validation.warningMessage) {
        largeFiles.push({ file, validation });
      }
    }
  });
  
  return {
    validFiles,
    oversizedFiles,
    largeFiles,
    totalSizeMB: bytesToMB(totalSizeBytes),
    totalSizeFormatted: formatFileSize(totalSizeBytes)
  };
}

/**
 * Get user-friendly guidance for file size issues
 */
export function getFileSizeGuidance(sizeMB: number, limits: FileSizeLimits = DEFAULT_FILE_SIZE_LIMITS): {
  title: string;
  message: string;
  suggestions: string[];
  severity: 'error' | 'warning' | 'info';
} {
  if (sizeMB > limits.maxFileSizeMB) {
    return {
      title: 'File Too Large',
      message: `This file (${sizeMB.toFixed(1)}MB) exceeds our ${limits.maxFileSizeMB}MB limit.`,
      suggestions: [
        'Compress the file using built-in compression tools',
        'Split large documents into smaller sections',
        'Convert to a more efficient format (e.g., PDF instead of Word)',
        'Remove unnecessary images or reduce image quality',
        'Contact support if this is a critical business document'
      ],
      severity: 'error'
    };
  }
  
  if (sizeMB > limits.warningFileSizeMB) {
    return {
      title: 'Large File Detected',
      message: `This file (${sizeMB.toFixed(1)}MB) is quite large and may take longer to upload.`,
      suggestions: [
        'Upload may take several minutes depending on your connection',
        'Consider compressing the file for faster upload',
        'Ensure stable internet connection during upload',
        'Large files will be processed in batches for better performance'
      ],
      severity: 'warning'
    };
  }
  
  if (sizeMB > limits.recommendedMaxMB) {
    return {
      title: 'Medium File Size',
      message: `This file (${sizeMB.toFixed(1)}MB) is above our recommended size for optimal performance.`,
      suggestions: [
        'File will upload normally but may take a bit longer',
        'Consider compressing if you frequently upload similar files',
        'Batch upload mode will be used for better performance'
      ],
      severity: 'info'
    };
  }
  
  return {
    title: 'File Size OK',
    message: `This file (${sizeMB.toFixed(1)}MB) is within optimal size limits.`,
    suggestions: [],
    severity: 'info'
  };
}

/**
 * Estimate upload time based on file size and connection speed
 */
export function estimateUploadTime(
  fileSizeBytes: number,
  connectionSpeedMbps: number = 10 // Default to 10 Mbps
): {
  estimatedSeconds: number;
  estimatedMinutes: number;
  formattedTime: string;
} {
  // Convert file size to megabits and account for upload overhead (typically 80% efficiency)
  const fileSizeMegabits = (fileSizeBytes * 8) / (1024 * 1024);
  const estimatedSeconds = Math.ceil((fileSizeMegabits / connectionSpeedMbps) / 0.8);
  const estimatedMinutes = estimatedSeconds / 60;
  
  let formattedTime: string;
  if (estimatedSeconds < 60) {
    formattedTime = `${estimatedSeconds} seconds`;
  } else if (estimatedMinutes < 60) {
    formattedTime = `${Math.ceil(estimatedMinutes)} minutes`;
  } else {
    const hours = Math.floor(estimatedMinutes / 60);
    const remainingMinutes = Math.ceil(estimatedMinutes % 60);
    formattedTime = `${hours}h ${remainingMinutes}m`;
  }
  
  return {
    estimatedSeconds,
    estimatedMinutes,
    formattedTime
  };
}

/**
 * Check if files should trigger batch upload mode
 */
export function shouldUseBatchUpload(
  files: File[],
  limits: FileSizeLimits = DEFAULT_FILE_SIZE_LIMITS
): {
  shouldUseBatch: boolean;
  reason: string;
  fileCount: number;
  totalSizeMB: number;
  largeFileCount: number;
} {
  const totalSizeBytes = files.reduce((sum, file) => sum + file.size, 0);
  const totalSizeMB = bytesToMB(totalSizeBytes);
  const largeFileCount = files.filter(file => bytesToMB(file.size) > limits.warningFileSizeMB).length;
  
  let shouldUseBatch = false;
  let reason = '';
  
  if (files.length >= 50) {
    shouldUseBatch = true;
    reason = `Large number of files (${files.length})`;
  } else if (totalSizeMB >= 100) {
    shouldUseBatch = true;
    reason = `Large total size (${totalSizeMB.toFixed(1)}MB)`;
  } else if (largeFileCount > 0) {
    shouldUseBatch = true;
    reason = `Contains ${largeFileCount} large file${largeFileCount > 1 ? 's' : ''}`;
  } else {
    reason = 'Standard upload suitable';
  }
  
  return {
    shouldUseBatch,
    reason,
    fileCount: files.length,
    totalSizeMB,
    largeFileCount
  };
}
