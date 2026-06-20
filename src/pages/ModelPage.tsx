import { useState, useRef } from 'react';
import { Upload, Plus, AlertTriangle } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import ProjectTree from '@/components/ProjectTree';
import DisciplineFilter from '@/components/DisciplineFilter';
import ModelCanvas from '@/components/ModelCanvas';
import IssueForm from '@/components/IssueForm';
import { useProjectStore } from '@/store/projectStore';
import { useIssueStore } from '@/store/issueStore';
import { DISCIPLINE_LIST, STATUS_LIST } from '@/types';
import { getDisciplineColor } from '@/utils/disciplineColors';

export default function ModelPage() {
  const {
    getSelectedProject,
    getSelectedBuilding,
    getSelectedFloor,
    uploadModel,
    selectedFloorId,
    visibleDisciplines,
    getElementsForFloor,
  } = useProjectStore();
  const { isFormOpen, openForm, closeForm, getIssuesForFloor } = useIssueStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const project = getSelectedProject();
  const building = getSelectedBuilding();
  const floor = getSelectedFloor();
  const floorElements = selectedFloorId ? getElementsForFloor(selectedFloorId) : [];
  const floorIssues = selectedFloorId ? getIssuesForFloor(selectedFloorId) : [];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFloorId) return;

    setIsUploading(true);
    setTimeout(() => {
      uploadModel(selectedFloorId, file.name, '张工');
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 1000);
  };

  const stats = {
    total: floorElements.length,
    visible: floorElements.filter((e) => visibleDisciplines.includes(e.discipline)).length,
    issues: floorIssues.length,
    pendingIssues: floorIssues.filter((i) => i.status === 'pending').length,
  };

  const handleCreateIssue = () => {
    if (!selectedFloorId) {
      alert('请先选择楼层');
      return;
    }
    openForm();
  };

  const subtitle = [project?.name, building?.name, floor?.name].filter(Boolean).join(' / ');

  return (
    <PageLayout
      title="模型导入与楼层定位"
      subtitle={subtitle}
      headerRight={
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".ifc,.rvt,.dwg"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!selectedFloorId || isUploading}
            className={`btn-primary text-sm flex items-center gap-2 ${
              !selectedFloorId ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Upload className="w-4 h-4" />
            {isUploading ? '上传中...' : '上传模型'}
          </button>
          <button
            onClick={handleCreateIssue}
            disabled={!selectedFloorId}
            className={`btn-accent text-sm flex items-center gap-2 ${
              !selectedFloorId ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Plus className="w-4 h-4" />
            新建问题
          </button>
        </div>
      }
    >
      <div className="flex gap-6 h-full">
        <div className="w-72 flex-shrink-0 space-y-4">
          <ProjectTree />
          <DisciplineFilter />

          {selectedFloorId && (
            <div className="bg-white border border-gray-200 rounded p-4 space-y-4">
              <h3 className="font-semibold text-gray-800 text-sm">当前楼层统计</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded text-center">
                  <p className="text-2xl font-bold text-primary-600">{stats.visible}</p>
                  <p className="text-xs text-gray-500">可见构件</p>
                </div>
                <div className="bg-gray-50 p-3 rounded text-center">
                  <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                  <p className="text-xs text-gray-500">总构件</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">各专业构件数</p>
                {DISCIPLINE_LIST.map((d) => {
                  const count = floorElements.filter((e) => e.discipline === d.key).length;
                  const isVisible = visibleDisciplines.includes(d.key);
                  return (
                    <div
                      key={d.key}
                      className={`flex items-center gap-2 text-sm ${
                        !isVisible ? 'opacity-40' : ''
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="text-gray-600">{d.name}</span>
                      <span className="ml-auto font-medium text-gray-800">{count}</span>
                    </div>
                  );
                })}
              </div>

              {stats.issues > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 font-medium mb-2">问题统计</p>
                  <div className="space-y-1">
                    {STATUS_LIST.map((s) => {
                      const count = floorIssues.filter((i) => i.status === s.key).length;
                      if (count === 0) return null;
                      return (
                        <div
                          key={s.key}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className={`w-2 h-2 rounded-full ${s.color.split(' ')[0]}`} />
                          <span className="text-gray-600">{s.name}</span>
                          <span className="ml-auto font-medium text-gray-800">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {stats.pendingIssues > 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <span className="text-yellow-800">
                    有 {stats.pendingIssues} 个问题等待会审
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden">
          <ModelCanvas />
        </div>
      </div>

      <IssueForm isOpen={isFormOpen} onClose={closeForm} />
    </PageLayout>
  );
}
