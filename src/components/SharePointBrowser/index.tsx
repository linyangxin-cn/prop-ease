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
} from "antd";
import {
  FolderOutlined,
  FileOutlined,
  SearchOutlined,
  ReloadOutlined,
  CloudDownloadOutlined,
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
}) => {
  // State management
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [files, setFiles] = useState<SharePointFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<SharePointFile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentSiteId, setCurrentSiteId] = useState<string>("");
  const [currentLibraryId, setCurrentLibraryId] = useState<string>("");

  // Resizable splitter state
  const [treePanelWidth, setTreePanelWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load SharePoint sites on component mount
  useEffect(() => {
    loadSites();
  }, []);

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

  /**
   * Load files from a specific library
   */
  const loadFiles = useCallback(async (siteId: string, libraryId: string) => {
    setLoading(true);
    try {
      const libraryFiles = await SharePointApiService.getLibraryFiles(siteId, libraryId);
      setFiles(libraryFiles);
      setCurrentSiteId(siteId);
      setCurrentLibraryId(libraryId);
    } catch (error: any) {
      console.error("Failed to load files:", error);
      message.error("Failed to load files from the selected library.");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
        await loadFiles(info.node.siteId, info.node.libraryId);
      }
    },
    [loadFiles]
  );

  /**
   * Handle file selection in the table
   */
  const handleFileSelection = useCallback(
    (file: SharePointFile, selected: boolean) => {
      setSelectedFiles((prev) => {
        if (selected) {
          if (prev.length >= maxSelections) {
            message.warning(`Maximum ${maxSelections} files can be selected.`);
            return prev;
          }
          return [...prev, file];
        } else {
          return prev.filter((f) => f.fileId !== file.fileId);
        }
      });
    },
    [maxSelections]
  );

  /**
   * Handle select all files
   */
  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        const filteredFiles = filteredFileList.slice(0, maxSelections);
        setSelectedFiles(filteredFiles);
        if (filteredFiles.length < filteredFileList.length) {
          message.warning(`Only first ${maxSelections} files were selected due to limit.`);
        }
      } else {
        setSelectedFiles([]);
      }
    },
    [maxSelections]
  );

  /**
   * Filter files based on search term
   */
  const filteredFileList = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
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
      render: (name: string) => (
        <Space>
          <FileOutlined style={{ color: '#ff4d4f' }} />
          <Tooltip title={name}>
            <span style={{ fontWeight: 500 }}>{name}</span>
          </Tooltip>
        </Space>
      ),
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
          <Button
            icon={<ReloadOutlined />}
            onClick={loadSites}
            loading={loading}
            size="small"
          >
            Refresh
          </Button>
          <Tag color="blue">
            {selectedFiles.length} of {maxSelections} files selected
          </Tag>
        </Space>
      </div>

      <div className={styles.browserContent} ref={containerRef}>
        <div
          className={styles.treePanel}
          style={{ width: treePanelWidth, minWidth: treePanelWidth, maxWidth: treePanelWidth }}
        >
          <div className={styles.treePanelHeader}>
            <h4>SharePoint Sites</h4>
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
              <Table
                columns={columns}
                dataSource={filteredFileList}
                rowKey="fileId"
                size="small"
                pagination={{
                  pageSize: 15,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} files`,
                  size: 'small',
                }}
                scroll={{
                  y: 350,
                  x: 'max-content'
                }}
                rowSelection={{
                  type: 'checkbox',
                  selectedRowKeys: selectedFiles.map(f => f.fileId),
                  onSelect: (record, selected) => {
                    handleFileSelection(record, selected);
                  },
                  onSelectAll: (selected) => {
                    handleSelectAll(selected);
                  },
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePointBrowser;
