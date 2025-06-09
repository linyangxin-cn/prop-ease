import { HomeOutlined } from "@ant-design/icons";
import { Button } from "antd";
import React, { useContext, useState } from "react";
import styles from "./index.module.less";
import PropertyCard from "./components/PropertyCard";
import CreateModal from "./components/CreateModal";
import CustomBreadcrumb from "@/components/CustomBreadcrumb";
import { useRequest } from "ahooks";
import { getDataRooms } from "@/utils/request/request-utils";
import { Spin } from "antd";
import { DataroomInfo } from "@/utils/request/types";
import { UserInfoContext } from "@/store/userInfo";
import EmptyState from "./components/EmptyState";

const Home: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [curEditItem, setCurEditItem] = useState<DataroomInfo | undefined>();
  const userInfo = useContext(UserInfoContext);

  const { data, run, loading } = useRequest(getDataRooms);
  const list = data?.items ?? [];

  return (
    <div style={{ width: "100%", height: "100%" }}>
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
      {!loading ? (
        list.length > 0 ? (
          <div className={styles.propertyContainer}>
            {list.map((item, index) => (
              <PropertyCard
                key={index}
                dataroomInfo={item}
                refresh={run}
                onEditClick={(_item) => {
                  setCurEditItem(_item);
                  setVisible(true);
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            userName={userInfo?.displayName}
            text="Create your first property to start managing your real estate documents and files."
            onCreateClick={() => setVisible(true)}
          />
        )
      ) : (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
        </div>
      )}

      {visible && (
        <CreateModal
          visible={visible}
          setVisible={setVisible}
          onSuccess={run}
          curEditItem={curEditItem}
          setCurEditItem={setCurEditItem}
        />
      )}
    </div>
  );
};

export default Home;
