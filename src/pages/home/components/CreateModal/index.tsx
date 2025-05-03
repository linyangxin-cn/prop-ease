import { Form, Input, Modal } from "antd";
import React from "react";
import ImageUpload from "../ImageUpload";
import { createDataRoom } from "@/utils/request/request-utils";

interface CreateModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

const CreateModal: React.FC<CreateModalProps> = (props) => {
  const { visible, setVisible } = props;
  const [form] = Form.useForm();

  const onOk = () => {
    createDataRoom({
      name: "test",
      description: "1111",
    }).catch(() => null);
  };

  return (
    <Modal
      title="Create property"
      open={visible}
      onCancel={() => setVisible(false)}
      onOk={onOk}
    >
      <Form requiredMark={false} layout="vertical" form={form}>
        <Form.Item label="Property cover" name="propertyCover">
          <ImageUpload />
        </Form.Item>
        <Form.Item
          label="Property name"
          name="propertyName"
          rules={[{ required: true, message: "Please input the location!" }]}
        >
          <Input placeholder="Enter name" />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input.TextArea placeholder="Enter description" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateModal;
