import { X, ChevronLeft, ChevronRight, Check, Users, Calendar, FileText } from 'lucide-react';
import { useReviewStore } from '@/store/reviewStore';
import { useIssueStore } from '@/store/issueStore';
import { getDisciplineName, getDisciplineColor } from '@/utils/disciplineColors';

interface BatchReviewWizardProps {
  onClose: () => void;
}

export default function BatchReviewWizard({ onClose }: BatchReviewWizardProps) {
  const {
    isBatchReviewActive,
    batchReviewIssueIds,
    currentBatchIndex,
    currentMeetingId,
    prevBatchReview,
    nextBatchReview,
    cancelBatchReview,
    getMeeting,
    reviews,
  } = useReviewStore();
  const { issues } = useIssueStore();

  if (!isBatchReviewActive || batchReviewIssueIds.length === 0) return null;

  const currentIssue = issues.find((i) => i.id === batchReviewIssueIds[currentBatchIndex]);
  const meeting = currentMeetingId ? getMeeting(currentMeetingId) : null;
  const totalCount = batchReviewIssueIds.length;
  const currentCount = currentBatchIndex + 1;
  const reviewedIds = batchReviewIssueIds.filter((id) =>
    reviews.some((r) => r.issueId === id)
  );
  const progress = Math.round((reviewedIds.length / totalCount) * 100);

  const handleCancel = () => {
    const confirmed = window.confirm('确定要取消本次批量会审吗？已处理的问题将保留记录。');
    if (confirmed) {
      cancelBatchReview();
      onClose();
    }
  };

  if (!currentIssue) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40 pointer-events-none">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl pointer-events-auto">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-accent-500 text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold">批量会审进行中</h4>
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

        <div className="px-4 py-3 border-b border-gray-200">
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
        </div>

        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
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
            <span className={`status-badge ${
              currentIssue.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              currentIssue.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
              currentIssue.status === 'fixing' ? 'bg-orange-100 text-orange-800' :
              'bg-green-100 text-green-800'
            }`}>
              {currentIssue.status === 'pending' ? '待会审' :
               currentIssue.status === 'reviewed' ? '已会审' :
               currentIssue.status === 'fixing' ? '整改中' : '已完成'}
            </span>
          </div>
        </div>

        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={prevBatchReview}
            disabled={currentBatchIndex === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            上一条
          </button>

          <div className="flex items-center gap-1">
            {batchReviewIssueIds.map((id, index) => {
              const isReviewed = reviews.some((r) => r.issueId === id);
              const isCurrent = index === currentBatchIndex;
              return (
                <div
                  key={id}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    isCurrent
                      ? 'bg-accent-500 scale-125'
                      : isReviewed
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              );
            })}
          </div>

          <button
            onClick={nextBatchReview}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
          >
            {currentBatchIndex === totalCount - 1 ? (
              <>
                <Check className="w-4 h-4" />
                完成会审
              </>
            ) : (
              <>
                下一条
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-green-600 text-white">
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
                        {review.customHandling ||
                          (review.handling === 'lift_up' ? '上翻' :
                           review.handling === 'go_under' ? '下绕' :
                           review.handling === 'side_corridor' ? '改走廊侧边' : '自定义')}
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

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
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
