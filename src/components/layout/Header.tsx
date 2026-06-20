import { User, Bell, Settings } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}

export default function Header({ title, subtitle, rightContent }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {rightContent}
        <button className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800">张经理</p>
            <p className="text-xs text-gray-500">BIM负责人</p>
          </div>
        </div>
      </div>
    </header>
  );
}
