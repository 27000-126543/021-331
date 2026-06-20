import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useIssueStore } from '@/store/issueStore';
import { getDisciplineName, getDisciplineColor } from '@/utils/disciplineColors';
import { ModelElement } from '@/types';
import { ZoomIn, ZoomOut, Move, AlertTriangle, Plus } from 'lucide-react';

interface CanvasElementProps {
  element: ModelElement;
  isSelected: boolean;
  hasIssue: boolean;
  onClick: () => void;
}

function CanvasElement({ element, isSelected, hasIssue, onClick }: CanvasElementProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`absolute cursor-pointer transition-all duration-150 ${
        isSelected ? 'ring-2 ring-accent-500 z-20' : isHovered ? 'brightness-110 z-10' : 'z-0'
      }`}
      style={{
        left: `${element.position.x}px`,
        top: `${element.position.y}px`,
        width: `${element.position.width}px`,
        height: `${element.position.height}px`,
        backgroundColor: element.color,
        opacity: isSelected || isHovered ? 0.9 : 0.75,
        boxShadow: isSelected
          ? '0 0 0 2px rgba(232, 119, 34, 0.3), 0 4px 12px rgba(0,0,0,0.2)'
          : isHovered
          ? '0 2px 8px rgba(0,0,0,0.15)'
          : '0 1px 3px rgba(0,0,0,0.1)',
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {hasIssue && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
          <AlertTriangle className="w-3 h-3 text-white" />
        </div>
      )}

      {(isSelected || isHovered) && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-30">
          <div className="font-medium">{getDisciplineName(element.discipline)}</div>
          <div className="text-gray-300">{element.system}</div>
          <div className="text-gray-300">
            底标高: {element.bottomElevation}m | 顶标高: {element.topElevation}m
          </div>
          <div className="text-gray-300">规格: {element.size}</div>
        </div>
      )}
    </div>
  );
}

interface ElementInfoPanelProps {
  element: ModelElement;
  onCreateIssue: () => void;
}

function ElementInfoPanel({ element, onCreateIssue }: ElementInfoPanelProps) {
  const disciplineName = getDisciplineName(element.discipline);
  const disciplineColor = getDisciplineColor(element.discipline);

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 w-72 z-30">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: disciplineColor }}
        />
        <div>
          <h4 className="font-semibold text-gray-800">{disciplineName}</h4>
          <p className="text-xs text-gray-500">{element.system}</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-xs text-gray-500">底标高</p>
            <p className="font-semibold text-gray-800">{element.bottomElevation} m</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-xs text-gray-500">顶标高</p>
            <p className="font-semibold text-gray-800">{element.topElevation} m</p>
          </div>
          <div className="bg-gray-50 p-2 rounded col-span-2">
            <p className="text-xs text-gray-500">规格尺寸</p>
            <p className="font-semibold text-gray-800">{element.size}</p>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500 mb-1">构件 ID</p>
          <p className="text-xs font-mono text-gray-600">{element.id}</p>
        </div>
        <button
          onClick={onCreateIssue}
          className="w-full btn-accent flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          基于此构件创建问题
        </button>
      </div>
    </div>
  );
}

export default function ModelCanvas() {
  const {
    selectedFloorId,
    selectedElementId,
    visibleDisciplines,
    setSelectedElement,
    getElementsForFloor,
    getSelectedFloor,
    getSelectedElement,
  } = useProjectStore();
  const { openForm, getIssuesForFloor } = useIssueStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const floor = getSelectedFloor();
  const selectedElement = getSelectedElement();
  const elements = selectedFloorId ? getElementsForFloor(selectedFloorId) : [];
  const visibleElements = elements.filter((e) => visibleDisciplines.includes(e.discipline));
  const floorIssues = selectedFloorId ? getIssuesForFloor(selectedFloorId) : [];

  const elementIdsWithIssues = new Set(floorIssues.flatMap((i) => i.elementIds));

  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setSelectedElement(null);
  }, [selectedFloorId, setSelectedElement]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedElement(null);
    }
  };

  const handleZoom = (delta: number) => {
    setScale((prev) => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const handleResetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleCreateIssueFromElement = () => {
    if (selectedElement) {
      openForm([selectedElement.id]);
    }
  };

  if (!selectedFloorId) {
    return (
      <div className="model-canvas flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">请从左侧选择楼层</p>
          <p className="text-sm">加载模型后可浏览各专业管线</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {floor && floor.modelUrl && (
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{floor.name}</span>
            <span className="mx-2">|</span>
            <span>标高: {floor.elevation}m</span>
            <span className="mx-2">|</span>
            <span>上传: {floor.modelUploadedBy} - {floor.modelUploadedAt}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">缩放: {Math.round(scale * 100)}%</span>
            <button
              onClick={() => handleZoom(0.1)}
              className="p-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              title="放大"
            >
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => handleZoom(-0.1)}
              className="p-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              title="缩小"
            >
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              title="重置视图"
            >
              <Move className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={`model-canvas flex-1 relative overflow-hidden ${
          isPanning ? 'cursor-grabbing' : 'cursor-default'
        }`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onClick={handleCanvasClick}
      >
        <div
          className="absolute transition-transform duration-75"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            width: '800px',
            height: '600px',
            top: '50%',
            left: '50%',
            marginLeft: '-400px',
            marginTop: '-300px',
          }}
        >
          {visibleElements.map((element) => (
            <CanvasElement
              key={element.id}
              element={element}
              isSelected={selectedElementId === element.id}
              hasIssue={elementIdsWithIssues.has(element.id)}
              onClick={() => setSelectedElement(element.id)}
            />
          ))}
        </div>

        {!floor?.modelUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80">
            <div className="text-center bg-white p-8 rounded-lg shadow-md border border-gray-200">
              <p className="text-lg text-gray-600 mb-4">该楼层暂无模型</p>
              <button className="btn-primary text-sm">上传模型</button>
            </div>
          </div>
        )}

        {selectedElement && (
          <ElementInfoPanel
            element={selectedElement}
            onCreateIssue={handleCreateIssueFromElement}
          />
        )}

        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-200 text-xs text-gray-500">
          <p>提示：点击构件查看属性 | Alt+拖动平移视图</p>
        </div>
      </div>
    </div>
  );
}
