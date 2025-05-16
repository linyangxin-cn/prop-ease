import { Table } from "antd";

interface RecentlyUploadedProps {}

const RecentlyUploaded: React.FC<RecentlyUploadedProps> = (props) => {
  const {} = props;

  const data = [
    {
      key: "1",
      name: "John Brown",
      Status: "Not categorized",
      "Predicted category": "N/A",
      Actions: <a>View</a>,
    },
    {
      key: "2",
      name: "Jim Green",
      Status: "Categorizing",
      "Predicted category": "N/A",
      Actions: <a>View</a>,
    },
    {
      key: "3",
      name: "Joe Black",
      Status: "Categorized",
      "Predicted category": "N/A",
      Actions: <a>View</a>,
    },
  ];

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
    },
    {
      title: "Actions",
      dataIndex: "Actions",
      key: "Actions",
    },
  ];

  return <Table columns={columns} dataSource={data} />;
};

export default RecentlyUploaded;
