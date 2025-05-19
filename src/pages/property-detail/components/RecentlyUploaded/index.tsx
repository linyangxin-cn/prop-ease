import {
  confirmClassificationCate,
  deleteDocument,
  getClassificationCate,
} from "@/utils/request/request-utils";
import { DoucementInfo } from "@/utils/request/types";
import { useRequest } from "ahooks";
import { Button, Empty, Form, message, Modal, Select, Table } from "antd";
import { useForm } from "antd/es/form/Form";
import { useEffect, useMemo, useState } from "react";
import emptyIcon from "@/assets/empty-dataroom-icon.svg";

interface RecentlyUploadedProps {
  data: DoucementInfo[];
  refresh: () => void;
  setPausePolling: (pause: boolean) => void;
}

const RecentlyUploaded: React.FC<RecentlyUploadedProps> = (props) => {
  const { data, refresh, setPausePolling } = props;
  const [form] = useForm();
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

  const { data: cateData } = useRequest(getClassificationCate);

  // Initialize form values when data changes, but preserve user selections
  useEffect(() => {
    const initialValues: Record<string, string> = {};

    data.forEach(item => {
      const docId = `cate_${item.id}`;
      // If user has made a selection for this document, use that value
      // Otherwise, use the value from the API
      initialValues[docId] = userSelections[docId] || item.classification_label;

      // If this is a new document that wasn't in our selections yet,
      // make sure it's not marked as changed
      if (!userSelections[docId] && !changedCategories[item.id]) {
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
    }));
  }, [data]);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Status",
      dataIndex: "Status",
      key: "Status",
    },
    {
      title: "Predicted category",
      dataIndex: "classification_label",
      key: "classification_label",
      render: (_: any, record: any) => {
        if (!record) return null;

        const id = record.id;
        const predicted = record.PredictedCategory;

        if (!id || !predicted) return null;

        const options = [
          {
            label: <span>Predicted</span>,
            title: "Predicted",
            options: [{ label: <span>{predicted}</span>, value: predicted }],
          },
          {
            label: <span>All categories</span>,
            title: "All categories",
            options: cateData?.categories?.filter(item => item !== predicted).map((item) => ({
              label: <span>{item}</span>,
              value: item,
            })),
          },
        ];
        return (
          <Form.Item name={"cate_" + id}>
            <Select
              style={{ width: 400 }}
              options={options}
              // Use the value from form instead of defaultValue to ensure it shows the correct value
              // when the page is refreshed and userSelections has a value
              value={form.getFieldValue(`cate_${id}`)}
              onChange={(value) => {
                // When user makes a selection, pause polling to prevent overwriting
                setPausePolling(true);

                // Store the user's selection
                const fieldName = `cate_${id}`;
                setUserSelections(prev => ({
                  ...prev,
                  [fieldName]: value
                }));

                // Update the changed categories state
                // Compare with the original predicted category from the API
                setChangedCategories(prev => ({
                  ...prev,
                  [id]: value !== record.classification_label
                }));
              }}
            />
          </Form.Item>
        );
      },
    },
    {
      title: "Actions",
      render: (_: any, record: any) => {
        if (!record) return null;

        const id = record.id;
        if (!id) return null;

        return (
          <div>
            <Button
              type={changedCategories[id] ? "primary" : "link"}
              size="small"
              onClick={async () => {
                const formValues = form.getFieldsValue();
                const selectedCategory = formValues["cate_" + id];
                if (selectedCategory) {
                  const res = await confirmClassificationCate({
                    id: id,
                    userLabel: selectedCategory,
                  }).catch(() => null);
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
                  } else {
                    message.error("Failed to confirm category.");
                  }
                } else {
                  message.error("Please select a category.");
                }
              }}
            >
              {changedCategories[id] ? "Submit category" : "Confirm category"}
            </Button>
            <Button
              color="default"
              variant="link"
              onClick={() => {
                Modal.info({
                  title: "Document preview",
                  width: 1000,
                  height: 600,
                  icon: null,
                  content: (
                    <iframe
                      src={record.preview_url}
                      title="Document preview"
                      style={{ width: "100%", height: "600px" }}
                    />
                  ),
                });
              }}
            >
              View
            </Button>
            <Button
              color="default"
              variant="link"
              onClick={() => {
                Modal.confirm({
                  title: "Are you sure you want to delete this document?",
                  content: "This action cannot be undone.",
                  onOk: () => {
                    deleteDocument(id)
                      .then(() => {
                        message.success("Document deleted successfully.");
                        refresh();
                      })
                      .catch(() => null);
                  },
                });
              }}
            >
              Delete
            </Button>
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
        key={"id"}
        locale={{
          emptyText: (
            <Empty
              description="You haven’t uploaded anything recently."
              image={emptyIcon}
            />
          ),
        }}
      />
    </Form>
  );
};

export default RecentlyUploaded;
