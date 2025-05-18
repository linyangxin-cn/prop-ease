import {
  confirmClassificationCate,
  deleteDocument,
  getClassificationCate,
} from "@/utils/request/request-utils";
import { DoucementInfo } from "@/utils/request/types";
import { useRequest } from "ahooks";
import { Button, Form, message, Modal, Select, Table } from "antd";
import { useForm } from "antd/es/form/Form";
import { useMemo } from "react";

interface RecentlyUploadedProps {
  data: DoucementInfo[];
  refresh: () => void;
}

const RecentlyUploaded: React.FC<RecentlyUploadedProps> = (props) => {
  const { data, refresh } = props;
  const [form] = useForm();

  const { data: cateData } = useRequest(getClassificationCate);

  const tableData = useMemo(() => {
    return data.map((item, index) => ({
      ...data,
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
      render: (_: any, records: any, index: number) => {
        const record = records[index];
        const { id } = record;
        const predicted = record["classification_label"];
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
            />
          </Form.Item>
        );
      },
    },
    {
      title: "Actions",
      render: (_: any, records: any, index: number) => {
        const record = records[index];
        return (
          <div>
            <Button
              type="link"
              size="small"
              onClick={async () => {
                const formValues = form.getFieldsValue();
                const selectedCategory = formValues["cate_" + record.id];
                if (selectedCategory) {
                  const res = await confirmClassificationCate({
                    id: record.id,
                    userLabel: selectedCategory,
                  }).catch(() => null);
                  if (res) {
                    message.success("Category confirmed successfully.");
                    refresh();
                  } else {
                    message.error("Failed to confirm category.");
                  }
                } else {
                  message.error("Please select a category.");
                }
              }}
            >
              Confirm category
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
                if (record.id) {
                  Modal.confirm({
                    title: "Are you sure you want to delete this document?",
                    content: "This action cannot be undone.",
                    onOk: () => {
                      deleteDocument(record.id)
                        .then(() => {
                          message.success("Document deleted successfully.");
                          refresh();
                        })
                        .catch(() => null);
                    },
                  });
                }
              }}
            >
              delete
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
      />
    </Form>
  );
};

export default RecentlyUploaded;
