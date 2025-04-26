import { Breadcrumb, BreadcrumbProps } from "antd";
import styles from "./index.module.less";

interface CustomBreadcrumbProps extends BreadcrumbProps {
  btns?: React.ReactNode;
}

const CustomBreadcrumb: React.FC<CustomBreadcrumbProps> = (props) => {
  const { btns, ...resProps } = props;
  return (
    <div className={styles.header}>
      <Breadcrumb {...resProps} />
      {btns}
    </div>
  );
};

export default CustomBreadcrumb;
