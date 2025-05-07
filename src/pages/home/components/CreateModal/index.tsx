import { Form, Input, message, Modal } from "antd";
import React, { useState } from "react";
import ImageUpload from "../ImageUpload";
import { createDataRoom } from "@/utils/request/request-utils";

interface CreateModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  onSuccess: () => void;
}

const CreateModal: React.FC<CreateModalProps> = (props) => {
  const { visible, setVisible, onSuccess } = props;
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);

  const onOk = async () => {
    const validateResult = await form.validateFields().catch(() => null);
    if (!validateResult) {
      return;
    }
    setLoading(true);
    createDataRoom({ ...validateResult })
      .then(() => {
        message.success("Create property successfully!");
        onSuccess();
        setVisible(false);
      })
      .catch(() => {
        message.error("Create property failed!");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Modal
      title="Create property"
      open={visible}
      onCancel={() => setVisible(false)}
      onOk={onOk}
      okButtonProps={{
        loading,
      }}
    >
      <Form requiredMark={false} layout="vertical" form={form}>
        <Form.Item label="Property cover" name="img">
          <ImageUpload />
        </Form.Item>
        <Form.Item
          label="Property name"
          name="name"
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
