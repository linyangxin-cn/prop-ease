import React from "react";
import styles from "./index.module.less";
import { MoreOutlined } from "@ant-design/icons";
import { DataroomInfo } from "@/utils/request/types";
import { Dropdown, MenuProps, Modal, Tooltip } from "antd";
import { deleteDataRoom } from "@/utils/request/request-utils";
import defaultDataroom1 from "@/assets/default-dataroom-1.svg";
import defaultDataroom2 from "@/assets/default-dataroom-2.svg";
import defaultDataroom3 from "@/assets/default-dataroom-3.svg";
import defaultDataroom4 from "@/assets/default-dataroom-4.svg";
import defaultDataroom5 from "@/assets/default-dataroom-5.svg";

// Array of default dataroom images
const defaultDataroomImages = [
  defaultDataroom1,
  defaultDataroom2,
  defaultDataroom3,
  defaultDataroom4,
  defaultDataroom5,
];

// Get a consistent default image based on the dataroom ID
const getDefaultImage = (id?: string) => {
  if (!id) return defaultDataroomImages[0];

  // Use the last character of the ID to determine the image index
  // This ensures the same dataroom always gets the same default image
  const lastChar = id.charAt(id.length - 1);
  const charCode = lastChar.charCodeAt(0);
  const index = charCode % defaultDataroomImages.length;

  return defaultDataroomImages[index];
};

const StatusEnum = {
  success: {
    color: "#2BB534",
    bgColor: "#EFFFF1",
  },
  warning: {
    color: "#EC7211",
    bgColor: "#FEF6F0",
  },
  error: {
    color: "#E53935",
    bgColor: "#FFEBEE",
  },
  neutral: {
    color: "#9E9E9E",
    bgColor: "#F5F5F5",
  },
};

interface PropertyCardProps {
  dataroomInfo?: DataroomInfo;
  refresh?: () => void;
  onEditClick?: (item?: DataroomInfo) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = (props) => {
  const { dataroomInfo, refresh, onEditClick } = props;

  const {
    notConfirmedDocumentCount = 0,
    confirmedDocumentCount = 0,
    name,
    description,
    id,
    dataroomImageUrl
  } = dataroomInfo || {};

  const content = [description];

  const onCardClick = () => {
    // Use window.location.href instead of React Router's redirect
    // This forces a full page reload and ensures authentication state is refreshed
    // Use origin to ensure we don't append to /index.html
    window.location.href = window.location.origin + "/property-detail?id=" + id;
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
        src={dataroomImageUrl || getDefaultImage(id)}
        alt="Property"
        className={styles.image}
      />
      <div className={styles.titleContainer}>
        <span className={styles.name}>{name}</span>
        <div className={styles.tagContainer}>
          {confirmedDocumentCount > 0 && (
            <Tooltip title="Confirmed documents">
              <div
                className={styles.tag}
                style={{ backgroundColor: StatusEnum.success.bgColor }}
              >
                <div
                  className={styles.dot}
                  style={{ backgroundColor: StatusEnum.success.color }}
                />
                <span className={styles.count} style={{ color: StatusEnum.success.color }}>
                  {confirmedDocumentCount}
                </span>
              </div>
            </Tooltip>
          )}
          {notConfirmedDocumentCount > 0 && (
            <Tooltip title="Documents pending confirmation">
              <div
                className={styles.tag}
                style={{ backgroundColor: StatusEnum.error.bgColor }}
              >
                <div
                  className={styles.dot}
                  style={{ backgroundColor: StatusEnum.error.color }}
                />
                <span className={styles.count} style={{ color: StatusEnum.error.color }}>
                  {notConfirmedDocumentCount}
                </span>
              </div>
            </Tooltip>
          )}
          {confirmedDocumentCount === 0 && notConfirmedDocumentCount === 0 && (
            <Tooltip title="No documents in this dataroom">
              <div
                className={styles.tag}
                style={{ backgroundColor: StatusEnum.neutral.bgColor }}
              >
                <span className={styles.count} style={{ color: StatusEnum.neutral.color }}>
                  Empty
                </span>
              </div>
            </Tooltip>
          )}
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
