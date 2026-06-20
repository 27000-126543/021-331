import { NavLink } from 'react-router-dom';
import { Building2, ListChecks, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/model', label: '模型导入与楼层定位', icon: Building2 },
  { path: '/issues', label: '碰撞问题清单', icon: ListChecks },
  { path: '/review', label: '调整会审记录', icon: ClipboardList },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary-600">管综协同</h1>
              <p className="text-xs text-gray-500">机电管线排布系统</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-primary-600 flex items-center justify-center text-white font-bold text-sm mx-auto">
            M
          </div>
        )}
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''} ${
                collapsed ? 'justify-center' : ''
              }`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 transition-colors"
          title={collapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
