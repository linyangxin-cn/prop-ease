import { routes } from "@/routes";
import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import styles from "./index.module.less";
import { Header } from "antd/es/layout/layout";
import headerIcon from "@/assets/header-icon.svg";
import { Input } from "antd";
import {
  QuestionCircleOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = (props) => {
  const { children } = props;
  const { pathname } = useLocation();

  const showMenu = useMemo(() => {
    const route = routes.find((route) => route.path === pathname);
    return route?.showMenu ?? true;
  }, [pathname]);

  return (
    <div className={styles.layout}>
      {showMenu && (
        <Header className={styles.header}>
          <img src={headerIcon} alt="" />
          <div className={styles.searchBar}>
            <Input
              placeholder="Search keywords"
              prefix={<SearchOutlined style={{ color: "rgb(101,104,113)" }} />}
              style={{
                backgroundColor: "transparent",
                border: "1px solid rgb(101,104,113)",
              }}
            />
          </div>
          <div className={styles.rightIcons}>
            <QuestionCircleOutlined style={{ color: "#fff" }} />
            <SettingOutlined style={{ color: "#fff" }} />
            <UserOutlined style={{ color: "#fff" }} />
          </div>
        </Header>
      )}

      {showMenu ? <div className={styles.container}>{children}</div> : children}
    </div>
  );
};

export default Layout;
