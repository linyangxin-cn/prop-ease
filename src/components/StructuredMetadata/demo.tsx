// Demo component to showcase the structured metadata display
import React from 'react';
import { StructuredMetadata } from './index';
import { StructuredMetadata as StructuredMetadataType } from './types';

const sampleStructuredMetadata: StructuredMetadataType = {
  sections: [
    {
      name: 'Document Overview',
      priority: 100,
      fields: [
        {
          key: 'title',
          displayName: 'Title',
          value: 'Keuringsrapport',
          formattedValue: 'Keuringsrapport',
          fieldType: 'text',
          copyable: false,
          priority: 100
        },
        {
          key: 'address',
          displayName: 'Address',
          value: 'Leuvensesteenweg 970, 1140 Evere',
          formattedValue: 'Leuvensesteenweg 970, 1140 Evere',
          fieldType: 'text',
          copyable: false,
          priority: 90
        },
        {
          key: 'report_date',
          displayName: 'Report Date',
          value: '2022-11-17',
          formattedValue: 'Nov 17, 2022',
          fieldType: 'date',
          copyable: false,
          priority: 80
        },
        {
          key: 'summary',
          displayName: 'Summary',
          value: 'Electrical Inspection',
          formattedValue: 'Electrical Inspection',
          fieldType: 'text',
          copyable: false,
          priority: 70
        }
      ]
    },
    {
      name: 'Contact Information',
      priority: 80,
      fields: [
        {
          key: 'owner',
          displayName: 'Owner',
          value: 'De Lijn',
          formattedValue: 'De Lijn',
          fieldType: 'text',
          copyable: false,
          priority: 60
        },
        {
          key: 'client_name',
          displayName: 'Client Name',
          value: 'De Lijn',
          formattedValue: 'De Lijn',
          fieldType: 'text',
          copyable: false,
          priority: 50
        },
        {
          key: 'company_name',
          displayName: 'Company Name',
          value: 'De Lijn',
          formattedValue: 'De Lijn',
          fieldType: 'text',
          copyable: false,
          priority: 40
        }
      ]
    },
    {
      name: 'Document Details',

      priority: 70,
      fields: [
        {
          key: 'report_reference_id',
          displayName: 'Reference ID',
          value: '674740191',
          formattedValue: '674740191',
          fieldType: 'text',
          copyable: true,
          priority: 60
        },
        {
          key: 'language',
          displayName: 'Language',
          value: 'nl',
          formattedValue: 'NL',
          fieldType: 'language',
          copyable: false,
          priority: 50
        },
        {
          key: 'unit',
          displayName: 'Unit',
          value: 'HS-Stelplaats Evere',
          formattedValue: 'HS-Stelplaats Evere',
          fieldType: 'text',
          copyable: false,
          priority: 40
        }
      ]
    },
    {
      name: 'Technical Details',
      priority: 60,
      fields: [
        {
          key: 'installation_id',
          displayName: 'Installation ID',
          value: '661080054',
          formattedValue: '661080054',
          fieldType: 'text',
          copyable: true,
          priority: 50
        },
        {
          key: 'additional_info',
          displayName: 'Additional Info',
          value: {
            'primary_voltage': '11 kV',
            'protection_cell': 'HOV 16A',
            'transformer_brand': 'France transfo',
            'transformer_power': '160 kVA'
          },
          formattedValue: {
            'Primary Voltage': '11 kV',
            'Protection Cell': 'HOV 16A',
            'Transformer Brand': 'France transfo',
            'Transformer Power': '160 kVA'
          },
          fieldType: 'json',
          copyable: false,
          priority: 40
        }
      ]
    },
    {
      name: 'File Information',
      priority: 50,
      fields: [
        {
          key: 'file_size_bytes',
          displayName: 'File Size',
          value: 2097152,
          formattedValue: '2.0 MB',
          fieldType: 'file_size',
          copyable: false,
          priority: 30
        },
        {
          key: 'content_type',
          displayName: 'Content Type',
          value: 'application/pdf',
          formattedValue: 'application/pdf',
          fieldType: 'text',
          copyable: false,
          priority: 20
        },
        {
          key: 'uploaded_at',
          displayName: 'Uploaded At',
          value: '2024-01-15T10:30:00Z',
          formattedValue: 'Jan 15, 2024',
          fieldType: 'date',
          copyable: false,
          priority: 10
        }
      ]
    }
  ]
};

const StructuredMetadataDemo: React.FC = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Simple Structured Metadata Demo</h2>
      <div style={{
        border: '1px solid #e9ebed',
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: '#fff'
      }}>
        <div style={{
          fontWeight: 600,
          fontSize: '16px',
          marginBottom: '16px',
          borderBottom: '1px solid rgb(198, 198, 205)',
          paddingBottom: '8px'
        }}>
          Information
        </div>
        <StructuredMetadata metadata={sampleStructuredMetadata} />
      </div>
    </div>
  );
};

export default StructuredMetadataDemo;
