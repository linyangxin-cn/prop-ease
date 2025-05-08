import React from "react";
import styles from "./index.module.less";
import { MoreOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { DataroomInfo } from "@/utils/request/types";
import { Dropdown, MenuProps, Modal } from "antd";
import { deleteDataRoom } from "@/utils/request/request-utils";

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
  refresh?: () => void;
  onEditClick?: (item?: DataroomInfo) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = (props) => {
  const { dataroomInfo, refresh, onEditClick } = props;
  const redirect = useNavigate();
  const tagStatus = StatusEnum.success;

  const { documentCount, name, description, id } = dataroomInfo || {};

  const content = [description];

  const onCardClick = () => {
    redirect("/property-detail?id=" + id);
  };

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: "Edit property info",
      onClick: () => onEditClick?.(dataroomInfo),
    },
    {
      key: "2",
      label: "Export to Excel",
    },
    {
      key: "3",
      label: "Delete",
      onClick: () => {
        if (id) {
          Modal.confirm({
            title: "Delete property?",
            content:
              "Are you sure you want to delete this property? This action is permanent and will also remove all associated files.",
            cancelText: "Cancel",
            okText: "Delete",
            onOk: async () => {
              await deleteDataRoom(id).then(() => {
                refresh?.();
              });
            },
          });
        }
      },
    },
  ];

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
        <div
          className={styles.more}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Dropdown menu={{ items }}>
            <MoreOutlined />
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
