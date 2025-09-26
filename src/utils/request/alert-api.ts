import axiosBean from './index';

export interface AlertData {
  id: string;
  userId: string;
  tenantId: string;
  documentId: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data: {
    // Frontend camelCase format (for local/test data)
    documentName?: string;
    expiryDate?: string;
    daysUntilExpiry?: number;  // For future expiry alerts
    daysExpired?: number;      // For expired document alerts
    documentMetadata?: {
      address?: string;
      expiryDate?: string;
      companyName?: string;
    };
    // Backend snake_case format (for real API data)
    document_name?: string;
    expiry_date?: string;
    days_until_expiry?: number;
    days_expired?: number;
    document_metadata?: {
      address?: string;
      expiry_date?: string;
      company_name?: string;
      unit?: string | null;
      email?: string | null;
      title?: string;
      report_date?: string;
    };
  };
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
  readAt?: string;
  dismissedAt?: string;
}

export interface AlertStats {
  unreadCount: number;
  highPriorityCount: number;
  totalCount: number;
}

export interface AlertsResponse {
  alerts: AlertData[];
  total: number;
  unreadOnly: boolean;
}

export interface AlertApiParams {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Fetch user alerts
 */
export const fetchAlerts = async (params: AlertApiParams = {}): Promise<AlertsResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.unreadOnly !== undefined) {
    queryParams.append('unread_only', params.unreadOnly.toString());
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params.offset !== undefined) {
    queryParams.append('offset', params.offset.toString());
  }

  const url = `/alerts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return axiosBean.get(url);
};

// Alert action functions moved below

/**
 * Get alert statistics
 */
export const getAlertStats = async (): Promise<AlertStats> => {
  return axiosBean.get('/alerts/stats');
};

/**
 * Manually trigger alert generation
 * @param allTenants - If true, generate alerts for all tenants (admin only). If false, generate for current user's tenant.
 */
export const triggerAlertGeneration = async (allTenants: boolean = false): Promise<{
  success: boolean;
  scope?: string;
  tenant_id?: string;
  alerts_created?: number;
}> => {
  const params = allTenants ? { all_tenants: true } : {};
  return axiosBean.post('/alerts/generate', {}, { params });
};

/**
 * Setup test alerts for the current authenticated user
 */
export const setupTestAlerts = async (): Promise<{
  success: boolean;
  alerts_created: number;
  user_id: string;
  tenant_id: string;
}> => {
  return axiosBean.post('/alerts/setup-test-alerts');
};

/**
 * Mark an alert as read
 */
export const markAlertAsRead = async (alertId: string): Promise<{
  success: boolean;
  alert_id: string;
  is_read: boolean;
}> => {
  return axiosBean.put(`/alerts/${alertId}/read`);
};

/**
 * Dismiss an alert
 */
export const dismissAlert = async (alertId: string): Promise<{
  success: boolean;
  alert_id: string;
  dismissed: boolean;
}> => {
  return axiosBean.post(`/alerts/${alertId}/dismiss`);
};

// Bulk operations removed - not used in current implementation

// Priority utility functions removed - styling handled in components

// Time formatting and urgency utilities removed - not used in current implementation

/**
 * Get urgency message based on days until expiry or days expired
 */
export const getUrgencyMessage = (
  daysUntilExpiry?: number | undefined,
  daysExpired?: number | undefined
): string => {
  if (daysExpired !== undefined && daysExpired > 0) {
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

// Sorting function removed - backend handles sorting
