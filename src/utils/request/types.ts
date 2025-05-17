export interface CommonResponse<T = any> {
  message: string;
  code: number;
  data: T;
}

// sign up
export interface SignUpRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantId: string;
}
export interface SignUpResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  tenantId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

// sign in
export interface SignInRequest {
  email: string;
  password: string;
}
export interface SignInResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  tenantId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

// 获取三方登录方式
export type ThirdPartyLoginResponse = string[];

//获取microsoft sso登录链接
export interface MicrosoftSSORequest {
  redirectUrl: string;
}

// microsoft sso登录回调
export interface MicrosoftSSORequest {
  code: string;
  state: string;
}
export interface MicrosoftSSOResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  tenantId: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
}

// get user/info
export interface UserInfoResponse {
  userId: string;
  email: string;
  role: string;
  displayName: string;
  isActive: boolean;
  roles: string[];
  createdAt: string;
}

// post /document/upload
export interface UploadFileRequest {
  fileName: string[];
  source: string; // "local" | "url"
}

export interface UploadFileResponse {
  uploadBatchId: string;
  files: {
    fileId: string;
    originalFileName: string;
    uploadUrk: string;
    expiresAt: string;
  }[];
}

// get /datarooms
export interface GetDataroomsRequest {
  page: number;
  pageSize: number;
}

export interface DataroomInfo {
  id: string;
  name: string;
  tenantId: string;
  description: string;
  documentCount: number;
  notConfirmedDocumentCount: number;
  confirmedDocumentCount: number;
  dataroomImageUrl: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
}

export interface GetDataroomsResponse {
  items: DataroomInfo[];
  total: number;
  page: number;
  limit: number;
}

// post  /datarooms
export interface CreateDataroomRequest {
  name: string;
  description: string;
  dataroomImageUrl?: string;
}

export interface CreateDataroomResponse {
  dataroomId: string;
  name: string;
  description: string;
  dataroomImageUrl?: string;
}

export interface DoucementInfo {
  classification_label: string;
  classification_score: number;
  content_type: string;
  id: string;
  original_filename: string;
  processed_at: string;
  status: string;
  status_message: string;
  storage_path: string;
  tenant_id: string;
  uploaded_at: string;
  uploaded_by_user_id: string;
}

export interface GetDocumentsResponse {
  confirmed: DoucementInfo[];
  not_confirmed: DoucementInfo[];
  total: number;
  page: number;
  limit: number;
}

export interface PreviewData {
  content_type: string;
  preview_url: string;
}

export interface FeedbackRequest {
  ratingType: "negative";
  documentClassificationText: string;
  documentAddressExtractionText: string;
  otherText: string;
}
