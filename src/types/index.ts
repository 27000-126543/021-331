export type Discipline = 'airduct' | 'waterpipe' | 'cabletray' | 'firepipe';

export type IssueStatus = 'pending' | 'reviewed' | 'fixing' | 'completed';

export type HandlingType = 'lift_up' | 'go_under' | 'side_corridor' | 'custom';

export type Priority = 'high' | 'medium' | 'low';

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Building {
  id: string;
  projectId: string;
  name: string;
  floors: number;
}

export interface Floor {
  id: string;
  buildingId: string;
  name: string;
  elevation: number;
  modelUrl?: string;
  modelUploadedBy?: string;
  modelUploadedAt?: string;
}

export interface ModelElement {
  id: string;
  floorId: string;
  discipline: Discipline;
  system: string;
  bottomElevation: number;
  topElevation: number;
  size: string;
  position: { x: number; y: number; width: number; height: number };
  color: string;
}

export interface Issue {
  id: string;
  floorId: string;
  title: string;
  discipline: Discipline;
  elementIds: string[];
  affectedArea: string;
  priority: Priority;
  suggestedOrder: string;
  deadline: string;
  status: IssueStatus;
  reporter: string;
  createdAt: string;
  photos?: string[];
}

export interface ReviewRecord {
  id: string;
  issueId: string;
  handling: HandlingType;
  customHandling?: string;
  responsibleUnit: string;
  remarks: string;
  reviewer: string;
  reviewedAt: string;
  confirmed: boolean;
  confirmedAt?: string;
  meetingId?: string;
}

export interface CollisionPoint {
  id: string;
  elementIds: string[];
  elements: ModelElement[];
  position: { x: number; y: number; width: number; height: number };
  collisionType: 'horizontal' | 'vertical' | 'both';
  conflictReason: string;
  minElevation: number;
  maxElevation: number;
  clearance: number;
}

export interface MeetingRecord {
  id: string;
  name: string;
  date: string;
  host: string;
  attendees: string[];
  issueIds: string[];
  reviewRecordIds: string[];
  notes: string;
  createdAt: string;
}

export interface DisciplineInfo {
  key: Discipline;
  name: string;
  color: string;
  bgColor: string;
}

export const DISCIPLINE_LIST: DisciplineInfo[] = [
  { key: 'airduct', name: '风管', color: '#4a90d9', bgColor: 'bg-discipline-airduct' },
  { key: 'waterpipe', name: '水管', color: '#2ecc71', bgColor: 'bg-discipline-waterpipe' },
  { key: 'cabletray', name: '桥架', color: '#f39c12', bgColor: 'bg-discipline-cabletray' },
  { key: 'firepipe', name: '消防管', color: '#e74c3c', bgColor: 'bg-discipline-firepipe' },
];

export const STATUS_LIST: { key: IssueStatus; name: string; color: string }[] = [
  { key: 'pending', name: '待会审', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'reviewed', name: '已会审', color: 'bg-blue-100 text-blue-800' },
  { key: 'fixing', name: '整改中', color: 'bg-orange-100 text-orange-800' },
  { key: 'completed', name: '已完成', color: 'bg-green-100 text-green-800' },
];

export const HANDLING_LIST: { key: HandlingType; name: string }[] = [
  { key: 'lift_up', name: '上翻' },
  { key: 'go_under', name: '下绕' },
  { key: 'side_corridor', name: '改走廊侧边' },
  { key: 'custom', name: '自定义' },
];

export const PRIORITY_LIST: { key: Priority; name: string; color: string }[] = [
  { key: 'high', name: '高', color: 'bg-red-500' },
  { key: 'medium', name: '中', color: 'bg-yellow-500' },
  { key: 'low', name: '低', color: 'bg-green-500' },
];

export const RESPONSIBLE_UNITS = [
  '暖通分包',
  '给排水分包',
  '电气分包',
  '消防分包',
  '总包机电部',
];
