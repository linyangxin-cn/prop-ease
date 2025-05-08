import CustomBreadcrumb from "@/components/CustomBreadcrumb";
import {
  CloseOutlined,
  FileTextOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Empty, Space } from "antd";
import styles from "./index.module.less";
import emptyIcon from "@/assets/empty-icon.svg";
import UploadModal from "./components/UploadModal";
import { useEffect, useMemo, useState } from "react";
import DirectoryTree from "antd/es/tree/DirectoryTree";
import { useRequest } from "ahooks";
import {
  getDataroomDetail,
  getDataroomDocuments,
  getDocumentsPreview,
} from "@/utils/request/request-utils";
import { useLocation } from "react-router-dom";
import { DoucementInfo } from "@/utils/request/types";
import { Key } from "antd/es/table/interface";

// const treeData = [
//   {
//     title: "parent 0",
//     key: "0-0",
//     children: [
//       { title: "leaf 0-0", key: "0-0-0", isLeaf: true },
//       { title: "leaf 0-1", key: "0-0-1", isLeaf: true },
//     ],
//   },
//   {
//     title: "parent 1",
//     key: "0-1",
//     children: [
//       { title: "leaf 1-0", key: "0-1-0", isLeaf: true },
//       { title: "leaf 1-1", key: "0-1-1", isLeaf: true },
//     ],
//   },
// ];

const PropertyDetail: React.FC = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [curSelectedDoc, setCurSelectedDoc] = useState<DoucementInfo>();

  const isEmpty = false;
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get("id");

  const { data } = useRequest(() => getDataroomDetail(id ?? ""), {
    ready: !!id,
  });

  const { data: documentsData } = useRequest(
    () => getDataroomDocuments(id ?? ""),
    {
      ready: !!id,
    }
  );

  const { data: previewData, run } = useRequest(
    (id: string) => getDocumentsPreview(id),
    {
      manual: true,
    }
  );

  const documensTreeData = useMemo(() => {
    return documentsData?.items.map((item) => {
      return {
        title: item.original_filename,
        key: item.id,
        isLeaf: true,
      };
    });
  }, [documentsData?.items]);

  const { name } = data || {};

  const infoList = useMemo(() => {
    return [
      {
        title: "Original name",
        value: curSelectedDoc?.original_filename,
      },
      {
        title: "Type",
        value: curSelectedDoc?.content_type,
      },
      {
        title: "Size",
        value: curSelectedDoc?.classification_score,
      },
      {
        title: "Uploaded",
        value: curSelectedDoc?.uploaded_at,
      },
    ];
  }, [curSelectedDoc]);

  const onSelect = (keys: Key[]) => {
    const document = documentsData?.items.find((item) => item.id === keys[0]);
    if (document) {
      setCurSelectedDoc(document);
      run(document.id);
    }
  };

  const onExpand = (keys: any, info: any) => {
    console.log("Trigger Expand", keys, info);
  };

  return (
    <div className={styles.container}>
      <CustomBreadcrumb
        separator=">"
        items={[
          {
            title: <a href="/">Application Center</a>,
          },
          {
            title: name,
          },
        ]}
        btns={
          <Space size={16}>
            <Button>
              <FileTextOutlined />
              Export to Excel
            </Button>
            <Button type="primary" onClick={() => setVisible(true)}>
              <UploadOutlined />
              Upload files
            </Button>
          </Space>
        }
      />
      {isEmpty && (
        <Empty
          image={emptyIcon}
          className={styles.empty}
          description={
            <div className={styles.emptyDesc}>
              <div className={styles.title}>Hey Jane Doe 👋</div>
              <div className={styles.desc}>
                Clicking the “Upload files” button to manage your property
                files.
              </div>
            </div>
          }
        />
      )}

      <div className={styles.content}>
        <div className={styles.contentLeft}>
          <div className={styles.contentTree}>
            <div className={styles.treeTitle}>Table of contents</div>
            <DirectoryTree
              multiple
              draggable
              defaultExpandAll
              onSelect={onSelect}
              onExpand={onExpand}
              treeData={documensTreeData}
            />
          </div>
          <div className={styles.previewContent}>
            {previewData?.preview_url && (
              <iframe
                src={previewData?.preview_url}
                title={curSelectedDoc?.original_filename}
              />
            )}
          </div>
        </div>
        <div className={styles.contentRight}>
          <div className={styles.header}>
            <span>Information</span>
            <CloseOutlined style={{ color: "rgb(65,77,92)" }} />
          </div>
          {infoList.map((item, index) => (
            <div key={index} className={styles.info}>
              <div className={styles.infoTitle}>{item.title}</div>
              <div className={styles.infoValue}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {visible && (
        <UploadModal visible={visible} setVisible={setVisible} id={id!} />
      )}
    </div>
  );
};

export default PropertyDetail;
