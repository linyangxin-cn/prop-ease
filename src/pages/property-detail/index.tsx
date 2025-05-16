import CustomBreadcrumb from "@/components/CustomBreadcrumb";
import { FileTextOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Space, Spin, Tabs, TabsProps } from "antd";
import styles from "./index.module.less";
import EmptyState from "./components/EmptyState";
import CategorizingFiles from "./components/CategorizingFiles";
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

const PropertyDetail: React.FC = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const { isCategorizing } = useCategorizingContext();

  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get("id");

  const { data } = useRequest(() => getDataroomDetail(id ?? ""), {
    ready: !!id,
  });

  const { name } = data || {};
  const { data: userInfo } = useRequest(getUserInfo);

  const { data: documentsData, loading: documentsLoading } = useRequest(
    () => getDataroomDocuments(id ?? ""),
    {
      ready: !!id,
    }
  );

  const isEmpty = useMemo(() => {
    return (
      !documentsLoading &&
      (!documentsData?.not_confirmed ||
        documentsData.not_confirmed.length === 0)
    );
  }, [documentsData?.not_confirmed, documentsLoading]);

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "All uploads",
      children: <RecentlyUploaded data={documentsData?.not_confirmed ?? []} />,
    },
    {
      key: "2",
      label: "Classification",
      children: (
        <DocmentDetail
          documentsData={documentsData}
          documentsLoading={documentsLoading}
        />
      ),
    },
  ];

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
      ) : isCategorizing ? (
        // 正在分类
        <CategorizingFiles />
      ) : isEmpty ? (
        // 没有文件
        <EmptyState userName={userInfo?.displayName} />
      ) : documentsData?.not_confirmed ? (
        // 存在未确认文件
        <Tabs defaultActiveKey="1" items={items}></Tabs>
      ) : (
        <DocmentDetail
          documentsData={documentsData}
          documentsLoading={documentsLoading}
        />
      )}
      {visible && (
        <UploadModal visible={visible} setVisible={setVisible} id={id!} />
      )}
    </div>
  );
};

export default PropertyDetail;
