import { message, Modal, Button, Progress, Tag } from "antd";
import styles from "./index.module.less";
import { FileOutlined, CloseOutlined, FolderOutlined } from "@ant-design/icons";
import microsoftShareIcon from "@/assets/microsoft-share.svg";
import cs from "classnames";
import FileUploader from "../UploadFile";
import { uploadAndAddDocumentsToDataroom } from "@/utils/request/request-utils";
import { useState } from "react";
import { FolderUploadMetadata } from "@/utils/folderUploadUtils";

interface UploadModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  id: string;
  onSuccess?: () => void; // Callback to refresh parent data
}

interface UploadedFile {
  id: string;
  name: string;
  date: string;
  status: "success" | "error" | "uploading";
  size?: string;
  file?: File;
}

const UploadModal: React.FC<UploadModalProps> = (props) => {
  const { visible, setVisible, id, onSuccess } = props;
  const [documentIds, setDocuemntIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSource, setActiveSource] = useState<"localFiles" | "sharePoint">(
    "localFiles"
  );
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [folderMetadata, setFolderMetadata] = useState<FolderUploadMetadata | undefined>(undefined);

  const sources = [
    {
      key: "localFiles",
      label: (
        <>
          <FileOutlined />
          Local Files
        </>
      ),
    },
    {
      key: "sharePoint",
      label: (
        <>
          <img
            src={microsoftShareIcon}
            alt=""
            style={{ width: 16, height: 16 }}
          />
          SharePoint
        </>
      ),
    },
  ];

  const handleSourceChange = (source: "localFiles" | "sharePoint") => {
    setActiveSource(source);
  };

  const handleFilesSelected = (files: File[], metadata?: FolderUploadMetadata) => {
    // Define supported file types and extensions
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint', // .ppt
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/bmp',
      'image/tiff',
      'image/gif',
      'text/plain',
      'text/csv',
      'text/markdown' // .md files
    ];

    const supportedExtensions = [
      '.pdf', '.xlsx', '.xls', '.docx', '.doc', '.pptx', '.ppt',
      '.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif', '.txt', '.csv', '.md'
    ];

    // Filter to only accept supported files
    const supportedFiles = files.filter(file => {
      const hasValidType = supportedTypes.includes(file.type);
      const hasValidExtension = supportedExtensions.some(ext =>
        file.name.toLowerCase().endsWith(ext)
      );
      return hasValidType || hasValidExtension;
    });

    if (supportedFiles.length < files.length) {
      message.warning('Only PDF, Excel, Word, PowerPoint, Image, Text, and Markdown files are accepted.');
    }

    if (supportedFiles.length === 0) {
      return;
    }

    // Store folder metadata if provided
    if (metadata && Object.keys(metadata).length > 0) {
      setFolderMetadata(metadata);

      // Count unique folders
      const uniqueFolders = new Set(
        Object.values(metadata).map(m => m.folder_path).filter(p => p)
      );

      message.success({
        content: (
          <span>
            📁 Folder structure preserved! {supportedFiles.length} files from {uniqueFolders.size} folder{uniqueFolders.size !== 1 ? 's' : ''}
          </span>
        ),
        duration: 3,
      });
    }

    // Create uploaded files entries from the selected files
    const newUploadedFiles = supportedFiles.map((file, index) => {
      const sizeInKB = Math.round(file.size / 1024);
      return {
        id: `temp-${Date.now()}-${index}`,
        name: file.name,
        date: new Date().toISOString().split("T")[0],
        status: "success" as const, // Keep status for internal tracking
        size: `${sizeInKB}KB`,
        file: file, // Store the actual file for later upload
      };
    });

    setUploadedFiles([...uploadedFiles, ...newUploadedFiles]);
    setStep("review");
  };

  const handleConfirm = async () => {
    if (uploadedFiles.length === 0) {
      message.warning("Please select at least one file.");
      return;
    }

    if (loading) return; // Prevent multiple clicks

    setLoading(true);
    setUploadProgress(0);
    setUploadStatus("Preparing files...");

    try {
      // Extract files from uploaded files
      const files = uploadedFiles
        .map((uploadedFile) => uploadedFile.file)
        .filter((file): file is File => file !== undefined);

      setUploadProgress(10);
      setUploadStatus(`Uploading and adding ${files.length} files to dataroom...`);

      // Use the new combined endpoint for better performance
      // Pass folder metadata if available
      await uploadAndAddDocumentsToDataroom(id, files, folderMetadata); // resolves if API code===0 per interceptor

      // If we reach here, the upload succeeded
      setUploadProgress(100);
      setUploadStatus("Upload completed!");

      // Show success message with file count
      const folderInfo = folderMetadata ? ' with folder structure preserved' : '';
      message.success(`${files.length} files uploaded and added to dataroom successfully${folderInfo}`);

      // Call onSuccess callback to refresh parent data immediately
      if (onSuccess) {
        onSuccess();
      }

      // Small delay to show completion before closing
      setTimeout(() => {
        setVisible(false);
        // Reset states
        setUploadProgress(0);
        setUploadStatus("");
        setUploadedFiles([]);
        setFolderMetadata(undefined);
        setStep("upload");
        setLoading(false);
      }, 800); // brief delay to show success state
    } catch (error: any) {
      // Keep loading state and show error in progress
      setUploadProgress(0);
      setUploadStatus("Upload failed");

      // Extract error message from backend response
      let errorMessage = "Failed to upload files";
      let errorCode = null;

      if (error.response?.data) {
        const responseData = error.response.data;

        if (responseData.message) {
          errorMessage = responseData.message;
          errorCode = responseData.code;
        }

        // Handle specific error codes with custom styling or actions
        if (errorCode === 1005) {
          // File duplicate error - show as warning instead of error
          message.warning(errorMessage, 6); // Show for 6 seconds for longer message
        } else {
          message.error(errorMessage);
        }
      } else if (error.message) {
        // Network or other error
        errorMessage = error.message;
        message.error(errorMessage);
      } else {
        // Fallback error
        message.error(errorMessage);
      }

      console.error("Upload error:", error);

      // Reset states after showing error for a moment
      setTimeout(() => {
        setLoading(false);
        setUploadProgress(0);
        setUploadStatus("");
      }, 2000); // Show error state for 2 seconds
    }
  };

  const handleCancel = () => {
    setVisible(false);
    // Reset states when modal is closed
    setUploadProgress(0);
    setUploadStatus("");
    setUploadedFiles([]);
    setStep("upload");
  };

  const handleDeleteFile = (fileId: string) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.id !== fileId));
    setDocuemntIds(documentIds.filter((id) => id !== fileId));
  };

  return (
    <Modal
      title={null}
      onCancel={handleCancel}
      open={visible}
      width={720}
      footer={null}
      closeIcon={<CloseOutlined />}
    >
      <div className={styles.content}>
        <div className={styles.leftContent}>
          {sources.map((source) => (
            <div
              key={source.key}
              className={cs(
                styles.choiceBtn,
                activeSource === source.key ? styles.btnActive : null
              )}
              onClick={() =>
                handleSourceChange(source.key as "localFiles" | "sharePoint")
              }
            >
              {source.label}
            </div>
          ))}
        </div>
        <div className={styles.rightContent}>
          {step === "upload" ? (
            activeSource === "localFiles" ? (
              <div className={styles.uploadArea}>
                <div className={styles.dragDropArea}>
                  <FileUploader
                    onFilesSelected={handleFilesSelected}
                    buttonText="Choose local files"
                    showDragDrop
                    showFolderButton
                  />
                </div>
              </div>
            ) : (
              <div className={styles.microsoftConnectArea}>
                <Button type="primary" className={styles.connectButton}>
                  Link your Microsoft account
                </Button>
              </div>
            )
          ) : (
            <div className={styles.uploadedFilesArea}>
              <div className={styles.filesHeader}>
                <span>Selected files ({uploadedFiles.length})</span>
                {folderMetadata && Object.keys(folderMetadata).length > 0 && (
                  <Tag icon={<FolderOutlined />} color="success" style={{ marginLeft: 8 }}>
                    Folder structure preserved
                  </Tag>
                )}
              </div>
              <div className={styles.filesList}>
                {uploadedFiles.map((file) => {
                  const fileFolderInfo = folderMetadata?.[file.name];
                  return (
                    <div key={file.id} className={styles.fileItem}>
                      <div className={styles.fileIcon}>
                        📄
                      </div>
                      <div className={styles.fileInfo}>
                        <div className={styles.fileName}>
                          <span className={styles.fileNameText}>{file.name}</span>
                          {fileFolderInfo && fileFolderInfo.folder_path && (
                            <Tag
                              icon={<FolderOutlined />}
                              color="blue"
                              style={{ marginLeft: 8, fontSize: 11, flexShrink: 0 }}
                            >
                              {fileFolderInfo.folder_path}
                            </Tag>
                          )}
                        </div>
                        {file.status === "error" && (
                          <div className={`${styles.fileStatus} ${styles.error}`}>
                            ✗ Error (size limit exceeded)
                          </div>
                        )}
                        {file.status === "uploading" && (
                          <div
                            className={`${styles.fileStatus} ${styles.uploading}`}
                          >
                            ↑ Uploading {file.size || "250KB"}
                          </div>
                        )}
                      </div>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className={styles.addMoreFiles}>
                <FileUploader
                  onFilesSelected={handleFilesSelected}
                  buttonText="Choose local files"
                  showFolderButton
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={styles.modalFooter}>
        {loading && (
          <div className={styles.progressContainer}>
            <Progress
              percent={uploadProgress}
              status={
                uploadStatus === "Upload failed" ? "exception" :
                uploadProgress === 100 ? "success" : "active"
              }
              size="small"
            />
            <div className={styles.progressStatus}>{uploadStatus}</div>
            {uploadStatus === "Upload failed" && (
              <Button
                type="primary"
                size="small"
                onClick={handleConfirm}
                style={{ marginTop: 8 }}
              >
                Try Again
              </Button>
            )}
          </div>
        )}
        <div className={styles.buttonContainer}>
          <Button onClick={handleCancel} disabled={loading}>Cancel</Button>
          {step === "review" ? (
            <Button type="primary" onClick={handleConfirm} loading={loading}>
              {loading ? "Uploading..." : "Confirm"}
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={() => setStep("review")}
              disabled={uploadedFiles.length === 0}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default UploadModal;
