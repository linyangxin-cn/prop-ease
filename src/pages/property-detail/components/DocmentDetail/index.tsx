import { CloseOutlined } from "@ant-design/icons";
import { Empty, Spin } from "antd";
import DirectoryTree from "antd/es/tree/DirectoryTree";
import OptionalBar from "../OptionalBar";
import styles from "./index.module.less";
import { DoucementInfo, GetDocumentsResponse } from "@/utils/request/types";
import { Key } from "antd/es/table/interface";
import { useEffect, useMemo, useState } from "react";
import { organizeDocumentsByClassification } from "@/utils/classification";
import { useRequest } from "ahooks";
import { getDocumentsPreview } from "@/utils/request/request-utils";
import emptyIcon from "@/assets/empty-dataroom-icon.svg";

interface RecentlyUploadedProps {
  documentsData: GetDocumentsResponse | undefined;
  documentsLoading: boolean;
  curSelectedDoc: DoucementInfo | undefined;
  setCurSelectedDoc: React.Dispatch<
    React.SetStateAction<DoucementInfo | undefined>
  >;
  refresh: () => void;
}

const DocmentDetail: React.FC<RecentlyUploadedProps> = (props) => {
  const {
    documentsData,
    documentsLoading,
    curSelectedDoc,
    setCurSelectedDoc,
    refresh,
  } = props;

  const [showInfo, setShowInfo] = useState(false);

  const documensTreeData = useMemo(() => {
    if (
      !documentsData?.confirmed ||
      documentsData.confirmed.length === 0
    ) {
      return [];
    }
    return organizeDocumentsByClassification(documentsData.confirmed);
  }, [documentsData?.confirmed]);

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
        value: curSelectedDoc?.user_label || "Unclassified",
      },
      {
        title: "Size",
        value: curSelectedDoc?.file_size_bytes
          ? `${Math.round(curSelectedDoc.file_size_bytes / 1024)} KB`
          : "Unknown",
      },
      {
        title: "Uploaded",
        value: curSelectedDoc?.uploaded_at
          ? new Date(curSelectedDoc.uploaded_at).toLocaleDateString()
          : "",
      },
    ];
  }, [curSelectedDoc]);

  const onSelect = (keys: Key[]) => {
    if (
      typeof keys[0] === "string" &&
      (keys[0].toString().startsWith("category-") ||
        keys[0].toString().startsWith("subcategory-"))
    ) {
      return;
    }

    const document = documentsData?.confirmed.find(
      (item) => item.id === keys[0]
    );
    if (document) {
      setCurSelectedDoc(document);
      getPreviewUrl(document.id);
    }
  };

  const onExpand = (keys: any, info: any) => {
    console.log("Trigger Expand", keys, info);
  };

  const { data: previewData, run: getPreviewUrl } = useRequest(
    (id: string) => getDocumentsPreview(id),
    {
      manual: true,
    }
  );

  useEffect(() => {
    if (
      !documentsLoading &&
      documentsData?.confirmed &&
      documentsData.confirmed.length > 0 &&
      !curSelectedDoc
    ) {
      const firstDocument = documentsData.confirmed[0];
      setCurSelectedDoc(firstDocument);
      getPreviewUrl(firstDocument.id);
    }
  }, [documentsLoading, documentsData, curSelectedDoc, getPreviewUrl, setCurSelectedDoc]);

  // Check if there are any confirmed documents
  const hasConfirmedDocuments = useMemo(() => {
    return documentsData?.confirmed && documentsData.confirmed.length > 0;
  }, [documentsData?.confirmed]);

  if (!hasConfirmedDocuments) {
    return (
      <div className={styles.emptyContainer}>
        <Empty
          description="No classifications available yet."
          image={emptyIcon}
        />
      </div>
    );
  }

  return (
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
            <>
              <OptionalBar
                setShowInfo={setShowInfo}
                curSelectedDoc={curSelectedDoc}
                refresh={refresh}
              />
              <iframe
                src={previewData?.preview_url}
                title={curSelectedDoc?.new_file_name || curSelectedDoc?.original_filename}
              />
            </>
          ) : curSelectedDoc ? (
            <div className={styles.loadingPreview}>
              <Spin size="large" tip="Loading preview..." />
            </div>
          ) : null}
        </div>
      </div>
      {showInfo && (
        <div className={styles.contentRight}>
          <div className={styles.header}>
            <span>Information</span>
            <CloseOutlined
              style={{ color: "rgb(65,77,92)" }}
              onClick={() => setShowInfo(false)}
            />
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
      )}
    </div>
  );
};

export default DocmentDetail;
