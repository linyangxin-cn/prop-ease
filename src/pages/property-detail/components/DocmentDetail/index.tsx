import { CloseOutlined } from "@ant-design/icons";
import { Empty, Spin } from "antd";
import DirectoryTree from "antd/es/tree/DirectoryTree";
import OptionalBar from "../OptionalBar";
import styles from "./index.module.less";
import { DoucementInfo, GetDocumentsResponse } from "@/utils/request/types";
import { Key } from "antd/es/table/interface";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { organizeDocumentsByClassification } from "@/utils/classification";
import { useRequest } from "ahooks";
import { getDocumentsPreview } from "@/utils/request/request-utils";
import emptyIcon from "@/assets/empty-dataroom-icon.svg";
import { StructuredMetadata } from "@/components/StructuredMetadata";
import LoadMore from "@/components/LoadMore";

// Type for info list items
type InfoItem = {
  title: string;
  value: string | undefined;
  isSeparator?: boolean;
};

interface DocmentDetailProps {
  documentsData: GetDocumentsResponse | undefined;
  documentsLoading: boolean;
  curSelectedDoc: DoucementInfo | undefined;
  setCurSelectedDoc: React.Dispatch<
    React.SetStateAction<DoucementInfo | undefined>
  >;
  refresh: () => void;
  // Pagination props
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  totalConfirmed?: number;
}

const DocmentDetail: React.FC<DocmentDetailProps> = (props) => {
  const {
    documentsData,
    documentsLoading,
    curSelectedDoc,
    setCurSelectedDoc,
    refresh,
    onLoadMore,
    hasMore = false,
    isLoadingMore = false,
    totalConfirmed = 0,
  } = props;

  const [showInfo, setShowInfo] = useState(false);
  const [treeWidth, setTreeWidth] = useState(() => {
    // Load saved width from localStorage, default to 320
    const savedWidth = localStorage.getItem('classificationTreeWidth');
    return savedWidth ? parseInt(savedWidth, 10) : 320;
  });
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // Handle mouse move for resizing
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left;

    // Apply constraints
    const minWidth = 250;
    const maxWidth = Math.min(600, containerRect.width * 0.7); // Max 70% of container width

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setTreeWidth(newWidth);
      // Save to localStorage
      localStorage.setItem('classificationTreeWidth', newWidth.toString());
    }
  }, [isResizing]);

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add event listeners for mouse move and up
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

  const documensTreeData = useMemo(() => {
    if (
      !documentsData?.confirmed ||
      documentsData.confirmed.length === 0
    ) {
      return [];
    }
    return organizeDocumentsByClassification(documentsData.confirmed);
  }, [documentsData?.confirmed]);

  // Create fallback metadata for documents without structured metadata
  const fallbackMetadata = useMemo(() => {
    if (!curSelectedDoc) return null;

    const formatDate = (dateString: string) => {
      try {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      } catch {
        return dateString;
      }
    };

    const basicInfo: InfoItem[] = [
      {
        title: "Name",
        value: curSelectedDoc?.original_filename,
      },
      {
        title: "Type",
        value: curSelectedDoc?.content_type,
      },
      {
        title: "Category",
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
          ? formatDate(curSelectedDoc.uploaded_at)
          : "",
      },
    ];

    // Add extracted metadata if available
    const metadata = curSelectedDoc?.document_metadata;
    const metadataInfo: InfoItem[] = [];

    if (metadata) {
      // Add a separator for metadata section
      metadataInfo.push({
        title: "separator",
        value: "Document Details",
        isSeparator: true,
      });

      // Add key metadata fields
      const keyFields = [
        { key: 'title', label: 'Title' },
        { key: 'address', label: 'Address' },
        { key: 'report_date', label: 'Report Date', format: 'date' },
        { key: 'expiry_date', label: 'Expiry Date', format: 'date' },
        { key: 'report_reference_id', label: 'Reference ID' },
        { key: 'language', label: 'Language', format: 'upper' },
        { key: 'unit', label: 'Unit' },
      ];

      keyFields.forEach(({ key, label, format }) => {
        const value = metadata[key];
        if (value) {
          let formattedValue = value;
          if (format === 'date') {
            formattedValue = formatDate(value);
          } else if (format === 'upper') {
            formattedValue = value.toUpperCase();
          }

          metadataInfo.push({
            title: label,
            value: formattedValue,
          });
        }
      });

      // Add other fields dynamically
      // Exclude internal/structural fields that shouldn't be displayed
      const displayedFields = new Set([
        'title', 'address', 'report_date', 'expiry_date',
        'report_reference_id', 'language', 'unit', 'long_summary',
        // Folder structure fields (internal use only)
        'folder_path', 'folder_hierarchy', 'folder_depth'
      ]);

      Object.entries(metadata).forEach(([key, value]) => {
        if (!displayedFields.has(key) && value !== null && value !== undefined && value !== '') {
          const displayKey = key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          metadataInfo.push({
            title: displayKey,
            value: typeof value === 'string' ? value : JSON.stringify(value),
          });
        }
      });
    }

    return [...basicInfo, ...metadataInfo];
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

  // Load preview when curSelectedDoc changes (e.g., from chat selection)
  useEffect(() => {
    if (curSelectedDoc) {
      getPreviewUrl(curSelectedDoc.id);
    }
  }, [curSelectedDoc, getPreviewUrl]);

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
    <div
      className={`${styles.content} ${isResizing ? styles.resizing : ''}`}
      ref={containerRef}
    >
      <div className={styles.contentLeft}>
        <div
          className={styles.contentTree}
          style={{ width: `${treeWidth}px` }}
        >
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

          {/* Load More component for confirmed documents */}
          {onLoadMore && documentsData?.confirmed && documentsData.confirmed.length > 0 && (
            <LoadMore
              loading={isLoadingMore}
              hasMore={hasMore}
              onLoadMore={onLoadMore}
              currentCount={documentsData.confirmed.length}
              totalCount={totalConfirmed || documentsData.confirmed.length} // Use current count if total unknown
              itemName="documents"
              size="small"
              className={styles.treeLoadMore}
            />
          )}
        </div>
        <div
          className={styles.resizeHandle}
          onMouseDown={handleMouseDown}
          title="Drag to resize"
        />
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
            // Use structured metadata if available, otherwise fall back to old format
            curSelectedDoc.structured_metadata ? (
              <StructuredMetadata
                metadata={curSelectedDoc.structured_metadata}
                className={styles.structuredMetadata}
              />
            ) : (
              // Fallback to old format for backward compatibility
              fallbackMetadata?.map((item, index) => (
                item.isSeparator ? (
                  <div key={index} className={styles.separator}>
                    <div className={styles.separatorLine}></div>
                    <div className={styles.separatorText}>{item.value}</div>
                    <div className={styles.separatorLine}></div>
                  </div>
                ) : (
                  <div key={index} className={styles.info}>
                    <div className={styles.infoTitle}>{item.title}</div>
                    <div className={styles.infoValue}>{item.value}</div>
                  </div>
                )
              ))
            )
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
