import { useProjectStore } from '@/store/projectStore';
import { DISCIPLINE_LIST } from '@/types';
import { Eye, EyeOff } from 'lucide-react';

export default function DisciplineFilter() {
  const { visibleDisciplines, toggleDiscipline, setAllDisciplines } = useProjectStore();

  const allVisible = visibleDisciplines.length === 4;
  const noneVisible = visibleDisciplines.length === 0;

  return (
    <div className="bg-white border border-gray-200 rounded p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-sm">专业显示</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setAllDisciplines(true)}
            className={`p-1.5 rounded transition-colors ${
              allVisible ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'
            }`}
            title="显示全部"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAllDisciplines(false)}
            className={`p-1.5 rounded transition-colors ${
              noneVisible ? 'bg-gray-200 text-gray-600' : 'text-gray-400 hover:text-gray-600'
            }`}
            title="隐藏全部"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {DISCIPLINE_LIST.map((discipline) => {
          const isVisible = visibleDisciplines.includes(discipline.key);
          return (
            <button
              key={discipline.key}
              onClick={() => toggleDiscipline(discipline.key)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded border-2 transition-all ${
                isVisible
                  ? 'border-gray-300 bg-white shadow-sm'
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: discipline.color }}
              />
              <span className="text-sm font-medium text-gray-700">{discipline.name}</span>
              <div className="ml-auto">
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    isVisible ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                  }`}
                >
                  {isVisible && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          已显示 {visibleDisciplines.length}/4 个专业
        </p>
      </div>
    </div>
  );
}
