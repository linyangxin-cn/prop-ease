import CustomBreadcrumb from "@/components/CustomBreadcrumb";
import { FileTextOutlined, UploadOutlined, SyncOutlined, ApiOutlined } from "@ant-design/icons";
import customChatIcon from "@/assets/Easi.svg"; // Replace with your actual icon path
import { Button, Space, Spin, Tabs, TabsProps, message, Tooltip, Switch, Modal } from "antd";
import styles from "./index.module.less";
import EmptyState from "./components/EmptyState";
import UploadModal from "./components/UploadModal";
import ChatSidebar from "./components/ChatSidebar";
import { useContext, useMemo, useState, useEffect, useCallback } from "react";
import { useRequest } from "ahooks";
import {
  getDataroomDetail,
  getDataroomDocuments,
  getDocumentsPreview,
} from "@/utils/request/request-utils";
import { useLocation } from "react-router-dom";
import DocmentDetail from "./components/DocmentDetail";
import RecentlyUploaded from "./components/RecentlyUploaded";
import { exportDocumentsToExcel } from "@/utils/excel";
import { DoucementInfo, GetDocumentsResponse } from "@/utils/request/types";
import { UserInfoContext } from "@/store/userInfo";


const PropertyDetail: React.FC = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [curSelectedDoc, setCurSelectedDoc] = useState<DoucementInfo>();
  const [hasInit, setHasInit] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pausePolling, setPausePolling] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DoucementInfo | null>(null);
  const [activeTabKey, setActiveTabKey] = useState("1"); // "1" = All uploads, "2" = Classifications

  // Get polling enabled state from localStorage, default to true if not set
  const [pollingEnabled, setPollingEnabled] = useState(() => {
    const savedState = localStorage.getItem('documentsPollingEnabled');
    return savedState !== null ? savedState === 'true' : true;
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [allDocuments, setAllDocuments] = useState<GetDocumentsResponse | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreDocuments, setHasMoreDocuments] = useState(true);

  // User activity state - pause polling during active document management
  const [userActiveUntil, setUserActiveUntil] = useState<number>(0);

  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get("id");

  const { data } = useRequest(() => getDataroomDetail(id ?? ""), {
    ready: !!id,
  });

  const { name } = data || {};
  const userInfo = useContext(UserInfoContext);

  // Custom pagination implementation
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const documentsData = allDocuments || undefined;

  // Function to fetch documents with pagination
  const fetchDocuments = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!id) return;

    try {
      if (!append) {
        setDocumentsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const skip = (page - 1) * 100;
      const limit = 100;

      const response = await getDataroomDocuments(id, skip, limit);

      if (append) {
        // Append new documents to existing ones using functional update
        setAllDocuments(prevDocuments => {
          if (!prevDocuments) return response;

          return {
            confirmed: [...prevDocuments.confirmed, ...response.confirmed],
            not_confirmed: [...prevDocuments.not_confirmed, ...response.not_confirmed],
            total: response.total,
            page: response.page,
            limit: response.limit
          };
        });
      } else {
        // Replace with new data (first load or refresh)
        setAllDocuments(response);
      }

      // Update pagination state - calculate total loaded documents
      let totalLoaded = response.confirmed.length + response.not_confirmed.length;

      if (append) {
        // For append, we need to calculate total from the updated state
        // Use the page number to estimate total loaded
        totalLoaded = page * 100; // Approximate total based on page
      }

      setHasMoreDocuments(totalLoaded < response.total);
      setCurrentPage(page);

      console.log("Documents data fetched", { page, totalLoaded, total: response.total });
      setHasInit(true);
      setIsRefreshing(false);

    } catch (error) {
      console.error("Failed to fetch documents:", error);
      message.error("Failed to load documents");
    } finally {
      setDocumentsLoading(false);
      setIsLoadingMore(false);
    }
  }, [id]);

  // Function to refresh all currently loaded pages
  const refreshAllLoadedPages = useCallback(async () => {
    if (!id || currentPage <= 1) return;

    try {
      setIsRefreshing(true);

      // Calculate total documents to fetch (all loaded pages)
      // Use a larger buffer to account for document state changes
      const totalDocumentsToFetch = Math.min(currentPage * 100 + 50, 1000); // Add buffer, cap at 1000

      // Fetch all pages in one request with larger limit
      const response = await getDataroomDocuments(id, 0, totalDocumentsToFetch);

      // Update state with refreshed data
      setAllDocuments(response);

      // Update pagination state - be more flexible about "hasMore"
      const totalLoaded = response.confirmed.length + response.not_confirmed.length;
      const estimatedTotal = Math.max(response.total, totalLoaded);
      setHasMoreDocuments(totalLoaded < estimatedTotal);

      console.log(`Refreshed ${totalLoaded} documents (estimated total: ${estimatedTotal})`);
      setHasInit(true);

    } catch (error) {
      console.error("Failed to refresh all loaded pages:", error);
      message.error("Failed to refresh documents");
    } finally {
      setIsRefreshing(false);
    }
  }, [id, currentPage]);

  // Gentle refresh function that updates data without disrupting UI
  const refresh = useCallback(async () => {
    if (!id) return;

    try {
      setIsRefreshing(true);

      if (currentPage > 1) {
        // Multi-page refresh: refresh all loaded pages
        console.log(`Gently refreshing all ${currentPage} loaded pages`);
        await refreshAllLoadedPages();
      } else {
        // Single page refresh: update data without clearing UI
        console.log(`Gently refreshing single page`);
        const response = await getDataroomDocuments(id, 0, 100);

        // Update data smoothly without clearing existing state
        setAllDocuments(response);
        const totalLoaded = response.confirmed.length + response.not_confirmed.length;
        setHasMoreDocuments(totalLoaded < response.total);
        setHasInit(true);
      }
    } catch (error) {
      console.error("Failed to refresh documents:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [id, currentPage, refreshAllLoadedPages]);

  // Load more function
  const loadMoreDocuments = useCallback(() => {
    if (!isLoadingMore && hasMoreDocuments) {
      fetchDocuments(currentPage + 1, true);
    }
  }, [isLoadingMore, hasMoreDocuments, fetchDocuments, currentPage]);

  // Initial data loading and polling
  useEffect(() => {
    if (id && !pausePolling) {
      fetchDocuments(1, false);
    }
  }, [id, pausePolling, fetchDocuments]);

  // Function to mark user as active (pauses polling temporarily)
  const markUserActive = useCallback(() => {
    setUserActiveUntil(Date.now() + 30000); // Pause polling for 30 seconds
  }, []);

  // Polling effect - pause when user has loaded multiple pages or is actively working
  useEffect(() => {
    if (!pollingEnabled || pausePolling || !id) return;

    // If user has loaded multiple pages, use longer polling interval to be less intrusive
    const pollingInterval = currentPage > 1 ? 30000 : 10000; // 30s for multi-page, 10s for single page

    const interval = setInterval(() => {
      const now = Date.now();
      const isUserActive = now < userActiveUntil;

      // Only refresh if we're not currently loading, refreshing, or user is active
      if (!isLoadingMore && !isRefreshing && !isUserActive) {
        console.log(`Auto-refresh triggered (${currentPage} pages loaded, interval: ${pollingInterval/1000}s)`);
        refresh();
      } else if (isUserActive) {
        console.log(`Auto-refresh skipped - user is active (${Math.ceil((userActiveUntil - now) / 1000)}s remaining)`);
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [pollingEnabled, pausePolling, id, isLoadingMore, isRefreshing, refresh, currentPage, userActiveUntil]);

  // Request hook for document preview
  const { data: previewData, run: getPreviewUrl } = useRequest(
    (documentId: string) => getDocumentsPreview(documentId),
    {
      manual: true,
    }
  );

  // Save polling state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('documentsPollingEnabled', pollingEnabled.toString());
  }, [pollingEnabled]);

  // Effect to handle manual polling when paused
  useEffect(() => {
    let pollingTimer: NodeJS.Timeout | null = null;

    // If polling is paused but we still want to fetch occasionally and polling is enabled
    if (pausePolling && id && pollingEnabled) {
      // Set up a less frequent manual polling (every 60 seconds instead of 30)
      pollingTimer = setInterval(() => {
        // Only refresh if we're not currently loading more or refreshing
        if (!isLoadingMore && !isRefreshing) {
          console.log(`Manual polling refresh triggered (${currentPage} pages loaded)`);
          refresh();
        }
      }, 60 * 1000); // Poll every 60 seconds when user is making selections to reduce server load
    }

    return () => {
      if (pollingTimer) {
        clearInterval(pollingTimer);
      }
    };
  }, [pausePolling, id, refresh, pollingEnabled, currentPage, isLoadingMore, isRefreshing]);

  // Function to manually refresh data with visual feedback
  const handleRefresh = () => {
    if (isRefreshing) return; // Prevent multiple clicks
    setIsRefreshing(true);
    refresh();
  };

  // Function to toggle polling on/off
  const togglePolling = (checked: boolean) => {
    setPollingEnabled(checked);
    message.info(`API polling ${checked ? 'enabled' : 'disabled'}`);
  };

  const isLoading = useMemo(() => {
    return !hasInit && documentsLoading;
  }, [documentsLoading, hasInit]);

  // 未分类列表为空
  const isNotConfirmedEmpty = useMemo(
    () =>
      !isLoading &&
      (!documentsData?.not_confirmed ||
        documentsData.not_confirmed.length === 0),
    [documentsData?.not_confirmed, isLoading]
  );

  // 分类列表为空
  const isConfirmedEmpty = useMemo(
    () =>
      !isLoading &&
      (!documentsData?.confirmed || documentsData.confirmed.length === 0),
    [documentsData?.confirmed, isLoading]
  );

  const isEmpty = useMemo(
    () => isNotConfirmedEmpty && isConfirmedEmpty,
    [isConfirmedEmpty, isNotConfirmedEmpty]
  );

  const docDetailCom = useMemo(
    () => {
      const confirmedCount = documentsData?.confirmed?.length ?? 0;
      const totalLoadedDocs = (documentsData?.confirmed?.length ?? 0) + (documentsData?.not_confirmed?.length ?? 0);
      const totalDocs = documentsData?.total ?? 0;

      // For confirmed documents: if we've loaded all documents, we know the exact count
      // If we haven't loaded all documents, we can't know the exact confirmed count
      const hasLoadedAllDocs = totalLoadedDocs >= totalDocs;
      const hasMoreConfirmed = !hasLoadedAllDocs && hasMoreDocuments;

      return (
        <DocmentDetail
          documentsData={documentsData}
          documentsLoading={isLoading}
          curSelectedDoc={curSelectedDoc}
          setCurSelectedDoc={setCurSelectedDoc}
          refresh={refresh}
          onLoadMore={loadMoreDocuments}
          hasMore={hasMoreConfirmed}
          isLoadingMore={isLoadingMore}
          totalConfirmed={hasLoadedAllDocs ? confirmedCount : undefined} // Only show total if we know it's accurate
        />
      );
    },
    [curSelectedDoc, documentsData, isLoading, refresh, loadMoreDocuments, isLoadingMore, hasMoreDocuments]
  );

  const recentlyUploadedCom = useMemo(
    () => {
      const notConfirmedCount = documentsData?.not_confirmed?.length ?? 0;
      const totalLoadedDocs = (documentsData?.confirmed?.length ?? 0) + (documentsData?.not_confirmed?.length ?? 0);
      const totalDocs = documentsData?.total ?? 0;

      // For not_confirmed documents: if we've loaded all documents, we know the exact count
      // If we haven't loaded all documents, we can't know the exact not_confirmed count
      const hasLoadedAllDocs = totalLoadedDocs >= totalDocs;
      const hasMoreNotConfirmed = !hasLoadedAllDocs && hasMoreDocuments;

      return (
        <RecentlyUploaded
          data={documentsData?.not_confirmed ?? []}
          refresh={refresh}
          setPausePolling={setPausePolling}
          onLoadMore={loadMoreDocuments}
          hasMore={hasMoreNotConfirmed}
          isLoadingMore={isLoadingMore}
          totalCount={hasLoadedAllDocs ? notConfirmedCount : undefined} // Only show total if we know it's accurate
          markUserActive={markUserActive}
        />
      );
    },
    [documentsData, refresh, setPausePolling, loadMoreDocuments, isLoadingMore, markUserActive, hasMoreDocuments]
  );

  // We don't need the excelData anymore as we're using a specialized export function

  // Handle document selection from chat
  const handleDocumentSelectFromChat = (documentId: string, confirmationStatus?: string) => {
    console.log('Chat document click - Document ID:', documentId, 'Status:', confirmationStatus);

    // Find the document in the current documents data
    const allDocuments = [
      ...(documentsData?.confirmed || []),
      ...(documentsData?.not_confirmed || [])
    ];

    console.log('Available documents:', allDocuments.map(doc => ({ id: doc.id, name: doc.new_file_name || doc.original_filename })));

    const document = allDocuments.find(doc => doc.id === documentId);
    if (document) {
      console.log('Document found:', document.new_file_name || document.original_filename);

      // Check confirmation status - use document's actual status if not provided from chat
      const actualStatus = confirmationStatus || (documentsData?.confirmed?.some(d => d.id === documentId) ? 'confirmed' : 'not_confirmed');

      if (actualStatus === 'confirmed') {
        // For confirmed documents, ensure we're on Classifications tab and select the document
        console.log('Selecting confirmed document in Classifications tab');
        if (activeTabKey !== "2") {
          console.log('Switching to Classifications tab');
          setActiveTabKey("2"); // Switch to Classifications tab only if not already there
        }
        setCurSelectedDoc(document);
        // The DocmentDetail component will handle the preview (either existing or new via useEffect)
      } else {
        // For unconfirmed documents, ensure we're on All uploads tab and show preview modal
        console.log('Showing preview modal for unconfirmed document');
        if (activeTabKey !== "1") {
          console.log('Switching to All uploads tab');
          setActiveTabKey("1"); // Switch to All uploads tab only if not already there
        }
        setPreviewDocument(document);
        getPreviewUrl(documentId);
        setPreviewModalVisible(true);
      }
    } else {
      console.warn('Document not found with ID:', documentId);
    }
  };

  const documentContent = useMemo(() => {
    // Always show both tabs unless both are empty
    const items: TabsProps["items"] = [
      {
        key: "1",
        label: "All uploads",
        children: recentlyUploadedCom,
      },
      {
        key: "2",
        label: "Classification",
        children: docDetailCom,
      },
    ];

    return <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} items={items} />;
  }, [docDetailCom, recentlyUploadedCom, activeTabKey]);

  return (
    <div className={styles.container}>
      <CustomBreadcrumb
        separator=">"
        items={[
          {
            title: <a href="/">My properties</a>,
          },
          {
            title: name,
          },
        ]}
        btns={
          <Space size={16}>
            {isLoading ? (
              <div className={styles.buttonPlaceholder}></div>
            ) : (
              <>
                <Space>
                  {/* Refresh button temporarily hidden - functionality still available */}
                  {false && (
                    <Tooltip title="Refresh documents">
                      <Button
                        icon={<SyncOutlined spin={isRefreshing} />}
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        loading={isRefreshing}
                      >
                        Refresh
                      </Button>
                    </Tooltip>
                  )}
                  {/* Polling controls temporarily hidden - logic still active */}
                  {false && (
                    <Tooltip title={`${pollingEnabled ? 'Disable' : 'Enable'} automatic API polling`}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Switch
                          checkedChildren={<ApiOutlined />}
                          unCheckedChildren={<ApiOutlined />}
                          checked={pollingEnabled}
                          onChange={togglePolling}
                          size="small"
                        />
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
                          Auto-refresh {pollingEnabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </Tooltip>
                  )}
                </Space>
                <Button
                  disabled={isEmpty || exportLoading}
                  loading={exportLoading}
                  className={isEmpty ? styles.disabledButton : ""}
                  onClick={async () => {
                    if (exportLoading) return; // Prevent multiple clicks

                    setExportLoading(true);
                    try {
                      // Combine confirmed and not_confirmed documents
                      const allDocuments = [
                        ...(documentsData?.confirmed || []),
                        ...(documentsData?.not_confirmed || []),
                      ];

                      if (allDocuments.length > 0) {
                        // The export function will filter for confirmed documents
                        await exportDocumentsToExcel(name || "dataroom", allDocuments);
                        message.success("Export completed successfully");
                      } else {
                        message.info("No documents available to export");
                      }
                    } catch (error) {
                      message.error("Failed to export documents");
                    } finally {
                      setExportLoading(false);
                    }
                  }}
                >
                  <FileTextOutlined />
                  Export to Excel
                </Button>
              </>
            )}
            <Button
              icon={<img src={customChatIcon} alt="chat" style={{ width: 16, height: 16 }} />}
              onClick={() => setChatVisible(!chatVisible)}
              type={chatVisible ? "primary" : "default"}
            >
              Ask Easi
            </Button>
            <Button type="primary" onClick={() => setVisible(true)}>
              <UploadOutlined />
              Upload files
            </Button>
          </Space>
        }
      />
      <div className={styles.contentWithChat}>
        <div className={styles.mainContent}>
          {isLoading ? (
            // 正在加载
            <div className={styles.loadingContainer}>
              <Spin size="large" tip="Loading documents..." />
            </div>
          ) : isEmpty ? (
            // 没有文件
            <EmptyState userName={userInfo?.displayName} />
          ) : (
            documentContent
          )}
        </div>

        {/* Chat Sidebar - part of layout flow */}
        {chatVisible && (
          <ChatSidebar
            dataroomId={id!}
            dataroomName={name || 'Property'}
            isVisible={chatVisible}
            onToggle={() => setChatVisible(!chatVisible)}
            onDocumentSelect={handleDocumentSelectFromChat}
            onRefreshDocuments={refresh}
          />
        )}
      </div>

      {visible && (
        <UploadModal visible={visible} setVisible={setVisible} id={id!} onSuccess={refresh} />
      )}

      {/* Document Preview Modal */}
      <Modal
        title={`Preview: ${previewDocument?.new_file_name || previewDocument?.original_filename || 'Document'}`}
        open={previewModalVisible}
        onCancel={() => {
          setPreviewModalVisible(false);
          setPreviewDocument(null);
        }}
        footer={null}
        width="90%"
        style={{ top: 20 }}
        styles={{ body: { height: '80vh', padding: 0 } }}
      >
        {previewData?.preview_url ? (
          <iframe
            src={previewData.preview_url}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title="Document Preview"
          />
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%'
          }}>
            <Spin size="large" />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PropertyDetail;
