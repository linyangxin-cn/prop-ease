import { HomeOutlined } from "@ant-design/icons";
import { Button } from "antd";
import React from "react";
import styles from "./index.module.less";
import PropertyCard from "./PropertyCard";

const Home: React.FC = () => {
  const nums = new Array(10).fill(0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>My properties</div>
        <Button type="primary">
          <HomeOutlined />
          Create property
        </Button>
      </div>
      <div className={styles.propertyContainer}>
        {nums.map((_, index) => (
          <PropertyCard key={index} />
        ))}
      </div>
    </div>
  );
};

export default Home;
