/**
 * Temporary component to test Sentry integration
 * Remove this after confirming Sentry works
 */

import React from 'react';
import { Button } from 'antd';
import { testSentry, reportUploadError } from '../utils/sentry';

const SentryTestButton: React.FC = () => {
  const handleTestSentry = () => {
    testSentry();
  };

  const handleTestUploadError = () => {
    const testError = new Error('Test upload error - this is expected');
    reportUploadError(testError, {
      operation: 'batch_upload',
      batchNumber: 1,
      totalBatches: 3,
      fileCount: 5,
      fileNames: ['test1.pdf', 'test2.docx']
    });
    console.log('Test upload error sent to Sentry');
  };

  // Only show in development or when testing
  if (process.env.NODE_ENV === 'production' && !window.location.search.includes('test=sentry')) {
    return null;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      zIndex: 9999,
      background: 'white',
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '4px'
    }}>
      <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
        Sentry Test (Remove after testing)
      </div>
      <Button 
        size="small" 
        onClick={handleTestSentry}
        style={{ marginRight: '8px' }}
      >
        Test Sentry
      </Button>
      <Button 
        size="small" 
        onClick={handleTestUploadError}
        type="primary"
      >
        Test Upload Error
      </Button>
    </div>
  );
};

export default SentryTestButton;
