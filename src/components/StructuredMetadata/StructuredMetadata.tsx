import React from 'react';
import { Empty } from 'antd';
import MetadataSection from './MetadataSection';
import { StructuredMetadataProps } from './types';
import styles from './StructuredMetadata.module.less';

const StructuredMetadata: React.FC<StructuredMetadataProps> = ({ metadata, className }) => {
  // Handle empty or invalid metadata
  if (!metadata || !metadata.sections || metadata.sections.length === 0) {
    return (
      <div className={`${styles.structuredMetadata} ${className || ''}`}>
        <Empty
          description="No metadata available"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          className={styles.emptyState}
        />
      </div>
    );
  }

  return (
    <div className={`${styles.structuredMetadata} ${className || ''}`}>
      {metadata.sections.map((section, index) => (
        <MetadataSection
          key={`${section.name}-${index}`}
          section={section}
          className={index === metadata.sections.length - 1 ? styles.lastSection : ''}
        />
      ))}
    </div>
  );
};

export default StructuredMetadata;
