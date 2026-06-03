// 底部 TabBar 布局组件
import { Home, ClipboardList, Compass, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const TAB_ITEMS = [
  { icon: Home, label: '职业路径', index: 0 },
  { icon: ClipboardList, label: '引导', index: 1 },
  { icon: Compass, label: '发现', index: 2 },
  { icon: User, label: '我的', index: 3 }
];

const TabBar: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-stretch h-16 max-w-2xl mx-auto">
        {TAB_ITEMS.map(({ icon: Icon, label, index }) => {
          const isActive = activeTab === index;
          return (
            <button
              key={index}
              type="button"
              onClick={() => setActiveTab(index)}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-200 min-h-12',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className="shrink-0 w-5 h-5"
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className={cn('text-[10px] leading-none font-medium', isActive ? 'text-primary' : '')}>
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TabBar;
