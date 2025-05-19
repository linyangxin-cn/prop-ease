import CustomBreadcrumb from "@/components/CustomBreadcrumb";
import { FileTextOutlined, UploadOutlined, SyncOutlined, ApiOutlined } from "@ant-design/icons";
import { Button, Space, Spin, Tabs, TabsProps, message, Tooltip, Switch } from "antd";
import styles from "./index.module.less";
import EmptyState from "./components/EmptyState";
import UploadModal from "./components/UploadModal";
import { useContext, useMemo, useState, useEffect } from "react";
import { useRequest } from "ahooks";
import {
  getDataroomDetail,
  getDataroomDocuments,
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
    pollingInterval: pollingEnabled ? 5 * 1000 : undefined, // Only poll if enabled
    onFinally: () => {
      console.log("Documents data fetched");
      setHasInit(true);
      setIsRefreshing(false);
    },
    manual: pausePolling, // Don't poll when paused
  });

  // Save polling state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('documentsPollingEnabled', pollingEnabled.toString());
  }, [pollingEnabled]);

  // Effect to handle manual polling when paused
  useEffect(() => {
    let pollingTimer: NodeJS.Timeout | null = null;

    // If polling is paused but we still want to fetch occasionally and polling is enabled
    if (pausePolling && id && pollingEnabled) {
      // Set up a less frequent manual polling (every 30 seconds instead of 5)
      pollingTimer = setInterval(() => {
        fetchDocuments();
      }, 30 * 1000); // Poll every 30 seconds when user is making selections
    }

    return () => {
      if (pollingTimer) {
        clearInterval(pollingTimer);
      }
    };
  }, [pausePolling, id, fetchDocuments, pollingEnabled]);

  // Function to manually refresh data with visual feedback
  const handleRefresh = () => {
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

    return <Tabs defaultActiveKey="1" items={items} />;
  }, [docDetailCom, recentlyUploadedCom]);

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
                  <Tooltip title="Refresh documents">
                    <Button
                      icon={<SyncOutlined spin={isRefreshing} />}
                      onClick={handleRefresh}
                    >
                      Refresh
                    </Button>
                  </Tooltip>
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
                </Space>
                <Button
                  disabled={isEmpty}
                  className={isEmpty ? styles.disabledButton : ""}
                  onClick={() => {
                    // Combine confirmed and not_confirmed documents
                    const allDocuments = [
                      ...(documentsData?.confirmed || []),
                      ...(documentsData?.not_confirmed || []),
                    ];

                    if (allDocuments.length > 0) {
                      // The export function will filter for confirmed documents
                      exportDocumentsToExcel(name || "dataroom", allDocuments);
                    } else {
                      message.info("No documents available to export");
                    }
                  }}
                >
                  <FileTextOutlined />
                  Export to Excel
                </Button>
              </>
            )}
            <Button type="primary" onClick={() => setVisible(true)}>
              <UploadOutlined />
              Upload files
            </Button>
          </Space>
        }
      />
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
      {visible && (
        <UploadModal visible={visible} setVisible={setVisible} id={id!} />
      )}
    </div>
  );
};

export default PropertyDetail;
