import SignLayout from "@/components/SignLayout";
import { Button, Form, Input, Space } from "antd";
import React from "react";
import styles from "./index.module.less";
import { CheckCircleOutlined } from "@ant-design/icons";
import { signUp } from "@/utils/request/request-utils";

const SignUp: React.FC = () => {
  const [form] = Form.useForm();
  const [passwordValidateResult, setPasswordValidateResult] = React.useState({
    length: false,
    special: false,
  });

  const passwordValidator = (_: any, value: any) => {
    if (!value) {
      return Promise.reject("Please input password!");
    }
    if (value.length < 10) {
      return Promise.reject();
    }
    setPasswordValidateResult((prev) => ({ ...prev, length: true }));
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) {
      return Promise.reject();
    }
    setPasswordValidateResult((prev) => ({ ...prev, special: true }));

    return Promise.resolve();
  };

  const onSignUpClick = async () => {
    const validateResult = await form.validateFields().catch(() => null);
    if (!validateResult) {
      return;
    }

    const res = await signUp({ ...validateResult }).catch(() => null);
    console.log(res);
  };

  return (
    <SignLayout title="Sign up for PropEase">
      <Form
        layout="vertical"
        requiredMark={false}
        style={{ width: "368px" }}
        form={form}
      >
        <Space size={16} align="baseline">
          <Form.Item
            name={"fristName"}
            label="Frist Name"
            rules={[{ required: true, message: "Please input frist name!" }]}
          >
            <Input placeholder="Enter first name" />
          </Form.Item>
          <Form.Item
            name={"lastName"}
            label="Last Name"
            rules={[{ required: true, message: "Please input last name!" }]}
          >
            <Input placeholder="Enter last name" />
          </Form.Item>
        </Space>

        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: "Please input your email!" }]}
        >
          <Input type="text" placeholder="Enter email" />
        </Form.Item>
        <Form.Item
          label="Set password"
          name="password"
          rules={[{ validator: passwordValidator }]}
          extra={
            <div>
              <div className={styles.passwordTips}>
                <CheckCircleOutlined
                  style={
                    passwordValidateResult.length ? { color: "green" } : {}
                  }
                />
                <span>At least 10 characters</span>
              </div>
              <div className={styles.passwordTips}>
                <CheckCircleOutlined
                  style={
                    passwordValidateResult.special ? { color: "green" } : {}
                  }
                />
                <span>Contains a special character</span>
              </div>
            </div>
          }
        >
          <Input.Password type="text" placeholder="Enter password" />
        </Form.Item>
        <Form.Item
          label="Tenant_id"
          name="tenantId"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input type="text" placeholder="Enter tenant_id" />
        </Form.Item>
      </Form>
      <Button type="primary" block onClick={onSignUpClick}>
        Sign up
      </Button>
    </SignLayout>
  );
};

export default SignUp;
