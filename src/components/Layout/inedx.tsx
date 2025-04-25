import { routes } from "@/routes";
import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import styles from "./index.module.less";

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
      {showMenu && <div>layout</div>}
      {children}
    </div>
  );
};

export default Layout;
