import axiosBean from ".";
import {
  CommonResponse,
  DataroomInfo,
  FeedbackRequest,
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
  return axiosBean.post("/auth/register", params);
};

export const signIn = (params: SignInRequest): Promise<SignInResponse> => {
  return axiosBean.post("/auth/login", params);
};

export const getUserInfo = (): Promise<UserInfoResponse> => {
  return axiosBean.get("/auth/me");
};

export const logout = async (): Promise<void> => {
  try {
    // If there's a server-side logout endpoint, call it here
    // For example: await axiosBean.post("/auth/logout");

    // Clear any client-side storage
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });

    // Redirect to login page
    window.location.href = window.location.origin + "/login";
  } catch (error) {
    console.error("Logout failed:", error);
    // Still redirect to login page even if the server-side logout fails
    window.location.href = window.location.origin + "/login";
  }
};

// export const getAuthProviders = (): Promise<string[]> => {
//   return axiosBean.get("/auth/providers");
// };

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

export const getDocumentsPreview = (id: string): Promise<PreviewData> => {
  return axiosBean.get(`/documents/${id}/preview`);
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
