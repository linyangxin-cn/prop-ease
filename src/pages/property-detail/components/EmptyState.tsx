import React from 'react';
import { Empty } from 'antd';
import styles from '../index.module.less';
import emptyIcon from "@/assets/empty-dataroom-icon.svg";

interface EmptyStateProps {
  userName?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ userName }) => {
  return (
    <Empty
      image={emptyIcon}
      className={styles.empty}
      description={
        <div className={styles.emptyDesc}>
          <div className={styles.title}>Hey {userName || 'there'} 👋</div>
          <div className={styles.desc}>
            Clicking the "Upload files" button to manage your property files.
          </div>
        </div>
      }
    />
  );
};

export default EmptyState;
