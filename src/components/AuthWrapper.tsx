import React from "react";
import { UserInfoProvider } from "@/store/userInfo";

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  return <UserInfoProvider>{children}</UserInfoProvider>;
};

export default AuthWrapper;
