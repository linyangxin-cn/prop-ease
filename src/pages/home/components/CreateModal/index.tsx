import { Form, Input, message, Modal } from "antd";
import React, { useEffect, useState } from "react";
import ImageUpload from "../ImageUpload";
import { createDataRoom, updateDataRoom } from "@/utils/request/request-utils";
import { DataroomInfo } from "@/utils/request/types";

interface CreateModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  onSuccess: () => void;
  curEditItem?: DataroomInfo;
  setCurEditItem: React.Dispatch<
    React.SetStateAction<DataroomInfo | undefined>
  >;
}

const CreateModal: React.FC<CreateModalProps> = (props) => {
  const { visible, setVisible, onSuccess, curEditItem, setCurEditItem } = props;
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);

  const isEdit = !!curEditItem;

  const onOk = async () => {
    const validateResult = await form.validateFields().catch(() => null);
    if (!validateResult) {
      return;
    }
    setLoading(true);
    if (isEdit) {
      updateDataRoom({ id: curEditItem.id, ...validateResult })
        .then(() => {
          message.success("Update property successfully!");
          setCurEditItem(undefined);
          onSuccess();
          setVisible(false);
        })
        .catch(() => {
          message.error("Update property failed!");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
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
    }
  };

  useEffect(() => {
    if (curEditItem) {
      form.setFieldsValue({
        name: curEditItem?.name,
        description: curEditItem?.description,
        dataroomImageUrl: curEditItem?.dataroomImageUrl,
      });
    }
  }, [curEditItem, form]);

  return (
    <Modal
      title={isEdit ? "Update property" : "Create property"}
      open={visible}
      onCancel={() => setVisible(false)}
      onOk={onOk}
      okText={isEdit ? "Update" : "Create"}
      okButtonProps={{
        loading,
      }}
    >
      <Form requiredMark={false} layout="vertical" form={form}>
        <Form.Item label="Property cover" name="dataroomImageUrl">
          <ImageUpload dataroomId={curEditItem?.id} />
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
