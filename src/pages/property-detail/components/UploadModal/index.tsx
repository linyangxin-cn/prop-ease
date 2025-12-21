import { message, Modal, Button, Progress, Tag, Space, Collapse, Typography, List } from "antd";
import styles from "./index.module.less";
import { FileOutlined, CloseOutlined, FolderOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";
import microsoftShareIcon from "@/assets/microsoft-share.svg";
import cs from "classnames";
import FileUploader from "../UploadFile";
import { uploadAndAddDocumentsToDataroom } from "@/utils/request/request-utils";
import { useState, useRef, useCallback } from "react";
import { FolderUploadMetadata } from "@/utils/folderUploadUtils";
import {
  BatchUploader,
  BatchUploadProgress,
  BatchUploadFile,
  convertToBatchUploadFiles
} from "@/utils/batchUploader";
import { SharePointBatchUploader, SharePointBatchUploadProgress } from "@/utils/sharepointBatchUploader";
import BatchUploadProgressComponent from "@/components/BatchUploadProgress";
import FileSizeWarning from "@/components/FileSizeWarning";
import { validateMultipleFiles, shouldUseBatchUpload, formatFileSize } from "@/utils/fileSizeUtils";
import SharePointConnection from "@/components/SharePointConnection";
import SharePointBrowser from "@/components/SharePointBrowser";
import { SharePointApiService, SharePointFile } from "@/utils/sharepoint/api";

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

// Function to show detailed import results
const showImportResultsModal = (result: any) => {
  const { duplicateFiles, failedFiles, duplicateImports, failedImports } = result;

  if (duplicateFiles === 0 && failedFiles === 0) return;

  const content = (
    <div>
      {duplicateFiles > 0 && duplicateImports && (
        <Collapse
          items={[
            {
              key: 'duplicates',
              label: (
                <Space>
                  <InfoCircleOutlined style={{ color: '#1890ff' }} />
                  <span>{duplicateFiles} Duplicate Files (Skipped)</span>
                </Space>
              ),
              children: (
                <List
                  size="small"
                  dataSource={duplicateImports}
                  renderItem={(item: {fileId: string; filename: string; error: string}) => (
                    <List.Item>
                      <div>
                        <Typography.Text strong>{item.filename}</Typography.Text>
                        <br />
                        <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                          {item.error}
                        </Typography.Text>
                      </div>
                    </List.Item>
                  )}
                />
              ),
            },
          ]}
        />
      )}

      {failedFiles > 0 && failedImports && (
        <Collapse
          style={{ marginTop: duplicateFiles > 0 ? 16 : 0 }}
          items={[
            {
              key: 'failures',
              label: (
                <Space>
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                  <span>{failedFiles} Failed Files</span>
                </Space>
              ),
              children: (
                <List
                  size="small"
                  dataSource={failedImports}
                  renderItem={(item: {fileId: string; error: string; errorType?: string}) => (
                    <List.Item>
                      <div>
                        <Typography.Text type="danger">File ID: {item.fileId}</Typography.Text>
                        <br />
                        <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                          {item.error}
                        </Typography.Text>
                        {item.errorType && (
                          <>
                            <br />
                            <Tag color={item.errorType === 'session_conflict' ? 'orange' : 'red'}>
                              {item.errorType}
                            </Tag>
                          </>
                        )}
                      </div>
                    </List.Item>
                  )}
                />
              ),
            },
          ]}
        />
      )}
    </div>
  );

  Modal.info({
    title: 'Import Results Details',
    content,
    width: 700,
    okText: 'Close',
  });
};

const UploadModal: React.FC<UploadModalProps> = (props) => {
  const { visible, setVisible, id, onSuccess } = props;
  const [documentIds, setDocuemntIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSource, setActiveSource] = useState<"localFiles" | "sharePoint">(
    "localFiles"
  );
  const [step, setStep] = useState<"upload" | "review" | "batch-uploading" | "sharepoint-connect" | "sharepoint-browse">("upload");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [folderMetadata, setFolderMetadata] = useState<FolderUploadMetadata | undefined>(undefined);

  // SharePoint-specific state
  const [selectedSharepointFiles, setSelectedSharepointFiles] = useState<SharePointFile[]>([]);

  // Batch upload state
  const [useBatchUpload, setUseBatchUpload] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchUploadProgress | null>(null);
  const [failedFiles, setFailedFiles] = useState<BatchUploadFile[]>([]);
  const [localUploadResults, setLocalUploadResults] = useState<{successfulFiles: number; duplicateFiles: number; failedFiles: number} | null>(null);
  const batchUploaderRef = useRef<BatchUploader | null>(null);

  // SharePoint batch upload state
  const [sharepointBatchProgress, setSharepointBatchProgress] = useState<SharePointBatchUploadProgress | null>(null);
  const [sharepointFailedBatches, setSharepointFailedBatches] = useState<SharePointFile[][]>([]);
  const [sharepointImportResults, setSharepointImportResults] = useState<{successfulFiles: number; duplicateFiles: number; failedFiles: number} | null>(null);
  const sharepointBatchUploaderRef = useRef<SharePointBatchUploader | null>(null);

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

    // Reset state when switching sources
    setUploadedFiles([]);
    setSelectedSharepointFiles([]);
    setStep("upload");

    // If switching to SharePoint, check connection status
    if (source === "sharePoint") {
      checkSharePointConnection();
    }
  };

  // SharePoint-specific handlers
  const checkSharePointConnection = async () => {
    try {
      const connected = await SharePointApiService.checkConnection();

      if (connected) {
        setStep("sharepoint-browse");
      } else {
        setStep("sharepoint-connect");
      }
    } catch (error) {
      console.error("Failed to check SharePoint connection:", error);
      setStep("sharepoint-connect");
    }
  };

  const handleSharePointConnection = (connected: boolean) => {
    if (connected) {
      setStep("sharepoint-browse");
    }
  };

  const handleSharePointConnect = () => {
    setStep("sharepoint-browse");
  };

  const handleSharePointFilesSelected = useCallback((files: SharePointFile[]) => {
    setSelectedSharepointFiles(files);
  }, []);

  const handleSharePointImport = async () => {
    if (selectedSharepointFiles.length === 0) {
      message.warning("Please select files to import.");
      return;
    }

    // Validate that all files have required context information
    const filesWithoutContext = selectedSharepointFiles.filter(file => !file.siteId || !file.libraryId);
    if (filesWithoutContext.length > 0) {
      message.error("Some files are missing context information. Please reselect the files.");
      return;
    }

    // Validate file sizes (similar to local upload validation)
    const maxFileSizeMB = 50; // Same as local upload limit
    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;
    const oversizedFiles = selectedSharepointFiles.filter(file => file.size > maxFileSizeBytes);

    if (oversizedFiles.length > 0) {
      const oversizedFileNames = oversizedFiles.map(f => `${f.name} (${formatFileSize(f.size)})`).join(', ');
      message.error(`The following files exceed the ${maxFileSizeMB}MB limit: ${oversizedFileNames}`);
      return;
    }

    // Check if we should use batch upload (same logic as local upload)
    const shouldUseBatch = selectedSharepointFiles.length > 25 ||
                          selectedSharepointFiles.some(f => f.size > 25 * 1024 * 1024);

    if (shouldUseBatch) {
      message.info(`Starting batch processing of ${selectedSharepointFiles.length} files for optimal performance.`);
    }

    setStep("batch-uploading");
    setSharepointBatchProgress(null);
    setSharepointImportResults(null);

    // Create SharePoint batch uploader
    const uploader = new SharePointBatchUploader({
      batchSize: 25, // 25 files per batch
      maxConcurrentBatches: 1, // Sequential for now
      retryAttempts: 3,
      retryDelay: 2000,
      onProgress: (progress) => {
        setSharepointBatchProgress(progress);
      },
      onBatchComplete: () => {
        // Batch completed successfully
      },
      onError: (error) => {
        console.error('SharePoint batch error:', error);
      }
    });

    sharepointBatchUploaderRef.current = uploader;

    try {
      const result = await uploader.importFiles(id, selectedSharepointFiles);

      // Store failed batches for retry functionality
      setSharepointFailedBatches(result.failedBatches);

      // Store import results for statistics display
      setSharepointImportResults({
        successfulFiles: result.successfulFiles,
        duplicateFiles: result.duplicateFiles,
        failedFiles: result.failedFiles
      });

      // Always show detailed breakdown if there are duplicates or failures
      if (result.duplicateFiles > 0 || result.failedFiles > 0) {
        let statusMessage = `Import completed: ${result.successfulFiles} successful`;

        if (result.duplicateFiles > 0) {
          statusMessage += `, ${result.duplicateFiles} duplicates`;
        }

        if (result.failedFiles > 0) {
          statusMessage += `, ${result.failedFiles} failed`;
        }

        // Show detailed breakdown in a modal
        showImportResultsModal(result);

        if (result.failedFiles > 0) {
          message.error(statusMessage);
        } else {
          message.info(statusMessage);
        }
      } else {
        // Only show simple success message if everything was successful with no duplicates
        message.success(`Successfully imported ${result.successfulFiles} files from SharePoint!`);
      }

      onSuccess?.(); // Refresh parent data

      // Close modal after a short delay if no failures
      if (result.failedFiles === 0) {
        setTimeout(() => {
          setVisible(false);
        }, 1500);
      }

    } catch (error: any) {
      console.error("SharePoint import failed:", error);
      message.error("Failed to import files from SharePoint. Please try again.");
    } finally {
      setLoading(false);
    }
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

      // Find the metadata key for this specific file
      let metadataKey = undefined;
      if (metadata) {
        // Try to find the full path key for this file
        // We need to match by the file object itself or by webkitRelativePath
        const webkitPath = (file as any).webkitRelativePath;

        if (webkitPath) {
          // Extract the relative path (remove root folder name)
          const pathParts = webkitPath.split('/');
          if (pathParts.length > 1) {
            // Remove the root folder name
            const relativePath = pathParts.slice(1).join('/');
            if (metadata[relativePath]) {
              metadataKey = relativePath;
            }
          }
        }

        // If not found by webkitRelativePath, try to find by filename
        if (!metadataKey) {
          for (const key of Object.keys(metadata)) {
            if (key === file.name || key.endsWith(`/${file.name}`)) {
              metadataKey = key;
              break;
            }
          }
        }
      }

      return {
        id: `temp-${Date.now()}-${index}`,
        name: file.name,
        date: new Date().toISOString().split("T")[0],
        status: "success" as const, // Keep status for internal tracking
        size: sizeFormatted,
        file: file, // Store the actual file for later upload
        metadataKey: metadataKey, // Store the metadata key for this specific file
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
      const response = await uploadAndAddDocumentsToDataroom(id, files, folderMetadata);

      // Extract results from response
      let responseData: any;
      if (response && typeof response === 'object' && (response as any).summary) {
        // Response is already the data object
        responseData = response;
      } else if (response.data && typeof response.data === 'object' && (response.data as any).summary) {
        // Response data is in response.data
        responseData = response.data;
      } else {
        // Fallback
        responseData = response.data || response || {};
      }

      const summary = responseData.summary || {};
      const successCount = summary.successful || 0;
      const duplicateCount = summary.duplicates || 0;
      const failureCount = summary.failed || 0;

      // If we reach here, the upload completed (may have duplicates or partial failures)
      setUploadProgress(100);
      setUploadStatus("Upload completed!");

      // Build success message based on results
      const folderInfo = folderMetadata ? ' with folder structure preserved' : '';
      const messageParts: string[] = [];
      if (successCount > 0) {
        messageParts.push(`${successCount} uploaded successfully`);
      }
      if (duplicateCount > 0) {
        messageParts.push(`${duplicateCount} duplicates skipped`);
      }
      if (failureCount > 0) {
        messageParts.push(`${failureCount} failed`);
      }

      const resultMessage = messageParts.length > 0
        ? `Upload completed: ${messageParts.join(', ')}${folderInfo}`
        : `Upload completed${folderInfo}`;

      if (failureCount > 0) {
        message.warning(resultMessage);
      } else {
        message.success(resultMessage);
      }

      // Call onSuccess callback if there were any successful uploads
      if (successCount > 0 && onSuccess) {
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
      onBatchComplete: () => {
        // Batch completed successfully
      },
      onError: (error) => {
        console.error('Batch error:', error);
      }
    });

    batchUploaderRef.current = uploader;

    try {
      const result = await uploader.uploadFiles(id, batchFiles, folderMetadata);

      // Store upload results for statistics display
      setLocalUploadResults({
        successfulFiles: result.successfulFiles,
        duplicateFiles: result.duplicateFiles,
        failedFiles: result.failedFiles
      });

      // Show detailed results modal if there are duplicates or failures
      if (result.duplicateFiles > 0 || result.failedFiles > 0) {
        showImportResultsModal(result);
      }

      if (result.failedFiles === 0) {
        // Success with possible duplicates
        const message_parts: string[] = [];
        if (result.successfulFiles > 0) {
          message_parts.push(`${result.successfulFiles} uploaded successfully`);
        }
        if (result.duplicateFiles > 0) {
          message_parts.push(`${result.duplicateFiles} duplicates skipped`);
        }

        const folderInfo = folderMetadata ? ' with folder structure preserved' : '';
        const resultMessage = message_parts.length > 0
          ? `Upload completed: ${message_parts.join(', ')}${folderInfo}`
          : `Upload completed${folderInfo}`;
        message.success(resultMessage);

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

        const message_parts: string[] = [];
        if (result.successfulFiles > 0) {
          message_parts.push(`${result.successfulFiles} successful`);
        }
        if (result.duplicateFiles > 0) {
          message_parts.push(`${result.duplicateFiles} duplicates`);
        }
        message_parts.push(`${result.failedFiles} failed`);

        const resultMessage = message_parts.length > 0
          ? `Upload completed: ${message_parts.join(', ')}.`
          : 'Upload completed.';

        message.warning({
          content: resultMessage,
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

    await handleBatchUpload(failedFiles.map(f => f.file));
  };

  const handleRetrySharepointFailedBatches = async () => {
    if (!sharepointFailedBatches.length || !sharepointBatchUploaderRef.current) return;

    setLoading(true);
    setSharepointBatchProgress(null);

    try {
      const result = await sharepointBatchUploaderRef.current.retryFailedBatches(id, sharepointFailedBatches);

      // Update failed batches with remaining failures
      setSharepointFailedBatches(result.failedBatches);

      if (result.success) {
        message.success(`Retry successful: ${result.successfulFiles} files imported!`);
        onSuccess?.(); // Refresh parent data
      } else {
        let statusMessage = `Retry completed: ${result.successfulFiles} successful`;

        if (result.duplicateFiles > 0) {
          statusMessage += `, ${result.duplicateFiles} duplicates`;
        }

        if (result.failedFiles > 0) {
          statusMessage += `, ${result.failedFiles} still failed`;
        }

        message.info(statusMessage);
      }

    } catch (error: any) {
      console.error("SharePoint retry failed:", error);
      message.error("Failed to retry SharePoint import. Please try again.");
    } finally {
      setLoading(false);
    }
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
    setFailedFiles([]);
    setOversizedFiles([]);
    setLargeFiles([]);
    setShowFileSizeWarning(false);
    batchUploaderRef.current = null;
    setLocalUploadResults(null);
    // Reset SharePoint state
    setSharepointBatchProgress(null);
    setSharepointFailedBatches([]);
    setSharepointImportResults(null);
    sharepointBatchUploaderRef.current = null;
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
      width={1000} // Increased width for better SharePoint experience
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
          {/* Keep SharePointBrowser mounted to preserve state, but hide when not needed */}
          <div style={{ display: step === "sharepoint-browse" ? "block" : "none" }}>
            <div className={styles.sharepointArea}>
              <div className={styles.sharepointBrowserContainer}>
                <SharePointBrowser
                  onFilesSelected={handleSharePointFilesSelected}
                  maxSelections={50}
                  initialSelectedFiles={selectedSharepointFiles}
                />
              </div>
            </div>
          </div>

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
              <div className={styles.sharepointArea}>
                <SharePointConnection
                  onConnectionChange={handleSharePointConnection}
                  onConnect={handleSharePointConnect}
                />
              </div>
            )
          ) : step === "sharepoint-connect" ? (
            <div className={styles.sharepointArea}>
              <SharePointConnection
                onConnectionChange={handleSharePointConnection}
                onConnect={handleSharePointConnect}
              />
            </div>
          ) : step === "sharepoint-browse" ? (
            // SharePoint browse step is handled by the always-mounted component above
            null
          ) : step === "batch-uploading" ? (
            <div className={styles.batchUploadArea}>
              <div className={styles.batchUploadHeader}>
                <h3>
                  {activeSource === "sharePoint" ? "Importing from SharePoint" : "Uploading Documents"}
                </h3>
                <p>
                  {activeSource === "sharePoint"
                    ? `Processing ${selectedSharepointFiles.length} files from SharePoint...`
                    : `Uploading ${uploadedFiles.length} files...`
                  }
                </p>
              </div>
              {/* Show appropriate progress component based on upload source */}
              {activeSource === "sharePoint" && sharepointBatchProgress && (
                <BatchUploadProgressComponent
                  progress={{
                    totalFiles: sharepointBatchProgress.totalFiles,
                    processedFiles: sharepointBatchProgress.processedFiles,
                    currentBatch: sharepointBatchProgress.currentBatch,
                    totalBatches: sharepointBatchProgress.totalBatches,
                    currentBatchFiles: sharepointBatchProgress.currentBatchFiles,
                    currentBatchTotal: sharepointBatchProgress.currentBatchTotal,
                    overallProgress: sharepointBatchProgress.overallProgress,
                    currentBatchProgress: sharepointBatchProgress.currentBatchProgress,
                    status: sharepointBatchProgress.status,
                    message: sharepointBatchProgress.message
                  }}
                  failedFiles={[]} // SharePoint doesn't use the same failed files structure
                  duplicateCount={sharepointImportResults?.duplicateFiles}
                  successfulCount={sharepointImportResults?.successfulFiles}
                  onCancel={() => sharepointBatchUploaderRef.current?.cancel()}
                  onRetry={sharepointFailedBatches.length > 0 ? handleRetrySharepointFailedBatches : undefined}
                  showDetails={false}
                />
              )}
              {activeSource === "localFiles" && batchProgress && (
                <BatchUploadProgressComponent
                  progress={batchProgress}
                  failedFiles={failedFiles}
                  duplicateCount={localUploadResults?.duplicateFiles}
                  successfulCount={localUploadResults?.successfulFiles}
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
                <span>
                  Selected files ({activeSource === "sharePoint" ? selectedSharepointFiles.length : uploadedFiles.length})
                </span>
                {/* Show source indicator */}
                {activeSource === "sharePoint" ? (
                  <Tag icon={<img src={microsoftShareIcon} alt="" style={{ width: 12, height: 12 }} />} color="blue" style={{ marginLeft: 8 }}>
                    SharePoint
                  </Tag>
                ) : folderMetadata && Object.keys(folderMetadata).length > 0 && (
                  <Tag icon={<FolderOutlined />} color="success" style={{ marginLeft: 8 }}>
                    Folder upload
                  </Tag>
                )}
              </div>
              <div className={styles.filesList}>
                {activeSource === "sharePoint" ? (
                  // SharePoint files display - match local files exactly with folder path
                  selectedSharepointFiles.map((file) => (
                    <div key={file.fileId} className={styles.fileItem}>
                      <div className={styles.fileIcon}>
                        📄
                      </div>
                      <div className={styles.fileInfo}>
                        <div className={styles.fileName}>
                          <span className={styles.fileNameText}>{file.name}</span>
                          {file.folderPath && (
                            <Tag
                              icon={<FolderOutlined />}
                              color="blue"
                              style={{ marginLeft: 8, fontSize: 11, flexShrink: 0 }}
                            >
                              {file.folderPath}
                            </Tag>
                          )}
                        </div>
                        {/* No status text to match local files */}
                      </div>
                      <button
                        className={styles.deleteButton}
                        onClick={() => {
                          setSelectedSharepointFiles(prev =>
                            prev.filter(f => f.fileId !== file.fileId)
                          );
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))
                ) : (
                  // Local files display
                  uploadedFiles.map((file) => {
                    // Get folder metadata using the stored metadata key
                    let fileFolderInfo = undefined;

                    if (folderMetadata && (file as any).metadataKey) {
                      fileFolderInfo = folderMetadata[(file as any).metadataKey];
                    }

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
                  })
                )}
              </div>
              <div className={styles.addMoreFiles}>
                {activeSource === "localFiles" ? (
                  <FileUploader
                    onFilesSelected={handleFilesSelected}
                    buttonText="Choose local files"
                    showFolderButton
                  />
                ) : (
                  // SharePoint add more files - go back to browse
                  <Space>
                    <Button
                      icon={<FileOutlined />}
                      onClick={() => setStep("sharepoint-browse")}
                      style={{
                        height: 40,
                        borderRadius: 6,
                        borderStyle: 'dashed',
                        borderColor: '#d9d9d9'
                      }}
                    >
                      Browse SharePoint Files
                    </Button>
                  </Space>
                )}
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
                  onClick={activeSource === "sharePoint" ? handleSharePointImport : handleConfirm}
                  loading={loading}
                  disabled={
                    activeSource === "sharePoint"
                      ? selectedSharepointFiles.length === 0
                      : oversizedFiles.length > 0
                  }
                >
                  {loading
                    ? (activeSource === "sharePoint" ? "Importing..." : "Uploading...")
                    : (activeSource === "sharePoint" ? "Import Files" : "Upload Files")
                  }
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={() => setStep("review")}
                  disabled={
                    activeSource === "sharePoint"
                      ? selectedSharepointFiles.length === 0
                      : uploadedFiles.length === 0
                  }
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
