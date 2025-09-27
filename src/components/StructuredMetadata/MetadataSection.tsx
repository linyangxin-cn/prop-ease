import React from 'react';
import MetadataField from './MetadataField';
import { MetadataSectionProps } from './types';
import styles from './StructuredMetadata.module.less';

const MetadataSection: React.FC<MetadataSectionProps> = ({ section, className }) => {
  return (
    <div className={`${styles.metadataSection} ${className || ''}`}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{section.name}</h3>
      </div>
      <div className={styles.sectionContent}>
        {section.fields.map((field) => (
          <MetadataField key={field.key} field={field} />
        ))}
      </div>
    </div>
  );
};

export default MetadataSection;
