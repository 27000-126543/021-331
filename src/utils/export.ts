import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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

export interface ExportFilters {
  projectId: string | 'all';
  buildingId: string | 'all';
  floorId: string | 'all';
  discipline: string | 'all';
  status: string | 'all';
}

export interface ExportStats {
  total: number;
  unconfirmed: number;
  overdue: number;
  statusCounts: Record<string, number>;
}

function getFilterDescription(filters: ExportFilters): string {
  const parts: string[] = [];
  if (filters.discipline !== 'all') {
    const discipline = DISCIPLINE_LIST.find((d) => d.key === filters.discipline);
    if (discipline) parts.push(`专业: ${discipline.name}`);
  }
  if (filters.status !== 'all') {
    const status = STATUS_LIST.find((s) => s.key === filters.status);
    if (status) parts.push(`状态: ${status.name}`);
  }
  return parts.length > 0 ? `筛选条件: ${parts.join(' · ')}` : '筛选条件: 全部';
}

export function exportToExcel(
  groups: ExportGroup[],
  fileName: string,
  filters?: ExportFilters,
  stats?: ExportStats
) {
  const wb = XLSX.utils.book_new();

  const allData: Record<string, unknown>[] = [];
  let rowIndex = 1;

  if (stats) {
    allData.push({
      '楼层': '统计概览',
      '专业': '',
      '问题标题': `总记录数: ${stats.total}`,
      '影响区域': `未确认: ${stats.unconfirmed}`,
      '处理方式': `已逾期: ${stats.overdue}`,
      '责任单位': '',
      '整改期限': '',
      '状态': '',
      '是否确认': '',
      '_isHeader': true,
      '_rowIndex': rowIndex,
    });
    rowIndex++;

    const statusParts: string[] = [];
    STATUS_LIST.forEach((s) => {
      const count = stats.statusCounts[s.key] || 0;
      if (count > 0) statusParts.push(`${s.name}: ${count}`);
    });
    allData.push({
      '楼层': '',
      '专业': '',
      '问题标题': statusParts.join(' | '),
      '影响区域': filters ? getFilterDescription(filters) : '',
      '处理方式': '',
      '责任单位': '',
      '整改期限': '',
      '状态': '',
      '是否确认': '',
      '_isHeader': true,
      '_rowIndex': rowIndex,
    });
    rowIndex++;

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

export async function exportToPDF(
  groups: ExportGroup[],
  fileName: string,
  filters?: ExportFilters,
  stats?: ExportStats
) {
  const filterDesc = filters ? getFilterDescription(filters) : '';
  const statusParts: string[] = [];
  if (stats) {
    STATUS_LIST.forEach((s) => {
      const count = stats.statusCounts[s.key] || 0;
      if (count > 0) statusParts.push(`${s.name}: ${count}`);
    });
  }

  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0; z-index: -1;
    background: white; padding: 20px;
    font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif;
    width: 1120px;
  `;

  let html = '';

  html += `<div style="text-align:center;font-size:22px;font-weight:bold;margin-bottom:12px;">机电管综调整清单</div>`;

  html += `<div style="display:flex;justify-content:space-between;font-size:11px;color:#555;margin-bottom:10px;">
    <span>生成日期: ${new Date().toLocaleDateString('zh-CN')}</span>
    <span>专业图例: ${DISCIPLINE_LIST.map(d => d.name).join('、')}</span>
  </div>`;

  if (stats) {
    html += `<div style="background:#f5f5f5;padding:8px 12px;border-radius:4px;margin-bottom:10px;font-size:11px;">
      <strong>统计概览</strong> &nbsp;&nbsp;
      总记录: ${stats.total} &nbsp;|&nbsp; 未确认: ${stats.unconfirmed} &nbsp;|&nbsp; 已逾期: ${stats.overdue}`;
    if (statusParts.length > 0) {
      html += `<br/><span style="margin-left:56px;">${statusParts.join(' | ')}</span>`;
    }
    if (filterDesc) {
      html += `<span style="float:right;">${filterDesc}</span>`;
    }
    html += `</div>`;
  }

  html += `<table style="width:100%;border-collapse:collapse;font-size:10px;">`;
  html += `<thead><tr style="background:#c8c8c8;">
    <th style="border:1px solid #999;padding:5px 6px;text-align:left;width:80px;">楼层</th>
    <th style="border:1px solid #999;padding:5px 6px;text-align:left;width:100px;">专业</th>
    <th style="border:1px solid #999;padding:5px 6px;text-align:left;width:280px;">问题描述</th>
    <th style="border:1px solid #999;padding:5px 6px;text-align:left;width:130px;">影响区域</th>
    <th style="border:1px solid #999;padding:5px 6px;text-align:left;width:100px;">处理方式</th>
    <th style="border:1px solid #999;padding:5px 6px;text-align:left;width:90px;">责任单位</th>
    <th style="border:1px solid #999;padding:5px 6px;text-align:left;width:80px;">状态</th>
  </tr></thead><tbody>`;

  for (const group of groups) {
    html += `<tr><td colspan="7" style="background:#1e3a5f;color:white;padding:5px 8px;font-weight:bold;font-size:11px;">
      ${group.floorName} - ${group.disciplineName} (${group.items.length}条)
    </td></tr>`;

    for (const item of group.items) {
      html += `<tr>
        <td style="border:1px solid #ccc;padding:4px 6px;">${group.floorName}</td>
        <td style="border:1px solid #ccc;padding:4px 6px;">${group.disciplineName}</td>
        <td style="border:1px solid #ccc;padding:4px 6px;">${item.issueTitle}</td>
        <td style="border:1px solid #ccc;padding:4px 6px;">${item.affectedArea}</td>
        <td style="border:1px solid #ccc;padding:4px 6px;">${item.handling}</td>
        <td style="border:1px solid #ccc;padding:4px 6px;">${item.responsibleUnit}</td>
        <td style="border:1px solid #ccc;padding:4px 6px;">${item.status}</td>
      </tr>`;
    }

    html += `<tr><td colspan="7" style="height:8px;border:none;"></td></tr>`;
  }

  html += `</tbody></table>`;

  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    doc.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - margin * 2);

    while (heightLeft > 0) {
      doc.addPage();
      position = margin - (imgHeight - heightLeft);
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - margin * 2);
    }

    doc.save(`${fileName}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

export function getExportFileName(projectName?: string): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const prefix = projectName ? `${projectName}_` : '';
  return `${prefix}管综调整清单_${date}`;
}
