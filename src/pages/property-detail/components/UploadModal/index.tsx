import { message, Modal, Button, Progress, Tag } from "antd";
import styles from "./index.module.less";
import { FileOutlined, CloseOutlined, FolderOutlined } from "@ant-design/icons";
import microsoftShareIcon from "@/assets/microsoft-share.svg";
import cs from "classnames";
import FileUploader from "../UploadFile";
import { uploadAndAddDocumentsToDataroom } from "@/utils/request/request-utils";
import { useState, useRef } from "react";
import { FolderUploadMetadata } from "@/utils/folderUploadUtils";
import {
  BatchUploader,
  BatchUploadProgress,
  BatchUploadFile,
  convertToBatchUploadFiles,
  BatchUploadResult
} from "@/utils/batchUploader";
import BatchUploadProgressComponent from "@/components/BatchUploadProgress";
import FileSizeWarning from "@/components/FileSizeWarning";
import { validateMultipleFiles, shouldUseBatchUpload, formatFileSize } from "@/utils/fileSizeUtils";

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
  const [step, setStep] = useState<"upload" | "review" | "batch-uploading">("upload");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [folderMetadata, setFolderMetadata] = useState<FolderUploadMetadata | undefined>(undefined);

  // Batch upload state
  const [useBatchUpload, setUseBatchUpload] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchUploadProgress | null>(null);
  const [batchResult, setBatchResult] = useState<BatchUploadResult | null>(null);
  const [failedFiles, setFailedFiles] = useState<BatchUploadFile[]>([]);
  const batchUploaderRef = useRef<BatchUploader | null>(null);

  // File size validation state
  const [oversizedFiles, setOversizedFiles] = useState<{ file: File; error: string }[]>([]);
  const [largeFiles, setLargeFiles] = useState<{ file: File; warning: string }[]>([]);
  const [showFileSizeWarning, setShowFileSizeWarning] = useState(false);

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

    // Validate file sizes and determine upload strategy
    const validation = validateMultipleFiles(supportedFiles);
    const batchDecision = shouldUseBatchUpload(validation.validFiles);

    // Handle oversized files (above 50MB limit)
    if (validation.oversizedFiles.length > 0) {
      const oversizedFileData = validation.oversizedFiles.map(({ file, validation }) => ({
        file,
        error: validation.errorMessage || `File exceeds 50MB limit`
      }));
      setOversizedFiles(oversizedFileData);
      setShowFileSizeWarning(true);

      message.error({
        content: `${validation.oversizedFiles.length} file${validation.oversizedFiles.length > 1 ? 's' : ''} exceed the 50MB size limit and cannot be uploaded.`,
        duration: 6,
      });
    } else {
      setOversizedFiles([]);
    }

    // Handle large files (25MB+ but under 50MB)
    if (validation.largeFiles.length > 0) {
      const largeFileData = validation.largeFiles.map(({ file, validation }) => ({
        file,
        warning: validation.warningMessage || `Large file detected`
      }));
      setLargeFiles(largeFileData);
      setShowFileSizeWarning(true);

      // Removed technical message - too complex for users
    } else {
      setLargeFiles([]);
    }

    // Set batch upload mode
    setUseBatchUpload(batchDecision.shouldUseBatch);

    // Removed technical batch upload message - too complex for users

    // Only show file size warning if there are issues
    setShowFileSizeWarning(validation.oversizedFiles.length > 0 || validation.largeFiles.length > 0);

    // Create uploaded files entries from VALID files only (exclude oversized files)
    const newUploadedFiles = validation.validFiles.map((file, index) => {
      const sizeFormatted = formatFileSize(file.size);
      return {
        id: `temp-${Date.now()}-${index}`,
        name: file.name,
        date: new Date().toISOString().split("T")[0],
        status: "success" as const, // Keep status for internal tracking
        size: sizeFormatted,
        file: file, // Store the actual file for later upload
      };
    });

    setUploadedFiles([...uploadedFiles, ...newUploadedFiles]);

    // Only proceed to review if we have valid files
    if (validation.validFiles.length > 0) {
      setStep("review");
    } else if (validation.oversizedFiles.length > 0) {
      // All files were oversized, stay on upload step with warning
      message.error("All selected files exceed the size limit. Please select smaller files or compress them.");
    }
  };

  const handleConfirm = async () => {
    if (uploadedFiles.length === 0) {
      message.warning("Please select at least one file.");
      return;
    }

    if (loading) return; // Prevent multiple clicks

    // Extract files from uploaded files
    const files = uploadedFiles
      .map((uploadedFile) => uploadedFile.file)
      .filter((file): file is File => file !== undefined);

    if (useBatchUpload) {
      // Use batch upload for large uploads
      await handleBatchUpload(files);
    } else {
      // Use traditional upload for smaller uploads
      await handleTraditionalUpload(files);
    }
  };

  const handleTraditionalUpload = async (files: File[]) => {
    setLoading(true);
    setUploadProgress(0);
    setUploadStatus("Preparing files...");

    try {
      setUploadProgress(10);
      setUploadStatus(`Uploading and adding ${files.length} files to dataroom...`);

      // Use the existing single-request endpoint
      await uploadAndAddDocumentsToDataroom(id, files, folderMetadata);

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
        resetUploadState();
      }, 800);
    } catch (error: any) {
      // Keep loading state and show error in progress
      setUploadProgress(0);
      setUploadStatus("Upload failed");

      // Extract error message from backend response
      let errorMessage = "Failed to upload files";
      let errorCode = null;

      if (error?.response?.data) {
        const responseData = error.response.data;
        if (responseData.message) {
          errorMessage = responseData.message;
        }
        if (responseData.code !== undefined) {
          errorCode = responseData.code;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Show error message with code if available
      const errorText = errorCode !== null ? `${errorMessage} (Code: ${errorCode})` : errorMessage;
      message.error(errorText);

      console.error("Upload error:", error);

      // Reset states after showing error for a moment
      setTimeout(() => {
        setLoading(false);
        setUploadProgress(0);
        setUploadStatus("");
      }, 2000);
    }
  };

  const handleBatchUpload = async (files: File[]) => {
    setStep("batch-uploading");
    setBatchProgress(null);
    setBatchResult(null);
    setFailedFiles([]);

    // Convert files to batch upload format
    const batchFiles = convertToBatchUploadFiles(files);

    // Create batch uploader
    const uploader = new BatchUploader({
      batchSize: 25, // 25 files per batch
      maxConcurrentBatches: 1, // Sequential for now
      retryAttempts: 3,
      retryDelay: 2000,
      onProgress: (progress) => {
        setBatchProgress(progress);
      },
      onBatchComplete: (batchIndex, batch) => {
        console.log(`Batch ${batchIndex + 1} completed:`, batch.length, 'files');
      },
      onError: (error, batch) => {
        console.error('Batch error:', error);
      }
    });

    batchUploaderRef.current = uploader;

    try {
      const result = await uploader.uploadFiles(id, batchFiles, folderMetadata);
      setBatchResult(result);

      if (result.success) {
        // All files uploaded successfully
        const folderInfo = folderMetadata ? ' with folder structure preserved' : '';
        message.success(`All ${result.totalFiles} files uploaded and added to dataroom successfully${folderInfo}`);

        // Call onSuccess callback
        if (onSuccess) {
          onSuccess();
        }

        // Close modal after brief delay
        setTimeout(() => {
          setVisible(false);
          resetUploadState();
        }, 2000);
      } else {
        // Some files failed
        const failedFilesList = result.failedBatches.flat();
        setFailedFiles(failedFilesList);

        message.warning({
          content: `Upload completed with ${result.failedFiles} failed files. ${result.successfulFiles} files uploaded successfully.`,
          duration: 5
        });

        // Call onSuccess for successful files
        if (result.successfulFiles > 0 && onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      console.error('Batch upload error:', error);
      message.error(`Batch upload failed: ${error.message || 'Unknown error'}`);
      setBatchProgress(prev => prev ? { ...prev, status: 'error', message: 'Upload failed' } : null);
    }
  };

  const handleCancelBatchUpload = () => {
    if (batchUploaderRef.current) {
      batchUploaderRef.current.cancel();
      message.info('Upload cancelled');
    }
  };

  const handleRetryFailedBatches = async () => {
    if (!failedFiles.length) return;

    // Reset failed files and try again
    setFailedFiles([]);
    setBatchResult(null);

    await handleBatchUpload(failedFiles.map(f => f.file));
  };

  const handleRemoveOversizedFile = (fileName: string) => {
    setOversizedFiles(prev => prev.filter(item => item.file.name !== fileName));
    setLargeFiles(prev => prev.filter(item => item.file.name !== fileName));

    // Hide warning if no more problematic files
    const remainingOversized = oversizedFiles.filter(item => item.file.name !== fileName);
    const remainingLarge = largeFiles.filter(item => item.file.name !== fileName);

    if (remainingOversized.length === 0 && remainingLarge.length === 0) {
      setShowFileSizeWarning(false);
    }
  };

  const resetUploadState = () => {
    setUploadProgress(0);
    setUploadStatus("");
    setUploadedFiles([]);
    setFolderMetadata(undefined);
    setStep("upload");
    setLoading(false);
    setUseBatchUpload(false);
    setBatchProgress(null);
    setBatchResult(null);
    setFailedFiles([]);
    setOversizedFiles([]);
    setLargeFiles([]);
    setShowFileSizeWarning(false);
    batchUploaderRef.current = null;
  };

  const handleCancel = () => {
    // Cancel batch upload if in progress
    if (step === "batch-uploading" && batchUploaderRef.current) {
      batchUploaderRef.current.cancel();
    }

    setVisible(false);
    resetUploadState();
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
          ) : step === "batch-uploading" ? (
            <div className={styles.batchUploadArea}>
              <div className={styles.batchUploadHeader}>
                <h3>Uploading Documents</h3>
                <p>Uploading {uploadedFiles.length} files...</p>
              </div>
              {batchProgress && (
                <BatchUploadProgressComponent
                  progress={batchProgress}
                  failedFiles={failedFiles}
                  onCancel={handleCancelBatchUpload}
                  onRetry={handleRetryFailedBatches}
                  showDetails={false}
                />
              )}
            </div>
          ) : (
            <div className={styles.uploadedFilesArea}>
              {/* Simplified File Size Warning */}
              {showFileSizeWarning && (
                <FileSizeWarning
                  oversizedFiles={oversizedFiles}
                  largeFiles={largeFiles}
                  totalFiles={uploadedFiles.length + oversizedFiles.length}
                  totalSizeMB={
                    [...uploadedFiles.map(f => f.file), ...oversizedFiles.map(f => f.file)]
                      .reduce((sum, file) => sum + (file?.size || 0), 0) / (1024 * 1024)
                  }
                  onRemoveFile={handleRemoveOversizedFile}
                  showGuidance={false}
                />
              )}

              <div className={styles.filesHeader}>
                <span>Selected files ({uploadedFiles.length})</span>
                {/* Removed technical tags - too complex for users */}
                {folderMetadata && Object.keys(folderMetadata).length > 0 && (
                  <Tag icon={<FolderOutlined />} color="success" style={{ marginLeft: 8 }}>
                    Folder upload
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
                            ✗ File too large
                          </div>
                        )}
                        {file.status === "uploading" && (
                          <div
                            className={`${styles.fileStatus} ${styles.uploading}`}
                          >
                            ↑ Uploading...
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
        {loading && step !== "batch-uploading" && (
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
          {step === "batch-uploading" ? (
            <>
              {batchProgress?.status === 'completed' || batchProgress?.status === 'error' ? (
                <Button type="primary" onClick={handleCancel}>
                  Close
                </Button>
              ) : (
                <Button onClick={handleCancel} danger>
                  Cancel Upload
                </Button>
              )}
            </>
          ) : (
            <>
              <Button onClick={handleCancel} disabled={loading}>Cancel</Button>
              {step === "review" ? (
                <Button
                  type="primary"
                  onClick={handleConfirm}
                  loading={loading}
                  disabled={oversizedFiles.length > 0}
                >
                  {loading ? "Uploading..." : "Upload Files"}
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
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default UploadModal;
