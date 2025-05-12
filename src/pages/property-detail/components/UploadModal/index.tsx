import { message, Modal, Button } from "antd";
import styles from "./index.module.less";
import { FileOutlined, CloseOutlined } from "@ant-design/icons";
import microsoftShareIcon from "@/assets/microsoft-share.svg";
import cs from "classnames";
import FileUploader from "../UploadFile";
import { uploadDocuments } from "@/utils/request/request-utils";
import { useState } from "react";
import axios from "axios";

interface UploadModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  id: string;
}

interface UploadedFile {
  id: string;
  name: string;
  date: string;
  status: 'success' | 'error' | 'uploading';
  size?: string;
  file?: File;
}

const UploadModal: React.FC<UploadModalProps> = (props) => {
  const { visible, setVisible, id } = props;
  const [documentIds, setDocuemntIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSource, setActiveSource] = useState<'localFiles' | 'sharePoint'>('localFiles');
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);



  const sources = [
    {
      key: 'localFiles',
      label: (
        <>
          <FileOutlined />
          Local Files
        </>
      ),
    },
    {
      key: 'sharePoint',
      label: (
        <>
          <img src={microsoftShareIcon} alt="" style={{ width: 16, height: 16 }} />
          SharePoint
        </>
      ),
    },
  ];

  const handleSourceChange = (source: 'localFiles' | 'sharePoint') => {
    setActiveSource(source);
  };

  const handleFilesSelected = (files: File[]) => {
    // Create uploaded files entries from the selected files
    const newUploadedFiles = files.map((file, index) => {
      const sizeInKB = Math.round(file.size / 1024);
      return {
        id: `temp-${Date.now()}-${index}`,
        name: file.name,
        date: new Date().toISOString().split('T')[0],
        status: 'success' as const,
        size: `${sizeInKB}KB`,
        file: file // Store the actual file for later upload
      };
    });

    setUploadedFiles([...uploadedFiles, ...newUploadedFiles]);
    setStep('review');
  };

  const handleConfirm = async () => {
    if (uploadedFiles.length === 0) {
      message.warning("Please select at least one file.");
      return;
    }

    setLoading(true);

    try {
      // Create a FormData object to send the files
      const formData = new FormData();
      uploadedFiles.forEach(uploadedFile => {
        if (uploadedFile.file) {
          formData.append("files", uploadedFile.file);
        }
      });

      // Upload the files
      const response = await axios.post("api/v1/documents/upload", formData, {
        headers: {
          accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        const newDocumentIds = response.data.data.documents.map((item: any) => item.id);

        // Upload the documents to the dataroom
        await uploadDocuments(id, newDocumentIds);

        message.success("Files uploaded successfully");
        setVisible(false);
      }
    } catch (error) {
      message.error("Failed to upload files");
      console.error("Upload error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const handleDeleteFile = (fileId: string) => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== fileId));
    setDocuemntIds(documentIds.filter(id => id !== fileId));
  };

  return (
    <Modal
      title="Upload files"
      onCancel={() => setVisible(false)}
      open={visible}
      width={720}
      footer={null}
      closeIcon={<CloseOutlined />}
    >
      <div className={styles.content}>
        <div className={styles.leftContent}>
          {sources.map((source, index) => (
            <div
              key={source.key}
              className={cs(
                styles.choiceBtn,
                activeSource === source.key ? styles.btnActive : null
              )}
              onClick={() => handleSourceChange(source.key as 'localFiles' | 'sharePoint')}
            >
              {source.label}
            </div>
          ))}
        </div>
        <div className={styles.rightContent}>
          {step === 'upload' ? (
            activeSource === 'localFiles' ? (
              <div className={styles.uploadArea}>
                <div className={styles.dragDropArea}>
                  <p>Drag and drop</p>
                  <FileUploader
                    onFilesSelected={handleFilesSelected}
                    buttonText="Choose local files"
                    showDragDrop
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
                Uploaded files ({uploadedFiles.length})
              </div>
              <div className={styles.filesList}>
                {uploadedFiles.map((file) => (
                  <div key={file.id} className={styles.fileItem}>
                    <div className={styles.fileIcon}>
                      {file.name.endsWith('.pptx') ? '📊' : '📄'}
                    </div>
                    <div className={styles.fileInfo}>
                      <div className={styles.fileName}>{file.name}</div>
                      {file.status === 'success' && (
                        <div className={styles.fileStatus}>
                          ✓ Success ({file.size || '50KB'})
                        </div>
                      )}
                      {file.status === 'error' && (
                        <div className={`${styles.fileStatus} ${styles.error}`}>
                          ✗ Error (size limit exceeded)
                        </div>
                      )}
                      {file.status === 'uploading' && (
                        <div className={`${styles.fileStatus} ${styles.uploading}`}>
                          ↑ Uploading {file.size || '250KB'}
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
                ))}
              </div>
              <div className={styles.addMoreFiles}>
                <FileUploader
                  onFilesSelected={handleFilesSelected}
                  buttonText="Choose local files"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={styles.modalFooter}>
        <Button onClick={handleCancel}>
          Cancel
        </Button>
        {step === 'review' ? (
          <Button
            type="primary"
            onClick={handleConfirm}
            loading={loading}
          >
            Confirm
          </Button>
        ) : (
          <Button
            type="primary"
            onClick={() => setStep('review')}
            disabled={uploadedFiles.length === 0}
          >
            Next
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default UploadModal;
