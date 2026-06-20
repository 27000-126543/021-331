import { useState, useEffect } from 'react';
import { Download, CheckSquare, Square, ListChecks, FileSpreadsheet, Clock, Users, Edit, AlertCircle } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import IssueCard from '@/components/IssueCard';
import ReviewPanel from '@/components/ReviewPanel';
import ExportPreview from '@/components/ExportPreview';
import BatchReviewWizard, { MeetingSummary } from '@/components/BatchReviewWizard';
import { useReviewStore } from '@/store/reviewStore';
import { useIssueStore } from '@/store/issueStore';
import { STATUS_LIST, RESPONSIBLE_UNITS, IssueStatus } from '@/types';
import { isOverdue } from '@/utils/date';
import { getDisciplineName, getDisciplineColor } from '@/utils/disciplineColors';

type TabType = 'pending' | 'all' | 'export' | 'meetings';

interface MeetingDetailState {
  mode: 'view' | 'edit';
  editingReviewId: string | null;
  editForm: {
    confirmed: boolean;
    responsibleUnit: string;
    remarks: string;
  };
}

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [showExport, setShowExport] = useState(false);
  const [showMeetingSummary, setShowMeetingSummary] = useState<string | null>(null);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingDetailId, setMeetingDetailId] = useState<string | null>(null);
  const [meetingDetailState, setMeetingDetailState] = useState<MeetingDetailState>({
    mode: 'view',
    editingReviewId: null,
    editForm: { confirmed: false, responsibleUnit: '', remarks: '' },
  });
  const [meetingForm, setMeetingForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    host: '刘总（BIM负责人）',
    attendees: '刘总（BIM负责人）、各专业分包负责人',
    notes: '',
  });

  const {
    selectedReviewIssueIds,
    toggleSelectedIssue,
    selectAllPending,
    clearSelection,
    isReviewPanelOpen,
    openReviewPanel,
    closeReviewPanel,
    addReview,
    startBatchReview,
    isBatchReviewActive,
    getMeetings,
    getMeeting,
    reviews,
    updateReview,
    confirmReview,
    completeBatchReview,
  } = useReviewStore();
  const { issues, updateIssueStatus } = useIssueStore();

  const pendingIssues = issues.filter((i) => i.status === 'pending');
  const displayIssues =
    activeTab === 'pending'
      ? pendingIssues
      : activeTab === 'all'
      ? issues
      : activeTab === 'meetings'
      ? []
      : issues.filter((i) => i.status !== 'pending');

  const allPendingSelected =
    pendingIssues.length > 0 &&
    pendingIssues.every((i) => selectedReviewIssueIds.includes(i.id));

  const meetings = getMeetings();

  useEffect(() => {
    if (showMeetingForm) {
      setMeetingForm({
        name: `会审会议 - ${new Date().toLocaleDateString('zh-CN')}`,
        date: new Date().toISOString().split('T')[0],
        host: '刘总（BIM负责人）',
        attendees: '刘总（BIM负责人）、各专业分包负责人',
        notes: '',
      });
    }
  }, [showMeetingForm]);

  const handleBatchReview = () => {
    if (selectedReviewIssueIds.length === 0) return;
    setShowMeetingForm(true);
  };

  const confirmStartBatchReview = () => {
    const meetingInfo = {
      name: meetingForm.name,
      date: meetingForm.date,
      host: meetingForm.host,
      attendees: meetingForm.attendees.split(/[、,，]/).map((s) => s.trim()).filter(Boolean),
      notes: meetingForm.notes,
    };
    startBatchReview(selectedReviewIssueIds, meetingInfo);
    setShowMeetingForm(false);
  };

  const handleBatchConfirm = () => {
    if (selectedReviewIssueIds.length === 0) return;

    const confirmed = window.confirm(
      `确定要将选中的 ${selectedReviewIssueIds.length} 个问题直接标记为已会审吗？\n\n将创建默认会审记录：\n- 处理方式：上翻\n- 责任单位：暖通分包\n- 会审人：刘总（BIM负责人）\n\n建议尽量使用"开始会审"逐条处理，确保信息完整。`
    );

    if (!confirmed) return;

    selectedReviewIssueIds.forEach((id) => {
      addReview({
        issueId: id,
        handling: 'lift_up',
        customHandling: '',
        responsibleUnit: '暖通分包',
        remarks: '通过批量标记已会审',
        reviewer: '刘总（BIM负责人）',
        confirmed: false,
      });
      updateIssueStatus(id, 'reviewed');
    });
    clearSelection();
  };

  const handleBatchComplete = (meetingId: string) => {
    completeBatchReview();
    setShowMeetingSummary(meetingId);
  };

  const handleUpdateReviewInMeeting = (reviewId: string) => {
    updateReview(reviewId, {
      confirmed: meetingDetailState.editForm.confirmed,
      responsibleUnit: meetingDetailState.editForm.responsibleUnit,
      remarks: meetingDetailState.editForm.remarks,
    });

    const review = reviews.find((r) => r.id === reviewId);
    if (review?.confirmed && !meetingDetailState.editForm.confirmed) {
      // unconfirming
    } else if (meetingDetailState.editForm.confirmed && review && !review.confirmed) {
      confirmReview(reviewId);
    }

    if (meetingDetailState.editForm.confirmed) {
      confirmReview(reviewId);
    }

    const reviewData = reviews.find((r) => r.id === reviewId);
    if (reviewData) {
      const issue = issues.find((i) => i.id === reviewData.issueId);
      if (issue && issue.status === 'reviewed') {
        updateIssueStatus(issue.id, 'fixing' as IssueStatus);
      }
    }

    setMeetingDetailState({
      mode: 'view',
      editingReviewId: null,
      editForm: { confirmed: false, responsibleUnit: '', remarks: '' },
    });
  };

  const startEditReview = (reviewId: string) => {
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) return;
    setMeetingDetailState({
      mode: 'edit',
      editingReviewId: reviewId,
      editForm: {
        confirmed: review.confirmed,
        responsibleUnit: review.responsibleUnit,
        remarks: review.remarks,
      },
    });
  };

  const handleUpdateIssueStatus = (issueId: string, newStatus: IssueStatus) => {
    updateIssueStatus(issueId, newStatus);
  };

  const tabs = [
    { key: 'pending', label: '待会审', count: pendingIssues.length },
    { key: 'all', label: '全部问题', count: issues.length },
    { key: 'meetings', label: '会议记录', count: meetings.length },
    { key: 'export', label: '导出清单', count: null },
  ];

  const renderMeetingDetail = () => {
    if (!meetingDetailId) return null;
    const meeting = getMeeting(meetingDetailId);
    if (!meeting) return null;

    const meetingReviews = reviews.filter((r) => meeting.reviewRecordIds.includes(r.id));
    const confirmedCount = meetingReviews.filter((r) => r.confirmed).length;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{meeting.name}</h3>
            <p className="text-sm text-gray-500">{meeting.date} · {meeting.host}</p>
          </div>
          <button
            onClick={() => setMeetingDetailId(null)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            返回列表
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-100">
            <p className="text-2xl font-bold text-blue-600">{meeting.issueIds.length}</p>
            <p className="text-sm text-blue-600">关联问题</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100">
            <p className="text-2xl font-bold text-green-600">{confirmedCount}</p>
            <p className="text-sm text-green-600">已确认</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-100">
            <p className="text-2xl font-bold text-orange-600">{meetingReviews.length - confirmedCount}</p>
            <p className="text-sm text-orange-600">待确认</p>
          </div>
        </div>

        {meeting.attendees.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">参会人员</h4>
            <div className="flex flex-wrap gap-2">
              {meeting.attendees.map((a, i) => (
                <span key={i} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">{a}</span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">问题处理记录</h4>
          <div className="space-y-3">
            {meetingReviews.map((review) => {
              const issue = issues.find((i) => i.id === review.issueId);
              if (!issue) return null;
              const isEditing = meetingDetailState.editingReviewId === review.id;
              const isOverdueItem = issue.status !== 'completed' && isOverdue(issue.deadline);

              return (
                <div
                  key={review.id}
                  className={`border rounded-lg p-4 ${isOverdueItem ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className="w-3 h-3 rounded mt-1 flex-shrink-0"
                        style={{ backgroundColor: getDisciplineColor(issue.discipline) }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{issue.title}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {getDisciplineName(issue.discipline)} · {issue.affectedArea}
                        </p>

                        {isEditing ? (
                          <div className="mt-3 space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">责任单位</label>
                                <select
                                  value={meetingDetailState.editForm.responsibleUnit}
                                  onChange={(e) => setMeetingDetailState({
                                    ...meetingDetailState,
                                    editForm: { ...meetingDetailState.editForm, responsibleUnit: e.target.value },
                                  })}
                                  className="input-field text-sm py-1.5"
                                >
                                  {RESPONSIBLE_UNITS.map((u) => (
                                    <option key={u} value={u}>{u}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">确认状态</label>
                                <label className="flex items-center gap-2 mt-1">
                                  <input
                                    type="checkbox"
                                    checked={meetingDetailState.editForm.confirmed}
                                    onChange={(e) => setMeetingDetailState({
                                      ...meetingDetailState,
                                      editForm: { ...meetingDetailState.editForm, confirmed: e.target.checked },
                                    })}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded"
                                  />
                                  <span className="text-sm">已确认</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">备注</label>
                              <textarea
                                value={meetingDetailState.editForm.remarks}
                                onChange={(e) => setMeetingDetailState({
                                  ...meetingDetailState,
                                  editForm: { ...meetingDetailState.editForm, remarks: e.target.value },
                                })}
                                rows={2}
                                className="input-field text-sm resize-none"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateReviewInMeeting(review.id)}
                                className="btn-primary text-xs px-3 py-1.5"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setMeetingDetailState({
                                  mode: 'view',
                                  editingReviewId: null,
                                  editForm: { confirmed: false, responsibleUnit: '', remarks: '' },
                                })}
                                className="btn-secondary text-xs px-3 py-1.5"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                            <span className="text-gray-500">
                              处理：{review.customHandling || (review.handling === 'lift_up' ? '上翻' : review.handling === 'go_under' ? '下绕' : review.handling === 'side_corridor' ? '改走廊侧边' : '自定义')}
                            </span>
                            <span className="text-gray-500">责任：{review.responsibleUnit}</span>
                            <span className={review.confirmed ? 'text-green-600' : 'text-yellow-600'}>
                              {review.confirmed ? '已确认' : '待确认'}
                            </span>
                            {review.remarks && <span className="text-gray-400">备注：{review.remarks}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <select
                          value={issue.status}
                          onChange={(e) => handleUpdateIssueStatus(issue.id, e.target.value as IssueStatus)}
                          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                        >
                          <option value="pending">待会审</option>
                          <option value="reviewed">已会审</option>
                          <option value="fixing">整改中</option>
                          <option value="completed">已完成</option>
                        </select>
                        <button
                          onClick={() => startEditReview(review.id)}
                          className="p-1 text-gray-400 hover:text-accent-600 transition-colors"
                          title="编辑会审记录"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isOverdueItem && !isEditing && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="w-3 h-3" />
                      整改期限已逾期
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageLayout
      title="调整会审记录"
      subtitle={`待会审 ${pendingIssues.length} 个问题`}
      headerRight={
        <div className="flex items-center gap-3">
          {activeTab === 'pending' && (
            <>
              <button
                onClick={allPendingSelected ? clearSelection : selectAllPending}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                {allPendingSelected ? (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    取消全选
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    全选待审
                  </>
                )}
              </button>
              {selectedReviewIssueIds.length > 0 && (
                <>
                  <button
                    onClick={handleBatchReview}
                    className="btn-accent text-sm flex items-center gap-2"
                  >
                    <ListChecks className="w-4 h-4" />
                    开始会审 ({selectedReviewIssueIds.length})
                  </button>
                  <button
                    onClick={handleBatchConfirm}
                    className="btn-primary text-sm"
                  >
                    标记已会审
                  </button>
                </>
              )}
            </>
          )}
          {activeTab !== 'pending' && activeTab !== 'meetings' && (
            <button
              onClick={() => setShowExport(true)}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              导出清单
            </button>
          )}
        </div>
      }
    >
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as TabType);
                setMeetingDetailId(null);
              }}
              className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'text-primary-600 border-primary-600 bg-primary-50'
                  : 'text-gray-600 border-transparent hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'export' && (
          <div className="p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">导出管综调整清单</h3>
              <p className="text-sm text-gray-500 mb-6">
                导出按楼层和专业分组的会审记录，用于例会追踪
              </p>
              <button
                onClick={() => setShowExport(true)}
                className="btn-primary text-sm flex items-center gap-2 mx-auto"
              >
                <Download className="w-4 h-4" />
                预览并导出
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                导出说明
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 清单按楼层和专业自动分组，便于查阅</li>
                <li>• 包含问题描述、处理方式、责任单位、整改期限等信息</li>
                <li>• 支持 Excel 和 PDF 两种格式导出</li>
                <li>• Excel 格式方便后续编辑和统计</li>
                <li>• PDF 格式适合打印和存档</li>
              </ul>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">状态统计</h4>
                <div className="space-y-2">
                  {STATUS_LIST.map((status) => {
                    const count = issues.filter((i) => i.status === status.key).length;
                    return (
                      <div key={status.key} className="flex items-center justify-between">
                        <span className={`status-badge ${status.color}`}>
                          {status.name}
                        </span>
                        <span className="font-medium text-gray-800">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">会审进度</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">会审完成率</span>
                      <span className="font-medium text-gray-800">
                        {issues.length > 0
                          ? Math.round(
                              ((issues.length - pendingIssues.length) / issues.length) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            issues.length > 0
                              ? ((issues.length - pendingIssues.length) / issues.length) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-2xl font-bold text-green-600">
                        {issues.filter((i) => i.status === 'completed').length}
                      </p>
                      <p className="text-xs text-gray-500">已完成</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-2xl font-bold text-orange-600">
                        {issues.filter((i) => i.status === 'fixing').length}
                      </p>
                      <p className="text-xs text-gray-500">整改中</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meetings' && (
          <div className="p-6">
            {meetingDetailId ? (
              renderMeetingDetail()
            ) : meetings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">暂无会议记录</h3>
                <p className="text-sm text-gray-500">
                  开始批量会审后将自动创建会议记录
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {meetings.map((meeting) => {
                  const meetingReviews = reviews.filter((r) => meeting.reviewRecordIds.includes(r.id));
                  const confirmedCount = meetingReviews.filter((r) => r.confirmed).length;
                  const fixingCount = meeting.issueIds.filter((id) => {
                    const issue = issues.find((i) => i.id === id);
                    return issue?.status === 'fixing';
                  }).length;
                  const completedCount = meeting.issueIds.filter((id) => {
                    const issue = issues.find((i) => i.id === id);
                    return issue?.status === 'completed';
                  }).length;

                  return (
                    <div
                      key={meeting.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors cursor-pointer"
                      onClick={() => setMeetingDetailId(meeting.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">{meeting.name}</h4>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {meeting.date} · {meeting.host}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>处理问题：{meeting.issueIds.length} 个</span>
                              <span className="text-green-600">已确认：{confirmedCount}</span>
                              <span className="text-orange-600">整改中：{fixingCount}</span>
                              <span className="text-blue-600">已完成：{completedCount}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {meeting.createdAt}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {activeTab !== 'export' && activeTab !== 'meetings' && (
        <>
          {selectedReviewIssueIds.length > 0 && !isBatchReviewActive && (
            <div className="mb-4 p-3 bg-accent-50 border border-accent-200 rounded-lg flex items-center justify-between">
              <span className="text-sm text-accent-800">
                已选择 <span className="font-medium">{selectedReviewIssueIds.length}</span> 个问题进行会审
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchReview}
                  className="btn-accent text-sm"
                >
                  开始会审
                </button>
                <button
                  onClick={handleBatchConfirm}
                  className="btn-primary text-sm"
                >
                  标记已会审
                </button>
              </div>
            </div>
          )}

          {displayIssues.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {activeTab === 'pending'
                  ? '太棒了！没有待会审的问题'
                  : '暂无问题记录'}
              </h3>
              <p className="text-sm text-gray-500">
                {activeTab === 'pending'
                  ? '所有问题已完成会审'
                  : '请先在模型中创建碰撞问题'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  selectable={issue.status === 'pending'}
                  selected={selectedReviewIssueIds.includes(issue.id)}
                  onToggleSelect={() => toggleSelectedIssue(issue.id)}
                  showReview={issue.status === 'pending'}
                />
              ))}
            </div>
          )}
        </>
      )}

      {isBatchReviewActive && (
        <BatchReviewWizard
          onClose={() => {}}
          onComplete={handleBatchComplete}
        />
      )}

      {showMeetingForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-primary-600 text-white">
              <h3 className="text-lg font-semibold">开始会审会议</h3>
              <p className="text-sm text-primary-100 mt-0.5">
                将处理 {selectedReviewIssueIds.length} 个问题
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  会议名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={meetingForm.name}
                  onChange={(e) => setMeetingForm({ ...meetingForm, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    会议日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={meetingForm.date}
                    onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    主持人 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={meetingForm.host}
                    onChange={(e) => setMeetingForm({ ...meetingForm, host: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  参会人员 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={meetingForm.attendees}
                  onChange={(e) => setMeetingForm({ ...meetingForm, attendees: e.target.value })}
                  placeholder="多个参会人用顿号或逗号分隔"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  会议备注
                </label>
                <textarea
                  value={meetingForm.notes}
                  onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                  placeholder="记录会议主题、决议等..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setShowMeetingForm(false)}
                className="btn-secondary text-sm"
              >
                取消
              </button>
              <button
                onClick={confirmStartBatchReview}
                disabled={!meetingForm.name.trim() || !meetingForm.host.trim()}
                className="btn-accent text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ListChecks className="w-4 h-4" />
                开始逐条会审
              </button>
            </div>
          </div>
        </div>
      )}

      {showMeetingSummary && (
        <MeetingSummary
          meetingId={showMeetingSummary}
          onClose={() => setShowMeetingSummary(null)}
        />
      )}

      <ReviewPanel isOpen={isReviewPanelOpen} onClose={closeReviewPanel} />
      <ExportPreview isOpen={showExport} onClose={() => setShowExport(false)} />
    </PageLayout>
  );
}
