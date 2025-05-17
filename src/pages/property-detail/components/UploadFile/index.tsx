import { useState, useRef } from "react";
import { Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import styles from "./index.module.less";

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  buttonText?: string;
  showDragDrop?: boolean;
}

const FileUploader = (props: FileUploaderProps) => {
  const { onFilesSelected, buttonText = "Choose local files", showDragDrop = false } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle file selection from input
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      onFilesSelected(fileArray);

      // Reset the input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle button click to open file dialog
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      // Let the parent component handle filtering
      onFilesSelected(fileArray);
    }
  };

  if (showDragDrop) {
    return (
      <div className={styles.uploaderContainer}>
        <div
          className={`${styles.dragger} ${isDragging ? styles.dragging : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <p className={styles.dragText}>
            Drag and drop
          </p>
          <div className={styles.chooseFilesButton}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              multiple
              accept=".pdf"
            />
            <Button
              className={styles.uploadButton}
              icon={<UploadOutlined />}
              onClick={handleButtonClick}
            >
              {buttonText}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.uploaderContainer}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        multiple
        accept=".pdf"
      />
      <Button
        className={styles.uploadButton}
        icon={<UploadOutlined />}
        onClick={handleButtonClick}
      >
        {buttonText}
      </Button>
    </div>
  );
};

export default FileUploader;
