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
}

const RecentlyUploaded: React.FC<RecentlyUploadedProps> = (props) => {
  const { data, refresh } = props;
  const [form] = useForm();
  const [changedCategories, setChangedCategories] = useState<Record<string, boolean>>({});

  const { data: cateData } = useRequest(getClassificationCate);

  // Initialize form values and reset changed categories when data changes
  useEffect(() => {
    const initialValues: Record<string, string> = {};

    data.forEach(item => {
      initialValues[`cate_${item.id}`] = item.classification_label;
    });

    form.setFieldsValue(initialValues);
    setChangedCategories({});
  }, [data, form]);

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
            options: cateData?.categories?.map((item) => ({
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
              defaultValue={predicted}
              onChange={(value) => {
                setChangedCategories(prev => ({
                  ...prev,
                  [id]: value !== predicted
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
                    setChangedCategories(prev => ({
                      ...prev,
                      [id]: false
                    }));
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
