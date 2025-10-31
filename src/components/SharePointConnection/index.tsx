/**
 * SharePoint Connection Component
 * 
 * Handles SharePoint authentication and connection status.
 * Provides a simple interface for users to connect their Microsoft account.
 */

import React, { useState, useEffect } from "react";
import { Button, message, Spin } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import styles from "./index.module.less";
import { SharePointApiService } from "../../utils/sharepoint/api";

interface SharePointConnectionProps {
  onConnectionChange?: (connected: boolean) => void;
  onConnect?: () => void;
  className?: string;
}

const SharePointConnection: React.FC<SharePointConnectionProps> = ({
  onConnectionChange,
  onConnect,
  className,
}) => {
  const [connected, setConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [connecting, setConnecting] = useState<boolean>(false);

  // Check connection status on component mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Notify parent component when connection status changes
  useEffect(() => {
    onConnectionChange?.(connected);
  }, [connected, onConnectionChange]);

  /**
   * Check if user has an active SharePoint connection
   */
  const checkConnectionStatus = async () => {
    setLoading(true);
    try {
      const isConnected = await SharePointApiService.checkConnection();
      setConnected(isConnected);
    } catch (error) {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle SharePoint authentication
   */
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const success = await SharePointApiService.authenticateWithPopup();
      
      if (success) {
        setConnected(true);
        message.success("Successfully connected to SharePoint!");
        onConnect?.();
      } else {
        message.error("Failed to connect to SharePoint. Please try again.");
      }
    } catch (error: any) {
      if (error.message.includes("Popup blocked")) {
        message.error("Popup was blocked. Please allow popups and try again.");
      } else if (error.message.includes("timeout")) {
        message.error("Authentication timed out. Please try again.");
      } else {
        message.error("Failed to connect to SharePoint. Please try again.");
      }
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className={`${styles.connectionContainer} ${className || ""}`}>
        <div className={styles.loadingState}>
          <Spin />
          <p>Checking connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.connectionContainer} ${className || ""}`}>
      {connected ? (
        <div className={styles.connectedState}>
          <p>SharePoint Connected</p>
          <Button onClick={checkConnectionStatus} size="small">
            Refresh
          </Button>
        </div>
      ) : (
        <div className={styles.disconnectedState}>
          <h3>Connect to SharePoint</h3>
          <p>Connect your Microsoft account to import documents.</p>
          <Button
            type="primary"
            icon={<LinkOutlined />}
            onClick={handleConnect}
            loading={connecting}
            size="large"
          >
            {connecting ? "Connecting..." : "Connect Microsoft"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SharePointConnection;
