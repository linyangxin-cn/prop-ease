import ExcelJS from "exceljs";
import { DoucementInfo } from "./request/types";

export async function exportExcel(
  filename: string,
  data: (number | string)[][]
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet1");

  // 添加数据
  worksheet.addRows(data);

  // 生成文件并下载
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename + ".xlsx";
  a.click();
}

/**
 * Export documents to Excel with specific columns
 * @param dataroomName The name of the dataroom (used for the filename)
 * @param documents Array of document objects
 */
export async function exportDocumentsToExcel(
  dataroomName: string,
  documents: DoucementInfo[] // Ensure DoucementInfo type is correctly defined/imported
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Documents");

  // Define the columns we want to export
  const headers = ["New File Name", "Original Filename", "Type", "Document Metadata"];

  // Add headers
  worksheet.addRow(headers);

  // Filter documents to only include those with confirmed status
  const confirmedDocuments = documents.filter(doc =>
    doc.user_confirmation_status === 'confirmed' ||
    doc.user_confirmation_status === 'CONFIRMED'
  );

  // Format the data
  confirmedDocuments.forEach(doc => {
    const type = doc.user_label || doc.classification_label || "";
    let metadataStr = "";
    if (doc.document_metadata) {
      try {
        if (typeof doc.document_metadata === 'string') {
          metadataStr = doc.document_metadata;
        } else {
          metadataStr = JSON.stringify(doc.document_metadata);
        }
      } catch (e) {
        console.error("Error stringifying document metadata", e);
        metadataStr = "Error parsing metadata";
      }
    }
    worksheet.addRow([
      doc.new_file_name || "",
      doc.original_filename || "",
      type,
      metadataStr
    ]);
  });

  // Auto-size columns
  if (worksheet.columns) {
    // Filter out undefined columns and explicitly type 'column'
    const definedColumns = worksheet.columns.filter(
      (col): col is ExcelJS.Column => !!col
    );

    definedColumns.forEach(column => { // 'column' is now guaranteed to be ExcelJS.Column
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => { // No more TS2722 error here
        const cellValue = cell.value;
        // Ensure cellValue is not null/undefined before calling toString()
        // and handle various cell types (string, number, date, rich text, etc.)
        let currentLength = 10; // Default length for empty or unhandled cells
        if (cellValue) {
            if (typeof cellValue === 'string') {
                currentLength = cellValue.length;
            } else if (typeof cellValue === 'number') {
                currentLength = cellValue.toString().length;
            } else if (cellValue.hasOwnProperty('richText')) { // Handle RichText
                const richText = (cellValue as ExcelJS.CellRichTextValue).richText;
                currentLength = richText.map(rt => rt.text).join('').length;
            } else if (cellValue instanceof Date) {
                currentLength = cellValue.toLocaleDateString().length; // Or any other desired date format length
            } else {
                // For other types, attempt toString() or assign a default
                try {
                    currentLength = cellValue.toString().length;
                } catch (e) {
                    // If toString fails or doesn't exist
                }
            }
        }
        // const columnLength = cell.value ? cell.value.toString().length : 10; // Original line
        const columnLength = currentLength;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(maxLength < 10 ? 10 : maxLength + 2, 50); // Ensure minimum width, cap width at 50
    });
  }

  // Generate file and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${dataroomName}_documents.xlsx`;
  a.click();
  // It's good practice to revoke the object URL after use
  URL.revokeObjectURL(url);
}
