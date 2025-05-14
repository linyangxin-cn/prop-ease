import CustomBreadcrumb from "@/components/CustomBreadcrumb";
import {
  CloseOutlined,
  FileTextOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Space, Spin } from "antd";
import styles from "./index.module.less";
import EmptyState from "./components/EmptyState";
import CategorizingFiles from "./components/CategorizingFiles";
import UploadModal from "./components/UploadModal";
import { useMemo, useState, useEffect } from "react";
import { useCategorizingContext } from "./context/CategorizingContext";
import DirectoryTree from "antd/es/tree/DirectoryTree";
import { useRequest } from "ahooks";
import {
  getDataroomDetail,
  getDataroomDocuments,
  getDocumentsPreview,
  getUserInfo,
} from "@/utils/request/request-utils";
import { useLocation } from "react-router-dom";
import { DoucementInfo } from "@/utils/request/types";
import { Key } from "antd/es/table/interface";
import { organizeDocumentsByClassification } from "@/utils/classification";

const PropertyDetail: React.FC = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [curSelectedDoc, setCurSelectedDoc] = useState<DoucementInfo>();
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
      // We don't want to show categorizing screen after every document retrieval
      // It will only be shown after file uploads
    }
  );

  // Check if there are no documents in the dataroom
  // Only consider it empty if we've finished loading and there are no documents
  const isEmpty = useMemo(() => {
    return !documentsLoading && (!documentsData?.not_confirmed || documentsData.not_confirmed.length === 0);
  }, [documentsData?.not_confirmed, documentsLoading]);

  // Get user info for the greeting in the empty state
  const { data: userInfo } = useRequest(getUserInfo);

  // Categorizing state is now managed by the CategorizingContext

  const { data: previewData, run } = useRequest(
    (id: string) => getDocumentsPreview(id),
    {
      manual: true,
    }
  );

  const documensTreeData = useMemo(() => {
    if (!documentsData?.not_confirmed || documentsData.not_confirmed.length === 0) {
      return [];
    }
    return organizeDocumentsByClassification(documentsData.not_confirmed);
  }, [documentsData?.not_confirmed]);

  const { name } = data || {};

  const infoList = useMemo(() => {
    return [
      {
        title: "Original name",
        value: curSelectedDoc?.original_filename,
      },
      {
        title: "Type",
        value: curSelectedDoc?.content_type,
      },
      {
        title: "Classification",
        value: curSelectedDoc?.classification_label || "Unclassified",
      },
      {
        title: "Size",
        value: curSelectedDoc?.classification_score,
      },
      {
        title: "Uploaded",
        value: curSelectedDoc?.uploaded_at ? new Date(curSelectedDoc.uploaded_at).toLocaleDateString() : "",
      },
    ];
  }, [curSelectedDoc]);

  const onSelect = (keys: Key[]) => {
    // Skip if the selected key is a category or subcategory
    if (
      typeof keys[0] === 'string' &&
      (keys[0].toString().startsWith('category-') || keys[0].toString().startsWith('subcategory-'))
    ) {
      return;
    }

    const document = documentsData?.not_confirmed.find((item) => item.id === keys[0]);
    if (document) {
      setCurSelectedDoc(document);
      run(document.id);
    }
  };

  const onExpand = (keys: any, info: any) => {
    console.log("Trigger Expand", keys, info);
  };

  // Automatically select the first document when documents are loaded
  useEffect(() => {
    if (!documentsLoading && documentsData?.not_confirmed && documentsData.not_confirmed.length > 0 && !curSelectedDoc) {
      // Get the first document
      const firstDocument = documentsData.not_confirmed[0];

      // Set the selected document
      setCurSelectedDoc(firstDocument);

      // Load the preview for the first document
      run(firstDocument.id);
    }
  }, [documentsLoading, documentsData, curSelectedDoc, run]);

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
            {/* Export to Excel button - disabled when there are no documents or during categorizing */}
            {documentsLoading || isCategorizing ? (
              // Show a placeholder during loading or categorizing to maintain layout
              <div className={styles.buttonPlaceholder}></div>
            ) : (
              <Button
                disabled={isEmpty}
                className={isEmpty ? styles.disabledButton : ''}
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
        <div className={styles.content}>
        <div className={styles.contentLeft}>
          <div className={styles.contentTree}>
            <div className={styles.treeTitle}>Table of contents</div>
            <DirectoryTree
              multiple
              draggable
              defaultExpandAll
              onSelect={onSelect}
              onExpand={onExpand}
              treeData={documensTreeData}
              showIcon={false}
              blockNode
              className="document-tree"
            />
          </div>
          <div className={styles.previewContent}>
            {previewData?.preview_url ? (
              <iframe
                src={previewData?.preview_url}
                title={curSelectedDoc?.original_filename}
              />
            ) : curSelectedDoc ? (
              <div className={styles.loadingPreview}>
                <Spin size="large" tip="Loading preview..." />
              </div>
            ) : null}
          </div>
        </div>
        <div className={styles.contentRight}>
          <div className={styles.header}>
            <span>Information</span>
            <CloseOutlined style={{ color: "rgb(65,77,92)" }} />
          </div>
          {curSelectedDoc ? (
            infoList.map((item, index) => (
              <div key={index} className={styles.info}>
                <div className={styles.infoTitle}>{item.title}</div>
                <div className={styles.infoValue}>{item.value}</div>
              </div>
            ))
          ) : (
            <div className={styles.noDocumentSelected}>
              <div className={styles.noDocumentMessage}>
                Select a document to view its information
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {visible && (
        <UploadModal visible={visible} setVisible={setVisible} id={id!} />
      )}
    </div>
  );
};

export default PropertyDetail;
