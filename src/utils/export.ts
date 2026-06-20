import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { DISCIPLINE_LIST, HANDLING_LIST, STATUS_LIST } from '@/types';

export interface ExportIssueItem {
  issueTitle: string;
  affectedArea: string;
  handling: string;
  responsibleUnit: string;
  deadline: string;
  status: string;
  confirmed: boolean;
}

export interface ExportGroup {
  floorName: string;
  disciplineName: string;
  items: ExportIssueItem[];
}

export function exportToExcel(groups: ExportGroup[], fileName: string) {
  const wb = XLSX.utils.book_new();

  const allData: Record<string, unknown>[] = [];
  let rowIndex = 1;

  for (const group of groups) {
    allData.push({
      '楼层': group.floorName,
      '专业': group.disciplineName,
      '问题标题': '',
      '影响区域': '',
      '处理方式': '',
      '责任单位': '',
      '整改期限': '',
      '状态': '',
      '是否确认': '',
      '_isHeader': true,
      '_rowIndex': rowIndex,
    });
    rowIndex++;

    for (let i = 0; i < group.items.length; i++) {
      const item = group.items[i];
      allData.push({
        '楼层': '',
        '专业': '',
        '问题标题': item.issueTitle,
        '影响区域': item.affectedArea,
        '处理方式': item.handling,
        '责任单位': item.responsibleUnit,
        '整改期限': item.deadline,
        '状态': item.status,
        '是否确认': item.confirmed ? '是' : '否',
        '_isHeader': false,
        '_rowIndex': rowIndex,
      });
      rowIndex++;
    }

    allData.push({
      '楼层': '',
      '专业': '',
      '问题标题': '',
      '影响区域': '',
      '处理方式': '',
      '责任单位': '',
      '整改期限': '',
      '状态': '',
      '是否确认': '',
      '_isSpacer': true,
      '_rowIndex': rowIndex,
    });
    rowIndex++;
  }

  const cleanData = allData.map(({ _isHeader, _isSpacer, _rowIndex, ...rest }) => rest);
  const ws = XLSX.utils.json_to_sheet(cleanData);

  ws['!cols'] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 40 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, '管综调整清单');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

export function exportToPDF(groups: ExportGroup[], fileName: string) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('机电管综调整清单', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`生成日期: ${new Date().toLocaleDateString('zh-CN')}`, margin, y);
  doc.text(`专业图例: ${DISCIPLINE_LIST.map(d => d.name).join('、')}`, pageWidth - margin, y, { align: 'right' });
  y += 8;

  const colWidths = [30, 40, 80, 35, 30, 25, 25];
  const headers = ['楼层', '专业', '问题描述', '影响区域', '处理方式', '责任单位', '状态'];

  for (const group of groups) {
    if (y > pageHeight - margin * 3) {
      doc.addPage();
      y = margin;
    }

    doc.setFillColor(30, 58, 95);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
    doc.text(`${group.floorName} - ${group.disciplineName}`, margin + 3, y + 5.5);
    y += 10;

    doc.setFillColor(200, 200, 200);
    doc.setTextColor(0, 0, 0);
    let x = margin;
    for (let i = 0; i < headers.length; i++) {
      doc.rect(x, y, colWidths[i], 7, 'F');
      doc.text(headers[i], x + 2, y + 5);
      x += colWidths[i];
    }
    y += 7;

    doc.setFont('helvetica', 'normal');
    for (const item of group.items) {
      if (y > pageHeight - margin * 2) {
        doc.addPage();
        y = margin;
        x = margin;
        doc.setFillColor(200, 200, 200);
        for (let i = 0; i < headers.length; i++) {
          doc.rect(x, y, colWidths[i], 7, 'F');
          doc.text(headers[i], x + 2, y + 5);
          x += colWidths[i];
        }
        y += 7;
      }

      x = margin;
      doc.rect(x, y, colWidths[0], 6);
      doc.text(group.floorName, x + 2, y + 4.5);
      x += colWidths[0];

      doc.rect(x, y, colWidths[1], 6);
      doc.text(group.disciplineName, x + 2, y + 4.5);
      x += colWidths[1];

      doc.rect(x, y, colWidths[2], 6);
      const title = doc.splitTextToSize(item.issueTitle, colWidths[2] - 4);
      doc.text(title[0] || item.issueTitle, x + 2, y + 4.5);
      x += colWidths[2];

      doc.rect(x, y, colWidths[3], 6);
      doc.text(item.affectedArea.substring(0, 10), x + 2, y + 4.5);
      x += colWidths[3];

      doc.rect(x, y, colWidths[4], 6);
      doc.text(item.handling.substring(0, 8), x + 2, y + 4.5);
      x += colWidths[4];

      doc.rect(x, y, colWidths[5], 6);
      doc.text(item.responsibleUnit.substring(0, 8), x + 2, y + 4.5);
      x += colWidths[5];

      doc.rect(x, y, colWidths[6], 6);
      doc.text(item.status, x + 2, y + 4.5);

      y += 6;
    }

    y += 4;
  }

  doc.save(`${fileName}.pdf`);
}

export function getExportFileName(projectName?: string): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const prefix = projectName ? `${projectName}_` : '';
  return `${prefix}管综调整清单_${date}`;
}
