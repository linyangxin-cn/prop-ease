import { DoucementInfo } from "@/utils/request/types";
import { Button, Table } from "antd";
import { useMemo } from "react";

interface RecentlyUploadedProps {
  data: DoucementInfo[];
}

const RecentlyUploaded: React.FC<RecentlyUploadedProps> = (props) => {
  const { data } = props;

  const tableData = useMemo(() => {
    return data.map((item, index) => ({
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
      render: () => {
        return (
          <div>
            <Button type="link" size="small">
              Confirm category
            </Button>
            <Button color="default" variant="link">
              Change category
            </Button>
          </div>
        );
      },
    },
  ];

  return <Table columns={columns} dataSource={tableData} pagination={false} />;
};

export default RecentlyUploaded;
