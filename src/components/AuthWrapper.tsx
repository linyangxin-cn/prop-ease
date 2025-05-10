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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const isPublicRoute = publicRoutes.includes(location.pathname);

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
        } else {
          navigate('/login', { replace: true });
        }
      } catch (error) {
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname, navigate, isPublicRoute]);

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

  if (!isAuthenticated && !isPublicRoute) {
    navigate('/login', { replace: true });
    return null;
  }

  return <>{children}</>;
};

export default AuthWrapper;
