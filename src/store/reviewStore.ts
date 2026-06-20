import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ReviewRecord, HandlingType, Issue, MeetingRecord } from '@/types';
import { mockReviews } from '@/data/mockReviews';
import { generateId, formatDateTime } from '@/utils/date';
import { useIssueStore } from './issueStore';

interface ReviewState {
  reviews: ReviewRecord[];
  meetings: MeetingRecord[];
  selectedReviewIssueIds: string[];
  isReviewPanelOpen: boolean;
  currentReviewIssueId: string | null;
  isBatchReviewActive: boolean;
  batchReviewIssueIds: string[];
  currentBatchIndex: number;
  currentMeetingId: string | null;
  setSelectedReviewIssues: (ids: string[]) => void;
  toggleSelectedIssue: (issueId: string) => void;
  selectAllPending: () => void;
  clearSelection: () => void;
  openReviewPanel: (issueId: string) => void;
  closeReviewPanel: () => void;
  addReview: (review: Omit<ReviewRecord, 'id' | 'reviewedAt'>) => void;
  updateReview: (id: string, updates: Partial<ReviewRecord>) => void;
  confirmReview: (reviewId: string) => void;
  getReviewForIssue: (issueId: string) => ReviewRecord | undefined;
  getReviewsForFloor: (floorId: string, issues: { id: string; floorId: string }[]) => ReviewRecord[];
  getGroupedForExport: (
    issues: Issue[],
    floors: { id: string; name: string }[]
  ) => {
    floorName: string;
    disciplineName: string;
    items: {
      issueTitle: string;
      affectedArea: string;
      handling: string;
      responsibleUnit: string;
      deadline: string;
      status: string;
      confirmed: boolean;
    }[];
  }[];
  startBatchReview: (issueIds: string[], meetingInfo?: Partial<MeetingRecord>) => void;
  nextBatchReview: () => void;
  prevBatchReview: () => void;
  completeBatchReview: () => void;
  cancelBatchReview: () => void;
  createMeeting: (meeting: Omit<MeetingRecord, 'id' | 'createdAt'>) => MeetingRecord;
  getMeeting: (meetingId: string) => MeetingRecord | undefined;
  getMeetings: () => MeetingRecord[];
  updateMeeting: (meetingId: string, updates: Partial<MeetingRecord>) => void;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      reviews: mockReviews,
      meetings: [],
      selectedReviewIssueIds: [],
      isReviewPanelOpen: false,
      currentReviewIssueId: null,
      isBatchReviewActive: false,
      batchReviewIssueIds: [],
      currentBatchIndex: 0,
      currentMeetingId: null,

      setSelectedReviewIssues: (ids) =>
        set({ selectedReviewIssueIds: ids }),

      toggleSelectedIssue: (issueId) =>
        set((state) => ({
          selectedReviewIssueIds: state.selectedReviewIssueIds.includes(issueId)
            ? state.selectedReviewIssueIds.filter((id) => id !== issueId)
            : [...state.selectedReviewIssueIds, issueId],
        })),

      selectAllPending: () => {
        const issueState = useIssueStore.getState();
        const pendingIds = issueState.issues
          .filter((i) => i.status === 'pending')
          .map((i) => i.id);
        set({ selectedReviewIssueIds: pendingIds });
      },

      clearSelection: () =>
        set({ selectedReviewIssueIds: [] }),

      openReviewPanel: (issueId) =>
        set({ isReviewPanelOpen: true, currentReviewIssueId: issueId }),

      closeReviewPanel: () =>
        set({ isReviewPanelOpen: false, currentReviewIssueId: null }),

      addReview: (review) =>
        set((state) => {
          const newReview = {
            ...review,
            id: generateId(),
            reviewedAt: formatDateTime(new Date()),
            meetingId: state.isBatchReviewActive ? state.currentMeetingId || undefined : undefined,
          };

          const newState = {
            reviews: [newReview, ...state.reviews],
            selectedReviewIssueIds: state.selectedReviewIssueIds.filter(
              (id) => id !== review.issueId
            ),
          };

          if (state.isBatchReviewActive) {
            if (state.currentBatchIndex < state.batchReviewIssueIds.length - 1) {
              const nextIndex = state.currentBatchIndex + 1;
              return {
                ...newState,
                currentBatchIndex: nextIndex,
                currentReviewIssueId: state.batchReviewIssueIds[nextIndex],
                isReviewPanelOpen: true,
                meetings: state.currentMeetingId
                  ? state.meetings.map((m) =>
                      m.id === state.currentMeetingId
                        ? { ...m, reviewRecordIds: [...m.reviewRecordIds, newReview.id] }
                        : m
                    )
                  : state.meetings,
              };
            } else {
              return {
                ...newState,
                isBatchReviewActive: false,
                batchReviewIssueIds: [],
                currentBatchIndex: 0,
                currentReviewIssueId: null,
                isReviewPanelOpen: false,
                currentMeetingId: null,
                meetings: state.currentMeetingId
                  ? state.meetings.map((m) =>
                      m.id === state.currentMeetingId
                        ? { ...m, reviewRecordIds: [...m.reviewRecordIds, newReview.id] }
                        : m
                    )
                  : state.meetings,
              };
            }
          }

          return {
            ...newState,
            isReviewPanelOpen: false,
            currentReviewIssueId: null,
          };
        }),

      updateReview: (id, updates) =>
        set((state) => ({
          reviews: state.reviews.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),

      confirmReview: (reviewId) =>
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.id === reviewId
              ? { ...r, confirmed: true, confirmedAt: formatDateTime(new Date()) }
              : r
          ),
        })),

      getReviewForIssue: (issueId) => {
        const state = get();
        return state.reviews.find((r) => r.issueId === issueId);
      },

      getReviewsForFloor: (floorId, issues) => {
        const state = get();
        const floorIssueIds = issues.filter((i) => i.floorId === floorId).map((i) => i.id);
        return state.reviews.filter((r) => floorIssueIds.includes(r.issueId));
      },

      getGroupedForExport: (issues, floors) => {
        const state = get();
        const disciplineMap: Record<string, string> = {
          airduct: '风管',
          waterpipe: '水管',
          cabletray: '桥架',
          firepipe: '消防管',
        };
        const handlingMap: Record<HandlingType, string> = {
          lift_up: '上翻',
          go_under: '下绕',
          side_corridor: '改走廊侧边',
          custom: '自定义',
        };
        const statusMap: Record<string, string> = {
          pending: '待会审',
          reviewed: '已会审',
          fixing: '整改中',
          completed: '已完成',
        };

        const floorMap = new Map(floors.map((f) => [f.id, f.name]));
        const issueMap = new Map(issues.map((i) => [i.id, i]));

        const grouped: Record<string, Record<string, typeof state.reviews>> = {};

        for (const review of state.reviews) {
          const issue = issueMap.get(review.issueId);
          if (!issue) continue;

          const floorName = floorMap.get(issue.floorId) || '未知楼层';
          const disciplineName = disciplineMap[issue.discipline] || '未知专业';

          if (!grouped[floorName]) {
            grouped[floorName] = {};
          }
          if (!grouped[floorName][disciplineName]) {
            grouped[floorName][disciplineName] = [];
          }
          grouped[floorName][disciplineName].push(review);
        }

        const result: {
          floorName: string;
          disciplineName: string;
          items: {
            issueTitle: string;
            affectedArea: string;
            handling: string;
            responsibleUnit: string;
            deadline: string;
            status: string;
            confirmed: boolean;
          }[];
        }[] = [];

        for (const [floorName, disciplines] of Object.entries(grouped)) {
          for (const [disciplineName, reviews] of Object.entries(disciplines)) {
            const items = reviews.map((r) => {
              const issue = issues.find((i) => i.id === r.issueId);
              return {
                issueTitle: issue?.title || '',
                affectedArea: issue?.affectedArea || '',
                handling: r.customHandling || handlingMap[r.handling],
                responsibleUnit: r.responsibleUnit,
                deadline: issue?.deadline || '',
                status: statusMap[issue?.status || ''] || '',
                confirmed: r.confirmed,
              };
            });
            result.push({ floorName, disciplineName, items });
          }
        }

        return result.sort((a, b) => a.floorName.localeCompare(b.floorName));
      },

      startBatchReview: (issueIds, meetingInfo) => {
        const state = get();
        let meetingId = state.currentMeetingId;

        if (!meetingId && issueIds.length > 0) {
          const meeting: MeetingRecord = {
            id: generateId(),
            name: meetingInfo?.name || `会审会议 - ${formatDateTime(new Date())}`,
            date: meetingInfo?.date || new Date().toISOString().split('T')[0],
            host: meetingInfo?.host || '刘总（BIM负责人）',
            attendees: meetingInfo?.attendees || ['刘总（BIM负责人）', '各专业分包负责人'],
            issueIds: [...issueIds],
            reviewRecordIds: [],
            notes: meetingInfo?.notes || '',
            createdAt: formatDateTime(new Date()),
          };
          set((state) => ({
            meetings: [meeting, ...state.meetings],
            currentMeetingId: meeting.id,
          }));
          meetingId = meeting.id;
        }

        set({
          isBatchReviewActive: true,
          batchReviewIssueIds: [...issueIds],
          currentBatchIndex: 0,
          isReviewPanelOpen: true,
          currentReviewIssueId: issueIds[0] || null,
        });
      },

      nextBatchReview: () => {
        const state = get();
        if (state.currentBatchIndex < state.batchReviewIssueIds.length - 1) {
          const nextIndex = state.currentBatchIndex + 1;
          set({
            currentBatchIndex: nextIndex,
            currentReviewIssueId: state.batchReviewIssueIds[nextIndex],
            isReviewPanelOpen: true,
          });
        } else {
          get().completeBatchReview();
        }
      },

      prevBatchReview: () => {
        const state = get();
        if (state.currentBatchIndex > 0) {
          const prevIndex = state.currentBatchIndex - 1;
          set({
            currentBatchIndex: prevIndex,
            currentReviewIssueId: state.batchReviewIssueIds[prevIndex],
            isReviewPanelOpen: true,
          });
        }
      },

      completeBatchReview: () => {
        const state = get();
        const reviewedIds = state.batchReviewIssueIds.filter((id) =>
          state.reviews.some((r) => r.issueId === id)
        );

        if (state.currentMeetingId) {
          set((state) => ({
            meetings: state.meetings.map((m) =>
              m.id === state.currentMeetingId
                ? { ...m, reviewRecordIds: [...m.reviewRecordIds, ...state.reviews.filter((r) => m.issueIds.includes(r.issueId)).map((r) => r.id)] }
                : m
            ),
          }));
        }

        set({
          isBatchReviewActive: false,
          batchReviewIssueIds: [],
          currentBatchIndex: 0,
          currentReviewIssueId: null,
          isReviewPanelOpen: false,
          currentMeetingId: null,
          selectedReviewIssueIds: [],
        });
      },

      cancelBatchReview: () => {
        set({
          isBatchReviewActive: false,
          batchReviewIssueIds: [],
          currentBatchIndex: 0,
          currentReviewIssueId: null,
          isReviewPanelOpen: false,
          currentMeetingId: null,
        });
      },

      createMeeting: (meeting) => {
        const newMeeting: MeetingRecord = {
          ...meeting,
          id: generateId(),
          createdAt: formatDateTime(new Date()),
        };
        set((state) => ({
          meetings: [newMeeting, ...state.meetings],
        }));
        return newMeeting;
      },

      getMeeting: (meetingId) => {
        return get().meetings.find((m) => m.id === meetingId);
      },

      getMeetings: () => {
        return get().meetings;
      },

      updateMeeting: (meetingId, updates) => {
        set((state) => ({
          meetings: state.meetings.map((m) =>
            m.id === meetingId ? { ...m, ...updates } : m
          ),
        }));
      },
    }),
    {
      name: 'review-store',
      partialize: (state) => ({
        reviews: state.reviews,
        meetings: state.meetings,
      }),
    }
  )
);
