import React, { useEffect } from 'react';
import { Result, Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

const AlertsPage: React.FC = () => {
  // Redirect to the new alert page
  useEffect(() => {
    window.location.href = '/alerts';
  }, []);

  return (
    <Result
      status="info"
      title="Redirecting to Alert Center"
      subTitle="You are being redirected to the new alert interface..."
      extra={
        <Button type="primary" onClick={() => window.location.href = '/alerts'}>
          <HomeOutlined />
          Go to Alert Center
        </Button>
      }
    />
  );
};

export default AlertsPage;
