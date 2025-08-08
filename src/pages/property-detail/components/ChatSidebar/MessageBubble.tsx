import React from 'react';
import { Button, Modal } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { ChatMessage, ActionableLink } from '@/utils/chat/chatTypes';
import styles from './MessageBubble.module.less';

interface MessageBubbleProps {
  message: ChatMessage;
  onDocumentClick?: (documentId: string) => void;
  onActionExecute?: (action: ActionableLink) => Promise<void>;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  onDocumentClick,
  onActionExecute 
}) => {
  const handleActionClick = (action: ActionableLink) => {
    if (action.confirmationMessage) {
      Modal.confirm({
        title: 'Confirm Action',
        content: action.confirmationMessage,
        onOk: async () => {
          await onActionExecute?.(action);
        },
        okText: 'Confirm',
        cancelText: 'Cancel'
      });
    } else {
      onActionExecute?.(action);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`${styles.messageBubble} ${styles[message.role]}`}>
      {/* Message Content */}
      <div className={styles.messageContent}>
        {message.content}
      </div>

      {/* Document References */}
      {message.documentReferences && message.documentReferences.length > 0 && (
        <div className={styles.documentReferences}>
          <div className={styles.referencesTitle}>Referenced Documents:</div>
          {message.documentReferences.map(ref => (
            <div 
              key={ref.documentId}
              className={styles.documentRef}
              onClick={() => onDocumentClick?.(ref.documentId)}
            >
              <FileTextOutlined className={styles.docIcon} />
              <div className={styles.docInfo}>
                <span className={styles.docName}>{ref.documentName}</span>
                <small className={styles.docRelevance}>({ref.relevance})</small>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {message.actionableLinks && message.actionableLinks.length > 0 && (
        <div className={styles.actionButtons}>
          {message.actionableLinks.map((action, index) => (
            <Button
              key={index}
              type="primary"
              size="small"
              onClick={() => handleActionClick(action)}
              className={styles.actionButton}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <div className={styles.timestamp}>
        {formatTimestamp(message.timestamp)}
      </div>
    </div>
  );
};

export default MessageBubble;
