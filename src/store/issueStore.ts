import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Issue, Discipline, Priority, IssueStatus } from '@/types';
import { mockIssues } from '@/data/mockIssues';
import { generateId, formatDateTime } from '@/utils/date';

interface IssueFilters {
  discipline: Discipline | 'all';
  status: IssueStatus | 'all';
  priority: Priority | 'all';
  floorId: string | 'all';
  keyword: string;
}

interface IssueState {
  issues: Issue[];
  filters: IssueFilters;
  selectedIssueId: string | null;
  isFormOpen: boolean;
  preselectedElementIds: string[];
  setFilters: (filters: Partial<IssueFilters>) => void;
  resetFilters: () => void;
  setSelectedIssue: (id: string | null) => void;
  openForm: (elementIds?: string[]) => void;
  closeForm: () => void;
  addIssue: (issue: Omit<Issue, 'id' | 'createdAt' | 'status'>) => void;
  updateIssue: (id: string, updates: Partial<Issue>) => void;
  deleteIssue: (id: string) => void;
  updateIssueStatus: (id: string, status: IssueStatus) => void;
  getFilteredIssues: () => Issue[];
  getIssuesForFloor: (floorId: string) => Issue[];
  getIssuesForElements: (elementIds: string[]) => Issue[];
  getSelectedIssue: () => Issue | undefined;
  getIssueStats: () => { total: number; pending: number; reviewed: number; fixing: number; completed: number };
}

export const useIssueStore = create<IssueState>()(
  persist(
    (set, get) => ({
      issues: mockIssues,
      filters: {
        discipline: 'all',
        status: 'all',
        priority: 'all',
        floorId: 'all',
        keyword: '',
      },
      selectedIssueId: null,
      isFormOpen: false,
      preselectedElementIds: [],

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      resetFilters: () =>
        set({
          filters: {
            discipline: 'all',
            status: 'all',
            priority: 'all',
            floorId: 'all',
            keyword: '',
          },
        }),

      setSelectedIssue: (id) =>
        set({ selectedIssueId: id }),

      openForm: (elementIds = []) =>
        set({ isFormOpen: true, preselectedElementIds: elementIds, selectedIssueId: null }),

      closeForm: () =>
        set({ isFormOpen: false, preselectedElementIds: [] }),

      addIssue: (issue) =>
        set((state) => ({
          issues: [
            {
              ...issue,
              id: generateId(),
              createdAt: formatDateTime(new Date()),
              status: 'pending',
            },
            ...state.issues,
          ],
          isFormOpen: false,
          preselectedElementIds: [],
        })),

      updateIssue: (id, updates) =>
        set((state) => ({
          issues: state.issues.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        })),

      deleteIssue: (id) =>
        set((state) => ({
          issues: state.issues.filter((i) => i.id !== id),
          selectedIssueId: state.selectedIssueId === id ? null : state.selectedIssueId,
        })),

      updateIssueStatus: (id, status) =>
        set((state) => ({
          issues: state.issues.map((i) => (i.id === id ? { ...i, status } : i)),
        })),

      getFilteredIssues: () => {
        const state = get();
        const { discipline, status, priority, floorId, keyword } = state.filters;
        return state.issues.filter((issue) => {
          if (discipline !== 'all' && issue.discipline !== discipline) return false;
          if (status !== 'all' && issue.status !== status) return false;
          if (priority !== 'all' && issue.priority !== priority) return false;
          if (floorId !== 'all' && issue.floorId !== floorId) return false;
          if (keyword) {
            const kw = keyword.toLowerCase();
            return (
              issue.title.toLowerCase().includes(kw) ||
              issue.affectedArea.toLowerCase().includes(kw) ||
              issue.reporter.toLowerCase().includes(kw)
            );
          }
          return true;
        });
      },

      getIssuesForFloor: (floorId) => {
        const state = get();
        return state.issues.filter((i) => i.floorId === floorId);
      },

      getIssuesForElements: (elementIds) => {
        const state = get();
        return state.issues.filter((i) =>
          i.elementIds.some((eid) => elementIds.includes(eid))
        );
      },

      getSelectedIssue: () => {
        const state = get();
        return state.issues.find((i) => i.id === state.selectedIssueId);
      },

      getIssueStats: () => {
        const state = get();
        const issues = state.getFilteredIssues();
        return {
          total: issues.length,
          pending: issues.filter((i) => i.status === 'pending').length,
          reviewed: issues.filter((i) => i.status === 'reviewed').length,
          fixing: issues.filter((i) => i.status === 'fixing').length,
          completed: issues.filter((i) => i.status === 'completed').length,
        };
      },
    }),
    {
      name: 'issue-store',
      partialize: (state) => ({
        issues: state.issues,
        filters: state.filters,
      }),
    }
  )
);
