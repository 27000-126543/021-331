import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, Building, Floor, ModelElement, Discipline, CollisionPoint } from '@/types';
import { mockProjects, mockBuildings, mockFloors } from '@/data/mockProjects';
import { mockElements } from '@/data/mockElements';
import { detectCollisions } from '@/utils/collision';

interface ProjectState {
  projects: Project[];
  buildings: Building[];
  floors: Floor[];
  elements: ModelElement[];
  collisions: CollisionPoint[];
  selectedProjectId: string | null;
  selectedBuildingId: string | null;
  selectedFloorId: string | null;
  selectedElementId: string | null;
  selectedCollisionId: string | null;
  visibleDisciplines: Discipline[];
  showCollisions: boolean;
  setSelectedProject: (id: string | null) => void;
  setSelectedBuilding: (id: string | null) => void;
  setSelectedFloor: (id: string | null) => void;
  setSelectedElement: (id: string | null) => void;
  setSelectedCollision: (id: string | null) => void;
  toggleDiscipline: (discipline: Discipline) => void;
  setAllDisciplines: (visible: boolean) => void;
  toggleShowCollisions: () => void;
  uploadModel: (floorId: string, fileName: string, uploadedBy: string) => void;
  detectCollisionsForFloor: (floorId: string) => CollisionPoint[];
  getElementsForFloor: (floorId: string) => ModelElement[];
  getFloorsForBuilding: (buildingId: string) => Floor[];
  getBuildingsForProject: (projectId: string) => Building[];
  getSelectedProject: () => Project | undefined;
  getSelectedBuilding: () => Building | undefined;
  getSelectedFloor: () => Floor | undefined;
  getSelectedElement: () => ModelElement | undefined;
  getSelectedCollision: () => CollisionPoint | undefined;
  getCollisionsForFloor: (floorId: string) => CollisionPoint[];
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: mockProjects,
      buildings: mockBuildings,
      floors: mockFloors,
      elements: mockElements,
      collisions: [],
      selectedProjectId: 'proj-001',
      selectedBuildingId: 'bld-001',
      selectedFloorId: 'floor-001',
      selectedElementId: null,
      selectedCollisionId: null,
      visibleDisciplines: ['airduct', 'waterpipe', 'cabletray', 'firepipe'],
      showCollisions: true,

      setSelectedProject: (id) =>
        set({ selectedProjectId: id, selectedBuildingId: null, selectedFloorId: null, selectedElementId: null, selectedCollisionId: null, collisions: [] }),

      setSelectedBuilding: (id) =>
        set({ selectedBuildingId: id, selectedFloorId: null, selectedElementId: null, selectedCollisionId: null, collisions: [] }),

      setSelectedFloor: (id) =>
        set({ selectedFloorId: id, selectedElementId: null, selectedCollisionId: null, collisions: [] }),

      setSelectedElement: (id) =>
        set({ selectedElementId: id, selectedCollisionId: null }),

      setSelectedCollision: (id) =>
        set({ selectedCollisionId: id, selectedElementId: null }),

      toggleDiscipline: (discipline) =>
        set((state) => ({
          visibleDisciplines: state.visibleDisciplines.includes(discipline)
            ? state.visibleDisciplines.filter((d) => d !== discipline)
            : [...state.visibleDisciplines, discipline],
        })),

      setAllDisciplines: (visible) =>
        set({
          visibleDisciplines: visible
            ? ['airduct', 'waterpipe', 'cabletray', 'firepipe']
            : [],
        }),

      toggleShowCollisions: () =>
        set((state) => ({ showCollisions: !state.showCollisions })),

      uploadModel: (floorId, fileName, uploadedBy) =>
        set((state) => ({
          floors: state.floors.map((f) =>
            f.id === floorId
              ? {
                  ...f,
                  modelUrl: `/models/${fileName}`,
                  modelUploadedBy: uploadedBy,
                  modelUploadedAt: new Date().toLocaleString('zh-CN'),
                }
              : f
          ),
        })),

      detectCollisionsForFloor: (floorId) => {
        const state = get();
        const elements = state.getElementsForFloor(floorId);
        const visibleElements = elements.filter((e) =>
          state.visibleDisciplines.includes(e.discipline)
        );
        const collisions = detectCollisions(visibleElements);
        set({ collisions });
        return collisions;
      },

      getElementsForFloor: (floorId) => {
        const state = get();
        return state.elements.filter((e) => e.floorId === floorId);
      },

      getFloorsForBuilding: (buildingId) => {
        const state = get();
        return state.floors.filter((f) => f.buildingId === buildingId);
      },

      getBuildingsForProject: (projectId) => {
        const state = get();
        return state.buildings.filter((b) => b.projectId === projectId);
      },

      getSelectedProject: () => {
        const state = get();
        return state.projects.find((p) => p.id === state.selectedProjectId);
      },

      getSelectedBuilding: () => {
        const state = get();
        return state.buildings.find((b) => b.id === state.selectedBuildingId);
      },

      getSelectedFloor: () => {
        const state = get();
        return state.floors.find((f) => f.id === state.selectedFloorId);
      },

      getSelectedElement: () => {
        const state = get();
        return state.elements.find((e) => e.id === state.selectedElementId);
      },

      getSelectedCollision: () => {
        const state = get();
        return state.collisions.find((c) => c.id === state.selectedCollisionId);
      },

      getCollisionsForFloor: (floorId) => {
        const state = get();
        return state.collisions;
      },
    }),
    {
      name: 'project-store',
      partialize: (state) => ({
        projects: state.projects,
        buildings: state.buildings,
        floors: state.floors,
        elements: state.elements,
        selectedProjectId: state.selectedProjectId,
        selectedBuildingId: state.selectedBuildingId,
        selectedFloorId: state.selectedFloorId,
        visibleDisciplines: state.visibleDisciplines,
        showCollisions: state.showCollisions,
      }),
    }
  )
);
