import axiosBean from ".";
import {
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
  return axiosBean.get("/user/info");
};

// export const getAuthProviders = (): Promise<string[]> => {
//   return axiosBean.get("/auth/providers");
// };

// Microsoft login is now handled by direct redirect to the backend endpoint
// which then redirects to Keycloak with the Microsoft IDP hint
