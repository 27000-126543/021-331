import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, Building, Floor, ModelElement, Discipline } from '@/types';
import { mockProjects, mockBuildings, mockFloors } from '@/data/mockProjects';
import { mockElements } from '@/data/mockElements';

interface ProjectState {
  projects: Project[];
  buildings: Building[];
  floors: Floor[];
  elements: ModelElement[];
  selectedProjectId: string | null;
  selectedBuildingId: string | null;
  selectedFloorId: string | null;
  selectedElementId: string | null;
  visibleDisciplines: Discipline[];
  setSelectedProject: (id: string | null) => void;
  setSelectedBuilding: (id: string | null) => void;
  setSelectedFloor: (id: string | null) => void;
  setSelectedElement: (id: string | null) => void;
  toggleDiscipline: (discipline: Discipline) => void;
  setAllDisciplines: (visible: boolean) => void;
  uploadModel: (floorId: string, fileName: string, uploadedBy: string) => void;
  getElementsForFloor: (floorId: string) => ModelElement[];
  getFloorsForBuilding: (buildingId: string) => Floor[];
  getBuildingsForProject: (projectId: string) => Building[];
  getSelectedProject: () => Project | undefined;
  getSelectedBuilding: () => Building | undefined;
  getSelectedFloor: () => Floor | undefined;
  getSelectedElement: () => ModelElement | undefined;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: mockProjects,
      buildings: mockBuildings,
      floors: mockFloors,
      elements: mockElements,
      selectedProjectId: 'proj-001',
      selectedBuildingId: 'bld-001',
      selectedFloorId: 'floor-001',
      selectedElementId: null,
      visibleDisciplines: ['airduct', 'waterpipe', 'cabletray', 'firepipe'],

      setSelectedProject: (id) =>
        set({ selectedProjectId: id, selectedBuildingId: null, selectedFloorId: null, selectedElementId: null }),

      setSelectedBuilding: (id) =>
        set({ selectedBuildingId: id, selectedFloorId: null, selectedElementId: null }),

      setSelectedFloor: (id) =>
        set({ selectedFloorId: id, selectedElementId: null }),

      setSelectedElement: (id) =>
        set({ selectedElementId: id }),

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
      }),
    }
  )
);
