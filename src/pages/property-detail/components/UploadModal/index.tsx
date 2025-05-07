import { Modal } from "antd";
import styles from "./index.module.less";
import { FileOutlined } from "@ant-design/icons";
import microsoftShareIcon from "@/assets/microsoft-share.svg";
import cs from "classnames";
import FileUploader from "../UploadFile";

interface UploadModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

const UploadModal: React.FC<UploadModalProps> = (props) => {
  const { visible, setVisible } = props;

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
  return (
    <Modal
      title="Upload files"
      onCancel={() => setVisible(false)}
      open={visible}
      width={820}
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
          <FileUploader />
        </div>
      </div>
    </Modal>
  );
};

export default UploadModal;
