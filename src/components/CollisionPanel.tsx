import { AlertTriangle, X, Plus, ArrowRight } from 'lucide-react';
import { CollisionPoint } from '@/types';
import { getDisciplineName, getDisciplineColor } from '@/utils/disciplineColors';
import { getCollisionTypeLabel, getCollisionTypeColor } from '@/utils/collision';

interface CollisionPanelProps {
  collision: CollisionPoint;
  onClose: () => void;
  onCreateIssue: (elementIds: string[]) => void;
}

export default function CollisionPanel({ collision, onClose, onCreateIssue }: CollisionPanelProps) {
  const collisionTypeLabel = getCollisionTypeLabel(collision.collisionType);
  const collisionTypeColor = getCollisionTypeColor(collision.collisionType);

  const handleCreateIssue = () => {
    onCreateIssue(collision.elementIds);
  };

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 w-96 z-30">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${collisionTypeColor}20` }}>
            <AlertTriangle className="w-4 h-4" style={{ color: collisionTypeColor }} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">碰撞检测</h4>
            <span
              className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
              style={{ backgroundColor: collisionTypeColor }}
            >
              {collisionTypeLabel}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{collision.conflictReason}</p>
        </div>

        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">涉及构件</h5>
          <div className="space-y-3">
            {collision.elements.map((elem, index) => (
              <div key={elem.id} className="bg-gray-50 rounded-lg p-3">
                {index < collision.elements.length - 1 && (
                  <div className="flex justify-center mb-2">
                    <ArrowRight className="w-4 h-4 text-gray-400 rotate-90" />
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div
                    className="w-3 h-3 rounded mt-1 flex-shrink-0"
                    style={{ backgroundColor: getDisciplineColor(elem.discipline) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">
                        {getDisciplineName(elem.discipline)}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                        {elem.size}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{elem.system}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>底标高: <span className="font-medium text-gray-700">{elem.bottomElevation}m</span></span>
                      <span>顶标高: <span className="font-medium text-gray-700">{elem.topElevation}m</span></span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">重叠标高</p>
            <p className="font-semibold text-gray-800">
              {collision.minElevation.toFixed(2)}m - {collision.maxElevation.toFixed(2)}m
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">净空</p>
            <p className="font-semibold text-gray-800">
              {collision.clearance.toFixed(2)}m
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <button
            onClick={handleCreateIssue}
            className="w-full btn-accent text-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            基于此碰撞创建问题
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            将自动关联涉及的 {collision.elements.length} 个构件
          </p>
        </div>
      </div>
    </div>
  );
}
