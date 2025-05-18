import React, { useMemo } from "react";
import styles from "./index.module.less";
import { MoreOutlined } from "@ant-design/icons";
import { DataroomInfo } from "@/utils/request/types";
import { Dropdown, MenuProps, Modal } from "antd";
import { deleteDataRoom } from "@/utils/request/request-utils";
import defaultDataroom1 from "@/assets/default-dataroom-1.svg";
import defaultDataroom2 from "@/assets/default-dataroom-2.svg";
import defaultDataroom3 from "@/assets/default-dataroom-3.svg";
import defaultDataroom4 from "@/assets/default-dataroom-4.svg";
import defaultDataroom5 from "@/assets/default-dataroom-5.svg";
import { useNavigate } from "react-router-dom";
import { exportDopcumentsData } from "@/utils/excel";

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

  const {
    name,
    description,
    id,
    dataroomImageUrl,
    confirmedDocumentCount,
    notConfirmedDocumentCount,
  } = dataroomInfo || {};

  const countData = useMemo(() => {
    if (notConfirmedDocumentCount) {
      return { ...StatusEnum.warring, count: notConfirmedDocumentCount };
    } else {
      return { ...StatusEnum.success, count: confirmedDocumentCount };
    }
  }, [confirmedDocumentCount, notConfirmedDocumentCount]);

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
      onClick: async () => {
        if (!id) {
          return;
        }
        exportDopcumentsData(id);
      },
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
        <div
          className={styles.tag}
          style={{ backgroundColor: countData.bgColor }}
        >
          <div
            className={styles.dot}
            style={{ backgroundColor: countData.color }}
          />
          <span className={styles.count} style={{ color: countData.color }}>
            {countData.count}
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
