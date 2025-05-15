import { DoucementInfo } from "@/utils/request/types";
import {
  DeleteOutlined,
  DislikeOutlined,
  InfoCircleOutlined,
  LikeOutlined,
} from "@ant-design/icons";
import { Checkbox, Divider, Modal, Popover } from "antd";
import { useState } from "react";

interface OptionalBarProps {
  setShowInfo: React.Dispatch<React.SetStateAction<boolean>>;
  curSelectedDoc: DoucementInfo | undefined;
}

const OptionalBar: React.FC<OptionalBarProps> = (props) => {
  const { setShowInfo, curSelectedDoc } = props;
  const { original_filename } = curSelectedDoc || {};

  const [visible, setVisible] = useState(false);

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          margin: "10px 0",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
          <div
            style={{
              fontSize: "18px",
              color: "0F141A",
              fontWeight: 700,
            }}
          >
            {original_filename}
          </div>
          <Divider type="vertical" style={{ height: "24px" }} />
          <Popover content="I like this classification">
            <LikeOutlined />
          </Popover>
          <Popover content="I don't like this classification">
            <DislikeOutlined
              onClick={() => {
                setVisible(true);
              }}
            />
          </Popover>
        </div>
        <div style={{ display: "flex", gap: "15px" }}>
          <DeleteOutlined />
          <InfoCircleOutlined
            onClick={() => {
              setShowInfo((_show) => !_show);
            }}
          />
        </div>
      </div>
      {visible && (
        <Modal
          onClose={() => setVisible(false)}
          open={visible}
          title={
            <div>
              <span
                style={{
                  fontWeight: 700,
                }}
              >
                Tell us more
              </span>
              <span
                style={{
                  fontWeight: 400,
                  fontStyle: "italic",
                }}
              >
                -optional
              </span>
            </div>
          }
          onCancel={() => setVisible(false)}
        >
          <div
            style={{
              color: "0F141A",
              fontWeight: 700,
              padding: "15px 0 10px 0",
              borderTop: "1px solid #E8E8E8",
            }}
          >
            What did you dislike?
          </div>
          <Checkbox.Group
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <Checkbox>Document classification</Checkbox>
            <Checkbox>Document address extraction</Checkbox>
            <Checkbox>Others</Checkbox>
          </Checkbox.Group>
        </Modal>
      )}
    </>
  );
};

export default OptionalBar;
