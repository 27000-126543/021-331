import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useReviewStore } from '@/store/reviewStore';
import { useIssueStore } from '@/store/issueStore';
import {
  HANDLING_LIST,
  RESPONSIBLE_UNITS,
  HandlingType,
} from '@/types';

interface ReviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReviewPanel({ isOpen, onClose }: ReviewPanelProps) {
  const { addReview, currentReviewIssueId, getReviewForIssue } = useReviewStore();
  const { issues, updateIssueStatus } = useIssueStore();

  const [formData, setFormData] = useState({
    handling: 'lift_up' as HandlingType,
    customHandling: '',
    responsibleUnit: RESPONSIBLE_UNITS[0],
    remarks: '',
    reviewer: '刘总（BIM负责人）',
    confirmed: false,
  });

  const existingReview = currentReviewIssueId
    ? getReviewForIssue(currentReviewIssueId)
    : null;
  const issue = issues.find((i) => i.id === currentReviewIssueId);

  useEffect(() => {
    if (existingReview) {
      setFormData({
        handling: existingReview.handling,
        customHandling: existingReview.customHandling || '',
        responsibleUnit: existingReview.responsibleUnit,
        remarks: existingReview.remarks,
        reviewer: existingReview.reviewer,
        confirmed: existingReview.confirmed,
      });
    } else {
      setFormData({
        handling: 'lift_up',
        customHandling: '',
        responsibleUnit: RESPONSIBLE_UNITS[0],
        remarks: '',
        reviewer: '刘总（BIM负责人）',
        confirmed: false,
      });
    }
  }, [currentReviewIssueId, existingReview]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentReviewIssueId) {
      alert('请选择要处理的问题');
      return;
    }

    addReview({
      ...formData,
      issueId: currentReviewIssueId,
    });

    updateIssueStatus(currentReviewIssueId, 'reviewed');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-accent-500 text-white">
          <h3 className="text-lg font-semibold">会审处理</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {issue && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500 mb-1">当前处理问题</p>
            <p className="font-medium text-gray-800">{issue.title}</p>
            <p className="text-sm text-gray-500 mt-1">{issue.affectedArea}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                处理方式 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {HANDLING_LIST.map((handling) => (
                  <label
                    key={handling.key}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.handling === handling.key
                        ? 'border-accent-500 bg-accent-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="handling"
                      value={handling.key}
                      checked={formData.handling === handling.key}
                      onChange={(e) =>
                        setFormData({ ...formData, handling: e.target.value as HandlingType })
                      }
                      className="w-4 h-4 text-accent-600 border-gray-300 focus:ring-accent-500"
                    />
                    <span className="text-sm font-medium">{handling.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.handling === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  自定义处理方式 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customHandling}
                  onChange={(e) => setFormData({ ...formData, customHandling: e.target.value })}
                  placeholder="请输入具体处理方式"
                  className="input-field"
                  required={formData.handling === 'custom'}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                责任单位 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.responsibleUnit}
                onChange={(e) => setFormData({ ...formData, responsibleUnit: e.target.value })}
                className="input-field"
                required
              >
                {RESPONSIBLE_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                会审备注
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="记录详细的处理要求、注意事项等"
                rows={4}
                className="input-field resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                会审人 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.reviewer}
                onChange={(e) => setFormData({ ...formData, reviewer: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <input
                type="checkbox"
                id="confirmed"
                checked={formData.confirmed}
                onChange={(e) => setFormData({ ...formData, confirmed: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="confirmed" className="text-sm text-green-800">
                {formData.responsibleUnit} 已确认此处理方案
              </label>
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
            className="btn-accent text-sm flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            确认会审
          </button>
        </div>
      </div>
    </div>
  );
}
