import ExcelJS from "exceljs";
import { getDataroomDocuments } from "./request/request-utils";
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

export const exportDopcumentsData = async (id: string) => {
  const documentsData = await getDataroomDocuments(id);
  const documents = [
    ...(documentsData?.confirmed || []),
    ...(documentsData?.not_confirmed || []),
  ];
  if (documents.length === 0) {
    return;
  }
  const header = Object.keys(documents[0]);
  const data: (number | string)[][] = documents.map((doc) => {
    return header.map((key) => doc[key as keyof DoucementInfo] ?? "");
  });
  exportExcel("document-excel", [header, ...data]);
};
