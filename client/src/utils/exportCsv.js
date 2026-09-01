/** Download an array of objects as a CSV file via Blob. */
export function exportToCsv(filename, rows, columns) {
  if (!rows?.length) {
    throw new Error("No rows to export");
  }

  const cols =
    columns ||
    Object.keys(rows[0]).map((key) => ({ key, label: key }));

  const escape = (value) => {
    const str = value == null ? "" : String(value);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = cols.map((c) => escape(c.label)).join(",");
  const body = rows
    .map((row) => cols.map((c) => escape(typeof c.value === "function" ? c.value(row) : row[c.key])).join(","))
    .join("\n");

  const blob = new Blob([`${header}\n${body}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
