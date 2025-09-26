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
  id: string
): Promise<GetDocumentsResponse> => {
  return axiosBean.get("/datarooms/" + id + "/documents");
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

export const uploadAndAddDocumentsToDataroom = (id: string, files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  return axiosBean.post(`/datarooms/${id}/upload-and-add`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
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
