import React from "react";
import { Button, Empty } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import styles from "./index.module.less";
import emptyIcon from "@/assets/empty-dataroom-icon.svg";

interface EmptyStateProps {
  userName?: string;
  text?: string;
  onCreateClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ userName, text, onCreateClick }) => {
  return (
    <div className={styles.emptyContainer}>
      <Empty
        image={emptyIcon}
        className={styles.empty}
        description={
          <div className={styles.emptyDesc}>
            <div className={styles.title}>Hey {userName || "there"} 👋</div>
            <div className={styles.desc}>
              {text || "Create your first property to start managing your real estate documents and files."}
            </div>
            <Button 
              type="primary" 
              size="large"
              icon={<HomeOutlined />}
              onClick={onCreateClick}
              className={styles.createButton}
            >
              Create Your First Property
            </Button>
          </div>
        }
      />
    </div>
  );
};

export default EmptyState;
