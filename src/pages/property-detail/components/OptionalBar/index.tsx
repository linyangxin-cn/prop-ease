import { DoucementInfo } from "@/utils/request/types";
import {
  DeleteOutlined,
  DislikeOutlined,
  InfoCircleOutlined,
  LikeOutlined,
} from "@ant-design/icons";
import { Divider, Popover } from "antd";

interface OptionalBarProps {
  setShowInfo: React.Dispatch<React.SetStateAction<boolean>>;
  curSelectedDoc: DoucementInfo | undefined;
}

const OptionalBar: React.FC<OptionalBarProps> = (props) => {
  const { setShowInfo, curSelectedDoc } = props;
  const { original_filename } = curSelectedDoc || {};

  return (
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
          <DislikeOutlined />
        </Popover>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <DeleteOutlined />
        <InfoCircleOutlined
          onClick={() => {
            setShowInfo((_show) => !_show);
          }}
        />
      </div>
    </div>
  );
};

export default OptionalBar;
