import { HomeOutlined } from "@ant-design/icons";
import { Button } from "antd";
import React, { useState } from "react";
import styles from "./index.module.less";
import PropertyCard from "./components/PropertyCard";
import CreateModal from "./components/CreateModal";
import CustomBreadcrumb from "@/components/CustomBreadcrumb";
import { useRequest } from "ahooks";
import { getDataRooms } from "@/utils/request/request-utils";

const Home: React.FC = () => {
  const [visible, setVisible] = useState(false);

  const { data, run } = useRequest(getDataRooms);

  console.log("data", data);

  const list = data?.items ?? [];

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
        {list.map((item, index) => (
          <PropertyCard key={index} dataroomInfo={item} />
        ))}
      </div>
      {visible && (
        <CreateModal
          visible={visible}
          setVisible={setVisible}
          onSuccess={run}
        />
      )}
    </div>
  );
};

export default Home;
