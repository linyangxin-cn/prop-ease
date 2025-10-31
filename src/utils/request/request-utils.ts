import axiosBean from ".";
import {
  CommonResponse,
  ConfirmClassificationCateResponse,
  DataroomInfo,
  FeedbackRequest,
  GetClassificationCateResponse,
  GetDataroomsResponse,
  GetDocumentsResponse,
  PreviewData,
  SignInRequest,
  SignInResponse,
  SignUpRequest,
  SignUpResponse,
  UserInfoResponse,
} from "./types";

export const signUp = (params: SignUpRequest): Promise<SignUpResponse> => {
  return axiosBean.post("/auth/register", params, {
    timeout: 30000, // 30 second timeout to prevent hanging requests
  });
};

export const signIn = (params: SignInRequest): Promise<SignInResponse> => {
  return axiosBean.post("/auth/login", params, {
    timeout: 30000, // 30 second timeout to prevent hanging requests
  });
};

export const getUserInfo = (): Promise<UserInfoResponse> => {
  return axiosBean.get("/auth/me");
};

export const logout = async (): Promise<void> => {
  try {
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });

    window.location.href = window.location.origin + "/login";
  } catch (error) {
    console.error("Logout failed:", error);

    window.location.href = window.location.origin + "/login";
  }
};

export const getDataRooms = (): Promise<GetDataroomsResponse> => {
  return axiosBean.get("/datarooms/");
};

export const createDataRoom = (params: {
  name: string;
  description: string;
  dataroomImageUrl?: string;
}) => {
  return axiosBean.post("/datarooms/", params);
};

export const getDataroomDetail = (id: string): Promise<DataroomInfo> => {
  return axiosBean.get("/datarooms/" + id);
};

export const getDataroomDocuments = (
  id: string,
  skip: number = 0,
  limit: number = 100
): Promise<GetDocumentsResponse> => {
  return axiosBean.get("/datarooms/" + id + "/documents", {
    params: { skip, limit }
  });
};

export const deleteDataRoom = (id: string) => {
  return axiosBean.delete("/datarooms/" + id);
};

export const updateDataRoom = (params: {
  id: string;
  name: string;
  description: string;
  dataroomImageUrl?: string;
}) => {
  const { id, ...resParams } = params;
  return axiosBean.put("/datarooms/" + id, resParams);
};

export const uploadDocuments = (id: string, documentIds: string[]) => {
  return axiosBean.post(`/datarooms/${id}/documents`, { documentIds });
};

export const uploadAndAddDocumentsToDataroom = (
  id: string,
  files: File[],
  folderMetadata?: Record<string, any>
) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  // Add folder metadata if provided
  if (folderMetadata && Object.keys(folderMetadata).length > 0) {
    formData.append("folder_metadata", JSON.stringify(folderMetadata));
  }

  // Calculate timeout based on file count (minimum 2 minutes, +30s per file, max 15 minutes)
  const baseTimeout = 120000; // 2 minutes base
  const perFileTimeout = 30000; // 30 seconds per file
  const maxTimeout = 900000; // 15 minutes max
  const calculatedTimeout = Math.min(baseTimeout + (files.length * perFileTimeout), maxTimeout);

  return axiosBean.post(`/datarooms/${id}/upload-and-add`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: calculatedTimeout,
  });
};

export const getDocumentsPreview = (id: string): Promise<PreviewData> => {
  return axiosBean.get(`/documents/${id}/preview`);
};

export const deleteDocument = (id: string): Promise<CommonResponse> => {
  return axiosBean.delete(`/documents/${id}`);
};

//点赞
export const thumbsUp = (id: string): Promise<CommonResponse<null>> => {
  return axiosBean.post(`/documents/${id}/thumbs-up`);
};

//差评
export const feedback = (
  id: string,
  feedbackRes: FeedbackRequest
): Promise<CommonResponse<null>> => {
  return axiosBean.post(`/documents/${id}/feedback`, { ...feedbackRes });
};

export const getClassificationCate =
  (): Promise<GetClassificationCateResponse> => {
    return axiosBean.get(`/classification/categories`);
  };

export const confirmClassificationCate = (
  params: ConfirmClassificationCateResponse
): Promise<CommonResponse> => {
  const { id, ...resParams } = params;
  return axiosBean.patch(`/documents/${id}/confirmation`, {
    ...resParams,
    userConfirmationStatus: "CONFIRMED",
  }, {
    timeout: 30000, // 30 second timeout to prevent hanging requests
  });
};

// Chat API endpoints
export const sendChatMessage = (dataroomId: string, request: any): Promise<any> => {
  return axiosBean.post(`/datarooms/${dataroomId}/chat/messages`, request);
};

export const getChatMessages = (dataroomId: string): Promise<any> => {
  return axiosBean.get(`/datarooms/${dataroomId}/chat/messages`);
};

export const clearChatMessages = (dataroomId: string): Promise<any> => {
  return axiosBean.delete(`/datarooms/${dataroomId}/chat/messages`);
};

// SharePoint Integration API calls
export const getSharePointAuthUrl = (): Promise<{
  authUrl: string;
  state: string;
}> => {
  return axiosBean.get("/sharepoint/auth/url");
};

export const checkSharePointConnection = (): Promise<{
  connected: boolean;
  tenantId: string;
}> => {
  return axiosBean.get("/sharepoint/connection/status");
};

export const getSharePointSites = (): Promise<{
  sites: Array<{
    siteId: string;
    name: string;
    displayName?: string;
    webUrl: string;
  }>;
}> => {
  return axiosBean.get("/sharepoint/sites");
};

export const getSharePointLibraries = (siteId: string): Promise<{
  libraries: Array<{
    libraryId: string;
    name: string;
    description?: string;
    webUrl: string;
  }>;
}> => {
  return axiosBean.get(`/sharepoint/sites/${siteId}/libraries`);
};

export const getSharePointFiles = (
  siteId: string,
  libraryId: string,
  folderPath?: string
): Promise<{
  files: Array<{
    fileId: string;
    name: string;
    size: number;
    webUrl: string;
    contentType: string;
    modifiedDateTime?: string;
    createdDateTime?: string;
  }>;
}> => {
  const params = folderPath ? { folder_path: folderPath } : {};
  return axiosBean.get(`/sharepoint/sites/${siteId}/libraries/${libraryId}/files`, {
    params,
  });
};

export const importSharePointFiles = (
  siteId: string,
  libraryId: string,
  fileIds: string[],
  dataroomId?: string
): Promise<{
  importedDocuments: Array<{
    documentId: string;
    filename: string;
    sharepointFileId: string;
    status: string;
  }>;
  failedImports: Array<{
    fileId: string;
    error: string;
  }>;
  totalRequested: number;
  successCount: number;
  failureCount: number;
}> => {
  const formData = new FormData();
  formData.append("site_id", siteId);
  formData.append("library_id", libraryId);
  formData.append("file_ids", fileIds.join(","));

  // Add dataroom_id if provided
  if (dataroomId) {
    formData.append("dataroom_id", dataroomId);
  }

  return axiosBean.post("/sharepoint/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 300000, // 5 minutes for import operations
  });
};
