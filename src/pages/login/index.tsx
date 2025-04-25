import { Button } from 'antd';
import React from 'react';
import loginBanner from '@/assets/login-banner.svg'; 

const Login: React.FC = () => {




    return (
        <div>
            <img src={loginBanner} alt="Login Banner" style={{ width: '100%', height: 'auto' }} />
            <Button>Login</Button>
            <h1>Welcome to the Home Page</h1>
        </div>
    );
};

export default Login;