import { X, Check, Users, Calendar, FileText, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useReviewStore } from '@/store/reviewStore';
import { useIssueStore } from '@/store/issueStore';
import { getDisciplineName, getDisciplineColor } from '@/utils/disciplineColors';
import {
  HANDLING_LIST,
  RESPONSIBLE_UNITS,
  HandlingType,
} from '@/types';
import { useState, useEffect } from 'react';

interface BatchReviewWizardProps {
  onClose: () => void;
  onComplete: (meetingId: string) => void;
}

export default function BatchReviewWizard({ onClose, onComplete }: BatchReviewWizardProps) {
  const {
    isBatchReviewActive,
    batchReviewIssueIds,
    currentBatchIndex,
    currentMeetingId,
    cancelBatchReview,
    addReview,
    getMeeting,
    reviews,
    nextBatchReview,
    prevBatchReview,
  } = useReviewStore();
  const { issues, updateIssueStatus } = useIssueStore();

  const [formData, setFormData] = useState({
    handling: 'lift_up' as HandlingType,
    customHandling: '',
    responsibleUnit: RESPONSIBLE_UNITS[0],
    remarks: '',
    reviewer: '刘总（BIM负责人）',
    confirmed: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  if (!isBatchReviewActive || batchReviewIssueIds.length === 0) return null;

  const currentIssue = issues.find((i) => i.id === batchReviewIssueIds[currentBatchIndex]);
  const meeting = currentMeetingId ? getMeeting(currentMeetingId) : null;
  const totalCount = batchReviewIssueIds.length;
  const currentCount = currentBatchIndex + 1;
  const reviewedIds = batchReviewIssueIds.filter((id) =>
    reviews.some((r) => r.issueId === id)
  );
  const progress = Math.round((reviewedIds.length / totalCount) * 100);

  const isCurrentReviewed = currentIssue
    ? reviews.some((r) => r.issueId === currentIssue.id)
    : false;

  useEffect(() => {
    setFormData({
      handling: 'lift_up',
      customHandling: '',
      responsibleUnit: RESPONSIBLE_UNITS[0],
      remarks: '',
      reviewer: '刘总（BIM负责人）',
      confirmed: false,
    });
    setErrors({});
  }, [currentBatchIndex]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.handling === 'custom' && !formData.customHandling.trim()) {
      newErrors.customHandling = '请输入自定义处理方式';
    }

    if (!formData.responsibleUnit.trim()) {
      newErrors.responsibleUnit = '请选择责任单位';
    }

    if (!formData.reviewer.trim()) {
      newErrors.reviewer = '请输入会审人';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAndNext = () => {
    if (!currentIssue) return;
    if (!validateForm()) return;

    setIsSaving(true);

    addReview({
      issueId: currentIssue.id,
      handling: formData.handling,
      customHandling: formData.customHandling,
      responsibleUnit: formData.responsibleUnit,
      remarks: formData.remarks,
      reviewer: formData.reviewer,
      confirmed: formData.confirmed,
    });

    updateIssueStatus(currentIssue.id, 'reviewed');

    setTimeout(() => {
      setIsSaving(false);

      const remaining = batchReviewIssueIds.filter(
        (id) => !useReviewStore.getState().reviews.some((r) => r.issueId === id)
      );

      if (remaining.length === 0 && currentMeetingId) {
        onComplete(currentMeetingId);
      } else {
        const nextIdx = currentBatchIndex + 1;
        if (nextIdx < totalCount) {
          nextBatchReview();
        } else if (currentMeetingId) {
          onComplete(currentMeetingId);
        }
      }
    }, 100);
  };

  const handlePrev = () => {
    if (currentBatchIndex > 0) {
      prevBatchReview();
    }
  };

  const handleCancel = () => {
    const confirmed = window.confirm('确定要取消本次批量会审吗？已处理的问题将保留记录。');
    if (confirmed) {
      cancelBatchReview();
      onClose();
    }
  };

  if (!currentIssue) return null;

  const handlingName = (key: HandlingType) => {
    const found = HANDLING_LIST.find((h) => h.key === key);
    return found ? found.name : '自定义';
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-accent-500 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold">会议会审工作台</h4>
              <p className="text-xs text-white/80">
                {meeting?.name || '会审会议'} · {meeting?.date}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              会审进度：<span className="font-medium text-accent-600">{currentCount}</span> / {totalCount}
            </span>
            <span className="text-sm text-gray-600">
              已完成：<span className="font-medium text-green-600">{reviewedIds.length}</span> 个
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center gap-1 mt-2">
            {batchReviewIssueIds.map((id, index) => {
              const isReviewed = reviews.some((r) => r.issueId === id);
              const isCurrent = index === currentBatchIndex;
              return (
                <button
                  key={id}
                  onClick={() => {
                    if (index <= currentBatchIndex || isReviewed) {
                      for (let i = currentBatchIndex; i > index; i--) {
                        prevBatchReview();
                      }
                    }
                  }}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    isCurrent
                      ? 'bg-accent-500'
                      : isReviewed
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              );
            })}
          </div>
        </div>

        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded flex-shrink-0"
              style={{ backgroundColor: getDisciplineColor(currentIssue.discipline) }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{currentIssue.title}</p>
              <p className="text-sm text-gray-500">
                {getDisciplineName(currentIssue.discipline)} · {currentIssue.affectedArea}
              </p>
            </div>
            {isCurrentReviewed && (
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                已处理
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {isCurrentReviewed ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-medium text-gray-800 mb-2">此问题已处理</p>
              {(() => {
                const review = reviews.find((r) => r.issueId === currentIssue.id);
                if (!review) return null;
                return (
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>处理方式：{review.customHandling || handlingName(review.handling)}</p>
                    <p>责任单位：{review.responsibleUnit}</p>
                    <p>确认状态：{review.confirmed ? '已确认' : '待确认'}</p>
                  </div>
                );
              })()}
              <div className="mt-6">
                {currentBatchIndex < totalCount - 1 ? (
                  <button
                    onClick={nextBatchReview}
                    className="btn-accent text-sm"
                  >
                    处理下一条
                  </button>
                ) : (
                  <button
                    onClick={() => currentMeetingId && onComplete(currentMeetingId)}
                    className="btn-primary text-sm"
                  >
                    查看会议汇总
                  </button>
                )}
              </div>
            </div>
          ) : (
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
                        onChange={(e) => {
                          setFormData({ ...formData, handling: e.target.value as HandlingType });
                          if (errors.handling) setErrors({ ...errors, handling: '' });
                        }}
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
                    onChange={(e) => {
                      setFormData({ ...formData, customHandling: e.target.value });
                      if (errors.customHandling) setErrors({ ...errors, customHandling: '' });
                    }}
                    placeholder="请输入具体处理方式"
                    className={`input-field ${errors.customHandling ? 'border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.customHandling && (
                    <p className="mt-1 text-sm text-red-500">{errors.customHandling}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    责任单位 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.responsibleUnit}
                    onChange={(e) => {
                      setFormData({ ...formData, responsibleUnit: e.target.value });
                      if (errors.responsibleUnit) setErrors({ ...errors, responsibleUnit: '' });
                    }}
                    className={`input-field ${errors.responsibleUnit ? 'border-red-500 focus:ring-red-500' : ''}`}
                  >
                    {RESPONSIBLE_UNITS.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                  {errors.responsibleUnit && (
                    <p className="mt-1 text-sm text-red-500">{errors.responsibleUnit}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    会审人 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.reviewer}
                    onChange={(e) => {
                      setFormData({ ...formData, reviewer: e.target.value });
                      if (errors.reviewer) setErrors({ ...errors, reviewer: '' });
                    }}
                    className={`input-field ${errors.reviewer ? 'border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.reviewer && (
                    <p className="mt-1 text-sm text-red-500">{errors.reviewer}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  会审备注
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="记录详细的处理要求、注意事项等"
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <input
                  type="checkbox"
                  id="confirmed-batch"
                  checked={formData.confirmed}
                  onChange={(e) => setFormData({ ...formData, confirmed: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="confirmed-batch" className="text-sm text-green-800">
                  {formData.responsibleUnit} 已确认此处理方案
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50 flex-shrink-0">
          <button
            onClick={handlePrev}
            disabled={currentBatchIndex === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            上一条
          </button>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertCircle className="w-4 h-4" />
            {!isCurrentReviewed
              ? '请填写完整后保存并进入下一条'
              : currentBatchIndex < totalCount - 1
              ? '已处理，可继续下一条'
              : '全部处理完成'}
          </div>

          {!isCurrentReviewed ? (
            <button
              onClick={handleSaveAndNext}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                '保存中...'
              ) : currentBatchIndex === totalCount - 1 ? (
                <>
                  <Check className="w-4 h-4" />
                  保存并完成
                </>
              ) : (
                <>
                  保存并下一条
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}

interface MeetingSummaryProps {
  meetingId: string;
  onClose: () => void;
}

export function MeetingSummary({ meetingId, onClose }: MeetingSummaryProps) {
  const { getMeeting, reviews } = useReviewStore();
  const { issues } = useIssueStore();

  const meeting = getMeeting(meetingId);
  if (!meeting) return null;

  const meetingReviews = reviews.filter((r) => meeting.reviewRecordIds.includes(r.id));
  const confirmedCount = meetingReviews.filter((r) => r.confirmed).length;

  const handlingName = (key: HandlingType, custom?: string) => {
    if (custom) return custom;
    const found = HANDLING_LIST.find((h) => h.key === key);
    return found ? found.name : '自定义';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-green-600 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">会审会议完成</h3>
              <p className="text-sm text-white/80">{meeting.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                会议日期
              </div>
              <p className="font-medium text-gray-800">{meeting.date}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Users className="w-4 h-4" />
                主持人
              </div>
              <p className="font-medium text-gray-800">{meeting.host}</p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              参会人员
            </h4>
            <div className="flex flex-wrap gap-2">
              {meeting.attendees.map((attendee, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                >
                  {attendee}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              会审统计
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-100">
                <p className="text-2xl font-bold text-blue-600">{meeting.issueIds.length}</p>
                <p className="text-sm text-blue-600">处理问题</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100">
                <p className="text-2xl font-bold text-green-600">{confirmedCount}</p>
                <p className="text-sm text-green-600">已确认</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-100">
                <p className="text-2xl font-bold text-orange-600">
                  {meeting.issueIds.length - confirmedCount}
                </p>
                <p className="text-sm text-orange-600">待确认</p>
              </div>
            </div>
          </div>

          {meeting.notes && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-2">会议备注</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                {meeting.notes}
              </p>
            </div>
          )}

          <div>
            <h4 className="font-medium text-gray-800 mb-3">会审记录明细</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
              {meetingReviews.map((review) => {
                const issue = issues.find((i) => i.id === review.issueId);
                if (!issue) return null;
                return (
                  <div
                    key={review.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div
                      className="w-2 h-2 rounded flex-shrink-0"
                      style={{ backgroundColor: getDisciplineColor(issue.discipline) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {issue.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {handlingName(review.handling, review.customHandling)}
                        {' · '}{review.responsibleUnit}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      review.confirmed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {review.confirmed ? '已确认' : '待确认'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="btn-primary text-sm"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
