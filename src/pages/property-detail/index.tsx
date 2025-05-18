import CustomBreadcrumb from "@/components/CustomBreadcrumb";
import { FileTextOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Space, Spin, Tabs, TabsProps, message } from "antd";
import styles from "./index.module.less";
import EmptyState from "./components/EmptyState";
import UploadModal from "./components/UploadModal";
import { useContext, useMemo, useState } from "react";
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
  } = useRequest(() => getDataroomDocuments(id ?? ""), {
    ready: !!id,
    pollingInterval: 5 * 1000,
    onFinally: () => {
      console.log("onFinally");
      setHasInit(true);
    },
  });

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
      />
    ),
    [documentsData, refresh]
  );

  // We don't need the excelData anymore as we're using a specialized export function

  const documentContent = useMemo(() => {
    if (!isNotConfirmedEmpty && !isConfirmedEmpty) {
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
    }
    if (isNotConfirmedEmpty) {
      return docDetailCom;
    }
    if (isConfirmedEmpty) {
      return recentlyUploadedCom;
    }
    return <></>;
  }, [
    docDetailCom,
    isConfirmedEmpty,
    isNotConfirmedEmpty,
    recentlyUploadedCom,
  ]);

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
