import React, { useRef, useEffect } from 'react';
import { Spin, Button, Tooltip } from 'antd';
import { DeleteOutlined, CloseOutlined } from '@ant-design/icons';
import { useDataroomChat } from '@/hooks/useDataroomChat';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import styles from './index.module.less';

interface ChatSidebarProps {
  dataroomId: string;
  dataroomName: string;
  isVisible: boolean;
  onToggle: () => void;
  onDocumentSelect?: (documentId: string) => void;
  onRefreshDocuments?: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  dataroomId,
  dataroomName,
  isVisible,
  onToggle,
  onDocumentSelect,
  onRefreshDocuments
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    clearChat, 
    executeAction 
  } = useDataroomChat({ dataroomId });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleActionExecute = async (action: any) => {
    await executeAction(action);
    // Refresh documents if the action might have changed document data
    if (onRefreshDocuments && (
      action.apiEndpoint.includes('/classification') ||
      action.apiEndpoint.includes('/documents/')
    )) {
      onRefreshDocuments();
    }
  };

  const handleClearChat = () => {
    clearChat();
  };

  return (
    <div className={styles.chatSidebar}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.headerTitle}>
          <span className={styles.title}>AI Assistant</span>
          <span className={styles.subtitle}>{dataroomName}</span>
        </div>
        <div className={styles.headerActions}>
          <Tooltip title="Clear chat history">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={handleClearChat}
              size="small"
              className={styles.headerButton}
            />
          </Tooltip>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onToggle}
            size="small"
            className={styles.headerButton}
          />
        </div>
      </div>

      {/* Messages Area */}
      <div className={styles.messagesContainer}>
        <div className={styles.messagesList}>
          {messages.length === 0 && !isLoading && (
            <div className={styles.emptyState}>
              <div className={styles.emptyTitle}>👋 Hi there!</div>
              <div className={styles.emptyText}>
                I'm your AI assistant for this property. Ask me about:
              </div>
              <ul className={styles.suggestions}>
                <li>Document expiry dates</li>
                <li>Missing documents</li>
                <li>Lease contract status</li>
                <li>Classification issues</li>
              </ul>
            </div>
          )}

          {messages.map(message => (
            <MessageBubble
              key={message.id}
              message={message}
              onDocumentClick={onDocumentSelect}
              onActionExecute={handleActionExecute}
            />
          ))}

          {isLoading && (
            <div className={styles.loadingMessage}>
              <Spin size="small" />
              <span>AI is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className={styles.inputContainer}>
        <ChatInput
          onSendMessage={sendMessage}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatSidebar;
