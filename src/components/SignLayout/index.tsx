import React from "react";
import loginBanner from "@/assets/login-banner.svg";
import styles from "./index.module.less";

interface SignLayoutProps {
  children?: React.ReactNode;
  title: string;
}

const SignLayout: React.FC<SignLayoutProps> = (props) => {
  const { children ,title} = props;

  return (
    <div className={styles.container}>
      <img src={loginBanner} alt="Login Banner" />
      <div className={styles.loginFormConatiner}>
        <div>
          <div className={styles.title}>{title}</div>
          <div className={styles.desc}>It’s great to see you. </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default SignLayout;
