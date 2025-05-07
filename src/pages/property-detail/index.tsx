import CustomBreadcrumb from "@/components/CustomBreadcrumb";
import {
  CloseOutlined,
  FileTextOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Empty, Space } from "antd";
import styles from "./index.module.less";
import emptyIcon from "@/assets/empty-icon.svg";
import UploadModal from "./components/UploadModal";
import { useState } from "react";
import DirectoryTree from "antd/es/tree/DirectoryTree";
import { useRequest } from "ahooks";
import { getDataroomDetail } from "@/utils/request/request-utils";
import { useLocation } from "react-router-dom";

const treeData = [
  {
    title: "parent 0",
    key: "0-0",
    children: [
      { title: "leaf 0-0", key: "0-0-0", isLeaf: true },
      { title: "leaf 0-1", key: "0-0-1", isLeaf: true },
    ],
  },
  {
    title: "parent 1",
    key: "0-1",
    children: [
      { title: "leaf 1-0", key: "0-1-0", isLeaf: true },
      { title: "leaf 1-1", key: "0-1-1", isLeaf: true },
    ],
  },
];

const PropertyDetail: React.FC = () => {
  const isEmpty = false;
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get("id");

  const { data } = useRequest(() => getDataroomDetail(id ?? ""), {
    ready: !!id,
  });
  const { name } = data || {};

  const infoList = [
    {
      title: "Property Name",
      value: "Nanty Street 41",
    },
    {
      title: "Property Type",
      value: "Residential",
    },
    {
      title: "Address",
      value: "Nanty Street 41, London, UK",
    },
    {
      title: "Owner",
      value: "Jane Doe",
    },
  ];

  const onSelect = (keys: any, info: any) => {
    console.log("Trigger Select", keys, info);
  };
  const onExpand = (keys: any, info: any) => {
    console.log("Trigger Expand", keys, info);
  };

  return (
    <div className={styles.container}>
      <CustomBreadcrumb
        separator=">"
        items={[
          {
            title: <a href="/">Application Center</a>,
          },
          {
            title: name,
          },
        ]}
        btns={
          <Space size={16}>
            <Button>
              <FileTextOutlined />
              Export to Excel
            </Button>
            <Button type="primary" onClick={() => setVisible(true)}>
              <UploadOutlined />
              Upload files
            </Button>
          </Space>
        }
      />
      {isEmpty && (
        <Empty
          image={emptyIcon}
          className={styles.empty}
          description={
            <div className={styles.emptyDesc}>
              <div className={styles.title}>Hey Jane Doe 👋</div>
              <div className={styles.desc}>
                Clicking the “Upload files” button to manage your property
                files.
              </div>
            </div>
          }
        />
      )}

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
              treeData={treeData}
            />
          </div>
          <div className={styles.content}>
            <div>EPC - Av. Rochefort 127B</div>
          </div>
        </div>
        <div className={styles.contentRight}>
          <div className={styles.header}>
            <span>Information</span>
            <CloseOutlined style={{ color: "rgb(65,77,92)" }} />
          </div>
          {infoList.map((item, index) => (
            <div key={index} className={styles.info}>
              <div className={styles.infoTitle}>{item.title}</div>
              <div className={styles.infoValue}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {visible && <UploadModal visible={visible} setVisible={setVisible} />}
    </div>
  );
};

export default PropertyDetail;
