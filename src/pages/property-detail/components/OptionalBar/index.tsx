import FormCheckBox from "@/components/form/FormCheckBox";
import { feedback, thumbsUp } from "@/utils/request/request-utils";
import { DoucementInfo } from "@/utils/request/types";
import {
  DeleteOutlined,
  DislikeOutlined,
  InfoCircleOutlined,
  LikeOutlined,
} from "@ant-design/icons";
import { Divider, Form, message, Modal, Popover } from "antd";
import { useState } from "react";

interface OptionalBarProps {
  setShowInfo: React.Dispatch<React.SetStateAction<boolean>>;
  curSelectedDoc: DoucementInfo | undefined;
}

const OptionalBar: React.FC<OptionalBarProps> = (props) => {
  const { setShowInfo, curSelectedDoc } = props;
  const { original_filename, id } = curSelectedDoc || {};
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const [visible, setVisible] = useState(false);

  const onModalConfirm = () => {
    const formValues = form.getFieldsValue();
    if (id) {
      setLoading(true);
      feedback(id, {
        ratingType: "negative",
        ...formValues,
      })
        .then(() => {
          message.success("Feedback submitted successfully. Thank you!");
          setVisible(false);
        })
        .catch(() => null)
        .finally(() => {
          setLoading(false);
        });
    }
  };

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
            <LikeOutlined
              onClick={() => {
                if (curSelectedDoc?.id) {
                  thumbsUp(curSelectedDoc?.id).then(() => {
                    message.success("Thanks for your positive feedback!");
                  });
                }
              }}
            />
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
          onOk={onModalConfirm}
          okButtonProps={{ loading }}
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

          <Form form={form} layout="vertical">
            <Form.Item name="documentClassificationText">
              <FormCheckBox
                text="Document classification"
                placeholder="The classification should be..."
              />
            </Form.Item>
            <Form.Item name="documentAddressExtractionText">
              <FormCheckBox
                text="Document address extraction"
                placeholder="The address of the property should be"
              />
            </Form.Item>
            <Form.Item name="otherText">
              <FormCheckBox
                text="Others"
                placeholder="Enter additional comments"
              />
            </Form.Item>
          </Form>
        </Modal>
      )}
    </>
  );
};

export default OptionalBar;
