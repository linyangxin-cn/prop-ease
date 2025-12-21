import React, { useState, useEffect } from 'react';
import { Spin, Alert, Button, Typography } from 'antd';
import { DownloadOutlined, FileWordOutlined } from '@ant-design/icons';
import mammoth from 'mammoth';

const { Title, Text } = Typography;

interface WordViewerProps {
  fileUrl: string;
  filename: string;
  onError?: (error: string) => void;
}

const WordViewer: React.FC<WordViewerProps> = ({ fileUrl, filename, onError }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    loadWordFile();
  }, [fileUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadWordFile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(fileUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,*/*'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });

      setHtmlContent(result.value);

      if (result.messages && result.messages.length > 0) {
        const warningMessages = result.messages
          .filter(msg => msg.type === 'warning')
          .map(msg => msg.message);
        setWarnings(warningMessages);
      }

    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'Failed to load Word document';

      if (err instanceof Error) {
        const errorText = err.message.toLowerCase();

        if (errorText.includes('password') ||
            errorText.includes('encrypted') ||
            errorText.includes('protected') ||
            errorText.includes('invalid signature') ||
            errorText.includes('unsupported encryption')) {
          errorMessage = 'File is password-protected';
        }
        else if (errorText.includes('networkerror') ||
                 errorText.includes('network error') ||
                 errorText.includes('failed to fetch') ||
                 err.name === 'TypeError') {
          errorMessage = 'Network error: Unable to load file';
        }
      }

      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Spin size="large" />
        <Text type="secondary">Loading Word document...</Text>
      </div>
    );
  }

  if (error) {
    // Check if it's a password-protected file
    const isPasswordProtected = error.includes('password-protected') ||
                                error.includes('password') ||
                                error.includes('encrypted');

    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message={isPasswordProtected ? "Password-Protected Word Document" : "Failed to load Word document"}
          description={
            isPasswordProtected
              ? "This Word document is password-protected and cannot be previewed in the browser. Please download it to view with Word or another compatible application."
              : error
          }
          type={isPasswordProtected ? "warning" : "error"}
          showIcon
          action={
            <Button size="small" onClick={handleDownload} icon={<DownloadOutlined />}>
              Download File
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        padding: '16px 20px', 
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileWordOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
          <Title level={5} style={{ margin: 0 }}>{filename}</Title>
        </div>
        <Button 
          size="small" 
          onClick={handleDownload} 
          icon={<DownloadOutlined />}
        >
          Download
        </Button>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ padding: '16px 20px 0' }}>
          <Alert
            message="Document conversion warnings"
            description={
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {warnings.slice(0, 3).map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
                {warnings.length > 3 && (
                  <li>... and {warnings.length - 3} more warnings</li>
                )}
              </ul>
            }
            type="warning"
            showIcon
            closable
            style={{ marginBottom: '16px' }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        padding: '20px',
        backgroundColor: '#fff'
      }}>
        {htmlContent ? (
          <div 
            style={{
              maxWidth: '800px',
              margin: '0 auto',
              lineHeight: '1.6',
              fontSize: '14px',
              color: '#333'
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: '#999'
          }}>
            <Text type="secondary">No content to display</Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordViewer;
