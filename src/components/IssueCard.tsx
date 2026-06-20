import { useState } from 'react';
import { Issue, STATUS_LIST, PRIORITY_LIST, DISCIPLINE_LIST } from '@/types';
import { getDisciplineColor, getDisciplineName } from '@/utils/disciplineColors';
import { isOverdue, getDaysRemaining, formatDate } from '@/utils/date';
import { ChevronDown, ChevronUp, AlertCircle, Calendar, User, MapPin, Layers } from 'lucide-react';
import { useIssueStore } from '@/store/issueStore';
import { useReviewStore } from '@/store/reviewStore';
import { useProjectStore } from '@/store/projectStore';

interface IssueCardProps {
  issue: Issue;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  showReview?: boolean;
}

export default function IssueCard({
  issue,
  selectable = false,
  selected = false,
  onToggleSelect,
  showReview = false,
}: IssueCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { deleteIssue, updateIssueStatus } = useIssueStore();
  const { getReviewForIssue, openReviewPanel } = useReviewStore();
  const { floors } = useProjectStore();

  const review = getReviewForIssue(issue.id);
  const floor = floors.find((f) => f.id === issue.floorId);
  const statusInfo = STATUS_LIST.find((s) => s.key === issue.status);
  const priorityInfo = PRIORITY_LIST.find((p) => p.key === issue.priority);
  const disciplineName = getDisciplineName(issue.discipline);
  const disciplineColor = getDisciplineColor(issue.discipline);
  const overdue = isOverdue(issue.deadline) && issue.status !== 'completed';
  const daysRemaining = getDaysRemaining(issue.deadline);

  return (
    <div
      className={`card rounded-lg overflow-hidden relative transition-all ${
        selected ? 'ring-2 ring-primary-500' : ''
      }`}
    >
      <div
        className="priority-indicator"
        style={{ backgroundColor: priorityInfo?.color || '#gray' }}
      />

      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {selectable && (
              <input
                type="checkbox"
                checked={selected}
                onChange={onToggleSelect}
                className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className="discipline-badge"
                  style={{ backgroundColor: disciplineColor }}
                >
                  {disciplineName}
                </span>
                <span className={`status-badge ${statusInfo?.color}`}>
                  {statusInfo?.name}
                </span>
                {overdue && (
                  <span className="status-badge bg-red-100 text-red-800 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    已逾期
                  </span>
                )}
              </div>

              <h4 className="font-medium text-gray-800 mb-2 line-clamp-2">
                {issue.title}
              </h4>

              <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  {floor?.name || '未知楼层'}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {issue.affectedArea}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(issue.deadline)}
                  {!overdue && issue.status !== 'completed' && (
                    <span
                      className={`ml-1 ${
                        daysRemaining <= 3 ? 'text-red-600' : 'text-gray-500'
                      }`}
                    >
                      ({daysRemaining}天后)
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {issue.reporter}
                </span>
              </div>
            </div>

            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
            >
              {expanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">建议让位顺序</h5>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                {issue.suggestedOrder}
              </p>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">涉及构件</h5>
              <div className="flex flex-wrap gap-2">
                {issue.elementIds.map((id) => (
                  <span
                    key={id}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-mono"
                  >
                    {id}
                  </span>
                ))}
              </div>
            </div>

            {review && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <h5 className="text-sm font-medium text-primary-800 mb-2">会审意见</h5>
                <div className="space-y-2 text-sm">
                  <p className="text-primary-700">
                    <span className="font-medium">处理方式：</span>
                    {review.customHandling ||
                      (review.handling === 'lift_up' && '上翻') ||
                      (review.handling === 'go_under' && '下绕') ||
                      (review.handling === 'side_corridor' && '改走廊侧边') ||
                      '自定义'}
                  </p>
                  <p className="text-primary-700">
                    <span className="font-medium">责任单位：</span>
                    {review.responsibleUnit}
                  </p>
                  {review.remarks && (
                    <p className="text-primary-700">
                      <span className="font-medium">备注：</span>
                      {review.remarks}
                    </p>
                  )}
                  <p className="text-xs text-primary-600 mt-2">
                    {review.reviewer} 于 {review.reviewedAt} 会审
                    {review.confirmed && ` · ${review.responsibleUnit} 已确认`}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 flex-wrap">
              {issue.status === 'pending' && showReview && (
                <button
                  onClick={() => openReviewPanel(issue.id)}
                  className="btn-accent text-sm"
                >
                  处理会审
                </button>
              )}
              {(issue.status === 'reviewed' || issue.status === 'fixing') && (
                <button
                  onClick={() => updateIssueStatus(issue.id, 'completed')}
                  className="btn-primary text-sm"
                >
                  标记完成
                </button>
              )}
              {issue.status === 'reviewed' && (
                <button
                  onClick={() => updateIssueStatus(issue.id, 'fixing')}
                  className="btn-secondary text-sm"
                >
                  开始整改
                </button>
              )}
              <button
                onClick={() => deleteIssue(issue.id)}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
