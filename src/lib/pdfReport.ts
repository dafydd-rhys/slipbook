// Renders a simple text/line table with jsPDF's core API — no autotable
// plugin, keeps the dependency footprint to just jsPDF for a "basic" export.
// Used by the Reports admin tab for the tax report and date-range ledger.
import type { jsPDF } from 'jspdf';

// Draws the title + subtitle at the top of the page, returning the y position to continue from.
function drawTitleBlock(doc: jsPDF, marginX: number, title: string, subtitle: string): number {
  let y = 50;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, marginX, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(subtitle, marginX, y);
  doc.setTextColor(0);

  return y + 24;
}

// Draws the column headers plus a rule underneath, returning the y position
// for the first data row. Called again on every new page.
function drawTableHeader(doc: jsPDF, marginX: number, y: number, columns: string[], colWidths: number[]): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);

  let x = marginX;
  columns.forEach((column, i) => {
    doc.text(column, x, y);
    x += colWidths[i];
  });

  y += 6;
  doc.setDrawColor(200);
  doc.line(marginX, y, marginX + colWidths.reduce((sum, width) => sum + width, 0), y);
  doc.setFont('helvetica', 'normal');

  return y + 12;
}

// Builds and downloads a simple PDF table — title, subtitle, header row, one
// row per entry in `rows` (paginating automatically), and a footer.
export async function exportReportPdf(
  title: string, subtitle: string, footer: string, columns: string[], colWidths: number[], rows: string[][],
) {
  const { jsPDF: JsPdfCtor } = await import('jspdf');
  const doc = new JsPdfCtor({ unit: 'pt', format: 'a4' });
  const marginX = 40;
  const rowHeight = 16;
  const pageHeight = doc.internal.pageSize.getHeight();

  let y = drawTitleBlock(doc, marginX, title, subtitle);
  y = drawTableHeader(doc, marginX, y, columns, colWidths);

  for (const row of rows) {
    if (y > pageHeight - 50) {
      doc.addPage();
      y = drawTableHeader(doc, marginX, 50, columns, colWidths);
    }

    let x = marginX;
    doc.setFontSize(8.5);
    row.forEach((cell, i) => {
      doc.text(cell, x, y, { maxWidth: colWidths[i] - 4 });
      x += colWidths[i];
    });
    y += rowHeight;
  }

  doc.setFontSize(7.5);
  doc.setTextColor(150);
  doc.text(footer, marginX, pageHeight - 24);

  doc.save(`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
}
