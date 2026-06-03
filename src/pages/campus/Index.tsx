/**
 * Campus brand - 顶层容器
 */
import { useState } from 'react';
import CampusHome from './CampusHome';
import SchedulePage from './SchedulePage';
import ServicesPage from './ServicesPage';

type View = 'home' | 'schedule' | 'services';

export default function CampusIndex() {
  const [view, setView] = useState<View>('home');

  if (view === 'schedule') return <SchedulePage onBack={() => setView('home')} />;
  if (view === 'services') return <ServicesPage onBack={() => setView('home')} />;

  return (
    <CampusHome
      onOpenSchedule={() => setView('schedule')}
      onOpenServices={() => setView('services')}
    />
  );
}
