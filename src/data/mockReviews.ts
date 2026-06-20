import { ReviewRecord } from '@/types';

export const mockReviews: ReviewRecord[] = [
  {
    id: 'review-001',
    issueId: 'issue-002',
    handling: 'go_under',
    responsibleUnit: '电气分包',
    remarks: '桥架在此处降低200mm，从消防管下方绕行，注意与下方风管保持≥100mm间距',
    reviewer: '刘总（BIM负责人）',
    reviewedAt: '2026-06-15 15:30',
    confirmed: true,
    confirmedAt: '2026-06-15 17:00',
  },
  {
    id: 'review-002',
    issueId: 'issue-004',
    handling: 'side_corridor',
    responsibleUnit: '总包机电部',
    remarks: '指定综合排布方案：走廊左侧分层布置，右侧预留检修通道。各专业3天内提交调整方案',
    reviewer: '刘总（BIM负责人）',
    reviewedAt: '2026-06-11 10:00',
    confirmed: true,
    confirmedAt: '2026-06-11 14:30',
  },
  {
    id: 'review-003',
    issueId: 'issue-005',
    handling: 'lift_up',
    responsibleUnit: '暖通分包',
    remarks: '新风管在此处上翻避让排水管，上翻高度300mm，保证与结构底≥50mm间距',
    reviewer: '刘总（BIM负责人）',
    reviewedAt: '2026-06-02 09:30',
    confirmed: true,
    confirmedAt: '2026-06-02 11:00',
  },
];
