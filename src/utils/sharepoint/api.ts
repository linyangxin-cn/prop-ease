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
  getSharePointFolderFilesRecursive,
  importSharePointFiles,
  checkSharePointConnection,
} from "../request/request-utils";
import axiosBean from "../request";

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
  folderPath?: string;  // Relative folder path from library root
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
   * Get files from a SharePoint document library with caching support
   */
  static async getLibraryFiles(
    siteId: string,
    libraryId: string,
    folderPath?: string,
    useCache: boolean = true,
    prefetchSubfolders: boolean = true
  ): Promise<SharePointFile[]> {
    const response = await getSharePointFiles(siteId, libraryId, folderPath, useCache, prefetchSubfolders);
    return response.files || [];
  }

  /**
   * Get files from a SharePoint document library with full cache metadata
   */
  static async getLibraryFilesWithMetadata(
    siteId: string,
    libraryId: string,
    folderPath?: string,
    useCache: boolean = true,
    prefetchSubfolders: boolean = true
  ): Promise<{
    files: SharePointFile[];
    cached: boolean;
    cache_hit: boolean;
    folder_path: string;
  }> {
    const response = await getSharePointFiles(siteId, libraryId, folderPath, useCache, prefetchSubfolders);
    return {
      files: response.files || [],
      cached: response.cached || false,
      cache_hit: response.cache_hit || false,
      folder_path: response.folder_path || folderPath || ""
    };
  }

  /**
   * Get all files recursively from a folder and its subfolders
   * This method makes a single backend call instead of multiple frontend recursive calls
   */
  static async getFolderFilesRecursive(
    siteId: string,
    libraryId: string,
    folderPath: string,
    useCache: boolean = true
  ): Promise<SharePointFile[]> {
    const response = await getSharePointFolderFilesRecursive(siteId, libraryId, folderPath, useCache);
    return response.files || [];
  }

  /**
   * Get all files recursively with progressive streaming updates
   * This method provides real-time progress updates for large folder scans
   */
  static async getFolderFilesRecursiveStream(
    siteId: string,
    libraryId: string,
    folderPath: string,
    useCache: boolean = true,
    onProgress?: (progress: {
      type: 'start' | 'progress' | 'complete' | 'error';
      message?: string;
      folders_processed?: number;
      files_found?: number;
      current_folder?: string;
      files?: SharePointFile[];
      total?: number;
      cached?: boolean;
    }) => void
  ): Promise<SharePointFile[]> {
    return new Promise(async (resolve, reject) => {
      const encodedFolderPath = encodeURIComponent(folderPath);
      // Use full API URL to ensure it goes to the correct domain
      const apiBaseUrl = process.env.REACT_APP_API_URL || "https://api.propease.eu/api/v1";
      const url = `${apiBaseUrl}/sharepoint/sites/${siteId}/libraries/${libraryId}/folders/${encodedFolderPath}/files/recursive/stream?use_cache=${useCache}`;

      let finalFiles: SharePointFile[] = [];
      let abortController = new AbortController();

      // Cleanup timeout after 5 minutes
      const timeoutId = setTimeout(() => {
        abortController.abort();
        reject(new Error('Request timeout'));
      }, 5 * 60 * 1000);

      try {
        // Use fetch with credentials instead of EventSource for authentication support
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
          signal: abortController.signal
        });

        if (!response.ok) {
          clearTimeout(timeoutId);
          if (response.status === 401) {
            reject(new Error('Authentication required. Please log in again.'));
          } else {
            reject(new Error(`Server error: ${response.status} ${response.statusText}`));
          }
          return;
        }

        if (!response.body) {
          clearTimeout(timeoutId);
          reject(new Error('No response body received'));
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            clearTimeout(timeoutId);
            break;
          }

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6)); // Remove 'data: ' prefix

                if (onProgress) {
                  onProgress(data);
                }

                if (data.type === 'complete') {
                  finalFiles = data.files || [];
                  clearTimeout(timeoutId);
                  resolve(finalFiles);
                  return;
                } else if (data.type === 'error') {
                  clearTimeout(timeoutId);
                  reject(new Error(data.message || 'Unknown error occurred'));
                  return;
                }
              } catch (error) {
                console.error('Error parsing SSE data:', error);
                // Continue processing other lines instead of failing completely
              }
            }
          }
        }

        // If we reach here without a 'complete' message, something went wrong
        clearTimeout(timeoutId);
        resolve(finalFiles);

      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          reject(new Error('Request timeout'));
        } else {
          console.error('Streaming error:', error);
          reject(new Error('Connection to server failed'));
        }
      }
    });
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
   * Clear SharePoint cache for current tenant
   */
  static async clearCache(): Promise<{
    success: boolean;
    cleared_entries: number;
    error?: string;
  }> {
    try {
      const response = await axiosBean.delete("/sharepoint/cache/clear");
      return response.data || { success: false, cleared_entries: 0 };
    } catch (error) {
      console.error("Error clearing SharePoint cache:", error);
      return { success: false, cleared_entries: 0, error: String(error) };
    }
  }

  /**
   * Get SharePoint cache statistics
   */
  static async getCacheStats(): Promise<{
    tenant_id: string;
    total_entries: number;
    max_entries: number;
    ttl_seconds: number;
    entries: Array<{
      site_id: string;
      library_id: string;
      folder_path: string;
      ttl: number;
    }>;
    error?: string;
  }> {
    try {
      const response = await axiosBean.get("/sharepoint/cache/stats");
      return response.data || { tenant_id: "", total_entries: 0, max_entries: 0, ttl_seconds: 0, entries: [] };
    } catch (error) {
      console.error("Error getting cache stats:", error);
      return {
        tenant_id: "",
        total_entries: 0,
        max_entries: 0,
        ttl_seconds: 0,
        entries: [],
        error: String(error)
      };
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
