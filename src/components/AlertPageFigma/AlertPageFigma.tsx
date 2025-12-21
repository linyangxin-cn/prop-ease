import React, { useState, useEffect } from 'react';
import { Button, Tag, Space } from 'antd';
import { ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { fetchAlerts, getAlertStats, markAlertAsRead, dismissAlert } from '@/utils/request/alert-api';
import type { AlertData, AlertStats } from '@/utils/request/alert-api';
import CustomBreadcrumb from '@/components/CustomBreadcrumb';
import { getDocumentsPreview } from '@/utils/request/request-utils';
import { useRequest } from 'ahooks';
import styles from './AlertPageFigma.module.less';
import { DocumentViewer } from '@/components/DocumentViewers';

interface AlertPageFigmaProps {}

const AlertPageFigma: React.FC<AlertPageFigmaProps> = () => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'resolved'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertsData, statsData] = await Promise.all([
        fetchAlerts({ limit: 50 }),
        getAlertStats()
      ]);
      setAlerts(alertsData.alerts || []);
      setStats(statsData || null);
    } catch (error) {
      console.error('Error fetching alert data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Document preview functionality
  const { data: previewData, run: getPreviewUrl } = useRequest(
    (id: string) => getDocumentsPreview(id),
    {
      manual: true,
    }
  );

  const handleViewDocument = (alert: AlertData) => {
    if (alert.documentId) {
      getPreviewUrl(alert.documentId);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      await dismissAlert(alertId);
      await fetchData(); // Refresh the alert list
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAlertAsRead(alertId);
      await fetchData(); // Refresh the alert list
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const getAlertIcon = (priority: string) => {
    if (priority === 'critical' || priority === 'high') {
      return <ExclamationCircleOutlined />;
    }
    return <ClockCircleOutlined />;
  };

  const getAlertIconBg = (priority: string) => {
    if (priority === 'critical' || priority === 'high') {
      return styles.alertIconCritical;
    }
    return styles.alertIconWarning;
  };

  const getAlertBadgeClass = (priority: string) => {
    if (priority === 'critical' || priority === 'high') {
      return styles.alertBadgeCritical;
    }
    return styles.alertBadgeWarning;
  };

  const formatExpiryMessage = (alert: AlertData) => {
    // Handle both camelCase and snake_case from backend
    const daysExpired = alert.data.daysExpired || (alert.data as any).days_expired;
    const daysUntilExpiry = alert.data.daysUntilExpiry || (alert.data as any).days_until_expiry;

    if (daysExpired && daysExpired > 0) {
      return `Expired ${daysExpired} day${daysExpired !== 1 ? 's' : ''} ago`;
    }
    if (daysUntilExpiry !== undefined) {
      if (daysUntilExpiry <= 0) {
        return 'Expires today';
      } else if (daysUntilExpiry === 1) {
        return 'Expires tomorrow';
      } else {
        return `Expires in ${daysUntilExpiry} days`;
      }
    }
    return 'Expiry date unknown';
  };

  const filteredAlerts = alerts.filter(alert => {
    if (activeTab === 'resolved') {
      // Show dismissed or read alerts in "Resolved" tab
      return alert.isDismissed || alert.isRead;
    }
    // Show only unresolved alerts in "All alerts" tab
    return !alert.isDismissed && !alert.isRead;
  });

  const urgentCount = stats?.highPriorityCount || 0;
  const highRiskCount = stats?.unreadCount || 0;

  // Calculate tab counts
  const activeAlertsCount = alerts.filter(alert => !alert.isDismissed && !alert.isRead).length;
  const resolvedAlertsCount = alerts.filter(alert => alert.isDismissed || alert.isRead).length;

  return (
    <div className={styles.container}>
      {/* Breadcrumb Header */}
      <CustomBreadcrumb
        items={[
          {
            title: (
              <span onClick={() => window.location.href = '/'} style={{ cursor: 'pointer' }}>
                My properties
              </span>
            ),
          },
          {
            title: 'Alert center',
          },
        ]}
        btns={
          <Space>
            {highRiskCount > 0 && (
              <Tag className={styles.summaryBadgeHigh}>
                {highRiskCount} high risk
              </Tag>
            )}
            {urgentCount > 0 && (
              <Tag className={styles.summaryBadgeUrgent}>
                {urgentCount} urgent
              </Tag>
            )}
          </Space>
        }
      />

      {/* Simplified Controls - Just Tabs */}
      <div className={styles.controls}>
        <div className={styles.tabs}>
          <Button
            type={activeTab === 'all' ? 'primary' : 'default'}
            onClick={() => setActiveTab('all')}
            className={styles.tabButton}
          >
            All alerts ({activeAlertsCount})
          </Button>
          <Button
            type={activeTab === 'resolved' ? 'primary' : 'default'}
            onClick={() => setActiveTab('resolved')}
            className={styles.tabButton}
          >
            Resolved ({resolvedAlertsCount})
          </Button>
        </div>
      </div>

      {/* Alert List */}
      <div className={styles.alertList}>
        {loading ? (
          <div className={styles.emptyState}>Loading alerts...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className={styles.emptyState}>No alerts found</div>
        ) : (
          filteredAlerts.map((alert) => (
            <div key={alert.id} className={styles.alertItem}>
              {/* Icon */}
              <div className={`${styles.alertIcon} ${getAlertIconBg(alert.priority)}`}>
                {getAlertIcon(alert.priority)}
              </div>

              {/* Content */}
              <div className={styles.alertContent}>
                {/* File name only */}
                <div className={styles.alertFilenameRow}>
                  <span className={styles.alertFilename}>
                    {/* Handle both camelCase and snake_case from backend */}
                    {alert.data.documentName || (alert.data as any).document_name || 'Unknown Document'}
                  </span>
                </div>

                {/* Address info */}
                <div className={styles.alertAddressRow}>
                  <span className={styles.alertAddressItem}>My properties</span>
                  <span className={styles.alertAddressDot}>•</span>
                  <span className={styles.alertAddressItem}>
                    {/* Handle both camelCase and snake_case from backend */}
                    {(alert.data.documentMetadata?.address ||
                      (alert.data as any).document_metadata?.address ||
                      'Av. Rochefort 127B')}
                  </span>
                  {/* Show company name if available */}
                  {((alert.data.documentMetadata as any)?.companyName ||
                    (alert.data as any).document_metadata?.company_name) && (
                    <>
                      <span className={styles.alertAddressDot}>•</span>
                      <span className={styles.alertAddressItem}>
                        {(alert.data.documentMetadata as any)?.companyName ||
                         (alert.data as any).document_metadata?.company_name}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Expiry Badge */}
              <Tag className={`${styles.alertExpiryBadge} ${getAlertBadgeClass(alert.priority)}`}>
                {formatExpiryMessage(alert)}
              </Tag>

              {/* Actions */}
              <div className={styles.alertActions}>
                <Button
                  type="text"
                  className={styles.alertActionBtn}
                  onClick={() => handleViewDocument(alert)}
                >
                  View
                </Button>
                {activeTab === 'all' ? (
                  // Show action buttons for unresolved alerts
                  <>
                    <Button
                      type="text"
                      className={`${styles.alertActionBtn} ${styles.alertActionPrimary}`}
                      onClick={() => handleDismissAlert(alert.id)}
                    >
                      Dismiss
                    </Button>
                    <Button
                      type="text"
                      className={styles.alertActionBtn}
                      onClick={() => handleMarkAsRead(alert.id)}
                    >
                      Mark as Read
                    </Button>
                  </>
                ) : (
                  // Show status tags for resolved alerts
                  <div className={styles.alertStatusTags}>
                    {alert.isDismissed && (
                      <Tag color="orange" className={styles.statusTag}>
                        Dismissed
                      </Tag>
                    )}
                    {alert.isRead && !alert.isDismissed && (
                      <Tag color="green" className={styles.statusTag}>
                        Read
                      </Tag>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Document Preview Modal - Similar to property-detail */}
      {previewData?.preview_url && (
        <div className={styles.previewModal} onClick={(e) => {
          if (e.target === e.currentTarget) {
            // Close when clicking outside
            window.location.reload();
          }
        }}>
          <div className={styles.previewContent}>
            <div className={styles.previewHeader}>
              <h3>Document Preview</h3>
              <Button
                type="text"
                className={styles.closePreview}
                onClick={() => window.location.reload()}
              >
                ✕
              </Button>
            </div>
            <DocumentViewer
              fileUrl={previewData.preview_url}
              filename="Document Preview"
              contentType={previewData.content_type}
              onError={(error) => {
                console.error('Document viewer error:', error);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertPageFigma;
