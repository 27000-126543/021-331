import { useState } from 'react';
import { AlertTriangle, CheckSquare, Square, Plus, List, ChevronDown, ChevronUp } from 'lucide-react';
import { CollisionPoint } from '@/types';
import { getCollisionTypeLabel, getCollisionTypeColor } from '@/utils/collision';
import { getDisciplineName, getDisciplineColor } from '@/utils/disciplineColors';

interface CollisionListPanelProps {
  collisions: CollisionPoint[];
  selectedCollisionId: string | null;
  onSelectCollision: (id: string) => void;
  onBatchCreateIssues: (elementIds: string[]) => void;
}

export default function CollisionListPanel({
  collisions,
  selectedCollisionId,
  onSelectCollision,
  onBatchCreateIssues,
}: CollisionListPanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(collisions.map((c) => c.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleBatchCreate = () => {
    const allElementIds = collisions
      .filter((c) => selectedIds.has(c.id))
      .flatMap((c) => c.elementIds);
    const uniqueIds = [...new Set(allElementIds)];
    if (uniqueIds.length > 0) {
      onBatchCreateIssues(uniqueIds);
    }
  };

  const allSelected = collisions.length > 0 && selectedIds.size === collisions.length;

  if (collisions.length === 0) return null;

  return (
    <div className="absolute bottom-4 right-4 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-30 flex flex-col max-h-[60vh]">
      <div
        className="px-4 py-3 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="font-semibold text-gray-800 text-sm">碰撞识别结果</span>
          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            {collisions.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <span className="text-xs text-primary-600 font-medium">
              已选 {selectedIds.size} 项
            </span>
          )}
          {isCollapsed ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50 flex-shrink-0">
            <button
              onClick={allSelected ? deselectAll : selectAll}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="w-3.5 h-3.5 text-primary-600" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              {allSelected ? '取消全选' : '全选'}
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={handleBatchCreate}
                className="flex items-center gap-1.5 text-xs bg-accent-500 text-white px-3 py-1.5 rounded hover:bg-accent-600 transition-colors"
              >
                <Plus className="w-3 h-3" />
                批量生成问题卡 ({selectedIds.size})
              </button>
            )}
          </div>

          <div className="overflow-y-auto scrollbar-thin flex-1">
            {collisions.map((collision, index) => {
              const isSelected = selectedCollisionId === collision.id;
              const isChecked = selectedIds.has(collision.id);
              const typeColor = getCollisionTypeColor(collision.collisionType);
              const typeLabel = getCollisionTypeLabel(collision.collisionType);

              return (
                <div
                  key={collision.id}
                  className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-accent-50 border-l-2 border-l-accent-500'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onSelectCollision(collision.id)}
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(collision.id);
                      }}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-primary-600" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">
                          #{index + 1}
                        </span>
                        <span
                          className="inline-block px-1.5 py-0.5 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: typeColor }}
                        >
                          {typeLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 flex-wrap">
                        {collision.elements.map((elem, elemIdx) => (
                          <span key={elem.id} className="flex items-center gap-1">
                            {elemIdx > 0 && (
                              <span className="text-gray-300 text-xs">×</span>
                            )}
                            <span
                              className="inline-block w-2 h-2 rounded"
                              style={{ backgroundColor: getDisciplineColor(elem.discipline) }}
                            />
                            <span className="text-xs text-gray-700">
                              {getDisciplineName(elem.discipline)}
                            </span>
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {collision.conflictReason}
                      </p>

                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>标高: {collision.minElevation.toFixed(1)}-{collision.maxElevation.toFixed(1)}m</span>
                        <span>净空: {collision.clearance.toFixed(2)}m</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
