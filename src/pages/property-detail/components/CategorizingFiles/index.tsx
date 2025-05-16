import React from 'react';
import styles from './index.module.less';
import categorizingFilesIcon from '@/assets/categorizing-files.svg';

const CategorizingFiles: React.FC = () => {
  return (
    <div className={styles.categorizingContainer}>
      <img src={categorizingFilesIcon} alt="Categorizing files" className={styles.categorizingIcon} />
      <div className={styles.categorizingText}>
        Categorizing files... please wait ⌛
      </div>
    </div>
  );
};

export default CategorizingFiles;
