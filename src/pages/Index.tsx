// 主应用入口 - TabBar 路由
import { useApp } from '@/context/AppContext';
import TabBar from '@/components/layout/TabBar';
import HomePage from '@/pages/HomePage';
import WizardPage from '@/pages/WizardPage';
import DiscoverPage from '@/pages/DiscoverPage';
import ProfilePage from '@/pages/ProfilePage';

const Index = () => {
  const { activeTab } = useApp();

  const pages = [
    <HomePage key="home" />,
    <WizardPage key="wizard" />,
    <DiscoverPage key="discover" />,
    <ProfilePage key="profile" />
  ];

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      {/* 页面内容区 */}
      <main className="flex-1 overflow-y-auto pb-16">
        {pages[activeTab]}
      </main>
      {/* 底部 TabBar */}
      <TabBar />
    </div>
  );
};

export default Index;
