/**
 * Excel Import Utility
 * Parses XLSX/CSV files and validates data structure
 */

export interface ImportResult<T = Record<string, any>> {
  success: boolean;
  data?: T[];
  errors: string[];
  warnings: string[];
}

export async function parseExcelFile(
  file: File,
  mapping: Record<string, string>
): Promise<ImportResult> {
  const XLSX = require("xlsx");

  if (!file) {
    return {
      success: false,
      errors: ["No file provided"],
      warnings: [],
    };
  }

  // Validate file type
  const validTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
  ];

  if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|csv)$/i)) {
    return {
      success: false,
      errors: ["Invalid file type. Please upload an XLSX or CSV file."],
      warnings: [],
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    if (workbook.SheetNames.length === 0) {
      return {
        success: false,
        errors: ["No sheets found in file"],
        warnings: [],
      };
    }

    // Read first sheet
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);

    if (rawData.length === 0) {
      return {
        success: false,
        errors: ["No data rows found in file"],
        warnings: [],
      };
    }

    // Map data to expected format
    const mappedData: Record<string, any>[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    rawData.forEach((row, index) => {
      const mappedRow: Record<string, any> = {};
      let hasData = false;

      Object.entries(mapping).forEach(([sourceCol, targetKey]) => {
        const value = row[sourceCol];
        if (value !== undefined && value !== null && value !== "") {
          mappedRow[targetKey] = value;
          hasData = true;
        }
      });

      if (hasData) {
        mappedData.push(mappedRow);
      } else {
        warnings.push(`Row ${index + 2}: Skipped (no data)`);
      }
    });

    if (mappedData.length === 0) {
      return {
        success: false,
        errors: ["No valid data rows found after mapping"],
        warnings,
      };
    }

    return {
      success: true,
      data: mappedData,
      errors,
      warnings,
    };
  } catch (err) {
    return {
      success: false,
      errors: [
        `Failed to parse file: ${err instanceof Error ? err.message : "Unknown error"}`,
      ],
      warnings: [],
    };
  }
}

/**
 * Parse CSV content directly (for text files)
 */
export function parseCSVContent(
  content: string,
  delimiter: string = ","
): Record<string, any>[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(delimiter).map((h) => h.trim());
  const data: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map((v) => v.trim());
    const row: Record<string, any> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    data.push(row);
  }

  return data;
}
