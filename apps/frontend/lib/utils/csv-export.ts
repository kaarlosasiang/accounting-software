/**
 * Lightweight CSV export utility — no external dependency required.
 */

type Row = Record<string, string | number | boolean | null | undefined>;

function escapeCsvCell(
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Wrap in quotes if contains comma, newline, or double-quote
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsvString(rows: Row[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const headerLine = headers.map(escapeCsvCell).join(",");
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCsvCell(row[h])).join(","),
  );
  return [headerLine, ...dataLines].join("\n");
}

export function downloadCsv(filename: string, rows: Row[]): void {
  const csv = toCsvString(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
