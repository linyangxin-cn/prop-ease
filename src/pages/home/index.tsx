import { HomeOutlined, BellOutlined } from "@ant-design/icons";
import { Button, Space, Badge } from "antd";
import React, { useContext, useState, useEffect } from "react";
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
import { fetchAlerts } from "@/utils/request/alert-api";
import type { AlertData } from "@/utils/request/alert-api";

const Home: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [curEditItem, setCurEditItem] = useState<DataroomInfo | undefined>();
  const [activeAlertCount, setActiveAlertCount] = useState<number>(0);
  const userInfo = useContext(UserInfoContext);

  const { data, run, loading } = useRequest(getDataRooms);
  const list = data?.items ?? [];

  // Fetch active alert count
  useEffect(() => {
    const fetchActiveAlertCount = async () => {
      try {
        const alertsResponse = await fetchAlerts({ limit: 100 });
        const alerts = alertsResponse.alerts || [];
        // Count only active alerts (not dismissed and not read)
        const activeCount = alerts.filter(alert => !alert.isDismissed && !alert.isRead).length;
        setActiveAlertCount(activeCount);
      } catch (error) {
        console.error('Error fetching active alert count:', error);
        setActiveAlertCount(0);
      }
    };

    fetchActiveAlertCount();
    // Refresh active alert count every 30 seconds
    const interval = setInterval(fetchActiveAlertCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <CustomBreadcrumb
        items={[
          {
            title: "My properties",
          },
        ]}
        btns={
          <Space>
            <Badge
              count={activeAlertCount}
              size="small"
              offset={[-5, 5]}
              overflowCount={99}
            >
              <Button onClick={() => window.location.href = '/alerts'}>
                <BellOutlined />
                View Alerts
              </Button>
            </Badge>
            <Button type="primary" onClick={() => setVisible(true)}>
              <HomeOutlined />
              Create property
            </Button>
          </Space>
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
