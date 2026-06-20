import { Discipline, DISCIPLINE_LIST } from '@/types';

export function getDisciplineColor(discipline: Discipline): string {
  const info = DISCIPLINE_LIST.find(d => d.key === discipline);
  return info?.color || '#6b7280';
}

export function getDisciplineBgColor(discipline: Discipline): string {
  const info = DISCIPLINE_LIST.find(d => d.key === discipline);
  return info?.bgColor || 'bg-gray-500';
}

export function getDisciplineName(discipline: Discipline): string {
  const info = DISCIPLINE_LIST.find(d => d.key === discipline);
  return info?.name || '未知';
}

export function getStatusName(status: string, list: { key: string; name: string }[]): string {
  const info = list.find(s => s.key === status);
  return info?.name || status;
}
