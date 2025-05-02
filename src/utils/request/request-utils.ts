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
