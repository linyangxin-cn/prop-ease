import { getUserInfo } from "@/utils/request/request-utils";
import { UserInfoResponse } from "@/utils/request/types";
import { message, Spin } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const publicRoutes = ["/login", "/sign-up"];

const UserInfoContext = React.createContext<UserInfoResponse | undefined>(
  undefined
);

interface UserInfoProviderProps {
  children: React.ReactNode;
}

const UserInfoProvider = ({ children }: UserInfoProviderProps) => {
  const [userInfo, setUserInfo] = useState<UserInfoResponse | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const redirect = useNavigate();

  const jump = useCallback(
    (path: string) => {
      setTimeout(() => {
        redirect(path);
      }, 3000);
    },
    [redirect]
  );

  useEffect(() => {
    const checkAuth = async () => {
      const isPublicRoute = publicRoutes.includes(location.pathname);
      if (isPublicRoute || userInfo) {
        setIsLoading(false);
        return;
      }

      try {
        const _userInfo = await getUserInfo();
        if (_userInfo) {
          setUserInfo(_userInfo);
          // If we're at /login but already authenticated, redirect to home
          if (location.pathname === "/login") {
            message.success("Already logged in, redirecting");
            jump("/");
            return;
          }
        } else {
          // If not authenticated and not on a public route, redirect to login
          jump("/login");
        }
      } catch (error) {
        // On error, redirect to login
        jump("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <UserInfoContext.Provider value={userInfo}>
      {children}
    </UserInfoContext.Provider>
  );
};

export { UserInfoContext, UserInfoProvider };
