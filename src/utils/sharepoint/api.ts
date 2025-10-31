/**
 * SharePoint Integration API Service
 * 
 * This service handles all SharePoint-related API calls including authentication,
 * site browsing, file listing, and document import functionality.
 */

import {
  getSharePointAuthUrl,
  getSharePointSites,
  getSharePointLibraries,
  getSharePointFiles,
  importSharePointFiles,
  checkSharePointConnection,
} from "../request/request-utils";

// SharePoint API Types
export interface SharePointSite {
  siteId: string;
  name: string;
  displayName?: string;
  webUrl: string;
}

export interface SharePointLibrary {
  libraryId: string;
  name: string;
  description?: string;
  webUrl: string;
}

export interface SharePointFile {
  fileId: string;
  name: string;
  size: number;
  webUrl: string;
  contentType: string;
  modifiedDateTime?: string;
  createdDateTime?: string;
  // Context information needed for import
  siteId?: string;
  libraryId?: string;
}

export interface SharePointAuthResponse {
  authUrl: string;
  state: string;
}

export interface SharePointImportResult {
  importedDocuments: Array<{
    documentId: string;
    filename: string;
    sharepointFileId: string;
    status: string;
  }>;
  failedImports: Array<{
    fileId: string;
    error: string;
  }>;
  totalRequested: number;
  successCount: number;
  failureCount: number;
}

// SharePoint API Service Class
export class SharePointApiService {
  /**
   * Get SharePoint authentication URL
   */
  static async getAuthUrl(): Promise<SharePointAuthResponse> {
    return getSharePointAuthUrl();
  }

  /**
   * Get user's accessible SharePoint sites
   */
  static async getSites(): Promise<SharePointSite[]> {
    const response = await getSharePointSites();
    return response.sites || [];
  }

  /**
   * Get document libraries for a specific SharePoint site
   */
  static async getSiteLibraries(siteId: string): Promise<SharePointLibrary[]> {
    const response = await getSharePointLibraries(siteId);
    return response.libraries || [];
  }

  /**
   * Get PDF files from a SharePoint document library
   */
  static async getLibraryFiles(
    siteId: string,
    libraryId: string,
    folderPath?: string
  ): Promise<SharePointFile[]> {
    const response = await getSharePointFiles(siteId, libraryId, folderPath);
    return response.files || [];
  }

  /**
   * Import selected files from SharePoint into PropEase
   */
  static async importFiles(
    siteId: string,
    libraryId: string,
    fileIds: string[],
    dataroomId?: string
  ): Promise<SharePointImportResult> {
    const response = await importSharePointFiles(siteId, libraryId, fileIds, dataroomId);

    return {
      importedDocuments: response.importedDocuments || [],
      failedImports: response.failedImports || [],
      totalRequested: response.totalRequested || fileIds.length,
      successCount: response.successCount || 0,
      failureCount: response.failureCount || 0,
    };
  }

  /**
   * Check if user has an active SharePoint connection
   */
  static async checkConnection(): Promise<boolean> {
    try {
      const response = await checkSharePointConnection();
      return response.connected;
    } catch (error: any) {
      console.error('Failed to check SharePoint connection:', error);
      return false;
    }
  }

  /**
   * Open SharePoint authentication in a popup window
   */
  static async authenticateWithPopup(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        // Get authentication URL
        const { authUrl } = await this.getAuthUrl();

        // Open popup window
        const popup = window.open(
          authUrl,
          "sharepoint-auth",
          "width=600,height=700,scrollbars=yes,resizable=yes"
        );

        if (!popup) {
          reject(new Error("Popup blocked. Please allow popups for this site."));
          return;
        }

        // Poll for popup closure or success
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            // Check if authentication was successful by trying to get sites
            this.checkConnection()
              .then(resolve)
              .catch(() => resolve(false));
          }
        }, 1000);

        // Listen for messages from popup (if callback sends postMessage)
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === "SHAREPOINT_AUTH_SUCCESS") {
            clearInterval(checkClosed);
            popup.close();
            window.removeEventListener("message", messageListener);
            resolve(true);
          } else if (event.data.type === "SHAREPOINT_AUTH_ERROR") {
            clearInterval(checkClosed);
            popup.close();
            window.removeEventListener("message", messageListener);
            resolve(false);
          }
        };

        window.addEventListener("message", messageListener);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          window.removeEventListener("message", messageListener);
          if (!popup.closed) {
            popup.close();
          }
          reject(new Error("Authentication timeout"));
        }, 300000);
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Utility functions for SharePoint integration
export const SharePointUtils = {
  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  /**
   * Format date for display
   */
  formatDate(dateString?: string): string {
    if (!dateString) return "Unknown";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  },

  /**
   * Extract file extension from filename
   */
  getFileExtension(filename: string): string {
    return filename.split(".").pop()?.toLowerCase() || "";
  },

  /**
   * Check if file is a PDF
   */
  isPdfFile(filename: string): boolean {
    return this.getFileExtension(filename) === "pdf";
  },

  /**
   * Generate a unique key for caching
   */
  generateCacheKey(siteId: string, libraryId?: string, folderPath?: string): string {
    return `sharepoint_${siteId}_${libraryId || "root"}_${folderPath || ""}`;
  },

  /**
   * Validate SharePoint file selection
   */
  validateFileSelection(files: SharePointFile[]): {
    valid: SharePointFile[];
    invalid: SharePointFile[];
    errors: string[];
  } {
    const valid: SharePointFile[] = [];
    const invalid: SharePointFile[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      if (!this.isPdfFile(file.name)) {
        invalid.push(file);
        errors.push(`${file.name}: Only PDF files are supported`);
      } else if (file.size > 100 * 1024 * 1024) { // 100MB limit
        invalid.push(file);
        errors.push(`${file.name}: File size exceeds 100MB limit`);
      } else {
        valid.push(file);
      }
    });

    return { valid, invalid, errors };
  },

  /**
   * Group files by their parent folder
   */
  groupFilesByFolder(files: SharePointFile[]): Record<string, SharePointFile[]> {
    const groups: Record<string, SharePointFile[]> = {};
    
    files.forEach((file) => {
      // Extract folder path from file name or use root
      const pathParts = file.name.split("/");
      const folder = pathParts.length > 1 ? pathParts.slice(0, -1).join("/") : "Root";
      
      if (!groups[folder]) {
        groups[folder] = [];
      }
      groups[folder].push(file);
    });

    return groups;
  }
};

export default SharePointApiService;
