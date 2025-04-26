import { HomeOutlined } from "@ant-design/icons";
import { Button } from "antd";
import React, { useState } from "react";
import styles from "./index.module.less";
import PropertyCard from "./components/PropertyCard";
import CreateModal from "./components/CreateModal";
import CustomBreadcrumb from "@/components/CustomBreadcrumb";

const Home: React.FC = () => {
  const [visible, setVisible] = useState(false);

  const nums = new Array(10).fill(0);

  return (
    <div>
      <CustomBreadcrumb
        items={[
          {
            title: "My properties",
          },
        ]}
        btns={
          <Button type="primary" onClick={() => setVisible(true)}>
            <HomeOutlined />
            Create property
          </Button>
        }
      />
      <div className={styles.propertyContainer}>
        {nums.map((_, index) => (
          <PropertyCard key={index} />
        ))}
      </div>
      {visible && <CreateModal visible={visible} setVisible={setVisible} />}
    </div>
  );
};

export default Home;
