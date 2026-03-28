/**
 * Excel Export Utility
 * Exports table data to XLSX format using SheetJS (xlsx library)
 */

export function exportToExcel(
  filename: string,
  data: Record<string, any>[],
  columns: Array<{ key: string; label: string }>
) {
  // Dynamically import xlsx to avoid SSR issues
  const XLSX = require("xlsx");

  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Transform data to match column labels
  const transformedData = data.map((row) => {
    const newRow: Record<string, any> = {};
    columns.forEach((col) => {
      newRow[col.label] = row[col.key];
    });
    return newRow;
  });

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(transformedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

  // Auto-scale column widths
  const columnWidths = columns.map((col) => ({
    wch: Math.max(col.label.length, 15),
  }));
  worksheet["!cols"] = columnWidths;

  // Generate file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportMultipleSheets(
  filename: string,
  sheets: Array<{
    name: string;
    data: Record<string, any>[];
    columns: Array<{ key: string; label: string }>;
  }>
) {
  const XLSX = require("xlsx");
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const transformedData = sheet.data.map((row) => {
      const newRow: Record<string, any> = {};
      sheet.columns.forEach((col) => {
        newRow[col.label] = row[col.key];
      });
      return newRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(transformedData);
    const columnWidths = sheet.columns.map((col) => ({
      wch: Math.max(col.label.length, 15),
    }));
    worksheet["!cols"] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
