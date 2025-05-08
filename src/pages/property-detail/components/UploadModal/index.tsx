import { message, Modal } from "antd";
import styles from "./index.module.less";
import { FileOutlined } from "@ant-design/icons";
import microsoftShareIcon from "@/assets/microsoft-share.svg";
import cs from "classnames";
import FileUploader from "../UploadFile";
import { uploadDocuments } from "@/utils/request/request-utils";
import { useState } from "react";

interface UploadModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  id: string;
}

const UploadModal: React.FC<UploadModalProps> = (props) => {
  const { visible, setVisible, id } = props;
  const [documentIds, setDocuemntIds] = useState<string[]>();
  const [loading, setLoading] = useState(false);

  const btns: { btnText: React.ReactNode }[] = [
    {
      btnText: (
        <>
          <FileOutlined />
          Local Files
        </>
      ),
    },
    {
      btnText: (
        <>
          <img src={microsoftShareIcon} alt="" />
          SharePoint
        </>
      ),
    },
  ];

  const onOk = () => {
    if (documentIds?.length) {
      setLoading(true);

      uploadDocuments(id, documentIds)
        .then(() => {
          message.success("Upload documents success");
          setVisible(false);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };
  console.log("documentIds", documentIds);
  return (
    <Modal
      title="Upload files"
      onCancel={() => setVisible(false)}
      open={visible}
      width={820}
      onOk={onOk}
      okButtonProps={{ disabled: !documentIds?.length, loading }}
    >
      <div className={styles.content}>
        <div className={styles.leftContent}>
          {btns.map((item, index) => {
            return (
              <div
                key={index}
                className={cs(
                  styles.choiceBtn,
                  index === 0 ? styles.btnActive : null
                )}
              >
                {item.btnText}
              </div>
            );
          })}
        </div>
        <div className={styles.rightContent}>
          <FileUploader setDocuemntIds={setDocuemntIds} />
        </div>
      </div>
    </Modal>
  );
};

export default UploadModal;
