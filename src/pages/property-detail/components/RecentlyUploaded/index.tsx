import {
  confirmClassificationCate,
  deleteDocument,
  getDocumentsPreview,
} from "@/utils/request/request-utils";
import { DoucementInfo, GetClassificationCateResponse } from "@/utils/request/types";
import { useRequest } from "ahooks";
import { Button, Empty, Form, message, Modal, Select, Table, Spin, Dropdown, Tag, Tooltip } from "antd";
import { useForm } from "antd/es/form/Form";
import { useEffect, useMemo, useState, useCallback } from "react";
import { MoreOutlined, FileOutlined } from "@ant-design/icons";
import emptyIcon from "@/assets/empty-dataroom-icon.svg";
import microsoftShareIcon from "@/assets/microsoft-share.svg";
import styles from "./index.module.less";
import LoadMore from "@/components/LoadMore";
import { DocumentViewer } from "@/components/DocumentViewers";

interface RecentlyUploadedProps {
  data: DoucementInfo[];
  refresh: () => void;
  setPausePolling: (pause: boolean) => void;
  // Pagination props
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  totalCount?: number;
  // User activity tracking
  markUserActive?: () => void;
  // Category data from parent
  cateData?: GetClassificationCateResponse;
}

const RecentlyUploaded: React.FC<RecentlyUploadedProps> = (props) => {
  const {
    data,
    refresh,
    setPausePolling,
    onLoadMore,
    hasMore = false,
    isLoadingMore = false,
    totalCount = 0,
    markUserActive,
    cateData
  } = props;
  const [form] = useForm();

  // Store loading states for each document's confirm button
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Store loading states for each document's delete button
  const [deleteLoadingStates, setDeleteLoadingStates] = useState<Record<string, boolean>>({});

  // Store changed categories state in localStorage too
  const [changedCategories, setChangedCategories] = useState<Record<string, boolean>>(() => {
    const savedChangedCategories = localStorage.getItem('changedDocumentCategories');
    return savedChangedCategories ? JSON.parse(savedChangedCategories) : {};
  });

  // Store user selections that haven't been submitted yet
  // Use localStorage to persist selections across component remounts
  const [userSelections, setUserSelections] = useState<Record<string, string>>(() => {
    const savedSelections = localStorage.getItem('userDocumentSelections');
    return savedSelections ? JSON.parse(savedSelections) : {};
  });

  // Preview modal state
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DoucementInfo | null>(null);

  // Request hook for document preview
  const { data: previewData, run: getPreviewUrl } = useRequest(
    (documentId: string) => getDocumentsPreview(documentId),
    {
      manual: true,
    }
  );

  // Debounced confirm function to prevent multiple rapid clicks
  const handleConfirmCategory = useCallback(async (id: string) => {
    // Prevent multiple clicks on the same document
    if (loadingStates[id]) {
      return;
    }

    setLoadingStates(prev => ({ ...prev, [id]: true }));

    // Mark user as active to pause polling during document confirmation
    markUserActive?.();

    try {
      const formValues = form.getFieldsValue();
      const selectedCategory = formValues["cate_" + id];

      if (!selectedCategory) {
        message.error("Please select a category.");
        return;
      }

      const res = await confirmClassificationCate({
        id: id,
        userLabel: selectedCategory,
      });

      if (res) {
        message.success(changedCategories[id]
          ? "Category updated successfully."
          : "Category confirmed successfully.");

        // Clear the user selection for this document since it's now submitted
        setUserSelections(prev => {
          const newSelections = { ...prev };
          delete newSelections[`cate_${id}`];
          return newSelections;
        });

        // Reset the changed flag and remove it from localStorage
        setChangedCategories(prev => {
          const newChangedCategories = { ...prev };
          delete newChangedCategories[id];
          return newChangedCategories;
        });

        // Resume polling after submission
        setPausePolling(false);

        // Refresh the data
        refresh();
      }
    } catch (error) {
      message.error("Failed to confirm category.");
    } finally {
      setLoadingStates(prev => ({ ...prev, [id]: false }));
    }
  }, [form, changedCategories, loadingStates, setUserSelections, setChangedCategories, setPausePolling, refresh, markUserActive]);

  // Initialize form values when data changes, but preserve user selections
  useEffect(() => {
    const initialValues: Record<string, string> = {};

    data.forEach(item => {
      const docId = `cate_${item.id}`;
      // If user has made a selection for this document, use that value
      // Otherwise, use user_label if available, then fall back to classification_label
      initialValues[docId] = userSelections[docId] || item.user_label || item.classification_label;

      // Initialize changedCategories state for each document if not already set
      // This ensures the button text updates correctly on first selection
      if (changedCategories[item.id] === undefined) {
        setChangedCategories(prev => ({
          ...prev,
          [item.id]: false
        }));
      }
    });

    form.setFieldsValue(initialValues);
  }, [data, form, userSelections, changedCategories]);

  // Save user selections to localStorage when they change
  useEffect(() => {
    localStorage.setItem('userDocumentSelections', JSON.stringify(userSelections));
  }, [userSelections]);

  // Save changed categories to localStorage when they change
  useEffect(() => {
    localStorage.setItem('changedDocumentCategories', JSON.stringify(changedCategories));
  }, [changedCategories]);

  const tableData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      id: item.id,
      name: item.original_filename,
      Status: item.status,
      PredictedCategory: item.classification_label,
      // Add FinalCategory to represent the user_label if available
      FinalCategory: item.user_label || item.classification_label,
    }));
  }, [data]);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: "30%",
      render: (text: string, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            type="link"
            className={styles.fileNameLink}
            style={{ padding: 0, height: 'auto', textAlign: 'left' }}
            onClick={() => {
              setPreviewDocument(record);
              getPreviewUrl(record.id);
              setPreviewModalVisible(true);
            }}
          >
            {text}
          </Button>
          {/* Upload source badge */}
          {record.upload_source === 'sharepoint' ? (
            <Tag
              icon={<img src={microsoftShareIcon} alt="" style={{ width: 12, height: 12 }} />}
              color="blue"
            >
              SharePoint
            </Tag>
          ) : (
            <Tag
              icon={<FileOutlined />}
              color="default"
            >
              Local
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "Status",
      key: "Status",
      width: "12%",
    },
    {
      title: "Category",
      dataIndex: "classification_label",
      key: "classification_label",
      width: "40%",
      render: (_: any, record: any) => {
        if (!record) return null;

        const id = record.id;
        const predicted = record.PredictedCategory;
        const finalCategory = record.FinalCategory;

        if (!id || !predicted) return null;

        const options = [
          {
            label: <span>{record.user_label ? "Current" : "Predicted"}</span>,
            title: record.user_label ? "Current" : "Predicted",
            options: [{
              label: (
                <Tooltip title={finalCategory} placement="right">
                  <span>{finalCategory}</span>
                </Tooltip>
              ),
              value: finalCategory
            }],
          },
          {
            label: <span>All categories</span>,
            title: "All categories",
            options: cateData?.categories?.filter(item => item !== finalCategory).map((item) => ({
              label: (
                <Tooltip title={item} placement="right">
                  <span>{item}</span>
                </Tooltip>
              ),
              value: item,
            })),
          },
        ];
        return (
          <Form.Item name={"cate_" + id}>
            <Select
              style={{ width: '100%' }}
              className={styles.categorySelect}
              options={options}
              // Use the value from form instead of defaultValue to ensure it shows the correct value
              // when the page is refreshed and userSelections has a value
              value={form.getFieldValue(`cate_${id}`)}
              onChange={(value) => {
                // When user makes a selection, pause polling to prevent overwriting
                markUserActive?.();
                setPausePolling(true);

                // Store the user's selection
                const fieldName = `cate_${id}`;
                setUserSelections(prev => ({
                  ...prev,
                  [fieldName]: value
                }));

                // Update the changed categories state
                // Compare with the final category (user_label if available, otherwise classification_label)
                setChangedCategories(prev => ({
                  ...prev,
                  [id]: value !== record.FinalCategory
                }));
              }}
              // Custom dropdown render to show text from the end
              optionRender={(option) => (
                <div className="category-option">
                  <span className="category-text">
                    {option.label}
                  </span>
                </div>
              )}
            />
          </Form.Item>
        );
      },
    },
    {
      title: "Actions",
      width: "18%",
      render: (_: any, record: any) => {
        if (!record) return null;

        const id = record.id;
        if (!id) return null;

        const dropdownItems = [
          {
            key: 'delete',
            label: 'Delete',
            danger: true,
            onClick: () => {
              if (!deleteLoadingStates[id]) {
                Modal.confirm({
                  title: "Are you sure you want to delete this document?",
                  content: "This action cannot be undone.",
                  onOk: async () => {
                    setDeleteLoadingStates(prev => ({ ...prev, [id]: true }));
                    try {
                      await deleteDocument(id);
                      message.success("Document deleted successfully.");
                      refresh();
                    } catch (error) {
                      message.error("Failed to delete document.");
                    } finally {
                      setDeleteLoadingStates(prev => ({ ...prev, [id]: false }));
                    }
                  },
                });
              }
            },
          },
        ];

        return (
          <div className={styles.actionsContainer}>
            <Button
              type={changedCategories[id] ? "primary" : "link"}
              size="small"
              loading={loadingStates[id]}
              disabled={loadingStates[id]}
              onClick={() => handleConfirmCategory(id)}
              className={styles.confirmButton}
            >
              {loadingStates[id] ? (
                <Spin size="small" />
              ) : (
                changedCategories[id] ? "Submit category" : "Confirm category"
              )}
            </Button>
            <Dropdown
              menu={{ items: dropdownItems }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                className={styles.moreButton}
              />
            </Dropdown>
          </div>
        );
      },
    },
  ];

  return (
    <Form form={form}>
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={false}
        rowKey="id"
        className={styles.uploadsTable}
        locale={{
          emptyText: (
            <Empty
              description="You haven’t uploaded anything recently."
              image={emptyIcon}
            />
          ),
        }}
      />

      {/* Load More component for pagination */}
      {onLoadMore && data.length > 0 && (
        <LoadMore
          loading={isLoadingMore}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          currentCount={data.length}
          totalCount={totalCount || data.length} // Use current count if total unknown
          itemName="documents"
          size="middle"
        />
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
        width="80%"
        style={{ top: 20 }}
        styles={{ body: { height: '75vh', padding: 0 } }}
      >
        {previewData?.preview_url ? (
          <div style={{ height: '100%', width: '100%' }}>
            <DocumentViewer
              fileUrl={previewData.preview_url}
              filename={previewDocument?.new_file_name || previewDocument?.original_filename || 'Document'}
              contentType={previewData.content_type}
              fileSizeBytes={previewDocument?.file_size_bytes}
              onError={(error) => {
                console.error('Document viewer error:', error);
              }}
            />
          </div>
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
    </Form>
  );
};

export default RecentlyUploaded;
