import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUserInfo } from '@/utils/request/request-utils';
import { Spin } from 'antd';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const publicRoutes = ['/login', '/sign-up'];

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  // This state is set but not directly used in rendering - it's used for flow control
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Normalize the path to handle /index.html as the root path
  const normalizedPath = location.pathname === '/index.html' ? '/' : location.pathname;

  // Check if the current route is a public route
  const isPublicRoute = publicRoutes.includes(normalizedPath);

  // This variable is defined for clarity but not directly used
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isRootPath = normalizedPath === '/';

  useEffect(() => {
    const checkAuth = async () => {
      if (isPublicRoute) {
        setIsLoading(false);
        return;
      }

      try {
        const userInfo = await getUserInfo();
        if (userInfo) {
          setIsAuthenticated(true);

          // If we're at /login but already authenticated, redirect to home
          if (normalizedPath === '/login') {
            window.location.href = window.location.origin;
            return;
          }
        } else {
          // If not authenticated and not on a public route, redirect to login
          window.location.href = window.location.origin + '/login';
        }
      } catch (error) {
        // On error, redirect to login
        window.location.href = window.location.origin + '/login';
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname, navigate, isPublicRoute, normalizedPath]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // We've already handled redirections in the useEffect
  // Just render children if we've reached this point
  return <>{children}</>;
};

export default AuthWrapper;
