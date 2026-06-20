import Sidebar from './Sidebar';
import Header from './Header';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

export default function PageLayout({ title, subtitle, headerRight, children }: PageLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} subtitle={subtitle} rightContent={headerRight} />
        <main className="flex-1 overflow-auto p-6 scrollbar-thin">{children}</main>
      </div>
    </div>
  );
}
