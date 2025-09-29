import CustomBreadcrumb from "@/components/CustomBreadcrumb";
import { FileTextOutlined, UploadOutlined, SyncOutlined, ApiOutlined } from "@ant-design/icons";
import customChatIcon from "@/assets/Easi.svg"; // Replace with your actual icon path
import { Button, Space, Spin, Tabs, TabsProps, message, Tooltip, Switch, Modal } from "antd";
import styles from "./index.module.less";
import EmptyState from "./components/EmptyState";
import UploadModal from "./components/UploadModal";
import ChatSidebar from "./components/ChatSidebar";
import { useContext, useMemo, useState, useEffect } from "react";
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
import { DoucementInfo } from "@/utils/request/types";
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

  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get("id");

  const { data } = useRequest(() => getDataroomDetail(id ?? ""), {
    ready: !!id,
  });

  const { name } = data || {};
  const userInfo = useContext(UserInfoContext);

  const {
    data: documentsData,
    loading: documentsLoading,
    refresh,
    run: fetchDocuments
  } = useRequest(() => getDataroomDocuments(id ?? ""), {
    ready: !!id && !pausePolling,
    pollingInterval: pollingEnabled ? 10 * 1000 : undefined, // Increased from 5s to 10s to reduce server load
    onFinally: () => {
      console.log("Documents data fetched");
      setHasInit(true);
      setIsRefreshing(false);
    },
    manual: pausePolling, // Don't poll when paused
  });

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
        fetchDocuments();
      }, 60 * 1000); // Poll every 60 seconds when user is making selections to reduce server load
    }

    return () => {
      if (pollingTimer) {
        clearInterval(pollingTimer);
      }
    };
  }, [pausePolling, id, fetchDocuments, pollingEnabled]);

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
    () => (
      <DocmentDetail
        documentsData={documentsData}
        documentsLoading={isLoading}
        curSelectedDoc={curSelectedDoc}
        setCurSelectedDoc={setCurSelectedDoc}
        refresh={refresh}
      />
    ),
    [curSelectedDoc, documentsData, isLoading, refresh]
  );

  const recentlyUploadedCom = useMemo(
    () => (
      <RecentlyUploaded
        data={documentsData?.not_confirmed ?? []}
        refresh={refresh}
        setPausePolling={setPausePolling}
      />
    ),
    [documentsData, refresh, setPausePolling]
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
