import React from 'react';
import { Button, Typography } from 'antd';
import { LoadingOutlined, DownOutlined } from '@ant-design/icons';
import styles from './index.module.css';

const { Text } = Typography;

interface LoadMoreProps {
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  currentCount: number;
  totalCount: number;
  itemName?: string;
  disabled?: boolean;
  size?: 'small' | 'middle' | 'large';
  className?: string;
}

const LoadMore: React.FC<LoadMoreProps> = ({
  loading,
  hasMore,
  onLoadMore,
  currentCount,
  totalCount,
  itemName = 'items',
  disabled = false,
  size = 'middle',
  className
}) => {
  const remainingCount = Math.max(0, totalCount - currentCount);
  const showExactTotal = totalCount > currentCount; // Only show "X of Y" if we know there are more

  if (!hasMore && currentCount > 0) {
    return (
      <div className={`${styles.loadMoreContainer} ${className || ''}`}>
        <div className={styles.completedIndicator}>
          <Text type="secondary" className={styles.progressText}>
            {showExactTotal ? `All ${totalCount} ${itemName} loaded` : `${currentCount} ${itemName} loaded`}
          </Text>
        </div>
      </div>
    );
  }

  // Don't show LoadMore if there are no items and no more to load
  if (currentCount === 0 && !hasMore) {
    return null;
  }

  return (
    <div className={`${styles.loadMoreContainer} ${className || ''}`}>
      <div className={styles.progressInfo}>
        <Text type="secondary" className={styles.progressText}>
          {showExactTotal ? (
            <>
              Showing {currentCount} of {totalCount} {itemName}
              {remainingCount > 0 && (
                <span className={styles.remainingCount}>
                  ({remainingCount} more)
                </span>
              )}
            </>
          ) : (
            `Showing ${currentCount} ${itemName}`
          )}
        </Text>
      </div>
      
      {hasMore && (
        <Button
          type="default"
          size={size}
          loading={loading}
          disabled={disabled || loading}
          onClick={onLoadMore}
          icon={loading ? <LoadingOutlined /> : <DownOutlined />}
          className={styles.loadMoreButton}
        >
          {loading ? 'Loading...' : `Load More ${itemName}`}
        </Button>
      )}
    </div>
  );
};

export default LoadMore;
