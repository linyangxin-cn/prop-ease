import React from "react";
import styles from "./index.module.less";
import { MoreOutlined } from "@ant-design/icons";

const StatusEnum = {
  success: {
    color: "#2BB534",
    bgColor: "#EFFFF1",
  },
  warring: {
    color: "#EC7211",
    bgColor: "#FEF6F0",
  },
};

const PropertyCard: React.FC = () => {
  const tagStatus = StatusEnum.success;
  const content = ["8 Offices", "2 Meeting rooms", "1 Kitchen"];

  return (
    <div className={styles.container}>
      <img
        src="https://www.universalhome.co.jp.t.aac.hp.transer.com/iebana/wp-content/uploads/2017/07/FB0817-4.jpg"
        alt="Property"
        className={styles.image}
      />
      <div className={styles.titleContainer}>
        <span className={styles.name}>Av. Rochefort 127B</span>
        <div
          className={styles.tag}
          style={{ backgroundColor: tagStatus.bgColor }}
        >
          <div
            className={styles.dot}
            style={{ backgroundColor: tagStatus.color }}
          />
          <span className={styles.count} style={{ color: tagStatus.color }}>
            2
          </span>
        </div>
      </div>
      <div className={styles.infoContainer}>
        <div className={styles.content}>
          {content.map((item, index) => (
            <div key={index} className={styles.item}>
              {item}
            </div>
          ))}
        </div>
        <div className={styles.more}>
          <MoreOutlined />
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
