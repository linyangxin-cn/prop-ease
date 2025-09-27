// Types for structured metadata display

export interface MetadataField {
  key: string;
  displayName: string;
  value: any;
  formattedValue: string | Record<string, string>;
  fieldType: 'text' | 'date' | 'file_size' | 'json' | 'language';
  copyable: boolean;
  icon?: string;
  priority: number;
}

export interface MetadataSection {
  name: string;
  priority: number;
  fields: MetadataField[];
}

export interface StructuredMetadata {
  sections: MetadataSection[];
}

export interface StructuredMetadataProps {
  metadata: StructuredMetadata;
  className?: string;
}

export interface MetadataSectionProps {
  section: MetadataSection;
  className?: string;
}

export interface MetadataFieldProps {
  field: MetadataField;
  className?: string;
}
