import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useIssueStore } from '@/store/issueStore';
import { useProjectStore } from '@/store/projectStore';
import {
  DISCIPLINE_LIST,
  PRIORITY_LIST,
  Discipline,
  Priority,
} from '@/types';
import { addDays, formatDate } from '@/utils/date';
import { getDisciplineName } from '@/utils/disciplineColors';

interface IssueFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IssueForm({ isOpen, onClose }: IssueFormProps) {
  const { addIssue, preselectedElementIds } = useIssueStore();
  const { getSelectedFloor, elements, selectedFloorId } = useProjectStore();

  const [formData, setFormData] = useState({
    title: '',
    discipline: 'airduct' as Discipline,
    affectedArea: '',
    priority: 'medium' as Priority,
    suggestedOrder: '',
    deadline: formatDate(addDays(new Date(), 7)),
    reporter: '张工（BIM）',
  });

  const [selectedElements, setSelectedElements] = useState<string[]>([]);

  useEffect(() => {
    if (preselectedElementIds.length > 0) {
      setSelectedElements(preselectedElementIds);
      const elem = elements.find((e) => e.id === preselectedElementIds[0]);
      if (elem) {
        setFormData((prev) => ({ ...prev, discipline: elem.discipline }));
      }
    } else {
      setSelectedElements([]);
    }
  }, [preselectedElementIds, elements]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        discipline: 'airduct',
        affectedArea: '',
        priority: 'medium',
        suggestedOrder: '',
        deadline: formatDate(addDays(new Date(), 7)),
        reporter: '张工（BIM）',
      });
    }
  }, [isOpen]);

  const floor = getSelectedFloor();
  const floorElements = elements.filter((e) => e.floorId === selectedFloorId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFloorId) {
      alert('请先选择楼层');
      return;
    }

    if (selectedElements.length === 0) {
      alert('请至少选择一个构件');
      return;
    }

    addIssue({
      ...formData,
      floorId: selectedFloorId,
      elementIds: selectedElements,
    });

    onClose();
  };

  const toggleElement = (elementId: string) => {
    setSelectedElements((prev) =>
      prev.includes(elementId)
        ? prev.filter((id) => id !== elementId)
        : [...prev, elementId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-primary-600 text-white">
          <h3 className="text-lg font-semibold">创建碰撞问题</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {floor && (
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">当前楼层：</span>
                {floor.name}
              </p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                问题标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例如：B1层走廊风管与水管交叉碰撞"
                className="input-field"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所属专业 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.discipline}
                  onChange={(e) =>
                    setFormData({ ...formData, discipline: e.target.value as Discipline })
                  }
                  className="input-field"
                  required
                >
                  {DISCIPLINE_LIST.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  优先级 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value as Priority })
                  }
                  className="input-field"
                  required
                >
                  {PRIORITY_LIST.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                影响区域 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.affectedArea}
                onChange={(e) => setFormData({ ...formData, affectedArea: e.target.value })}
                placeholder="例如：B1层走廊东端、1#机电房入口"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                涉及构件 <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-2">
                  (已选 {selectedElements.length} 个)
                </span>
              </label>
              <div className="border-2 border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto scrollbar-thin space-y-1">
                {floorElements.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    请先在模型中选择构件
                  </p>
                ) : (
                  floorElements.map((elem) => (
                    <label
                      key={elem.id}
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                        selectedElements.includes(elem.id)
                          ? 'bg-primary-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedElements.includes(elem.id)}
                        onChange={() => toggleElement(elem.id)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: elem.color }}
                      />
                      <span className="text-sm">
                        {getDisciplineName(elem.discipline)} - {elem.system} ({elem.size})
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">
                        底标高: {elem.bottomElevation}m
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                建议让位顺序 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.suggestedOrder}
                onChange={(e) => setFormData({ ...formData, suggestedOrder: e.target.value })}
                placeholder="例如：风管让水管，水管为重力流不可动"
                rows={3}
                className="input-field resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  整改期限 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  上报人 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.reporter}
                  onChange={(e) => setFormData({ ...formData, reporter: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-sm"
          >
            取消
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            创建问题
          </button>
        </div>
      </div>
    </div>
  );
}
