import { Button, Divider, Form, Input } from "antd";
import React from "react";
import microsoftLogo from "@/assets/microsoft-logo.svg";
import styles from "./index.module.less";
import cs from "classnames";
import SignLayout from "@/components/SignLayout";
import { signIn } from "@/utils/request/request-utils";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const redirect = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [microsoftLoading, setMicrosoftLoading] = React.useState(false);

  const onSignInClick = async () => {
    if (loading) return; // Prevent multiple clicks

    const validateResult = await form.validateFields().catch(() => null);
    if (!validateResult) {
      return;
    }

    setLoading(true);
    try {
      const res = await signIn({ ...validateResult });
      if (res) {
        redirect("/");
      }
    } catch (error) {
      // Error message is already handled by axios interceptor
    } finally {
      setLoading(false);
    }
  };

  const onMicrosoftLoginClick = () => {
    if (microsoftLoading) return; // Prevent multiple clicks

    setMicrosoftLoading(true);
    // Redirect directly to the Microsoft login endpoint
    // The backend will handle the redirect to Keycloak with Microsoft IDP hint
    window.location.href =
      "https://api.propease.eu/api/v1/auth/login/microsoft";
  };

  return (
    <SignLayout title="Welcome to PropEase">
      <Form layout="vertical" requiredMark={false} form={form}>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please input your email!" },
            {
              type: "email",
              message: "Please enter a valid email address!",
            },
          ]}
        >
          <Input type="text" placeholder="Enter email" />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input.Password type="text" placeholder="Enter password" />
        </Form.Item>
      </Form>
      <Button type="primary" block onClick={onSignInClick} loading={loading} disabled={loading}>
        Sign in
      </Button>

      <Divider className={styles.divider}>Or</Divider>
      <Button
        block
        className={cs(styles.button, styles.microsoftButton)}
        onClick={onMicrosoftLoginClick}
        disabled={true} // Currently disabled, but when enabled will use: disabled={microsoftLoading}
        loading={microsoftLoading}
      >
        <img
          src={microsoftLogo}
          alt="microsoft logo"
          className={styles.microsoftLogo}
        />
        Sign in with Microsoft
      </Button>

      <Button
        block
        type="link"
        className={cs(styles.button, styles.ssoButton)}
        disabled
      >
        Sign in with SSO
      </Button>

      <div className={styles.signUpconatiner}>
        <span>Don't have an account? </span>
        <Button
          className={styles.signUpBtn}
          type="link"
          onClick={() => {
            redirect("/sign-up");
          }}
        >
          Sign up
        </Button>
      </div>
    </SignLayout>
  );
};

export default Login;
