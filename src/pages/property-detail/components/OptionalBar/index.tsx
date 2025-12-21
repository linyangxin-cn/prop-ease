import FormCheckBox from "@/components/form/FormCheckBox";
import {
  deleteDocument,
  feedback,
  confirmClassificationCate,
} from "@/utils/request/request-utils";
import { DoucementInfo, GetClassificationCateResponse } from "@/utils/request/types";
import {
  DeleteOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Divider, Form, message, Modal, Select, Button, Tooltip } from "antd";
import { useState, useEffect } from "react";
import { Key } from "antd/es/table/interface";

interface OptionalBarProps {
  setShowInfo: React.Dispatch<React.SetStateAction<boolean>>;
  curSelectedDoc: DoucementInfo | undefined;
  refresh: () => void;
  cateData?: GetClassificationCateResponse;
  setExpandedKeys?: React.Dispatch<React.SetStateAction<Key[]>>;
}

const OptionalBar: React.FC<OptionalBarProps> = (props) => {
  const { setShowInfo, curSelectedDoc, refresh, cateData, setExpandedKeys } = props;
  const { original_filename, new_file_name, id, user_label, classification_label } = curSelectedDoc || {};
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [categoryChangeLoading, setCategoryChangeLoading] = useState(false);

  const [visible, setVisible] = useState(false);

  // Get the current category (user_label if available, otherwise classification_label)
  const currentCategory = user_label || classification_label || "";

  // Track selected category (before confirmation)
  const [selectedCategory, setSelectedCategory] = useState<string>(currentCategory);

  // Update selectedCategory when document changes
  useEffect(() => {
    setSelectedCategory(currentCategory);
  }, [currentCategory]);

  const onModalConfirm = () => {
    const formValues = form.getFieldsValue();
    if (id) {
      setLoading(true);
      feedback(id, {
        ratingType: "negative",
        ...formValues,
      })
        .then(() => {
          message.success("Feedback submitted successfully. Thank you!");
          setVisible(false);
        })
        .catch(() => null)
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const handleConfirmCategory = async () => {
    if (!id || !selectedCategory || categoryChangeLoading || selectedCategory === currentCategory) return;

    setCategoryChangeLoading(true);
    try {
      await confirmClassificationCate({
        id,
        userLabel: selectedCategory,
      });

      message.success("Category updated successfully!");

      // Refresh the document list to reflect the change
      refresh();

      // Auto-expand the new category in the tree
      if (setExpandedKeys) {
        const parts = selectedCategory.split("/");
        const category = parts[0];
        const subcategory = parts.length > 1 && parts[1] !== parts[0] ? parts[1] : null;

        const keysToExpand: Key[] = [`category-${category}`];
        if (subcategory) {
          keysToExpand.push(`subcategory-${category}-${subcategory}`);
        }

        setExpandedKeys(prev => {
          const newKeys = new Set([...prev, ...keysToExpand]);
          return Array.from(newKeys);
        });
      }
    } catch (error) {
      message.error("Failed to update category.");
    } finally {
      setCategoryChangeLoading(false);
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          margin: "10px 0",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flex: 1 }}>
          <div
            style={{
              fontSize: "18px",
              color: "0F141A",
              fontWeight: 700,
              minWidth: "200px",
            }}
          >
            {new_file_name || original_filename}
          </div>
          <Divider type="vertical" style={{ height: "24px" }} />
          {cateData?.categories && (
            <>
              <Select
                style={{ width: 400, minWidth: 300 }}
                value={selectedCategory}
                disabled={categoryChangeLoading}
                onChange={(value) => setSelectedCategory(value)}
                optionLabelProp="label"
                options={[
                  {
                    label: <span>Current</span>,
                    title: "Current",
                    options: [{
                      label: (
                        <Tooltip title={currentCategory} placement="right">
                          <span>{currentCategory}</span>
                        </Tooltip>
                      ),
                      value: currentCategory
                    }],
                  },
                  {
                    label: <span>All categories</span>,
                    title: "All categories",
                    options: cateData.categories
                      .filter(item => item !== currentCategory)
                      .map((item) => ({
                        label: (
                          <Tooltip title={item} placement="right">
                            <span>{item}</span>
                          </Tooltip>
                        ),
                        value: item,
                      })),
                  },
                ]}
              />
              <Button
                type="primary"
                loading={categoryChangeLoading}
                disabled={categoryChangeLoading || selectedCategory === currentCategory}
                onClick={handleConfirmCategory}
                style={{ marginRight: "20px" }}
              >
                Confirm
              </Button>
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: "15px" }}>
          <DeleteOutlined
            style={{ opacity: deleteLoading ? 0.5 : 1 }}
            onClick={() => {
              if (id && !deleteLoading) {
                Modal.confirm({
                  title: "Are you sure you want to delete this document?",
                  content: "This action cannot be undone.",
                  onOk: async () => {
                    setDeleteLoading(true);
                    try {
                      await deleteDocument(id);
                      message.success("Document deleted successfully.");
                      refresh();
                    } catch (error) {
                      message.error("Failed to delete document.");
                    } finally {
                      setDeleteLoading(false);
                    }
                  },
                });
              }
            }}
          />
          <InfoCircleOutlined
            onClick={() => {
              setShowInfo((_show) => !_show);
            }}
          />
        </div>
      </div>
      {visible && (
        <Modal
          onClose={() => setVisible(false)}
          open={visible}
          onOk={onModalConfirm}
          okButtonProps={{ loading }}
          title={
            <div>
              <span
                style={{
                  fontWeight: 700,
                }}
              >
                Tell us more
              </span>
              <span
                style={{
                  fontWeight: 400,
                  fontStyle: "italic",
                }}
              >
                -optional
              </span>
            </div>
          }
          onCancel={() => setVisible(false)}
        >
          <div
            style={{
              color: "0F141A",
              fontWeight: 700,
              padding: "15px 0 10px 0",
              borderTop: "1px solid #E8E8E8",
            }}
          >
            What did you dislike?
          </div>

          <Form form={form} layout="vertical">
            <Form.Item name="documentClassificationText">
              <FormCheckBox
                text="Document classification"
                placeholder="The classification should be..."
              />
            </Form.Item>
            <Form.Item name="documentAddressExtractionText">
              <FormCheckBox
                text="Document address extraction"
                placeholder="The address of the property should be"
              />
            </Form.Item>
            <Form.Item name="otherText">
              <FormCheckBox
                text="Others"
                placeholder="Enter additional comments"
              />
            </Form.Item>
          </Form>
        </Modal>
      )}
    </>
  );
};

export default OptionalBar;
