import { useState } from 'react';
import { Download, CheckSquare, Square, ListChecks, FileSpreadsheet, Clock } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import IssueCard from '@/components/IssueCard';
import ReviewPanel from '@/components/ReviewPanel';
import ExportPreview from '@/components/ExportPreview';
import { useReviewStore } from '@/store/reviewStore';
import { useIssueStore } from '@/store/issueStore';
import { STATUS_LIST } from '@/types';

type TabType = 'pending' | 'all' | 'export';

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [showExport, setShowExport] = useState(false);

  const {
    selectedReviewIssueIds,
    toggleSelectedIssue,
    selectAllPending,
    clearSelection,
    isReviewPanelOpen,
    openReviewPanel,
    closeReviewPanel,
  } = useReviewStore();
  const { issues, updateIssueStatus } = useIssueStore();

  const pendingIssues = issues.filter((i) => i.status === 'pending');
  const displayIssues =
    activeTab === 'pending'
      ? pendingIssues
      : activeTab === 'all'
      ? issues
      : issues.filter((i) => i.status !== 'pending');

  const allPendingSelected =
    pendingIssues.length > 0 &&
    pendingIssues.every((i) => selectedReviewIssueIds.includes(i.id));

  const handleBatchReview = () => {
    if (selectedReviewIssueIds.length === 0) return;
    openReviewPanel(selectedReviewIssueIds[0]);
  };

  const handleBatchConfirm = () => {
    selectedReviewIssueIds.forEach((id) => {
      updateIssueStatus(id, 'reviewed');
    });
    clearSelection();
  };

  const tabs = [
    { key: 'pending', label: '待会审', count: pendingIssues.length },
    { key: 'all', label: '全部问题', count: issues.length },
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
                <button
                  onClick={handleBatchReview}
                  className="btn-accent text-sm flex items-center gap-2"
                >
                  <ListChecks className="w-4 h-4" />
                  批量会审 ({selectedReviewIssueIds.length})
                </button>
              )}
            </>
          )}
          {activeTab !== 'pending' && (
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
      </div>

      {activeTab !== 'export' && (
        <>
          {selectedReviewIssueIds.length > 0 && (
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

      <ReviewPanel isOpen={isReviewPanelOpen} onClose={closeReviewPanel} />
      <ExportPreview isOpen={showExport} onClose={() => setShowExport(false)} />
    </PageLayout>
  );
}
