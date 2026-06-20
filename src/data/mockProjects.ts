import { Project, Building, Floor } from '@/types';

export const mockProjects: Project[] = [
  {
    id: 'proj-001',
    name: '城市商业综合体项目',
    description: '集商业、办公、酒店于一体的大型综合体项目',
    createdAt: '2026-01-15',
  },
  {
    id: 'proj-002',
    name: '科技园研发中心',
    description: '高新技术企业研发办公大楼',
    createdAt: '2026-02-20',
  },
];

export const mockBuildings: Building[] = [
  {
    id: 'bld-001',
    projectId: 'proj-001',
    name: 'A座商业楼',
    floors: 5,
  },
  {
    id: 'bld-002',
    projectId: 'proj-001',
    name: 'B座办公楼',
    floors: 20,
  },
  {
    id: 'bld-003',
    projectId: 'proj-002',
    name: '1号研发楼',
    floors: 12,
  },
];

export const mockFloors: Floor[] = [
  {
    id: 'floor-001',
    buildingId: 'bld-001',
    name: 'B1层',
    elevation: -3.6,
    modelUrl: '/models/b1.ifc',
    modelUploadedBy: '张工',
    modelUploadedAt: '2026-03-10 14:30',
  },
  {
    id: 'floor-002',
    buildingId: 'bld-001',
    name: '1层',
    elevation: 0.0,
    modelUrl: '/models/f1.ifc',
    modelUploadedBy: '张工',
    modelUploadedAt: '2026-03-10 15:00',
  },
  {
    id: 'floor-003',
    buildingId: 'bld-001',
    name: '2层',
    elevation: 4.5,
    modelUrl: '/models/f2.ifc',
    modelUploadedBy: '李工',
    modelUploadedAt: '2026-03-11 09:15',
  },
  {
    id: 'floor-004',
    buildingId: 'bld-001',
    name: '3层',
    elevation: 9.0,
  },
  {
    id: 'floor-005',
    buildingId: 'bld-001',
    name: '4层',
    elevation: 13.5,
  },
  {
    id: 'floor-006',
    buildingId: 'bld-002',
    name: '1层',
    elevation: 0.0,
    modelUrl: '/models/office-f1.ifc',
    modelUploadedBy: '王工',
    modelUploadedAt: '2026-03-12 10:00',
  },
  {
    id: 'floor-007',
    buildingId: 'bld-003',
    name: '1层',
    elevation: 0.0,
  },
];
