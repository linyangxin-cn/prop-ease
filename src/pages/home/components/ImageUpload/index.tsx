import { UploadOutlined } from "@ant-design/icons";
import { Button, Upload, UploadProps } from "antd";
import { UploadChangeParam, UploadFile } from "antd/es/upload";
import defaultHouse from "@/assets/default-house.svg";

interface ImageUploadProps extends React.PropsWithChildren<UploadProps> {
  value?: string;
  // onChange?: (file: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = (props) => {
  const { value } = props;

  const onUploadChange = (info: UploadChangeParam<UploadFile<any>>) => {
    console.log(info);
  };

  return (
    <>
      <img
        src={value ?? defaultHouse}
        alt=""
        style={{
          width: "380px",
          height: "144px",
          objectFit: "cover",
          borderRadius: "8px",
        }}
      />
      <Upload
        {...props}
        accept="image/*"
        showUploadList={false}
        maxCount={1}
        onChange={onUploadChange}
      >
        <Button icon={<UploadOutlined />}>Choose an image file</Button>
      </Upload>
    </>
  );
};

export default ImageUpload;
