/**
 * Sentry Configuration for PropEase Frontend
 * Optimized for upload error tracking and minimal quota usage
 */

import * as Sentry from "@sentry/react";

// Initialize Sentry with upload-focused configuration
export const initSentry = () => {
  // Only initialize if DSN is provided
  if (!process.env.REACT_APP_SENTRY_DSN) {
    console.warn("Sentry DSN not provided - error tracking disabled");
    return;
  }

  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.REACT_APP_ENVIRONMENT || "production",
    
    // Performance monitoring - DISABLED to save quota
    tracesSampleRate: 0,
    
    // Session replays - DISABLED to save quota  
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    
    // Error filtering - only capture relevant errors
    beforeSend(event, hint) {
      const error = hint.originalException;
      
      // Skip common non-critical errors
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message).toLowerCase();
        
        // Skip network errors that are not upload-related
        if (message.includes('network error') && !isUploadRelated(event)) {
          return null;
        }
        
        // Skip CORS errors (usually configuration issues)
        if (message.includes('cors')) {
          return null;
        }
        
        // Skip script loading errors
        if (message.includes('loading chunk') || message.includes('loading css')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Add custom tags for better filtering
    initialScope: {
      tags: {
        component: "frontend",
        version: process.env.REACT_APP_VERSION || "unknown"
      }
    }
  });
};

// Helper function to determine if error is upload-related
function isUploadRelated(event: Sentry.Event): boolean {
  const url = event.request?.url || '';
  const message = event.message || '';
  const fingerprint = event.fingerprint?.join(' ') || '';
  
  const uploadKeywords = [
    'upload',
    'batch',
    'formdata',
    'documents',
    'datarooms',
    'sharepoint',
    'import'
  ];
  
  const searchText = `${url} ${message} ${fingerprint}`.toLowerCase();
  return uploadKeywords.some(keyword => searchText.includes(keyword));
}

// Custom error reporting functions for upload scenarios
export const reportUploadError = (
  error: Error,
  context: {
    operation: 'local_upload' | 'sharepoint_import' | 'batch_upload';
    batchNumber?: number;
    totalBatches?: number;
    fileCount?: number;
    dataroomId?: string;
    fileNames?: string[];
  }
) => {
  Sentry.withScope((scope) => {
    // Set context for upload errors
    scope.setTag("error_type", "upload_error");
    scope.setTag("upload_operation", context.operation);
    
    if (context.batchNumber) {
      scope.setTag("batch_number", context.batchNumber);
      scope.setTag("total_batches", context.totalBatches || 0);
    }
    
    scope.setContext("upload_details", {
      fileCount: context.fileCount || 0,
      dataroomId: context.dataroomId,
      fileNames: context.fileNames?.slice(0, 5), // First 5 files only
      timestamp: new Date().toISOString()
    });
    
    // Set user context if available
    const userInfo = getUserInfo();
    if (userInfo) {
      scope.setUser(userInfo);
    }
    
    Sentry.captureException(error);
  });
};

export const reportBatchFailure = (
  batchNumber: number,
  totalBatches: number,
  failedFiles: string[],
  error: string
) => {
  Sentry.withScope((scope) => {
    scope.setTag("error_type", "batch_failure");
    scope.setTag("batch_number", batchNumber);
    scope.setTag("total_batches", totalBatches);
    
    scope.setContext("batch_failure", {
      failedFileCount: failedFiles.length,
      failedFiles: failedFiles.slice(0, 10), // First 10 files
      errorMessage: error,
      timestamp: new Date().toISOString()
    });
    
    Sentry.captureMessage(`Batch ${batchNumber}/${totalBatches} failed: ${error}`, "error");
  });
};

// Helper to get user info from session/localStorage
function getUserInfo() {
  try {
    // Try to get user info from your auth system
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        id: user.keycloak_id || user.id,
        email: user.email,
        tenant_id: user.tenant_id
      };
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return null;
}

// Test function to verify Sentry is working
export const testSentry = () => {
  console.log('Testing Sentry integration...');

  // Send a test error
  Sentry.withScope((scope) => {
    scope.setTag("test", "sentry_integration");
    scope.setContext("test_details", {
      timestamp: new Date().toISOString(),
      purpose: "verify_sentry_setup"
    });

    Sentry.captureMessage("Sentry integration test - this is expected", "info");
  });

  console.log('Test message sent to Sentry. Check your Sentry dashboard.');
};

// Export Sentry for direct use if needed
export { Sentry };
