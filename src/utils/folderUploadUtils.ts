/**
 * Folder Upload Utilities
 *
 * Provides utilities for handling folder uploads with metadata extraction.
 * Supports both File System Access API (modern browsers) and directory input (fallback).
 */

// Type declarations for File System Access API (not in standard TypeScript types)
declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }

  interface FileSystemHandle {
    readonly kind: 'file' | 'directory';
    readonly name: string;
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    readonly kind: 'file';
    getFile(): Promise<File>;
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    readonly kind: 'directory';
    values(): AsyncIterableIterator<FileSystemHandle>;
    [Symbol.asyncIterator](): AsyncIterableIterator<FileSystemHandle>;
  }
}

export interface FolderMetadata {
  folder_path: string;
  folder_hierarchy: string[];
  folder_depth: number;
}

export interface FolderUploadMetadata {
  [filename: string]: FolderMetadata;
}

/**
 * Check if the browser supports the File System Access API
 */
export const supportsFileSystemAccess = (): boolean => {
  return 'showDirectoryPicker' in window;
};

/**
 * Recursively traverse a directory and collect files with metadata
 * Uses File System Access API
 */
export const traverseDirectory = async (
  dirHandle: FileSystemDirectoryHandle,
  currentPath: string,
  files: File[],
  metadata: FolderUploadMetadata
): Promise<void> => {
  for await (const entry of dirHandle.values()) {
    const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
    
    if (entry.kind === 'file') {
      const fileHandle = entry as FileSystemFileHandle;
      const file = await fileHandle.getFile();
      
      // Filter for supported file types
      if (isSupportedFile(file)) {
        files.push(file);
        
        // Store metadata for this file
        const hierarchy = currentPath ? currentPath.split('/') : [];
        metadata[file.name] = {
          folder_path: currentPath || '',
          folder_hierarchy: hierarchy,
          folder_depth: hierarchy.length
        };
      }
    } else if (entry.kind === 'directory') {
      // Recursively traverse subdirectories
      const subDirHandle = entry as FileSystemDirectoryHandle;
      await traverseDirectory(subDirHandle, entryPath, files, metadata);
    }
  }
};

/**
 * Extract folder metadata from files with webkitRelativePath
 * Used for directory input fallback
 */
export const extractFolderMetadataFromFiles = (files: File[]): FolderUploadMetadata => {
  const metadata: FolderUploadMetadata = {};
  
  files.forEach(file => {
    // @ts-ignore - webkitRelativePath is not in TypeScript types
    const relativePath = file.webkitRelativePath || file.name;
    const pathParts = relativePath.split('/');
    
    // Remove the filename to get the folder path
    const folderParts = pathParts.slice(0, -1);
    const folderPath = folderParts.join('/');
    
    metadata[file.name] = {
      folder_path: folderPath,
      folder_hierarchy: folderParts,
      folder_depth: folderParts.length
    };
  });
  
  return metadata;
};

/**
 * Extract folder metadata from drag-and-drop entries
 */
export const extractFolderMetadataFromDrop = async (
  items: DataTransferItemList
): Promise<{ files: File[]; metadata: FolderUploadMetadata }> => {
  const files: File[] = [];
  const metadata: FolderUploadMetadata = {};
  
  // Process dropped items
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (item.kind === 'file') {
      // @ts-ignore - webkitGetAsEntry is not in TypeScript types
      const entry = item.webkitGetAsEntry();
      
      if (entry) {
        await processEntry(entry, '', files, metadata);
      }
    }
  }
  
  return { files, metadata };
};

/**
 * Process a file system entry (file or directory)
 * Used for drag-and-drop folder support
 */
const processEntry = async (
  entry: any,
  currentPath: string,
  files: File[],
  metadata: FolderUploadMetadata
): Promise<void> => {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve) => {
      entry.file((f: File) => resolve(f));
    });
    
    if (isSupportedFile(file)) {
      files.push(file);
      
      const hierarchy = currentPath ? currentPath.split('/') : [];
      metadata[file.name] = {
        folder_path: currentPath,
        folder_hierarchy: hierarchy,
        folder_depth: hierarchy.length
      };
    }
  } else if (entry.isDirectory) {
    const dirReader = entry.createReader();
    const entries = await new Promise<any[]>((resolve) => {
      dirReader.readEntries((e: any[]) => resolve(e));
    });
    
    for (const subEntry of entries) {
      const newPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
      await processEntry(subEntry, newPath, files, metadata);
    }
  }
};

/**
 * Check if a file is supported for upload
 */
const isSupportedFile = (file: File): boolean => {
  // Filter out system files
  const systemFiles = ['.ds_store', 'thumbs.db', 'desktop.ini', '.gitkeep', '.gitignore'];
  const fileName = file.name.toLowerCase();

  if (systemFiles.includes(fileName)) {
    return false;
  }

  const supportedExtensions = [
    '.pdf', '.xlsx', '.xls', '.docx', '.doc',
    '.pptx', '.ppt', '.jpg', '.jpeg', '.png',
    '.bmp', '.tiff', '.gif', '.txt', '.csv', '.md'
  ];

  return supportedExtensions.some(ext => fileName.endsWith(ext));
};

/**
 * Select and process a folder using File System Access API
 */
export const selectFolder = async (): Promise<{ files: File[]; metadata: FolderUploadMetadata }> => {
  if (!supportsFileSystemAccess()) {
    throw new Error('File System Access API is not supported in this browser');
  }
  
  try {
    // @ts-ignore - showDirectoryPicker is not in TypeScript types yet
    const dirHandle = await window.showDirectoryPicker();
    
    const files: File[] = [];
    const metadata: FolderUploadMetadata = {};
    
    await traverseDirectory(dirHandle, '', files, metadata);
    
    if (files.length === 0) {
      throw new Error('No supported files found in the selected folder');
    }
    
    return { files, metadata };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Folder selection was cancelled');
    }
    throw error;
  }
};

/**
 * Format folder metadata for display
 */
export const formatFolderPath = (metadata: FolderMetadata): string => {
  if (!metadata.folder_path) {
    return 'Root folder';
  }
  return metadata.folder_path;
};

/**
 * Get folder statistics from metadata
 */
export const getFolderStats = (metadata: FolderUploadMetadata): {
  totalFiles: number;
  maxDepth: number;
  uniqueFolders: Set<string>;
} => {
  const uniqueFolders = new Set<string>();
  let maxDepth = 0;
  
  Object.values(metadata).forEach(meta => {
    if (meta.folder_path) {
      uniqueFolders.add(meta.folder_path);
    }
    maxDepth = Math.max(maxDepth, meta.folder_depth);
  });
  
  return {
    totalFiles: Object.keys(metadata).length,
    maxDepth,
    uniqueFolders
  };
};

