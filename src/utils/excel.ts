import ExcelJS from "exceljs";

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
