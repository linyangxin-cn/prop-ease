import React from 'react';
import { Alert, Typography } from 'antd';
import { FileOutlined } from '@ant-design/icons';
import { formatFileSize } from '../../utils/fileSizeUtils';
import styles from './index.module.css';

const { Text } = Typography;

interface FileSizeWarningProps {
  oversizedFiles?: { file: File; error: string }[];
  largeFiles?: { file: File; warning: string }[];
  totalFiles: number;
  totalSizeMB: number;
  onRemoveFile?: (fileName: string) => void;
  showGuidance?: boolean;
}

const FileSizeWarning: React.FC<FileSizeWarningProps> = ({
  oversizedFiles = [],
  largeFiles = [],
  totalFiles,
  totalSizeMB,
  onRemoveFile,
  showGuidance = true
}) => {
  const hasOversizedFiles = oversizedFiles.length > 0;
  const hasLargeFiles = largeFiles.length > 0;
  
  if (!hasOversizedFiles && !hasLargeFiles) {
    return null;
  }

  // Removed complex renderFileItem function - simplified interface

  return (
    <div className={styles.warningContainer}>
      {/* Simplified Error Message */}
      {hasOversizedFiles && (
        <Alert
          message={`${oversizedFiles.length} file${oversizedFiles.length > 1 ? 's' : ''} too large`}
          description="Remove large files to continue"
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Simplified Warning - Only show if guidance is enabled */}
      {hasLargeFiles && showGuidance && (
        <Alert
          message="Large files detected"
          description="Upload may take longer"
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Simplified File List - Only show files that need to be removed */}
      {hasOversizedFiles && (
        <div className={styles.filesList}>
          {oversizedFiles.map(({ file }) => (
            <div key={file.name} className={styles.fileItem}>
              <div className={styles.fileHeader}>
                <div className={styles.fileInfo}>
                  <FileOutlined className={styles.fileIcon} />
                  <div className={styles.fileDetails}>
                    <Text strong className={styles.errorText}>
                      {file.name}
                    </Text>
                  </div>
                </div>
                {onRemoveFile && (
                  <button
                    className={styles.removeButton}
                    onClick={() => onRemoveFile(file.name)}
                    title="Remove file"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default FileSizeWarning;
