import CustomBreadcrumb from "@/components/CustomBreadcrumb";
import { FileTextOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Space, Spin, Tabs, TabsProps } from "antd";
import styles from "./index.module.less";
import EmptyState from "./components/EmptyState";
import UploadModal from "./components/UploadModal";
import { useMemo, useState } from "react";
import { useCategorizingContext } from "./context/CategorizingContext";
import { useRequest } from "ahooks";
import {
  getDataroomDetail,
  getDataroomDocuments,
  getUserInfo,
} from "@/utils/request/request-utils";
import { useLocation } from "react-router-dom";
import DocmentDetail from "./components/DocmentDetail";
import RecentlyUploaded from "./components/RecentlyUploaded";
import { exportExcel } from "@/utils/excel";
import { DoucementInfo } from "@/utils/request/types";

const PropertyDetail: React.FC = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const { isCategorizing } = useCategorizingContext();
  const [curSelectedDoc, setCurSelectedDoc] = useState<DoucementInfo>();

  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get("id");

  const { data } = useRequest(() => getDataroomDetail(id ?? ""), {
    ready: !!id,
  });

  const { name } = data || {};
  const { data: userInfo } = useRequest(getUserInfo);

  const {
    data: documentsData,
    loading: documentsLoading,
    refresh,
  } = useRequest(() => getDataroomDocuments(id ?? ""), {
    ready: !!id,
  });

  // 未分类列表为空
  const isNotConfirmedEmpty = useMemo(
    () =>
      !documentsLoading &&
      (!documentsData?.not_confirmed ||
        documentsData.not_confirmed.length === 0),
    [documentsData?.not_confirmed, documentsLoading]
  );

  // 分类列表为空
  const isConfirmedEmpty = useMemo(
    () =>
      !documentsLoading &&
      (!documentsData?.confirmed || documentsData.confirmed.length === 0),
    [documentsData?.confirmed, documentsLoading]
  );

  const isEmpty = useMemo(
    () => isNotConfirmedEmpty && isConfirmedEmpty,
    [isConfirmedEmpty, isNotConfirmedEmpty]
  );

  const docDetailCom = useMemo(
    () => (
      <DocmentDetail
        documentsData={documentsData}
        documentsLoading={documentsLoading}
        curSelectedDoc={curSelectedDoc}
        setCurSelectedDoc={setCurSelectedDoc}
        refresh={refresh}
      />
    ),
    [curSelectedDoc, documentsData, documentsLoading, refresh]
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

  const excelData = useMemo(() => {
    const documents = [
      ...(documentsData?.confirmed || []),
      ...(documentsData?.not_confirmed || []),
    ];
    if (documents.length === 0) {
      return [];
    }

    const header = Object.keys(documents[0]);
    const data: (number | string)[][] = documents.map((doc) => {
      return header.map((key) => doc[key as keyof DoucementInfo] ?? "");
    });

    return [header, ...data];
  }, [documentsData?.confirmed, documentsData?.not_confirmed]);

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
            {documentsLoading || isCategorizing ? (
              <div className={styles.buttonPlaceholder}></div>
            ) : (
              <Button
                disabled={isEmpty}
                className={isEmpty ? styles.disabledButton : ""}
                onClick={() => {
                  exportExcel("document-excel", excelData);
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
      {documentsLoading ? (
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
