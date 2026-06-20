import { Plus, Search, Filter, X, BarChart3 } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import IssueCard from '@/components/IssueCard';
import IssueForm from '@/components/IssueForm';
import { useIssueStore } from '@/store/issueStore';
import { useProjectStore } from '@/store/projectStore';
import {
  DISCIPLINE_LIST,
  STATUS_LIST,
  PRIORITY_LIST,
  Discipline,
  IssueStatus,
  Priority,
} from '@/types';
import { getDisciplineColor } from '@/utils/disciplineColors';

export default function IssuesPage() {
  const {
    filters,
    setFilters,
    resetFilters,
    isFormOpen,
    openForm,
    closeForm,
    getFilteredIssues,
    getIssueStats,
  } = useIssueStore();
  const { floors, buildings, projects, selectedProjectId, selectedBuildingId, selectedFloorId } = useProjectStore();

  const filteredIssues = getFilteredIssues();
  const stats = getIssueStats();

  const availableFloors = selectedBuildingId
    ? floors.filter((f) => f.buildingId === selectedBuildingId)
    : selectedProjectId
    ? floors.filter((f) => {
        const buildingIds = buildings
          .filter((b) => b.projectId === selectedProjectId)
          .map((b) => b.id);
        return buildingIds.includes(f.buildingId);
      })
    : floors;

  const hasActiveFilters =
    filters.discipline !== 'all' ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.floorId !== 'all' ||
    filters.keyword !== '';

  return (
    <PageLayout
      title="碰撞问题清单"
      subtitle={`共 ${stats.total} 个问题 · 待会审 ${stats.pending} 个`}
      headerRight={
        <button
          onClick={() => openForm()}
          className="btn-accent text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建问题
        </button>
      }
    >
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">全部问题</span>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="card rounded-lg p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">待会审</span>
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="card rounded-lg p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">已会审</span>
            <div className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.reviewed}</p>
        </div>
        <div className="card rounded-lg p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">整改中</span>
            <div className="w-2 h-2 rounded-full bg-orange-500" />
          </div>
          <p className="text-3xl font-bold text-orange-600">{stats.fixing}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-700">
            <Filter className="w-4 h-4" />
            <span className="font-medium">筛选条件</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-sm text-gray-500 hover:text-primary-600 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              清除筛选
            </button>
          )}
        </div>
        <div className="p-4 grid grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              专业
            </label>
            <select
              value={filters.discipline}
              onChange={(e) =>
                setFilters({ discipline: e.target.value as Discipline | 'all' })
              }
              className="input-field text-sm"
            >
              <option value="all">全部专业</option>
              {DISCIPLINE_LIST.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              状态
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ status: e.target.value as IssueStatus | 'all' })
              }
              className="input-field text-sm"
            >
              <option value="all">全部状态</option>
              {STATUS_LIST.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              优先级
            </label>
            <select
              value={filters.priority}
              onChange={(e) =>
                setFilters({ priority: e.target.value as Priority | 'all' })
              }
              className="input-field text-sm"
            >
              <option value="all">全部优先级</option>
              {PRIORITY_LIST.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              楼层
            </label>
            <select
              value={filters.floorId}
              onChange={(e) => setFilters({ floorId: e.target.value })}
              className="input-field text-sm"
            >
              <option value="all">全部楼层</option>
              {availableFloors.map((f) => {
                const building = buildings.find((b) => b.id === f.buildingId);
                const project = projects.find((p) => p.id === building?.projectId);
                return (
                  <option key={f.id} value={f.id}>
                    {project?.name}/{building?.name}/{f.name}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              搜索
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => setFilters({ keyword: e.target.value })}
                placeholder="关键词搜索"
                className="input-field text-sm pl-9"
              />
            </div>
          </div>
        </div>

        {filters.discipline !== 'all' && (
          <div className="px-4 pb-4">
            <div className="p-3 bg-gray-50 rounded flex items-center gap-2 text-sm">
              <span className="text-gray-500">专业图例：</span>
              {DISCIPLINE_LIST.map((d) => (
                <div
                  key={d.key}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${
                    filters.discipline === d.key ? 'bg-white shadow-sm' : 'opacity-50'
                  }`}
                >
                  <div
                    className="w-2.5 h-2.5 rounded"
                    style={{ backgroundColor: getDisciplineColor(d.key) }}
                  />
                  <span className="text-xs text-gray-600">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          显示 <span className="font-medium">{filteredIssues.length}</span> 条记录
        </p>
      </div>

      {filteredIssues.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">暂无符合条件的问题</h3>
          <p className="text-sm text-gray-500 mb-4">
            尝试调整筛选条件，或创建新的碰撞问题
          </p>
          <button
            onClick={() => openForm()}
            className="btn-accent text-sm"
          >
            创建问题
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} showReview />
          ))}
        </div>
      )}

      <IssueForm isOpen={isFormOpen} onClose={closeForm} />
    </PageLayout>
  );
}
