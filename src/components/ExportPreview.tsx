import { useState, useMemo } from 'react';
import { X, Download, FileSpreadsheet, FileText, ChevronDown, ChevronRight, Filter, AlertTriangle, Clock } from 'lucide-react';
import { useReviewStore } from '@/store/reviewStore';
import { useIssueStore } from '@/store/issueStore';
import { useProjectStore } from '@/store/projectStore';
import { exportToExcel, exportToPDF, getExportFileName } from '@/utils/export';
import { DISCIPLINE_LIST, STATUS_LIST } from '@/types';
import { isOverdue } from '@/utils/date';

interface ExportPreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExportFilters {
  projectId: string | 'all';
  buildingId: string | 'all';
  floorId: string | 'all';
  discipline: string | 'all';
  status: string | 'all';
}

export default function ExportPreview({ isOpen, onClose }: ExportPreviewProps) {
  const { getGroupedForExport, reviews } = useReviewStore();
  const { issues } = useIssueStore();
  const { projects, buildings, floors } = useProjectStore();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ExportFilters>({
    projectId: 'all',
    buildingId: 'all',
    floorId: 'all',
    discipline: 'all',
    status: 'all',
  });

  const availableBuildings = useMemo(() => {
    if (filters.projectId !== 'all') {
      return buildings.filter((b) => b.projectId === filters.projectId);
    }
    return buildings;
  }, [buildings, filters.projectId]);

  const availableFloors = useMemo(() => {
    if (filters.buildingId !== 'all') {
      return floors.filter((f) => f.buildingId === filters.buildingId);
    }
    if (filters.projectId !== 'all') {
      const buildingIds = availableBuildings.map((b) => b.id);
      return floors.filter((f) => buildingIds.includes(f.buildingId));
    }
    return floors;
  }, [floors, filters.buildingId, filters.projectId, availableBuildings]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (filters.discipline !== 'all' && issue.discipline !== filters.discipline) return false;
      if (filters.status !== 'all' && issue.status !== filters.status) return false;

      if (filters.projectId !== 'all') {
        const floor = floors.find((f) => f.id === issue.floorId);
        if (floor) {
          const building = buildings.find((b) => b.id === floor.buildingId);
          if (building?.projectId !== filters.projectId) return false;
        } else {
          return false;
        }
      }

      if (filters.buildingId !== 'all') {
        const floor = floors.find((f) => f.id === issue.floorId);
        if (floor?.buildingId !== filters.buildingId) return false;
      }

      if (filters.floorId !== 'all' && issue.floorId !== filters.floorId) return false;

      return true;
    });
  }, [issues, filters, floors, buildings]);

  const stats = useMemo(() => {
    const unconfirmedCount = reviews.filter(
      (r) => !r.confirmed && filteredIssues.some((i) => i.id === r.issueId)
    ).length;
    
    const overdueCount = filteredIssues.filter(
      (i) => i.status !== 'completed' && isOverdue(i.deadline)
    ).length;

    const statusCounts: Record<string, number> = {};
    STATUS_LIST.forEach((s) => {
      statusCounts[s.key] = filteredIssues.filter((i) => i.status === s.key).length;
    });

    return {
      total: filteredIssues.length,
      unconfirmed: unconfirmedCount,
      overdue: overdueCount,
      statusCounts,
    };
  }, [filteredIssues, reviews]);

  const groups = getGroupedForExport(filteredIssues, floors);

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

  const handleExport = async () => {
    const fileName = getExportFileName(filters.projectId !== 'all' ? projects.find((p) => p.id === filters.projectId)?.name : undefined);
    if (exportFormat === 'excel') {
      exportToExcel(groups, fileName, filters, stats);
    } else {
      await exportToPDF(groups, fileName, filters, stats);
    }
    onClose();
  };

  const resetFilters = () => {
    setFilters({
      projectId: 'all',
      buildingId: 'all',
      floorId: 'all',
      discipline: 'all',
      status: 'all',
    });
  };

  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
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

        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <FileText className="w-4 h-4" />
                总记录数
              </div>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 text-orange-600 text-sm mb-1">
                <AlertTriangle className="w-4 h-4" />
                未确认
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats.unconfirmed}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
                <Clock className="w-4 h-4" />
                已逾期
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
                状态分布
              </div>
              <div className="flex gap-2 flex-wrap">
                {STATUS_LIST.map((s) => (
                  <span key={s.key} className="text-xs">
                    <span className="font-medium">{s.name}:</span> {stats.statusCounts[s.key] || 0}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
                showFilters
                  ? 'bg-primary-100 border-primary-300 text-primary-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              筛选条件
              {(filters.projectId !== 'all' || filters.discipline !== 'all' || filters.status !== 'all' || filters.floorId !== 'all' || filters.buildingId !== 'all') && (
                <span className="w-5 h-5 bg-primary-600 text-white rounded-full text-xs flex items-center justify-center">
                  {Object.values(filters).filter((v) => v !== 'all').length}
                </span>
              )}
            </button>
            {(filters.projectId !== 'all' || filters.discipline !== 'all' || filters.status !== 'all' || filters.floorId !== 'all' || filters.buildingId !== 'all') && (
              <button
                onClick={resetFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                重置筛选
              </button>
            )}
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

        {showFilters && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 space-y-4">
            <div className="grid grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">项目</label>
                <select
                  value={filters.projectId}
                  onChange={(e) => setFilters({ ...filters, projectId: e.target.value, buildingId: 'all', floorId: 'all' })}
                  className="input-field text-sm py-1.5"
                >
                  <option value="all">全部项目</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">楼栋</label>
                <select
                  value={filters.buildingId}
                  onChange={(e) => setFilters({ ...filters, buildingId: e.target.value, floorId: 'all' })}
                  className="input-field text-sm py-1.5"
                >
                  <option value="all">全部楼栋</option>
                  {availableBuildings.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">楼层</label>
                <select
                  value={filters.floorId}
                  onChange={(e) => setFilters({ ...filters, floorId: e.target.value })}
                  className="input-field text-sm py-1.5"
                >
                  <option value="all">全部楼层</option>
                  {availableFloors.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">专业</label>
                <select
                  value={filters.discipline}
                  onChange={(e) => setFilters({ ...filters, discipline: e.target.value })}
                  className="input-field text-sm py-1.5"
                >
                  <option value="all">全部专业</option>
                  {DISCIPLINE_LIST.map((d) => (
                    <option key={d.key} value={d.key}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">状态</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="input-field text-sm py-1.5"
                >
                  <option value="all">全部状态</option>
                  {STATUS_LIST.map((s) => (
                    <option key={s.key} value={s.key}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="space-y-4">
            {groups.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">暂无可导出的会审记录</p>
                <p className="text-sm mt-2">请先完成问题会审或调整筛选条件</p>
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
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                整改期限
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
                            {group.items.map((item, itemIndex) => {
                              const isItemOverdue = item.status !== '已完成' && item.deadline && isOverdue(item.deadline);
                              return (
                                <tr key={itemIndex} className={`hover:bg-gray-50 ${isItemOverdue ? 'bg-red-50/50' : ''}`}>
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
                                  <td className={`px-4 py-2 ${isItemOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                    {item.deadline}
                                    {isItemOverdue && (
                                      <span className="ml-1 text-xs">(已逾期)</span>
                                    )}
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
                              );
                            })}
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

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-500">
            {stats.unconfirmed > 0 && (
              <span className="text-orange-600 mr-4">⚠️ {stats.unconfirmed} 条记录未确认</span>
            )}
            {stats.overdue > 0 && (
              <span className="text-red-600">⏰ {stats.overdue} 条记录已逾期</span>
            )}
          </div>
          <div className="flex items-center gap-3">
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
    </div>
  );
}
