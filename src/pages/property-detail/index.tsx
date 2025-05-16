import CustomBreadcrumb from "@/components/CustomBreadcrumb";
import { FileTextOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Space, Spin } from "antd";
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

const PropertyDetail: React.FC = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const { isCategorizing } = useCategorizingContext();

  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get("id");

  const { data } = useRequest(() => getDataroomDetail(id ?? ""), {
    ready: !!id,
  });

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

  const { data: userInfo } = useRequest(getUserInfo);

  const { name } = data || {};

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
        <div className={styles.loadingContainer}>
          <Spin size="large" tip="Loading documents..." />
        </div>
      ) : isCategorizing ? (
        <CategorizingFiles />
      ) : isEmpty ? (
        <EmptyState userName={userInfo?.displayName} />
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
