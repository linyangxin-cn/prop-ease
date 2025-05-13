import { UploadOutlined } from "@ant-design/icons";
import { Button, Upload } from "antd";
import { UploadChangeParam, UploadFile } from "antd/es/upload";
import { useEffect, useState } from "react";
import defaultDataroom1 from "@/assets/default-dataroom-1.svg";
import defaultDataroom2 from "@/assets/default-dataroom-2.svg";
import defaultDataroom3 from "@/assets/default-dataroom-3.svg";
import defaultDataroom4 from "@/assets/default-dataroom-4.svg";
import defaultDataroom5 from "@/assets/default-dataroom-5.svg";

interface ImageUploadProps {
  value?: string;
  onChange?: (value: string) => void;
  dataroomId?: string; // Add dataroomId prop to ensure consistent default image
}

// Array of default dataroom images
const defaultDataroomImages = [
  defaultDataroom1,
  defaultDataroom2,
  defaultDataroom3,
  defaultDataroom4,
  defaultDataroom5,
];

// Get a consistent default image based on the dataroom ID
const getDefaultImage = (id?: string) => {
  if (!id) return defaultDataroomImages[0];

  // Use the last character of the ID to determine the image index
  // This ensures the same dataroom always gets the same default image
  const lastChar = id.charAt(id.length - 1);
  const charCode = lastChar.charCodeAt(0);
  const index = charCode % defaultDataroomImages.length;

  return defaultDataroomImages[index];
};

const ImageUpload: React.FC<ImageUploadProps> = (props) => {
  const { value, dataroomId } = props;
  const [defaultImage, setDefaultImage] = useState<string>("");

  // Select a consistent default image when the component mounts
  useEffect(() => {
    if (!value) {
      // Use the consistent default image based on dataroom ID
      const defaultImg = getDefaultImage(dataroomId);
      setDefaultImage(defaultImg);
      // Pass the default image URL to the parent component
      props.onChange?.(defaultImg);
    }
  }, [value, dataroomId, props]);

  const onUploadChange = (info: UploadChangeParam<UploadFile<any>>) => {
    if (info.file.status === 'done') {
      // Get the uploaded file URL from the API response
      const response = info.file.response;
      if (response && response.data && response.data.documents && response.data.documents.length > 0) {
        const document = response.data.documents[0];
        // Use the document URL as the dataroom image URL
        const uploadedImageUrl = document.preview_url || document.storage_path || '';
        props.onChange?.(uploadedImageUrl);
      }
    }
  };

  return (
    <>
      <img
        src={value ?? defaultImage}
        alt=""
        style={{
          width: "380px",
          height: "144px",
          objectFit: "cover",
          borderRadius: "8px",
        }}
      />
      <Upload
        accept="image/*"
        showUploadList={false}
        maxCount={1}
        onChange={onUploadChange}
        action="https://api.propease.eu/api/v1/documents/upload" // Use absolute URL for API endpoint
        withCredentials={true} // Ensure cookies are sent with cross-origin requests
      >
        <Button icon={<UploadOutlined />}>Choose an image file</Button>
      </Upload>
    </>
  );
};

export default ImageUpload;
