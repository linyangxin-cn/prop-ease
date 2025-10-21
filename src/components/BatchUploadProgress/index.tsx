import React from 'react';
import { Progress, Button, Alert, Collapse } from 'antd';
import { PlayCircleOutlined, CloseOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { BatchUploadProgress, BatchUploadFile } from '../../utils/batchUploader';
import styles from './index.module.css';

const { Panel } = Collapse;

interface BatchUploadProgressProps {
  progress: BatchUploadProgress;
  failedFiles?: BatchUploadFile[];
  onCancel?: () => void;
  onRetry?: () => void;
  showDetails?: boolean;
}

const BatchUploadProgressComponent: React.FC<BatchUploadProgressProps> = ({
  progress,
  failedFiles = [],
  onCancel,
  onRetry,
  showDetails = true
}) => {
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />;
      case 'cancelled':
        return <CloseOutlined style={{ color: '#d9d9d9', fontSize: '16px' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed':
        return '#52c41a';
      case 'error':
        return '#ff4d4f';
      case 'cancelled':
        return '#d9d9d9';
      default:
        return '#1890ff';
    }
  };

  const formatFileSize = (files: BatchUploadFile[]) => {
    const totalBytes = files.reduce((sum, file) => {
      const sizeStr = file.size.replace('KB', '');
      return sum + (parseInt(sizeStr) * 1024);
    }, 0);
    
    if (totalBytes > 1024 * 1024) {
      return `${(totalBytes / (1024 * 1024)).toFixed(1)}MB`;
    }
    return `${Math.round(totalBytes / 1024)}KB`;
  };

  return (
    <div className={styles.progressContainer}>
      {/* Overall Progress */}
      <div className={styles.overallProgress}>
        <div className={styles.progressHeader}>
          {getStatusIcon()}
          <span className={styles.progressTitle}>
            {progress.status === 'preparing' && 'Preparing...'}
            {progress.status === 'uploading' && 'Uploading...'}
            {progress.status === 'completed' && 'Upload Complete!'}
            {progress.status === 'error' && 'Upload Failed'}
            {progress.status === 'cancelled' && 'Upload Cancelled'}
          </span>
        </div>

        <Progress
          percent={progress.overallProgress}
          status={progress.status === 'error' ? 'exception' : progress.status === 'completed' ? 'success' : 'active'}
          strokeColor={getStatusColor()}
          showInfo={true}
          format={(percent) => showDetails ? `${percent}% (${progress.processedFiles}/${progress.totalFiles})` : `${percent}%`}
        />

        {showDetails && (
          <div className={styles.progressMessage}>
            {progress.message}
          </div>
        )}
      </div>

      {/* Simplified Batch Progress - Only show if details are enabled */}
      {showDetails && progress.status === 'uploading' && progress.totalBatches > 1 && (
        <div className={styles.batchProgress}>
          <div className={styles.batchHeader}>
            <span>Processing batch {progress.currentBatch} of {progress.totalBatches}</span>
          </div>
          <Progress
            percent={progress.currentBatchProgress}
            size="small"
            showInfo={false}
            strokeColor="#722ed1"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        {(progress.status === 'uploading' || progress.status === 'preparing') && onCancel && (
          <Button
            icon={<CloseOutlined />}
            onClick={onCancel}
            size="small"
            danger
          >
            Cancel Upload
          </Button>
        )}
        
        {progress.status === 'error' && onRetry && (
          <Button
            icon={<PlayCircleOutlined />}
            onClick={onRetry}
            size="small"
            type="primary"
          >
            Retry Failed Batches
          </Button>
        )}
      </div>

      {/* Error Details */}
      {progress.status === 'error' && failedFiles.length > 0 && showDetails && (
        <div className={styles.errorDetails}>
          <Alert
            message={`${failedFiles.length} files failed to upload`}
            description={`${progress.processedFiles - failedFiles.length} files uploaded successfully`}
            type="warning"
            showIcon
            style={{ marginBottom: '12px' }}
          />
          
          <Collapse size="small">
            <Panel 
              header={`View Failed Files (${failedFiles.length})`} 
              key="failed-files"
              extra={<span style={{ color: '#ff4d4f' }}>{formatFileSize(failedFiles)}</span>}
            >
              <div className={styles.failedFilesList}>
                {failedFiles.map((file, index) => (
                  <div key={file.id || index} className={styles.failedFile}>
                    <div className={styles.fileName}>
                      <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                      {file.name}
                    </div>
                    <div className={styles.fileSize}>{file.size}</div>
                    {file.error && (
                      <div className={styles.fileError}>{file.error}</div>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          </Collapse>
        </div>
      )}

      {/* Success Summary */}
      {progress.status === 'completed' && (
        <div className={styles.successSummary}>
          <Alert
            message="Upload Completed Successfully!"
            description={`All ${progress.totalFiles} files have been uploaded and added to the dataroom.`}
            type="success"
            showIcon
          />
        </div>
      )}

      {/* Upload Statistics */}
      {showDetails && (progress.status === 'completed' || progress.status === 'error') && (
        <div className={styles.uploadStats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total Files:</span>
            <span className={styles.statValue}>{progress.totalFiles}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Successful:</span>
            <span className={styles.statValue} style={{ color: '#52c41a' }}>
              {progress.processedFiles - failedFiles.length}
            </span>
          </div>
          {failedFiles.length > 0 && (
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Failed:</span>
              <span className={styles.statValue} style={{ color: '#ff4d4f' }}>
                {failedFiles.length}
              </span>
            </div>
          )}
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Batches:</span>
            <span className={styles.statValue}>{progress.totalBatches}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchUploadProgressComponent;
