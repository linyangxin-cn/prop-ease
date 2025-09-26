import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Divider, Tag, Alert, Spin } from 'antd';
import { ReloadOutlined, BugOutlined } from '@ant-design/icons';
import { fetchAlerts, getAlertStats, triggerAlertGeneration, setupTestAlerts } from '@/utils/request/alert-api';
import type { AlertData, AlertStats } from '@/utils/request/alert-api';

const { Title, Text, Paragraph } = Typography;

const AlertDebug: React.FC = () => {
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiHealth, setApiHealth] = useState<{status: string, responseTime: number} | null>(null);

  const testApiHealth = async () => {
    try {
      const start = performance.now();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/alerts/stats`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const end = performance.now();
      const responseTime = end - start;

      if (response.ok) {
        setApiHealth({ status: 'healthy', responseTime });
      } else {
        setApiHealth({ status: `error: ${response.status}`, responseTime });
      }
    } catch (err: any) {
      setApiHealth({ status: `failed: ${err.message}`, responseTime: 0 });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Test API health first
      await testApiHealth();

      // Fetch stats with timing
      console.log('Fetching alert stats...');
      const statsStart = performance.now();
      const alertStats = await getAlertStats();
      const statsEnd = performance.now();
      console.log(`Alert stats fetched in ${(statsEnd - statsStart).toFixed(2)}ms:`, alertStats);
      setStats(alertStats);

      // Fetch alerts with timing
      console.log('Fetching alerts...');
      const alertsStart = performance.now();
      const response = await fetchAlerts({ limit: 10 });
      const alertsEnd = performance.now();
      console.log(`Alerts fetched in ${(alertsEnd - alertsStart).toFixed(2)}ms:`, response);
      setAlerts(response.alerts || []);

    } catch (err: any) {
      console.error('Error fetching alert data:', err);
      setError(err.message || 'Failed to fetch alert data');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerGeneration = async () => {
    setLoading(true);
    try {
      console.log('Triggering alert generation...');
      const result = await triggerAlertGeneration(false); // For current user's tenant
      console.log('Alert generation result:', result);

      // Refresh data after generation
      setTimeout(() => {
        fetchData();
      }, 1000);

    } catch (err: any) {
      console.error('Error triggering alert generation:', err);
      setError(err.message || 'Failed to trigger alert generation');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupTestAlerts = async () => {
    setLoading(true);
    try {
      console.log('Setting up test alerts...');
      const result = await setupTestAlerts();
      console.log('Test alerts setup result:', result);

      // Refresh data after setup
      setTimeout(() => {
        fetchData();
      }, 1000);

    } catch (err: any) {
      console.error('Error setting up test alerts:', err);
      setError(err.message || 'Failed to setup test alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Title level={2}>
          <BugOutlined /> Alert System Debug
        </Title>
        
        <Space style={{ marginBottom: '16px' }}>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
          >
            Refresh Data
          </Button>
          <Button
            type="primary"
            onClick={handleSetupTestAlerts}
            loading={loading}
          >
            🎯 Setup Test Alerts
          </Button>
          <Button
            onClick={handleTriggerGeneration}
            loading={loading}
          >
            Trigger Alert Generation
          </Button>
        </Space>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            style={{ marginBottom: '16px' }}
            showIcon
          />
        )}

        <Divider />

        {/* API Health Section */}
        <Title level={3}>API Health Check</Title>
        {apiHealth ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Tag color={apiHealth.status === 'healthy' ? 'green' : 'red'}>
                Status: {apiHealth.status}
              </Tag>
              <Tag color={apiHealth.responseTime < 1000 ? 'green' : apiHealth.responseTime < 3000 ? 'orange' : 'red'}>
                Response Time: {apiHealth.responseTime.toFixed(2)}ms
              </Tag>
            </div>
            <Text type="secondary">
              API URL: {process.env.REACT_APP_API_URL}
            </Text>
            <Text type="secondary">
              Backend: {process.env.REACT_APP_API_URL?.includes('localhost') ? 'Local Development' : 'Remote Production'}
            </Text>
          </Space>
        ) : (
          <Text type="secondary">Click "Refresh Data" to test API health</Text>
        )}

        <Divider />

        {/* Stats Section */}
        <Title level={3}>Alert Statistics</Title>
        {loading && !stats ? (
          <Spin />
        ) : stats ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Tag color="red">Unread: {stats.unreadCount}</Tag>
              <Tag color="orange">High Priority: {stats.highPriorityCount}</Tag>
              <Tag color="blue">Total: {stats.totalCount}</Tag>
            </div>
            <Text code>{JSON.stringify(stats, null, 2)}</Text>
          </Space>
        ) : (
          <Text type="secondary">No stats available</Text>
        )}

        <Divider />

        {/* Alerts Section */}
        <Title level={3}>Alert Details ({alerts.length} alerts)</Title>
        {loading && alerts.length === 0 ? (
          <Spin />
        ) : alerts.length > 0 ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            {alerts.map((alert, index) => (
              <Card 
                key={alert.id} 
                size="small" 
                style={{ marginBottom: '8px' }}
                title={
                  <Space>
                    <span>#{index + 1}</span>
                    <Tag color={
                      alert.priority === 'critical' ? 'red' :
                      alert.priority === 'high' ? 'orange' :
                      alert.priority === 'medium' ? 'blue' : 'default'
                    }>
                      {alert.priority.toUpperCase()}
                    </Tag>
                    <span>{alert.title}</span>
                  </Space>
                }
              >
                <Paragraph>
                  <Text strong>Message:</Text> {alert.message}
                </Paragraph>
                <Paragraph>
                  <Text strong>Type:</Text> {alert.type} | 
                  <Text strong> Read:</Text> {alert.isRead ? 'Yes' : 'No'} | 
                  <Text strong> Created:</Text> {new Date(alert.createdAt).toLocaleString()}
                </Paragraph>
                {alert.data && (
                  <Paragraph>
                    <Text strong>Document:</Text> {alert.data.documentName} | 
                    <Text strong> Expiry:</Text> {alert.data.expiryDate} |
                    <Text strong> Days:</Text> {alert.data.daysUntilExpiry || alert.data.daysExpired || 'N/A'}
                  </Paragraph>
                )}
                <details>
                  <summary style={{ cursor: 'pointer', color: '#1890ff' }}>
                    View Raw Data
                  </summary>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '8px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    marginTop: '8px'
                  }}>
                    {JSON.stringify(alert, null, 2)}
                  </pre>
                </details>
              </Card>
            ))}
          </Space>
        ) : (
          <Alert
            message="No Alerts Found"
            description="No alerts are currently available. Try triggering alert generation to create some test alerts."
            type="info"
            showIcon
          />
        )}
      </Card>
    </div>
  );
};

export default AlertDebug;
