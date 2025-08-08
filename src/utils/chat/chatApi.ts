import axiosBean from "../request";
import {
  sendChatMessage as sendChatMessageAPI,
  getChatMessages as getChatMessagesAPI,
  clearChatMessages as clearChatMessagesAPI
} from "../request/request-utils";
import {
  SendMessageRequest,
  SendMessageResponse,
  GetMessagesResponse,
  ActionableLink
} from "./chatTypes";

/**
 * Send a message to the AI assistant for a specific dataroom
 */
export const sendChatMessage = async (
  dataroomId: string,
  request: SendMessageRequest
): Promise<SendMessageResponse> => {
  return sendChatMessageAPI(dataroomId, request);
};

/**
 * Get chat message history for a dataroom
 */
export const getChatMessages = async (dataroomId: string): Promise<GetMessagesResponse> => {
  return getChatMessagesAPI(dataroomId);
};

/**
 * Clear chat history for a dataroom
 */
export const clearChatMessages = async (dataroomId: string): Promise<void> => {
  await clearChatMessagesAPI(dataroomId);
};

/**
 * Execute an actionable link (API call suggested by AI)
 */
export const executeActionableLink = async (action: ActionableLink): Promise<any> => {
  const config = {
    method: action.method,
    url: action.apiEndpoint,
    ...(action.payload && { data: action.payload })
  };

  return axiosBean.request(config);
};
