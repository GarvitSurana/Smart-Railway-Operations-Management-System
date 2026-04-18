// Part 1: Helper functions and document structure
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, HeadingLevel, TableOfContents } = require('docx');
const fs = require('fs');
const path = require('path');

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, spacing: { before: 300, after: 150 }, children: [new TextRun({ text, bold: true })] });
}
function subheading(text) { return heading(text, HeadingLevel.HEADING_2); }
function subsubheading(text) { return heading(text, HeadingLevel.HEADING_3); }
function para(text) {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, size: 24 })] });
}
function bold(text) {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, bold: true, size: 24 })] });
}
function bullet(text) {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text, size: 24 })] });
}
function italicPara(text) {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, italics: true, size: 24 })] });
}
function placeholder(text) {
  return new Paragraph({ spacing: { before: 200, after: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: `[ ${text} ]`, italics: true, color: 'FF0000', size: 24 })]
  });
}

function makeTable(headers, rows) {
  const borderStyle = { style: BorderStyle.SINGLE, size: 1, color: '000000' };
  const borders = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
  const headerRow = new TableRow({
    children: headers.map(h => new TableCell({
      borders, width: { size: Math.floor(9000/headers.length), type: WidthType.DXA },
      shading: { fill: '2C3E50' },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 20 })] })]
    }))
  });
  const dataRows = rows.map(row => new TableRow({
    children: row.map(cell => new TableCell({
      borders, width: { size: Math.floor(9000/headers.length), type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 20 })] })]
    }))
  }));
  return new Table({ width: { size: 9000, type: WidthType.DXA }, rows: [headerRow, ...dataRows] });
}

module.exports = { heading, subheading, subsubheading, para, bold, bullet, italicPara, placeholder, makeTable };
