import { useState } from 'react';
import { ChevronRight, ChevronDown, Building, Home, Layers } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { Project, Building as BuildingType, Floor } from '@/types';

interface TreeItemProps {
  label: string;
  icon: React.ReactNode;
  level: number;
  isExpanded?: boolean;
  isSelected?: boolean;
  hasChildren?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
}

function TreeItem({
  label,
  icon,
  level,
  isExpanded,
  isSelected,
  hasChildren,
  onToggle,
  onClick,
}: TreeItemProps) {
  return (
    <div
      className={`flex items-center gap-2 py-2 px-2 cursor-pointer rounded transition-colors ${
        isSelected
          ? 'bg-primary-100 text-primary-700 font-medium'
          : 'hover:bg-gray-100 text-gray-700'
      }`}
      style={{ paddingLeft: `${level * 16 + 8}px` }}
      onClick={onClick}
    >
      {hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className="p-0.5 hover:bg-gray-200 rounded"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>
      ) : (
        <span className="w-5" />
      )}
      <span className="flex-shrink-0">{icon}</span>
      <span className="text-sm truncate">{label}</span>
    </div>
  );
}

export default function ProjectTree() {
  const {
    projects,
    selectedProjectId,
    selectedBuildingId,
    selectedFloorId,
    setSelectedProject,
    setSelectedBuilding,
    setSelectedFloor,
    getBuildingsForProject,
    getFloorsForBuilding,
  } = useProjectStore();

  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(selectedProjectId ? [selectedProjectId] : [])
  );
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(
    new Set(selectedBuildingId ? [selectedBuildingId] : [])
  );

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const toggleBuilding = (buildingId: string) => {
    setExpandedBuildings((prev) => {
      const next = new Set(prev);
      if (next.has(buildingId)) {
        next.delete(buildingId);
      } else {
        next.add(buildingId);
      }
      return next;
    });
  };

  const handleProjectClick = (project: Project) => {
    if (selectedProjectId !== project.id) {
      setSelectedProject(project.id);
      setExpandedProjects(new Set([project.id]));
    }
  };

  const handleBuildingClick = (building: BuildingType) => {
    if (selectedBuildingId !== building.id) {
      setSelectedBuilding(building.id);
      setExpandedBuildings(new Set([building.id]));
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800 text-sm">项目结构</h3>
      </div>
      <div className="py-2 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin">
        {projects.map((project) => {
          const buildings = getBuildingsForProject(project.id);
          const isProjectExpanded = expandedProjects.has(project.id);

          return (
            <div key={project.id}>
              <TreeItem
                label={project.name}
                icon={<Building className="w-4 h-4 text-primary-600" />}
                level={0}
                hasChildren={buildings.length > 0}
                isExpanded={isProjectExpanded}
                isSelected={selectedProjectId === project.id}
                onToggle={() => toggleProject(project.id)}
                onClick={() => handleProjectClick(project)}
              />

              {isProjectExpanded &&
                buildings.map((building) => {
                  const floors = getFloorsForBuilding(building.id);
                  const isBuildingExpanded = expandedBuildings.has(building.id);

                  return (
                    <div key={building.id}>
                      <TreeItem
                        label={building.name}
                        icon={<Home className="w-4 h-4 text-accent-600" />}
                        level={1}
                        hasChildren={floors.length > 0}
                        isExpanded={isBuildingExpanded}
                        isSelected={selectedBuildingId === building.id}
                        onToggle={() => toggleBuilding(building.id)}
                        onClick={() => handleBuildingClick(building)}
                      />

                      {isBuildingExpanded &&
                        floors.map((floor) => (
                          <TreeItem
                            key={floor.id}
                            label={floor.name}
                            icon={
                              <Layers className={`w-4 h-4 ${floor.modelUrl ? 'text-green-600' : 'text-gray-400'}`} />
                            }
                            level={2}
                            isSelected={selectedFloorId === floor.id}
                            onClick={() => setSelectedFloor(floor.id)}
                          />
                        ))}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
