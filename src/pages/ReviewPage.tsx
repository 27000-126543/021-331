import { useState, useEffect } from 'react';
import { Download, CheckSquare, Square, ListChecks, FileSpreadsheet, Clock, Users } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import IssueCard from '@/components/IssueCard';
import ReviewPanel from '@/components/ReviewPanel';
import ExportPreview from '@/components/ExportPreview';
import BatchReviewWizard, { MeetingSummary } from '@/components/BatchReviewWizard';
import { useReviewStore } from '@/store/reviewStore';
import { useIssueStore } from '@/store/issueStore';
import { STATUS_LIST } from '@/types';

type TabType = 'pending' | 'all' | 'export' | 'meetings';

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [showExport, setShowExport] = useState(false);
  const [showMeetingSummary, setShowMeetingSummary] = useState<string | null>(null);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
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
    createMeeting,
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

  const tabs = [
    { key: 'pending', label: '待会审', count: pendingIssues.length },
    { key: 'all', label: '全部问题', count: issues.length },
    { key: 'meetings', label: '会议记录', count: meetings.length },
    { key: 'export', label: '导出清单', count: null },
  ];

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
              onClick={() => setActiveTab(tab.key as TabType)}
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
            {meetings.length === 0 ? (
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
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors cursor-pointer"
                    onClick={() => setShowMeetingSummary(meeting.id)}
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
                            <span>已确认：{meeting.reviewRecordIds.filter((id) => {
                              const review = useReviewStore.getState().reviews.find((r) => r.id === id);
                              return review?.confirmed;
                            }).length} 个</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {meeting.createdAt}
                      </div>
                    </div>
                  </div>
                ))}
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
        <BatchReviewWizard onClose={() => {}} />
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
