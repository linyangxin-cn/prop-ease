# 🤖 AI Assistant API Specifications

## 📋 Overview
The AI Assistant operates on the entire dataroom context, providing comprehensive answers about all documents in the property without requiring document tagging.

## 🔗 Base Configuration
- **Base URL**: `https://api.propease.eu/api/v1`
- **Authentication**: Cookie-based authentication (withCredentials: true)
- **Content-Type**: `application/json`

---

## 📡 API Endpoints

### 1. **Send Chat Message**
**Endpoint**: `POST /datarooms/{dataroomId}/chat/messages`

**Request Body**:
```typescript
{
  message: string;  // User's message text
}
```

**Response**:
```typescript
{
  code: 0,                   // Success code
  message: "Success",
  data: {
    messageId: string;       // Unique ID for the AI response
    response: string;        // AI assistant's response text
    timestamp: string;       // ISO 8601 timestamp
    documentReferences?: DocumentReference[];  // Optional referenced docs
    actionableLinks?: ActionableLink[];        // Optional action buttons
  }
}
```

---

### 2. **Get Chat Messages History**
**Endpoint**: `GET /datarooms/{dataroomId}/chat/messages`

**Response**:
```typescript
{
  code: 0,
  message: "Success", 
  data: {
    messages: ChatMessage[];  // Array of chat messages
  }
}
```

---

### 3. **Clear Chat History**
**Endpoint**: `DELETE /datarooms/{dataroomId}/chat/messages`

**Response**:
```typescript
{
  code: 0,
  message: "Chat history cleared successfully",
  data: null
}
```

---

## 📊 Data Types

### **ChatMessage**
```typescript
interface ChatMessage {
  id: string;                           // Unique message ID
  content: string;                      // Message text content
  role: 'user' | 'assistant';          // Message sender
  timestamp: string;                    // ISO 8601 timestamp
  documentReferences?: DocumentReference[];  // Referenced documents
  actionableLinks?: ActionableLink[];        // Action buttons
}
```

### **DocumentReference**
```typescript
interface DocumentReference {
  documentId: string;       // Document ID in the system
  documentName: string;     // Display name of the document
  relevance: string;        // Why this document is referenced
}
```

### **ActionableLink**
```typescript
interface ActionableLink {
  label: string;                    // Button text (e.g., "Update Classification")
  apiEndpoint: string;              // API endpoint to call
  method: 'PUT' | 'POST' | 'DELETE'; // HTTP method
  payload?: any;                    // Pre-filled request data
  confirmationMessage?: string;     // Optional confirmation dialog text
}
```

---

## 🎯 AI Assistant Context & Capabilities

### **Dataroom-Wide Context** 🏢
The AI assistant has access to **ALL documents** in the dataroom and can provide comprehensive insights:

- **Document Overview**: "Show me all documents in this property"
- **Expiry Tracking**: "Which documents are expiring in the next 30 days?"
- **Missing Documents**: "What documents are missing for this property type?"
- **Classification Issues**: "Are there any misclassified documents?"
- **Compliance Status**: "Is this property compliant with regulations?"

### **Smart Document Analysis** 📊
- **Cross-Document Insights**: Compare and analyze relationships between documents
- **Pattern Recognition**: Identify trends across document types and dates
- **Risk Assessment**: Highlight potential issues across the entire property portfolio
- **Completeness Check**: Verify if all required documents are present

### **Actionable Responses** ⚡
- **Bulk Operations**: "Update all lease classifications" 
- **Batch Reminders**: "Set reminders for all expiring certificates"
- **Mass Export**: "Export all compliance documents"
- **Global Updates**: "Mark all fire safety reports as reviewed"

---

## 🔄 User Experience Flow

### **Simplified Interaction** ✨
1. **User asks question** → "Which documents need renewal?"
2. **AI analyzes entire dataroom** → Reviews ALL documents
3. **Comprehensive response** → Lists relevant documents with details
4. **Actionable suggestions** → Provides buttons for next steps
5. **Document navigation** → User can click references to view specific docs

### **Example Conversations** 💬

**User**: "What documents are expiring soon?"
**AI**: "I found 3 documents expiring in the next 30 days:
- Fire Safety Certificate (expires Jan 15, 2024)
- Energy Performance Certificate (expires Jan 22, 2024)  
- Insurance Policy (expires Feb 5, 2024)

Would you like me to set renewal reminders?"
[Set Reminders] [Export List]

**User**: "Are we missing any required documents?"
**AI**: "Based on property regulations, you're missing:
- Asbestos Survey Report (required for buildings pre-2000)
- Gas Safety Certificate (required annually)

I can help you request these documents."
[Request Documents] [View Requirements]

---

## 🛡️ Error Handling

### **Standard Error Response**
```typescript
{
  code: number;        // Error code (non-zero)
  message: string;     // Error message
  data: null;
}
```

### **Common Error Codes**
- `1002`: Authentication required (triggers redirect to login)
- `4xx`: Client errors (validation, permissions, etc.)
- `5xx`: Server errors (AI service unavailable, etc.)

---

## 📈 Benefits of Simplified Approach

### **For Users** 👥
- **No Decision Fatigue**: No need to choose which documents to include
- **Comprehensive Answers**: AI considers all relevant information
- **Natural Interaction**: Ask questions like talking to a property expert
- **Better Insights**: Cross-document analysis provides deeper understanding

### **For AI Assistant** 🤖
- **Full Context**: Access to complete property information
- **Better Recommendations**: Can suggest actions based on entire portfolio
- **Smarter Responses**: Understands relationships between documents
- **Proactive Insights**: Can identify issues user might not have considered

### **For Backend Implementation** ⚙️
- **Simpler API**: Single message parameter instead of complex tagging
- **Consistent Context**: Always process entire dataroom for better results
- **Easier Caching**: Can cache dataroom-wide analysis results
- **Better Performance**: No need to handle partial context scenarios

---

## 🚀 Implementation Status

✅ **Frontend Changes Complete**
- Document tagging UI removed
- Simplified message sending interface
- Updated component interfaces
- Clean user experience

✅ **API Interface Defined**
- Simplified request/response structure
- Comprehensive data types
- Clear error handling
- Actionable response format

🔄 **Next Steps**
- Backend implementation of simplified API
- AI context processing for entire dataroom
- Testing with real property data
- Performance optimization for large datarooms

This simplified approach provides a much better user experience while making the AI assistant more powerful and comprehensive! 🚀
