import { Button, Divider, Form, Input } from "antd";
import React from "react";
// import loginBanner from "@/assets/login-banner.svg";
import microsoftLogo from "@/assets/microsoft-logo.svg";
import styles from "./index.module.less";
import cs from "classnames";
import SignLayout from "@/components/SignLayout";

const Login: React.FC = () => {
  return (
    <SignLayout title="Welcome to PropEase">
      <Form layout="vertical" requiredMark={false}>
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: "Please input your email!" }]}
        >
          <Input type="text" placeholder="Enter email" />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input type="text" placeholder="Enter password" />
        </Form.Item>
      </Form>
      <Button type="primary" block>
        Sign in
      </Button>

      <Divider className={styles.divider}>Or</Divider>
      <Button block className={cs(styles.button, styles.microsoftButton)}>
        <img
          src={microsoftLogo}
          alt="microsoft logo"
          className={styles.microsoftLogo}
        />
        Sign in with Microsoft
      </Button>

      <Button block type="link" className={cs(styles.button, styles.ssoButton)}>
        Sign in with SSO
      </Button>

      <div className={styles.signUpconatiner}>
        <span>Don't have an account? </span>
        <Button className={styles.signUpBtn} type="link">
          Sign up
        </Button>
      </div>
    </SignLayout>
  );
};

export default Login;
