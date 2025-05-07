import React from "react";
import styles from "./index.module.less";
import { MoreOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { DataroomInfo } from "@/utils/request/types";

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

interface PropertyCardProps {
  dataroomInfo?: DataroomInfo;
}
const PropertyCard: React.FC<PropertyCardProps> = (props) => {
  const { dataroomInfo } = props;
  const redirect = useNavigate();
  const tagStatus = StatusEnum.success;

  const { documentCount, name, description } = dataroomInfo || {};

  const content = [description];

  const onCardClick = () => {
    redirect("/property-detail");
  };

  return (
    <div className={styles.container} onClick={onCardClick}>
      <img
        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfLHxWvb0yTBrNuNgsDqp9ku9XaESGQTSEzw&s"
        alt="Property"
        className={styles.image}
      />
      <div className={styles.titleContainer}>
        <span className={styles.name}>{name}</span>
        <div
          className={styles.tag}
          style={{ backgroundColor: tagStatus.bgColor }}
        >
          <div
            className={styles.dot}
            style={{ backgroundColor: tagStatus.color }}
          />
          <span className={styles.count} style={{ color: tagStatus.color }}>
            {documentCount}
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
