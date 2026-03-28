/**
 * Excel Export Utility
 * Exports table data to XLSX format using SheetJS (xlsx library)
 * Handles relational data flattening for user-friendly exports
 */

export interface ExportColumnDef {
  key: string;
  label: string;
  // For relational fields, specify how to flatten them
  relationshipType?: "simple" | "anggota" | "jabatan" | "user" | "roles";
}

/**
 * Flatten relational data based on entity type
 */
function flattenRelationshipValue(
  value: any,
  relationshipType?: string
): string | null {
  if (!value) return null;

  // For Anggota export: extract NIM from anggota object
  if (relationshipType === "anggota" && typeof value === "object") {
    return value.nim || null;
  }

  // For Jabatan export: extract namaJabatan (ignore kategori)
  if (relationshipType === "jabatan" && typeof value === "object") {
    return value.namaJabatan || null;
  }

  // For User export: extract username
  if (relationshipType === "user" && typeof value === "object") {
    return value.username || null;
  }

  // For Roles export: convert array of objects to comma-separated string
  if (relationshipType === "roles" && Array.isArray(value)) {
    return value.map((role: any) => role.name || role).join(", ") || null;
  }

  // For simple types, convert to string
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  // For objects without special handling, return null
  if (typeof value === "object") {
    return null;
  }

  return null;
}

export function exportToExcel(
  filename: string,
  data: Record<string, any>[],
  columns: Array<ExportColumnDef>
) {
  // Dynamically import xlsx to avoid SSR issues
  const XLSX = require("xlsx");

  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Transform data to match column labels and flatten relationships
  const transformedData = data.map((row) => {
    const newRow: Record<string, any> = {};
    columns.forEach((col) => {
      const value = row[col.key];

      // Flatten relational data based on type
      if (col.relationshipType) {
        newRow[col.label] = flattenRelationshipValue(value, col.relationshipType);
      } else {
        newRow[col.label] = value;
      }
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
