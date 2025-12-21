import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Spin, Alert, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { detectDocumentType, DocumentType } from '@/utils/fileTypeUtils';

// Lazy load viewers for code splitting
const ExcelViewer = lazy(() => import('./ExcelViewer'));
const WordViewer = lazy(() => import('./WordViewer'));
const ImageViewer = lazy(() => import('./ImageViewer'));

interface DocumentViewerProps {
  fileUrl: string;
  filename: string;
  contentType?: string;
  fileSizeBytes?: number;
  onError?: (error: string) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  fileUrl,
  filename,
  contentType,
  fileSizeBytes,
  onError
}) => {
  // Initialize to null to prevent rendering iframe before determining the correct mode
  // This prevents Firefox from triggering auto-download on first render
  const [viewerMode, setViewerMode] = useState<'client-side' | 'iframe' | 'error' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    determineViewerMode();
  }, [filename, contentType, fileSizeBytes]); // eslint-disable-line react-hooks/exhaustive-deps

  const determineViewerMode = () => {
    const fileInfo = detectDocumentType(filename, contentType);

    // For PDF files, always use iframe (existing PDF.js integration)
    if (fileInfo.type === DocumentType.PDF) {
      setViewerMode('iframe');
      return;
    }

    // For Excel, Word, and Image files, use client-side viewer
    // NEVER use iframe as it triggers auto-download in Firefox
    if ([DocumentType.EXCEL, DocumentType.WORD, DocumentType.IMAGE].includes(fileInfo.type)) {
      setViewerMode('client-side');
      return;
    }

    // For all other files, use iframe
    setViewerMode('iframe');
  };

  const handleClientSideError = (errorMessage: string) => {
    setError(errorMessage);
    setViewerMode('error');
    onError?.(errorMessage);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderClientSideViewer = () => {
    const fileInfo = detectDocumentType(filename, contentType);
    
    const LoadingFallback = (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Spin size="large" />
        <span>Loading viewer...</span>
      </div>
    );

    switch (fileInfo.type) {
      case DocumentType.EXCEL:
        return (
          <Suspense fallback={LoadingFallback}>
            <ExcelViewer
              fileUrl={fileUrl}
              filename={filename}
              onError={handleClientSideError}
            />
          </Suspense>
        );

      case DocumentType.WORD:
        return (
          <Suspense fallback={LoadingFallback}>
            <WordViewer
              fileUrl={fileUrl}
              filename={filename}
              onError={handleClientSideError}
            />
          </Suspense>
        );

      case DocumentType.IMAGE:
        return (
          <Suspense fallback={LoadingFallback}>
            <ImageViewer
              fileUrl={fileUrl}
              filename={filename}
              onError={handleClientSideError}
            />
          </Suspense>
        );

      default:
        // Fallback to iframe for unsupported types
        setViewerMode('iframe');
        return null;
    }
  };

  const renderIframeViewer = () => {
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <iframe
          src={fileUrl}
          title={filename}
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          onError={() => {
            handleClientSideError('Failed to load document in iframe');
          }}
        />
      </div>
    );
  };

  const renderErrorState = () => {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="Unable to display document"
          description={
            <div>
              <p>{error || 'The document could not be displayed in the browser.'}</p>
              <p>You can download the file to view it with an appropriate application.</p>
            </div>
          }
          type="error"
          showIcon
          action={
            <Button onClick={handleDownload} icon={<DownloadOutlined />}>
              Download File
            </Button>
          }
        />
      </div>
    );
  };

  // Main render logic
  const renderContent = () => {
    // Show loading spinner while determining viewer mode
    if (viewerMode === null) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          minHeight: '400px'
        }}>
          <Spin size="large" tip="Loading document..." />
        </div>
      );
    }

    switch (viewerMode) {
      case 'client-side':
        return renderClientSideViewer();

      case 'iframe':
        return renderIframeViewer();

      case 'error':
        return renderErrorState();

      default:
        return renderIframeViewer();
    }
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {renderContent()}
    </div>
  );
};

export default DocumentViewer;
