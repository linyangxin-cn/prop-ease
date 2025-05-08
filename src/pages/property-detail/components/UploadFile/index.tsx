import React, { useState } from "react";
import { Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";

interface FileUploaderProps {
  setDocuemntIds: React.Dispatch<React.SetStateAction<string[] | undefined>>;
}

const FileUploader = (props: FileUploaderProps) => {
  const { setDocuemntIds } = props;
  const [fileList, setFileList] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // 处理文件选择变化
  const handleChange = (info: any) => {
    const newFiles = info.fileList
      .filter((f: any) => f.originFileObj)
      .map((f: any) => f.originFileObj);
    setFileList(newFiles);
  };

  // 执行上传操作
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning("请选择至少一个文件");
      return;
    }

    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append("files", file); // 对应 cURL 中的 -F 'files=@...'
    });

    try {
      setUploading(true);
      const response = await axios.post("api/v1/documents/upload", formData, {
        headers: {
          accept: "application/json",
          "Content-Type": "multipart/form-data", // 与 cURL 参数一致
        },
      });

      if (response.status === 200) {
        setDocuemntIds((_ids) => [
          ...(_ids ?? []),
          response.data.data.documents.map((item: any) => item.id),
        ]);
        message.success("文件上传成功");
        setFileList([]); // 清空已选文件
      }
    } catch (error) {
      message.error("文件上传失败");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Upload
        multiple // 支持多选
        beforeUpload={() => false} // 阻止自动上传[1,5](@ref)
        fileList={fileList.map((f) => ({ uid: f.name, name: f.name }))} // 显示文件列表
        onChange={handleChange}
      >
        <Button icon={<UploadOutlined />}>选择 PDF 文件</Button>
      </Upload>

      <Button
        type="primary"
        onClick={handleUpload}
        disabled={fileList.length === 0}
        loading={uploading}
        style={{ marginTop: 16 }}
      >
        {uploading ? "上传中..." : "开始上传"}
      </Button>
    </div>
  );
};

export default FileUploader;
