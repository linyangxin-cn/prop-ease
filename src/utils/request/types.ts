export interface CommonResponse<T = any> {
  message: string;
  code: number;
  data: T;
}

// sign up
export interface SignUpRequest {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  tenant_id: string;
}
export interface SignUpResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  tenant_id: string;
  user: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    role: string;
  };
}

// sign in
export interface SignInRequest {
  email: string;
  password: string;
}
export interface SignInResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  tenant_id: string;
  user: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    role: string;
  };
}

// 获取三方登录方式
export type ThirdPartyLoginResponse = string[];

//获取microsoft sso登录链接
export interface MicrosoftSSORequest {
  redirect_url: string;
}

// microsoft sso登录回调
export interface MicrosoftSSORequest {
  code: string;
  state: string;
}
export interface MicrosoftSSOResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  tenant_id: string;
  user: {
    id: string;
    email: string;
    display_name: string;
  };
}

// get user/info
export interface UserInfoResponse {
  user_id: string;
  email: string;
  role: string;
  display_name: string;
  is_active: boolean;
  roles: string[];
  created_at: string;
}

// post /document/upload
export interface UploadFileRequest {
  file_name: string[];
  source: string; // "local" | "url"
}

export interface UploadFileResponse {
  upload_batch_id: string;
  files: {
    file_id: string;
    original_filename: string;
    upload_urk: string;
    expires_at: string;
  }[];
}

// get /datarooms
export interface GetDataroomsRequest {
  page: number;
  page_size: number;
}

export interface GetDataroomsResponse {
  datarooms: {
    dataroom_id: string;
    name: string;
    description: string;
    document_count: number;
    dataroom_image_url: string;
    created_at: string;
    updated_at: string;
  }[];
  total: number;
  page: number;
  page_size: number;
}

// post  /datarooms
export interface CreateDataroomRequest {
  name: string;
  description: string;
}

export interface CreateDataroomResponse {
  dataroom_id: string;
  name: string;
  description: string;
}
