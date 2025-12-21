/**
 * File type detection and utilities for document viewers
 */

export enum DocumentType {
  PDF = 'pdf',
  EXCEL = 'excel', 
  WORD = 'word',
  IMAGE = 'image',
  TEXT = 'text',
  UNSUPPORTED = 'unsupported'
}

export interface FileTypeInfo {
  type: DocumentType;
  extension: string;
  mimeType: string;
  supportsClientSideViewing: boolean;
}

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.slice(lastDot + 1).toLowerCase() : '';
};

/**
 * Get MIME type from filename
 */
export const getMimeTypeFromFilename = (filename: string): string => {
  const extension = getFileExtension(filename);
  const mimeTypeMap: Record<string, string> = {
    // PDF
    'pdf': 'application/pdf',
    
    // Excel
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    
    // Word
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    
    // PowerPoint
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'ppt': 'application/vnd.ms-powerpoint',
    
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',
    
    // Text
    'txt': 'text/plain',
    'csv': 'text/csv',
    'md': 'text/markdown'
  };
  
  return mimeTypeMap[extension] || 'application/octet-stream';
};

/**
 * Detect document type from filename or content type
 */
export const detectDocumentType = (filename: string, contentType?: string): FileTypeInfo => {
  const extension = getFileExtension(filename);
  const mimeType = contentType || getMimeTypeFromFilename(filename);
  
  // PDF files
  if (extension === 'pdf' || mimeType === 'application/pdf') {
    return {
      type: DocumentType.PDF,
      extension,
      mimeType,
      supportsClientSideViewing: true // PDF.js
    };
  }
  
  // Excel files
  if (['xlsx', 'xls'].includes(extension) || 
      ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
       'application/vnd.ms-excel'].includes(mimeType)) {
    return {
      type: DocumentType.EXCEL,
      extension,
      mimeType,
      supportsClientSideViewing: true // SheetJS
    };
  }
  
  // Word files
  if (['docx', 'doc'].includes(extension) || 
      ['application/vnd.openxmlformats-officedocument.wordprocessingml.document',
       'application/msword'].includes(mimeType)) {
    return {
      type: DocumentType.WORD,
      extension,
      mimeType,
      supportsClientSideViewing: true // mammoth.js
    };
  }
  
  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(extension) ||
      mimeType.startsWith('image/')) {
    return {
      type: DocumentType.IMAGE,
      extension,
      mimeType,
      supportsClientSideViewing: false // Use iframe/img tag
    };
  }
  
  // Text files
  if (['txt', 'csv', 'md'].includes(extension) ||
      mimeType.startsWith('text/')) {
    return {
      type: DocumentType.TEXT,
      extension,
      mimeType,
      supportsClientSideViewing: false // Use iframe
    };
  }
  
  return {
    type: DocumentType.UNSUPPORTED,
    extension,
    mimeType,
    supportsClientSideViewing: false
  };
};

/**
 * Check if file size is within client-side processing limits
 */
export const isFileSizeSupported = (fileSizeBytes: number, maxSizeMB: number = 20): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSizeBytes <= maxSizeBytes;
};

/**
 * Get appropriate viewer strategy for a document
 */
export interface ViewerStrategy {
  primary: 'client-side' | 'iframe';
  fallback: 'iframe' | 'download-only';
  reason: string;
}

export const getViewerStrategy = (
  filename: string, 
  contentType?: string, 
  fileSizeBytes?: number
): ViewerStrategy => {
  const fileInfo = detectDocumentType(filename, contentType);
  
  // PDF files - always use iframe (PDF.js already integrated)
  if (fileInfo.type === DocumentType.PDF) {
    return {
      primary: 'iframe',
      fallback: 'download-only',
      reason: 'PDF.js already integrated via iframe'
    };
  }
  
  // Excel and Word files - use client-side if supported
  if ([DocumentType.EXCEL, DocumentType.WORD].includes(fileInfo.type)) {
    // Check file size if provided
    if (fileSizeBytes && !isFileSizeSupported(fileSizeBytes)) {
      return {
        primary: 'iframe',
        fallback: 'download-only',
        reason: `File too large (${Math.round(fileSizeBytes / 1024 / 1024)}MB > 20MB limit)`
      };
    }
    
    return {
      primary: 'client-side',
      fallback: 'iframe',
      reason: 'Client-side viewer available'
    };
  }
  
  // All other files - use iframe
  return {
    primary: 'iframe',
    fallback: 'download-only',
    reason: 'No client-side viewer available'
  };
};
