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

const PropertyDetail: React.FC = () => {
  const isEmpty = false;
  const [visible, setVisible] = useState(false);

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

  return (
    <div className={styles.container}>
      <CustomBreadcrumb
        separator=">"
        items={[
          {
            title: <a href="/">Application Center</a>,
          },
          {
            title: "Nanty Street 41 todo",
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
        <div className={styles.contentLeft}>left</div>
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
