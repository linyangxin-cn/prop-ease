import { useState, useRef } from "react";
import { Button } from "antd";
import { UploadOutlined, FolderOpenOutlined } from "@ant-design/icons";
import styles from "./index.module.less";
import {
  extractFolderMetadataFromFiles,
  extractFolderMetadataFromDrop,
  FolderUploadMetadata
} from "@/utils/folderUploadUtils";

interface FileUploaderProps {
  onFilesSelected: (files: File[], folderMetadata?: FolderUploadMetadata) => void;
  buttonText?: string;
  showDragDrop?: boolean;
  showFolderButton?: boolean;
}

const FileUploader = (props: FileUploaderProps) => {
  const {
    onFilesSelected,
    buttonText = "Choose local files",
    showDragDrop = false,
    showFolderButton = false
  } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle file selection from input
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);

      // Check if this is a folder upload (has webkitRelativePath)
      // @ts-ignore
      const hasRelativePath = fileArray.some(f => f.webkitRelativePath);

      if (hasRelativePath) {
        // Extract folder metadata
        const metadata = extractFolderMetadataFromFiles(fileArray);
        onFilesSelected(fileArray, metadata);
      } else {
        // Regular file upload
        onFilesSelected(fileArray);
      }

      // Reset the input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (folderInputRef.current) {
        folderInputRef.current.value = '';
      }
    }
  };

  // Handle button click to open file dialog
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle folder button click
  const handleFolderButtonClick = () => {
    if (folderInputRef.current) {
      folderInputRef.current.click();
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

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // Try to extract folder metadata from dropped items
    try {
      const { files, metadata } = await extractFolderMetadataFromDrop(e.dataTransfer.items);

      if (files.length > 0 && Object.keys(metadata).length > 0) {
        // Folder was dropped
        onFilesSelected(files, metadata);
      } else {
        // Regular files were dropped
        const fileArray = Array.from(e.dataTransfer.files);
        onFilesSelected(fileArray);
      }
    } catch (error) {
      // Fallback to regular file handling
      const fileArray = Array.from(e.dataTransfer.files);
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
            {isDragging ? '📁 Drop your files or folders here' : '📄 Drag and drop documents or folders'}
          </p>
          <p className={styles.supportedFormats}>
            Supports: PDF, Excel, Word, PowerPoint, Images, Text files, Markdown
            <br />
            <strong>Tip:</strong> You can drag entire folders to preserve folder structure
          </p>
          <div className={styles.buttonGroup}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              multiple
              accept=".pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.jpg,.jpeg,.png,.bmp,.tiff,.gif,.txt,.csv,.md"
            />
            {/* Hidden input for folder selection */}
            <input
              type="file"
              ref={folderInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              multiple
              // @ts-ignore - webkitdirectory is not in TypeScript types
              webkitdirectory="true"
              directory="true"
              accept=".pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.jpg,.jpeg,.png,.bmp,.tiff,.gif,.txt,.csv,.md"
            />
            <Button
              className={styles.uploadButton}
              icon={<UploadOutlined />}
              onClick={handleButtonClick}
              size="large"
            >
              {buttonText}
            </Button>
            {showFolderButton && (
              <Button
                className={styles.folderButton}
                icon={<FolderOpenOutlined />}
                onClick={handleFolderButtonClick}
                size="large"
              >
                Choose Folder
              </Button>
            )}
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
        accept=".pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.jpg,.jpeg,.png,.bmp,.tiff,.gif,.txt,.csv,.md"
      />
      {/* Hidden input for folder selection */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        multiple
        // @ts-ignore - webkitdirectory is not in TypeScript types
        webkitdirectory="true"
        directory="true"
        accept=".pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.jpg,.jpeg,.png,.bmp,.tiff,.gif,.txt,.csv,.md"
      />
      <div className={styles.buttonGroup}>
        <Button
          className={styles.uploadButton}
          icon={<UploadOutlined />}
          onClick={handleButtonClick}
          size="large"
        >
          {buttonText}
        </Button>
        {showFolderButton && (
          <Button
            className={styles.folderButton}
            icon={<FolderOpenOutlined />}
            onClick={handleFolderButtonClick}
            size="large"
          >
            Choose Folder
          </Button>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
