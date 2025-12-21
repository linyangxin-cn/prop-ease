/**
 * SharePoint Browser Component
 * 
 * A comprehensive file browser for SharePoint integration that allows users to:
 * - Browse SharePoint sites and document libraries
 * - Select PDF files for import
 * - Preview file information
 * - Import selected files into PropEase
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Tree,
  Table,
  message,
  Spin,
  Empty,
  Input,
  Space,
  Tooltip,
  Tag,
  Breadcrumb,
} from "antd";
import {
  FolderOutlined,
  FileOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  DragOutlined,
} from "@ant-design/icons";
import type { DataNode } from "antd/es/tree";
import type { ColumnsType } from "antd/es/table";
import styles from "./index.module.less";
import {
  SharePointApiService,
  SharePointSite,
  SharePointLibrary,
  SharePointFile,
  SharePointUtils,
} from "../../utils/sharepoint/api";

const { Search } = Input;

interface SharePointBrowserProps {
  onFilesSelected: (files: SharePointFile[]) => void;
  onImportComplete?: (result: any) => void;
  maxSelections?: number;
  className?: string;
  initialSelectedFiles?: SharePointFile[];  // Pre-selected files to remember previous selections
}

interface TreeNodeData extends DataNode {
  type: "site" | "library";
  siteId?: string;
  libraryId?: string;
  data?: SharePointSite | SharePointLibrary;
}

const SharePointBrowser: React.FC<SharePointBrowserProps> = ({
  onFilesSelected,
  onImportComplete,
  maxSelections = 50,
  className,
  initialSelectedFiles = [],
}) => {
  // State management
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [files, setFiles] = useState<SharePointFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<SharePointFile[]>(initialSelectedFiles);
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // Removed frontend cache - now using backend Redis cache exclusively

  // Progress tracking for large folder operations
  const [progressModal, setProgressModal] = useState({
    visible: false,
    title: '',
    progress: 0,
    status: 'Initializing...',
    foldersProcessed: 0,
    filesFound: 0,
    currentFolder: ''
  });

  const [currentSiteId, setCurrentSiteId] = useState<string>("");
  const [currentLibraryId, setCurrentLibraryId] = useState<string>("");
  const [currentFolderPath, setCurrentFolderPath] = useState<string>("");
  const [folderBreadcrumbs, setFolderBreadcrumbs] = useState<Array<{name: string, path: string}>>([]);

  // Pagination state
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  // Resizable splitter state
  const [treePanelWidth, setTreePanelWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Notify parent component when file selection changes
  useEffect(() => {
    // Add context information to selected files
    const filesWithContext = selectedFiles.map(file => ({
      ...file,
      siteId: currentSiteId,
      libraryId: currentLibraryId
    }));
    onFilesSelected(filesWithContext);
  }, [selectedFiles, onFilesSelected, currentSiteId, currentLibraryId]);

  // All frontend cache logic removed - using backend Redis cache exclusively

  // Handle mouse events for resizing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left;
    const minWidth = 200;
    const maxWidth = containerRect.width * 0.6; // Max 60% of container width

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setTreePanelWidth(newWidth);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add global mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  /**
   * Load SharePoint sites and build tree structure
   */
  const loadSites = useCallback(async () => {
    setLoading(true);
    try {
      const sites = await SharePointApiService.getSites();

      const treeNodes: TreeNodeData[] = sites.map((site) => ({
        title: site.displayName || site.name,
        key: `site-${site.siteId}`,
        type: "site",
        siteId: site.siteId,
        data: site,
        icon: <FolderOutlined />,
        children: undefined, // This makes the node expandable
        isLeaf: false, // Explicitly mark as not a leaf node
      }));

      setTreeData(treeNodes);
    } catch (error: any) {
      console.error("Failed to load SharePoint sites:", error);
      message.error("Failed to load SharePoint sites. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load SharePoint sites on component mount
  useEffect(() => {
    loadSites();
  }, [loadSites]);

  /**
   * Load document libraries for a specific site
   */
  const loadLibraries = useCallback(async (siteId: string) => {
    console.log("loadLibraries called with siteId:", siteId);
    try {
      const libraries = await SharePointApiService.getSiteLibraries(siteId);
      console.log("Loaded libraries:", libraries);

      const libraryNodes: TreeNodeData[] = libraries.map((library) => ({
        title: library.name,
        key: `library-${siteId}-${library.libraryId}`,
        type: "library",
        siteId,
        libraryId: library.libraryId,
        data: library,
        icon: <FolderOutlined />,
        isLeaf: true,
      }));

      // Update tree data with loaded libraries
      setTreeData((prevData) =>
        prevData.map((node) => {
          if (node.key === `site-${siteId}`) {
            return { ...node, children: libraryNodes };
          }
          return node;
        })
      );

      return libraryNodes;
    } catch (error: any) {
      console.error("Failed to load libraries:", error);
      message.error("Failed to load document libraries.");
      return [];
    }
  }, []);

  // Prefetching removed - backend handles caching automatically

  /**
   * Check if a folder path is selected (simplified - checks current files only)
   */
  const isFolderPathSelected = useCallback((folderPath: string): boolean => {
    // Check if any parent folder in current files is selected
    const pathParts = folderPath.split('/');
    for (let i = 0; i < pathParts.length; i++) {
      const folderName = pathParts[i];
      const folder = files.find((f: SharePointFile) =>
        f.contentType === 'folder' && f.name === folderName);
      if (folder && selectedFolders.has(folder.fileId)) {
        return true;
      }
    }
    return false;
  }, [selectedFolders, files]);

  /**
   * Load files from a specific library or folder (using backend cache)
   */
  const loadFiles = useCallback(async (siteId: string, libraryId: string, folderPath: string = "") => {
    setLoading(true);
    try {
      console.log(`📁 Loading files from ${folderPath || 'root'}`);

      // Always use backend cache - no frontend cache logic
      const libraryFiles = await SharePointApiService.getLibraryFiles(siteId, libraryId, folderPath, true);

      setFiles(libraryFiles);
      setCurrentSiteId(siteId);
      setCurrentLibraryId(libraryId);
      setCurrentFolderPath(folderPath);

      // Update folder selection state based on parent folder selections
      const foldersInCurrentPath = libraryFiles.filter((f: SharePointFile) => f.contentType === 'folder');
      const selectedFolderIds = new Set<string>();

      foldersInCurrentPath.forEach((folder: SharePointFile) => {
        const fullFolderPath = folderPath ? `${folderPath}/${folder.name}` : folder.name;
        if (isFolderPathSelected(fullFolderPath)) {
          selectedFolderIds.add(folder.fileId);
        }
      });

      setSelectedFolders(selectedFolderIds);

      console.log(`✅ Loaded ${libraryFiles.length} files from ${folderPath || 'root'}`);

    } catch (error: any) {
      console.error("Failed to load files:", error);
      message.error("Failed to load files from the selected library.");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [isFolderPathSelected]);



  /**
   * Navigate into a folder
   */
  const navigateToFolder = useCallback(async (folderName: string) => {
    if (!currentSiteId || !currentLibraryId) return;

    const newFolderPath = currentFolderPath ? `${currentFolderPath}/${folderName}` : folderName;

    // Update breadcrumbs
    const newBreadcrumbs = [...folderBreadcrumbs, { name: folderName, path: newFolderPath }];
    setFolderBreadcrumbs(newBreadcrumbs);

    // Load files from the new folder
    await loadFiles(currentSiteId, currentLibraryId, newFolderPath);
  }, [currentSiteId, currentLibraryId, currentFolderPath, folderBreadcrumbs, loadFiles]);

  /**
   * Navigate to a specific folder path (used by breadcrumbs)
   */
  const navigateToBreadcrumb = useCallback(async (targetPath: string) => {
    if (!currentSiteId || !currentLibraryId) return;

    // Update breadcrumbs to only include items up to the target path
    const newBreadcrumbs = folderBreadcrumbs.filter(crumb => {
      const crumbDepth = crumb.path.split('/').length;
      const targetDepth = targetPath ? targetPath.split('/').length : 0;
      return crumbDepth <= targetDepth;
    });
    setFolderBreadcrumbs(newBreadcrumbs);

    // Load files from the target folder
    await loadFiles(currentSiteId, currentLibraryId, targetPath);
  }, [currentSiteId, currentLibraryId, folderBreadcrumbs, loadFiles]);

  /**
   * Go back to library root
   */
  const navigateToRoot = useCallback(async () => {
    if (!currentSiteId || !currentLibraryId) return;

    setFolderBreadcrumbs([]);
    await loadFiles(currentSiteId, currentLibraryId, "");
  }, [currentSiteId, currentLibraryId, loadFiles]);

  /**
   * Refresh SharePoint sites (backend cache will handle refresh)
   */
  const handleRefreshSites = useCallback(async () => {
    await loadSites();

    // If we have a current folder loaded, refresh it
    if (currentSiteId && currentLibraryId) {
      await loadFiles(currentSiteId, currentLibraryId, currentFolderPath);
    }
  }, [loadSites, currentSiteId, currentLibraryId, currentFolderPath, loadFiles]);

  /**
   * Refresh current library files (backend cache will handle refresh)
   */
  const handleRefreshFiles = useCallback(async () => {
    if (currentSiteId && currentLibraryId) {
      // Backend cache will handle refresh automatically
      await loadFiles(currentSiteId, currentLibraryId, currentFolderPath);
    }
  }, [currentSiteId, currentLibraryId, currentFolderPath, loadFiles]);

  /**
   * Handle tree node expansion
   */
  const onExpand = useCallback(
    async (expandedKeysValue: React.Key[], info: any) => {
      console.log("Tree expand event:", { expandedKeysValue, info });
      setExpandedKeys(expandedKeysValue);

      // Load libraries when a site is expanded
      if (info.expanded && info.node.type === "site") {
        console.log("Loading libraries for site:", info.node.siteId);
        await loadLibraries(info.node.siteId);
      }
    },
    [loadLibraries]
  );

  /**
   * Handle tree node selection
   */
  const onSelect = useCallback(
    async (selectedKeysValue: React.Key[], info: any) => {
      setSelectedKeys(selectedKeysValue);

      // Load files when a library is selected
      if (info.selected && info.node.type === "library") {
        // Reset folder navigation and selections when switching libraries
        setCurrentFolderPath("");
        setFolderBreadcrumbs([]);
        setSelectedFiles([]);
        setSelectedFolders(new Set());
        // Backend cache will handle library switching automatically
        await loadFiles(info.node.siteId, info.node.libraryId, "");
      }
    },
    [loadFiles]
  );

  /**
   * Check if file type is supported (align with local upload)
   */
  const isSupportedFileType = useCallback((fileName: string): boolean => {
    const supportedExtensions = [
      '.pdf', '.xlsx', '.xls', '.docx', '.doc', '.pptx', '.ppt',
      '.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif', '.txt', '.csv', '.md'
    ];

    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return supportedExtensions.includes(extension);
  }, []);

  /**
   * Select all supported files in a folder (recursive) - Backend-optimized
   */
  const selectFilesInFolder = useCallback(async (folderName: string) => {
    if (!currentSiteId || !currentLibraryId || progressModal.visible) return;

    const folderPath = currentFolderPath ? `${currentFolderPath}/${folderName}` : folderName;

    try {
      console.log(`🔄 Getting files recursively from folder: ${folderPath}`);

      // Show progress modal for potentially long operations
      setProgressModal({
        visible: true,
        title: `Scanning folder: ${folderName}`,
        progress: 0,
        status: 'Starting scan...',
        foldersProcessed: 0,
        filesFound: 0,
        currentFolder: folderPath
      });

      // Use streaming API for progressive updates
      const allFiles = await SharePointApiService.getFolderFilesRecursiveStream(
        currentSiteId,
        currentLibraryId,
        folderPath,
        true, // use cache
        (progress) => {
          console.log('📊 Progress update received:', progress);
          if (progress.type === 'start') {
            console.log('🚀 Starting scan...');
            setProgressModal(prev => ({
              ...prev,
              status: progress.message || 'Starting scan...',
              progress: 5
            }));
          } else if (progress.type === 'progress') {
            // More realistic progress calculation: logarithmic growth that slows down
            const foldersProcessed = progress.folders_processed || 0;
            const progressPercent = Math.min(85, Math.round(20 + (foldersProcessed * 1.5) + Math.log(foldersProcessed + 1) * 10));
            console.log(`📈 Progress: ${foldersProcessed} folders → ${progressPercent}%, ${progress.files_found} files`);
            setProgressModal(prev => ({
              ...prev,
              progress: progressPercent,
              status: `Scanning ${progress.current_folder || 'folders'}...`,
              foldersProcessed: foldersProcessed,
              filesFound: progress.files_found || 0
            }));
          } else if (progress.type === 'complete') {
            console.log('✅ Scan complete:', progress.total, 'files');
            setProgressModal(prev => ({
              ...prev,
              progress: 100,
              status: progress.cached ? 'Loaded from cache' : 'Scan complete',
              filesFound: progress.total || 0
            }));
          }
        }
      );

      // Filter for supported file types and add site/library info
      const supportedFiles = allFiles
        .filter(file => isSupportedFileType(file.name))
        .map(file => ({
          ...file,
          siteId: currentSiteId,
          libraryId: currentLibraryId
        }));

      // Add to selected files (avoid duplicates)
      setSelectedFiles(prev => {
        const existingIds = new Set(prev.map(f => f.fileId));
        const newFiles = supportedFiles.filter(f => !existingIds.has(f.fileId));
        return [...prev, ...newFiles];
      });

      // Close progress modal after a brief delay
      setTimeout(() => {
        setProgressModal(prev => ({ ...prev, visible: false }));
      }, 1000);

      console.log(`✅ Selected ${supportedFiles.length} files from folder "${folderName}" (backend recursive)`);
      message.success(`Selected ${supportedFiles.length} files from folder "${folderName}" (including subfolders)`);

    } catch (error) {
      console.error("Failed to select files from folder:", error);
      setProgressModal(prev => ({ ...prev, visible: false }));
      message.error(`Failed to select files from folder "${folderName}"`);
    }
  }, [currentSiteId, currentLibraryId, currentFolderPath, isSupportedFileType, progressModal.visible]);

  /**
   * Remove all files from a folder (recursive) when unchecking folder - Backend-optimized
   */
  const removeFilesFromFolder = useCallback(async (folderName: string) => {
    if (!currentSiteId || !currentLibraryId) return;

    const folderPath = currentFolderPath ? `${currentFolderPath}/${folderName}` : folderName;

    try {
      console.log(`🔄 Getting files recursively for removal from folder: ${folderPath}`);

      // Use backend recursive endpoint - single API call instead of multiple frontend calls
      const allFiles = await SharePointApiService.getFolderFilesRecursive(
        currentSiteId,
        currentLibraryId,
        folderPath,
        true // use cache
      );

      // Get file IDs for supported files
      const fileIdsToRemove = allFiles
        .filter(file => isSupportedFileType(file.name))
        .map(file => file.fileId);

      // Remove files from selection and show notification only once
      let removedCount = 0;
      setSelectedFiles(prev => {
        const filteredFiles = prev.filter(f => !fileIdsToRemove.includes(f.fileId));
        removedCount = prev.length - filteredFiles.length;
        return filteredFiles;
      });

      // Show notification outside of setState to avoid duplicates
      if (removedCount > 0) {
        console.log(`✅ Removed ${removedCount} files from folder "${folderName}" (backend recursive)`);
        message.success(`Removed ${removedCount} files from folder "${folderName}" (including subfolders)`);
      }

    } catch (error) {
      console.error("Failed to remove files from folder:", error);
      message.error(`Failed to remove files from folder "${folderName}"`);
    }
  }, [currentSiteId, currentLibraryId, currentFolderPath, isSupportedFileType]);

  /**
   * Handle file selection in the table
   */
  const handleFileSelection = useCallback(
    (file: SharePointFile, selected: boolean) => {
      // Check if file type is supported
      if (selected && !isSupportedFileType(file.name)) {
        message.warning('Only PDF, Excel, Word, PowerPoint, Image, Text, and Markdown files are supported.');
        return;
      }

      setSelectedFiles((prev) => {
        if (selected) {
          return [...prev, file];
        } else {
          return prev.filter((f) => f.fileId !== file.fileId);
        }
      });
    },
    [isSupportedFileType]
  );

  /**
   * Filter files based on search term and file type support
   */
  const filteredFileList = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch; // Show all files but we'll handle selection differently
  });

  /**
   * Handle select all files
   */
  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        // Select supported files and all folders
        const supportedFiles = filteredFileList.filter(file =>
          file.contentType !== 'folder' && isSupportedFileType(file.name)
        );
        const folders = filteredFileList.filter(file => file.contentType === 'folder');

        setSelectedFiles(supportedFiles);
        setSelectedFolders(new Set(folders.map(f => f.fileId)));

        const unsupportedCount = filteredFileList.filter(file =>
          file.contentType !== 'folder' && !isSupportedFileType(file.name)
        ).length;

        if (unsupportedCount > 0) {
          message.info(`Selected ${supportedFiles.length} supported files and ${folders.length} folders. ${unsupportedCount} unsupported files were skipped.`);
        }
      } else {
        setSelectedFiles([]);
        setSelectedFolders(new Set());
      }
    },
    [filteredFileList, isSupportedFileType]
  );

  /**
   * Table columns configuration
   */
  const columns: ColumnsType<SharePointFile> = [
    {
      title: "File Name",
      dataIndex: "name",
      key: "name",
      ellipsis: {
        showTitle: true,
      },
      render: (name: string, record: SharePointFile) => {
        const isFolder = record.contentType === 'folder';
        const isSupported = isFolder || isSupportedFileType(name);

        return (
          <Space>
            {isFolder ? (
              <FolderOutlined style={{ color: '#1890ff' }} />
            ) : (
              <FileOutlined style={{ color: isSupported ? '#ff4d4f' : '#d9d9d9' }} />
            )}
            <Tooltip title={
              isFolder
                ? `${name} (Folder) - Click to navigate`
                : isSupported
                  ? name
                  : `${name} (Unsupported file type)`
            }>
              {isFolder ? (
                <Button
                  type="link"
                  onClick={() => navigateToFolder(name)}
                  style={{
                    padding: 0,
                    height: 'auto',
                    fontWeight: 500,
                    color: '#1890ff'
                  }}
                >
                  {name}
                </Button>
              ) : (
                <span style={{
                  fontWeight: 500,
                  color: isSupported ? 'inherit' : '#d9d9d9',
                  textDecoration: isSupported ? 'none' : 'line-through'
                }}>
                  {name}
                </span>
              )}
            </Tooltip>
            {!isSupported && !isFolder && (
              <Tooltip title="File type not supported">
                <InfoCircleOutlined style={{ color: '#faad14', fontSize: '12px' }} />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      width: 80,
      align: 'right',
      render: (size: number) => (
        <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
          {SharePointUtils.formatFileSize(size)}
        </span>
      ),
    },
    {
      title: "Modified",
      dataIndex: "modifiedDateTime",
      key: "modified",
      width: 100,
      render: (date: string) => (
        <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
          {SharePointUtils.formatDate(date)}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 60,
      fixed: 'right',
      render: (_, file) => (
        <Tooltip title="View in SharePoint">
          <Button
            type="link"
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => window.open(file.webUrl, "_blank")}
            style={{ padding: '4px' }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className={`${styles.sharepointBrowser} ${className || ""}`}>
      <div className={styles.browserHeader}>
        <Space>
          <Tag color={progressModal.visible ? "orange" : "blue"}>
            {progressModal.visible
              ? `Scanning... ${progressModal.filesFound} files found`
              : `${selectedFiles.length} files selected`
            }
          </Tag>
          {progressModal.visible && (
            <Tag color="blue">{Math.round(progressModal.progress)}%</Tag>
          )}
          {selectedFiles.length > 0 && !progressModal.visible && (
            <Button
              size="small"
              onClick={() => {
                setSelectedFiles([]);
                setSelectedFolders(new Set());
              }}
              style={{ fontSize: '12px' }}
            >
              Empty All
            </Button>
          )}
        </Space>
      </div>

      <div className={styles.browserContent} ref={containerRef}>
        <div
          className={styles.treePanel}
          style={{ width: treePanelWidth, minWidth: treePanelWidth, maxWidth: treePanelWidth }}
        >
          <div className={styles.treePanelHeader}>
            <Space>
              <h4>SharePoint Sites</h4>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefreshSites}
                loading={loading}
                size="small"
                type="text"
                title="Refresh sites & clear all cache"
              />
            </Space>
          </div>
          <div className={styles.treeContainer}>
            {loading && treeData.length === 0 ? (
              <div className={styles.loadingContainer}>
                <Spin tip="Loading SharePoint sites..." />
              </div>
            ) : treeData.length === 0 ? (
              <Empty
                description="No SharePoint sites found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Tree
                treeData={treeData}
                expandedKeys={expandedKeys}
                selectedKeys={selectedKeys}
                onExpand={onExpand}
                onSelect={onSelect}
                showIcon
              />
            )}
          </div>
        </div>

        {/* Resizable splitter */}
        <div
          className={styles.resizer}
          onMouseDown={handleMouseDown}
          style={{ cursor: isResizing ? 'col-resize' : 'col-resize' }}
        >
          <div className={styles.resizerHandle}>
            <DragOutlined />
          </div>
        </div>

        <div className={styles.filePanel} style={{ width: `calc(100% - ${treePanelWidth + 8}px)` }}>
          <div className={styles.filePanelHeader}>
            <Space>
              <h4>Files</h4>

              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefreshFiles}
                loading={loading && !!(currentSiteId && currentLibraryId)}
                size="small"
                type="text"
                title="Refresh & clear all cache"
                disabled={!currentSiteId || !currentLibraryId}
              />
              <Search
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
            </Space>
          </div>
          <div className={styles.fileContainer}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <Spin tip="Loading files..." />
              </div>
            ) : files.length === 0 ? (
              <Empty
                description="Select a document library to view files"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <>
                {/* Breadcrumb Navigation */}
                {(currentFolderPath || folderBreadcrumbs.length > 0) && (
                  <div style={{ marginBottom: 16, padding: '8px 0' }}>
                    <Breadcrumb>
                      <Breadcrumb.Item>
                        <Button
                          type="link"
                          size="small"
                          onClick={navigateToRoot}
                          style={{ padding: 0, height: 'auto' }}
                        >
                          Library Root
                        </Button>
                      </Breadcrumb.Item>
                      {folderBreadcrumbs.map((crumb) => (
                        <Breadcrumb.Item key={crumb.path}>
                          <Button
                            type="link"
                            size="small"
                            onClick={() => navigateToBreadcrumb(crumb.path)}
                            style={{ padding: 0, height: 'auto' }}
                          >
                            {crumb.name}
                          </Button>
                        </Breadcrumb.Item>
                      ))}
                    </Breadcrumb>
                  </div>
                )}

                <Table
                columns={columns}
                dataSource={filteredFileList}
                rowKey="fileId"
                size="small"
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '15', '20', '50'],
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} files`,
                  size: 'small',
                  onChange: (page, size) => {
                    setCurrentPage(page);
                    if (size !== pageSize) {
                      setPageSize(size);
                    }
                  },
                  onShowSizeChange: (_, size) => {
                    setCurrentPage(1); // Reset to first page when changing page size
                    setPageSize(size);
                  },
                }}
                scroll={{
                  y: 250,
                  x: 'max-content'
                }}
                rowSelection={{
                  type: 'checkbox',
                  selectedRowKeys: [
                    ...selectedFiles.filter(f => f.contentType !== 'folder').map(f => f.fileId),
                    ...Array.from(selectedFolders)
                  ],

                  onSelect: (record, selected) => {
                    if (record.contentType === 'folder') {
                      // For folders, select all files within the folder and track folder selection
                      if (selected) {
                        selectFilesInFolder(record.name);
                        setSelectedFolders(prev => new Set(Array.from(prev).concat(record.fileId)));
                      } else {
                        setSelectedFolders(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(record.fileId);
                          return newSet;
                        });
                        // Remove all files from this folder when unchecking
                        removeFilesFromFolder(record.name);
                      }
                    } else {
                      // For files, use normal selection
                      handleFileSelection(record, selected);
                    }
                  },
                  onSelectAll: (selected) => {
                    handleSelectAll(selected);
                  },
                  getCheckboxProps: (record) => ({
                    disabled: progressModal.visible || (record.contentType !== 'folder' && !isSupportedFileType(record.name)),
                  }),
                }}
              />
              </>
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default SharePointBrowser;
