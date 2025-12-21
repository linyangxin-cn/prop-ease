import React, { useState, useEffect } from 'react';
import { Spin, Alert, Table, Tabs, Button, Typography } from 'antd';
import { DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface ExcelViewerProps {
  fileUrl: string;
  filename: string;
  onError?: (error: string) => void;
}

interface SheetData {
  name: string;
  data: any[][];
  columns: any[];
  dataSource: any[];
}

const ExcelViewer: React.FC<ExcelViewerProps> = ({ fileUrl, filename, onError }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('0');

  useEffect(() => {
    loadExcelFile();
  }, [fileUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadExcelFile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(fileUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      const sheetsData: SheetData[] = [];
      
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '', // Default value for empty cells
          raw: false // Format values as strings
        }) as any[][];

        console.log(`ExcelViewer: Sheet "${sheetName}" has ${jsonData.length} rows`);

        if (jsonData.length === 0) {
          sheetsData.push({
            name: sheetName,
            data: [],
            columns: [],
            dataSource: []
          });
          return;
        }
        
        // First row as headers
        const headers = jsonData[0] || [];
        const dataRows = jsonData.slice(1);
        
        // Create columns for Ant Design Table
        const columns = headers.map((header, colIndex) => ({
          title: header || `Column ${colIndex + 1}`,
          dataIndex: `col_${colIndex}`,
          key: `col_${colIndex}`,
          width: 150,
          ellipsis: true,
          render: (text: any) => (
            <span title={text?.toString()}>
              {text?.toString() || ''}
            </span>
          )
        }));
        
        // Create data source for Ant Design Table
        const dataSource = dataRows.map((row, rowIndex) => {
          const rowData: any = { key: rowIndex };
          headers.forEach((_, colIndex) => {
            rowData[`col_${colIndex}`] = row[colIndex] || '';
          });
          return rowData;
        });
        
        sheetsData.push({
          name: sheetName,
          data: jsonData,
          columns,
          dataSource
        });
      });

      setSheets(sheetsData);
      setActiveSheet('0');

    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'Failed to load Excel file';

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
        <Text type="secondary">Loading Excel file...</Text>
      </div>
    );
  }

  if (error) {
    // Check if it's a password-protected file
    const isPasswordProtected = error.includes('password-protected') ||
                                error.includes('password') ||
                                error.includes('encrypted');

    console.log('ExcelViewer: Rendering error state:', { error, isPasswordProtected });

    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message={isPasswordProtected ? "Password-Protected Excel File" : "Failed to load Excel file"}
          description={
            isPasswordProtected
              ? "This Excel file is password-protected and cannot be previewed in the browser. Please download it to view with Excel or another compatible application."
              : error
          }
          type={isPasswordProtected ? "warning" : "error"}
          showIcon
          action={
            isPasswordProtected ? (
              <Button size="small" onClick={handleDownload} icon={<DownloadOutlined />}>
                Download File
              </Button>
            ) : (
              <Button size="small" onClick={handleDownload} icon={<DownloadOutlined />}>
                Download File
              </Button>
            )
          }
        />
      </div>
    );
  }

  if (sheets.length === 0) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="Empty Excel file"
          description="This Excel file contains no data to display."
          type="info"
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
          <FileExcelOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
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

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {sheets.length === 1 ? (
          // Single sheet - show directly
          <div style={{ height: '100%', padding: '16px' }}>
            <Table
              columns={sheets[0].columns}
              dataSource={sheets[0].dataSource}
              scroll={{ x: 'max-content', y: 'calc(100vh - 200px)' }}
              size="small"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} rows`
              }}
            />
          </div>
        ) : (
          // Multiple sheets - show tabs
          <Tabs
            activeKey={activeSheet}
            onChange={setActiveSheet}
            style={{ height: '100%' }}
            tabBarStyle={{ paddingLeft: '16px', paddingRight: '16px' }}
          >
            {sheets.map((sheet, index) => (
              <TabPane tab={sheet.name} key={index.toString()}>
                <div style={{ padding: '0 16px 16px' }}>
                  <Table
                    columns={sheet.columns}
                    dataSource={sheet.dataSource}
                    scroll={{ x: 'max-content', y: 'calc(100vh - 250px)' }}
                    size="small"
                    pagination={{
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total) => `Total ${total} rows`
                    }}
                  />
                </div>
              </TabPane>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default ExcelViewer;
