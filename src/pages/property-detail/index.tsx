import CustomBreadcrumb from "@/components/CustomBreadcrumb";
import { FileTextOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Empty, Space } from "antd";
import styles from "./index.module.less";
import emptyIcon from "@/assets/empty-icon.svg";

const PropertyDetail: React.FC = () => {
  const isEmpty = true;

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
            <Button type="primary">
              <FileTextOutlined />
              Export to Excel
            </Button>
            <Button type="primary">
              <UploadOutlined />
              Upload files
            </Button>
          </Space>
        }
      />
      {isEmpty && (
        <Empty
          image={emptyIcon}
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
    </div>
  );
};

export default PropertyDetail;
