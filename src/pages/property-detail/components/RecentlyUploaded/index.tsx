import { DoucementInfo } from "@/utils/request/types";
import { Button, Modal, Table } from "antd";
import { useMemo } from "react";

interface RecentlyUploadedProps {
  data: DoucementInfo[];
}

const RecentlyUploaded: React.FC<RecentlyUploadedProps> = (props) => {
  const { data } = props;

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
      dataIndex: "Predicted category",
      key: "Predicted category",
      render: (text: string) => {
        return <span>{text || "-"}</span>;
      },
    },
    {
      title: "Actions",
      render: (_: any, records: any, index: number) => {
        const record = records[index];

        return (
          <div>
            <Button type="link" size="small">
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
                      style={{ width: "100%", height: '600px' }}
                    />
                  ),
                });
              }}
            >
              View
            </Button>
          </div>
        );
      },
    },
  ];

  return <Table columns={columns} dataSource={tableData} pagination={false} />;
};

export default RecentlyUploaded;
