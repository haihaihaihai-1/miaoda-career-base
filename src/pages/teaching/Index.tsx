/**
 * Teaching brand - 顶层容器（视图状态机）
 *   - 'home' : LearningHome（默认）
 *   - 'course' : CoursePage（点击课程卡片）
 *   - 'gaps'  : KnowledgeGapPage（点击"知识点弱项"标题）
 */
import { useState } from 'react';
import LearningHome from './LearningHome';
import CoursePage from './CoursePage';
import KnowledgeGapPage from './KnowledgeGapPage';

type View =
  | { name: 'home' }
  | { name: 'course'; courseId: string; courseName: string }
  | { name: 'gaps' };

export default function TeachingIndex() {
  const [view, setView] = useState<View>({ name: 'home' });

  if (view.name === 'course') {
    return (
      <CoursePage
        courseId={view.courseId}
        courseName={view.courseName}
        onBack={() => setView({ name: 'home' })}
      />
    );
  }
  if (view.name === 'gaps') {
    return <KnowledgeGapPage onBack={() => setView({ name: 'home' })} />;
  }

  return (
    <LearningHome
      onOpenCourse={(courseId, courseName) =>
        setView({ name: 'course', courseId, courseName })
      }
      onOpenGaps={() => setView({ name: 'gaps' })}
    />
  );
}
