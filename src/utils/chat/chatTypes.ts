export interface DocumentReference {
  documentId: string;
  documentName: string;
  relevance: string; // Why this document is referenced
  confirmationStatus: string; // Document confirmation status (confirmed/not_confirmed)
}

export interface ActionableLink {
  label: string; // "Update Classification", "Set Reminder"
  apiEndpoint: string; // "/api/v1/documents/{id}/classification"
  method: 'PUT' | 'POST' | 'DELETE';
  payload?: any; // Pre-filled data for the API call
  confirmationMessage?: string; // "Are you sure you want to update classification?"
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  documentReferences?: DocumentReference[];
  actionableLinks?: ActionableLink[];
}

export interface SendMessageRequest {
  message: string;
}

export interface SendMessageResponse {
  messageId: string;
  response: string;
  timestamp: string;
  documentReferences?: DocumentReference[];
  actionableLinks?: ActionableLink[];
}

export interface GetMessagesResponse {
  messages: ChatMessage[];
}

export interface ChatError {
  message: string;
  code?: string;
}
