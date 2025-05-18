import React from "react";
import { Empty } from "antd";
import styles from "./index.module.less";
import emptyIcon from "@/assets/empty-dataroom-icon.svg";

interface EmptyStateProps {
  userName?: string;
  text?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ userName, text }) => {
  return (
    <Empty
      image={emptyIcon}
      className={styles.empty}
      description={
        <div className={styles.emptyDesc}>
          <div className={styles.title}>Hey {userName || "there"} 👋</div>
          <div className={styles.desc}>
            {text ||
              'Clicking the "Upload files" button to manage your property files.'}
          </div>
        </div>
      }
    />
  );
};

export default EmptyState;
