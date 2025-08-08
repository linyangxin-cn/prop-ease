import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { 
  ChatMessage, 
  SendMessageRequest,
  ActionableLink 
} from '@/utils/chat/chatTypes';
import { 
  sendChatMessage, 
  getChatMessages, 
  clearChatMessages,
  executeActionableLink 
} from '@/utils/chat/chatApi';

interface UseDataroomChatProps {
  dataroomId: string;
}

interface UseDataroomChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (messageText: string) => Promise<void>;
  clearChat: () => Promise<void>;
  executeAction: (action: ActionableLink) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

export const useDataroomChat = ({ dataroomId }: UseDataroomChatProps): UseDataroomChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing messages when hook initializes
  const refreshMessages = useCallback(async () => {
    try {
      const response = await getChatMessages(dataroomId);
      setMessages(response.messages);
    } catch (error) {
      console.error('Failed to load chat messages:', error);
    }
  }, [dataroomId]);

  // Load messages on mount
  useEffect(() => {
    refreshMessages();
  }, [refreshMessages]);

  // Send a new message
  const sendMessage = useCallback(async (
    messageText: string
  ) => {
    if (!messageText.trim()) return;

    // Add user message immediately to UI
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      content: messageText,
      role: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const request: SendMessageRequest = {
        message: messageText
      };

      const response = await sendChatMessage(dataroomId, request);
      
      // Add AI response to messages
      const aiMessage: ChatMessage = {
        id: response.messageId,
        content: response.response,
        role: 'assistant',
        timestamp: response.timestamp,
        documentReferences: response.documentReferences,
        actionableLinks: response.actionableLinks
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      message.error('Failed to send message. Please try again.');
      
      // Remove the user message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [dataroomId]);

  // Clear chat history
  const clearChat = useCallback(async () => {
    try {
      await clearChatMessages(dataroomId);
      setMessages([]);
      message.success('Chat history cleared');
    } catch (error) {
      console.error('Failed to clear chat:', error);
      message.error('Failed to clear chat history');
    }
  }, [dataroomId]);

  // Execute an actionable link
  const executeAction = useCallback(async (action: ActionableLink) => {
    try {
      await executeActionableLink(action);
      message.success(`${action.label} completed successfully`);
    } catch (error) {
      console.error('Failed to execute action:', error);
      message.error(`Failed to ${action.label.toLowerCase()}`);
    }
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    executeAction,
    refreshMessages
  };
};
