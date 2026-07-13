import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function exportToCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) throw new Error('Sem dados para exportar');

  const headers = Object.keys(rows[0]!);
  const lines = [headers.join(';')];

  for (const row of rows) {
    lines.push(headers.map((header) => String(row[header] ?? '')).join(';'));
  }

  downloadBlob(`${filename}.csv`, new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' }));
}

export function exportToExcel(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) throw new Error('Sem dados para exportar');

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dados');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPdf(title: string, filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) throw new Error('Sem dados para exportar');

  const headers = Object.keys(rows[0]!);
  const body = rows.map((row) => headers.map((header) => String(row[header] ?? '')));

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text(title, 40, 40);

  autoTable(doc, {
    head: [headers],
    body,
    startY: 60,
    styles: {
      fontSize: 8
    }
  });

  doc.save(`${filename}.pdf`);
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
