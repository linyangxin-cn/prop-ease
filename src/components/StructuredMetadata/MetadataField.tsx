import React from 'react';
import { Button, message, Tooltip } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { MetadataFieldProps } from './types';
import styles from './StructuredMetadata.module.less';

const MetadataField: React.FC<MetadataFieldProps> = ({ field, className }) => {
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('Copied to clipboard');
    } catch (err) {
      message.error('Failed to copy');
    }
  };

  const renderValue = () => {
    if (field.fieldType === 'json' && typeof field.formattedValue === 'object') {
      // Render JSON as key-value pairs
      return (
        <div className={styles.jsonValue}>
          {Object.entries(field.formattedValue).map(([key, value]) => (
            <div key={key} className={styles.jsonItem}>
              <span className={styles.jsonKey}>{key}:</span>
              <span className={styles.jsonItemValue}>{value}</span>
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <span className={styles.fieldValue}>
        {field.formattedValue || field.value || '—'}
      </span>
    );
  };

  return (
    <div className={`${styles.metadataField} ${className || ''}`}>
      <div className={styles.fieldHeader}>
        <div className={styles.fieldLabel}>
          <span className={styles.fieldName}>{field.displayName}</span>
        </div>
        {field.copyable && field.formattedValue && (
          <Tooltip title="Copy to clipboard">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(String(field.formattedValue))}
              className={styles.copyButton}
            />
          </Tooltip>
        )}
      </div>
      <div className={styles.fieldValueContainer}>
        {renderValue()}
      </div>
    </div>
  );
};

export default MetadataField;
