import React, { useMemo } from 'react';
import { Button, Modal, Tooltip } from 'antd';
import { FileTextOutlined, TableOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, ActionableLink } from '@/utils/chat/chatTypes';
import styles from './MessageBubble.module.less';

interface MessageBubbleProps {
  message: ChatMessage;
  onDocumentClick?: (documentId: string, confirmationStatus?: string) => void;
  onActionExecute?: (action: ActionableLink) => Promise<void>;
}

// Content block types
type ContentBlock =
  | { type: 'text'; content: string }
  | { type: 'table'; content: string };

// Parse markdown content into separate blocks (text vs tables)
const parseContentBlocks = (content: string): ContentBlock[] => {
  const blocks: ContentBlock[] = [];
  // Regex to match markdown tables (header row, separator row, and data rows)
  const tableRegex = /(?:^|\n)(\|[^\n]+\|\n\|[-:\s|]+\|\n(?:\|[^\n]+\|\n?)+)/g;

  let lastIndex = 0;
  let match;

  while ((match = tableRegex.exec(content)) !== null) {
    // Add text before table if any
    const textBefore = content.slice(lastIndex, match.index).trim();
    if (textBefore) {
      blocks.push({ type: 'text', content: textBefore });
    }
    // Add table block
    blocks.push({ type: 'table', content: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last table
  const textAfter = content.slice(lastIndex).trim();
  if (textAfter) {
    blocks.push({ type: 'text', content: textAfter });
  }

  // If no blocks found, treat entire content as text
  if (blocks.length === 0) {
    blocks.push({ type: 'text', content: content });
  }

  return blocks;
};

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

  // Parse content into blocks for assistant messages
  const contentBlocks = useMemo(() => {
    if (message.role === 'assistant') {
      return parseContentBlocks(message.content);
    }
    return [{ type: 'text' as const, content: message.content }];
  }, [message.content, message.role]);

  // Markdown components for text blocks (no tables)
  const textMarkdownComponents = {
    p: ({ children }: { children?: React.ReactNode }) => <p className={styles.markdownP}>{children}</p>,
    ul: ({ children }: { children?: React.ReactNode }) => <ul className={styles.markdownUl}>{children}</ul>,
    ol: ({ children }: { children?: React.ReactNode }) => <ol className={styles.markdownOl}>{children}</ol>,
    li: ({ children }: { children?: React.ReactNode }) => <li className={styles.markdownLi}>{children}</li>,
    strong: ({ children }: { children?: React.ReactNode }) => <strong className={styles.markdownStrong}>{children}</strong>,
    code: ({ children }: { children?: React.ReactNode }) => <code className={styles.markdownCode}>{children}</code>,
    h1: ({ children }: { children?: React.ReactNode }) => <h4 className={styles.markdownHeading}>{children}</h4>,
    h2: ({ children }: { children?: React.ReactNode }) => <h4 className={styles.markdownHeading}>{children}</h4>,
    h3: ({ children }: { children?: React.ReactNode }) => <h4 className={styles.markdownHeading}>{children}</h4>,
  };

  // Markdown components for table blocks
  const tableMarkdownComponents = {
    table: ({ children }: { children?: React.ReactNode }) => <table className={styles.markdownTable}>{children}</table>,
    thead: ({ children }: { children?: React.ReactNode }) => <thead className={styles.markdownThead}>{children}</thead>,
    tbody: ({ children }: { children?: React.ReactNode }) => <tbody className={styles.markdownTbody}>{children}</tbody>,
    tr: ({ children }: { children?: React.ReactNode }) => <tr className={styles.markdownTr}>{children}</tr>,
    th: ({ children }: { children?: React.ReactNode }) => <th className={styles.markdownTh}>{children}</th>,
    td: ({ children }: { children?: React.ReactNode }) => <td className={styles.markdownTd}>{children}</td>,
  };

  // Render user message (simple)
  if (message.role === 'user') {
    return (
      <div className={`${styles.messageWrapper} ${styles.user}`}>
        <div className={styles.textBlock}>
          <div className={styles.messageContent}>{message.content}</div>
        </div>
        <div className={styles.timestamp}>{formatTimestamp(message.timestamp)}</div>
      </div>
    );
  }

  // Render assistant message (with blocks)
  return (
    <div className={`${styles.messageWrapper} ${styles.assistant}`}>
      {/* Content Blocks */}
      {contentBlocks.map((block, index) => (
        block.type === 'text' ? (
          <div key={index} className={styles.textBlock}>
            <div className={styles.messageContent}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={textMarkdownComponents}>
                {block.content}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <div key={index} className={styles.tableBlock}>
            <div className={styles.tableHeader}>
              <TableOutlined className={styles.tableIcon} />
              <span>Data Table</span>
            </div>
            <div className={styles.tableContent}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={tableMarkdownComponents}>
                {block.content}
              </ReactMarkdown>
            </div>
          </div>
        )
      ))}

      {/* Document References - Table-like styling */}
      {message.documentReferences && message.documentReferences.length > 0 && (
        <div className={styles.documentReferences}>
          <div className={styles.referencesHeader}>
            <FileTextOutlined className={styles.referencesIcon} />
            <span>Referenced Documents</span>
          </div>
          {message.documentReferences.map(ref => (
            <Tooltip
              key={ref.documentId}
              title={ref.documentName}
              placement="topLeft"
            >
              <div
                className={styles.documentRef}
                onClick={() => onDocumentClick?.(ref.documentId, ref.confirmationStatus)}
              >
                <FileTextOutlined className={styles.docIcon} />
                <div className={styles.docInfo}>
                  <span className={styles.docName}>{ref.documentName}</span>
                  <small className={styles.docRelevance}>({ref.relevance})</small>
                </div>
              </div>
            </Tooltip>
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
      <div className={styles.timestamp}>{formatTimestamp(message.timestamp)}</div>
    </div>
  );
};

export default MessageBubble;
