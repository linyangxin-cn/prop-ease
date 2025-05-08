import axiosBean from ".";
import {
  DataroomInfo,
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

// export const getAuthProviders = (): Promise<string[]> => {
//   return axiosBean.get("/auth/providers");
// };

export const getDataRooms = (): Promise<GetDataroomsResponse> => {
  return axiosBean.get("/datarooms/");
};

export const createDataRoom = (params: {
  name: string;
  description: string;
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
