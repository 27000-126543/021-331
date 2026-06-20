import { useState } from 'react';
import { X, Download, FileSpreadsheet, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { useReviewStore } from '@/store/reviewStore';
import { useIssueStore } from '@/store/issueStore';
import { useProjectStore } from '@/store/projectStore';
import { exportToExcel, exportToPDF, getExportFileName } from '@/utils/export';
import { getExportFileName as getFileName } from '@/utils/export';

interface ExportPreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportPreview({ isOpen, onClose }: ExportPreviewProps) {
  const { getGroupedForExport } = useReviewStore();
  const { issues } = useIssueStore();
  const { getSelectedProject, floors } = useProjectStore();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');

  const project = getSelectedProject();
  const groups = getGroupedForExport(issues, floors);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const handleExport = () => {
    const fileName = getFileName(project?.name);
    if (exportFormat === 'excel') {
      exportToExcel(groups, fileName);
    } else {
      exportToPDF(groups, fileName);
    }
    onClose();
  };

  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-primary-600 text-white">
          <div>
            <h3 className="text-lg font-semibold">导出管综调整清单</h3>
            <p className="text-sm text-primary-100">
              共 {groups.length} 组，{totalItems} 条记录
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">导出格式：</span>
            <div className="flex bg-white border border-gray-200 rounded overflow-hidden">
              <button
                onClick={() => setExportFormat('excel')}
                className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                  exportFormat === 'excel'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={() => setExportFormat('pdf')}
                className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                  exportFormat === 'pdf'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="space-y-4">
            {groups.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">暂无可导出的会审记录</p>
                <p className="text-sm mt-2">请先完成问题会审</p>
              </div>
            ) : (
              groups.map((group, index) => {
                const groupKey = `${group.floorName}-${group.disciplineName}`;
                const isExpanded = expandedGroups.has(groupKey);

                return (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleGroup(groupKey)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary-600" />
                        <span className="font-medium text-gray-800">
                          {group.floorName} - {group.disciplineName}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({group.items.length} 条)
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-200">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                问题标题
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                影响区域
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                处理方式
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                责任单位
                              </th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">
                                状态
                              </th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">
                                确认
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {group.items.map((item, itemIndex) => (
                              <tr key={itemIndex} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-gray-800 max-w-xs truncate">
                                  {item.issueTitle}
                                </td>
                                <td className="px-4 py-2 text-gray-600">
                                  {item.affectedArea}
                                </td>
                                <td className="px-4 py-2 text-gray-600">
                                  {item.handling}
                                </td>
                                <td className="px-4 py-2 text-gray-600">
                                  {item.responsibleUnit}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-xs ${
                                      item.status === '已完成'
                                        ? 'bg-green-100 text-green-800'
                                        : item.status === '整改中'
                                        ? 'bg-orange-100 text-orange-800'
                                        : item.status === '已会审'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-center">
                                  {item.confirmed ? (
                                    <span className="text-green-600">是</span>
                                  ) : (
                                    <span className="text-gray-400">否</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-sm"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={groups.length === 0}
            className={`text-sm flex items-center gap-2 ${
              groups.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-2 border-gray-300 px-4 py-2'
                : exportFormat === 'excel'
                ? 'bg-green-600 text-white px-4 py-2 border-2 border-green-700 hover:bg-green-700 hover:shadow-md transition-all duration-200'
                : 'bg-red-600 text-white px-4 py-2 border-2 border-red-700 hover:bg-red-700 hover:shadow-md transition-all duration-200'
            }`}
          >
            <Download className="w-4 h-4" />
            导出 {exportFormat === 'excel' ? 'Excel' : 'PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
