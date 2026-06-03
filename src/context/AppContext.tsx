// 全局状态管理 Context
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Student, CareerPath, Milestone, WizardFormData } from '@/types/types';
import { demoStudent, demoCareerPath, demoMilestones } from '@/data/demoData';
import { generateCareerPath } from '@/utils/pathAnalysis';
import {
  isDifyConfigured,
  collectStudentProfile,
  analyzeSkillGap,
  generatePathFromDify,
  type StudentProfile,
} from '@/services/difyApi';
import { courses } from '@/data/courses';
import { toast } from 'sonner';

/** 全局应用状态 */
interface AppState {
  student: Student | null;
  careerPath: CareerPath | null;
  milestones: Milestone[];
  activeTab: number;
  isDemo: boolean;
  /** AI分析加载中（显示加载状态） */
  aiLoading: boolean;
  /** AI加载阶段描述 */
  aiLoadingStep: string;
}

/** Context 操作方法 */
interface AppContextValue extends AppState {
  setActiveTab: (tab: number) => void;
  submitWizard: (data: WizardFormData) => void;
  loadDemo: () => void;
  clearData: () => void;
  updateMilestone: (id: number, progress: number) => void;
  completeMilestone: (id: number) => void;
  /** 加载预设演示场景（快速入门卡片） */
  loadPreset: (presetKey: 'java' | 'ai' | 'robot') => void;
  /** 从发现页预填目标岗位，跳转引导页 */
  prefillTargetRole: (role: string) => void;
  /** 引导页预填的目标岗位（单次消费） */
  wizardPrefillRole: string;
  /** 最近完成的里程碑 title（用于 AI 顾问主动推送），完成一次就更新 */
  lastCompletedMilestoneTitle: string;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = 'career_navigator_state';
const PROGRESS_KEY = 'career_path_progress';
const ONE_HOUR_MS = 60 * 60 * 1000;

// ---- 预设演示场景数据 ----
import { demoCareerPath as _demoCp } from '@/data/demoData';
const PRESETS: Record<string, Partial<WizardFormData>> = {
  java: {
    name: '张三', major: '软件技术', grade: '大二', education: '高职',
    skills: ['Java', 'HTML/CSS', 'SQL', 'Git'], skill_score: 3,
    target_role: 'Java开发工程师', career_interest: ['Web开发', '后端开发'],
    learning_goal: '掌握企业级Java后端开发技术', daily_hours: '1-2小时',
    study_period: '6个月', budget: '500元以下',
    learning_style: '动手型', learning_pace: '稳健',
    background: [], learning_methods: [],
  },
  ai: {
    name: '李四', major: '人工智能技术应用', grade: '大二', education: '高职',
    skills: ['Python', 'SQL'], skill_score: 2,
    target_role: 'AI应用开发工程师', career_interest: ['AI/机器学习', '数据分析'],
    learning_goal: '掌握AI应用开发与大模型调用', daily_hours: '2-4小时',
    study_period: '9个月', budget: '500元以下',
    learning_style: '探索型', learning_pace: '积极',
    background: [], learning_methods: [],
  },
  robot: {
    name: '王五', major: '智能制造装备技术', grade: '大三', education: '高职',
    skills: ['PLC编程'], skill_score: 2,
    target_role: '工业机器人运维工程师', career_interest: ['嵌入式', '智能制造'],
    learning_goal: '掌握工业机器人运维与系统集成', daily_hours: '1-2小时',
    study_period: '6个月', budget: '1000元以下',
    learning_style: '动手型', learning_pace: '稳健',
    background: [], learning_methods: [],
  },
};

// ---- 工具函数 ----

const buildStudent = (data: WizardFormData): Student => ({
  id: Date.now(),
  name: data.name || '未命名',
  major: data.major || '未填写',
  grade: (data.grade as Student['grade']) || '大一',
  education: (data.education as Student['education']) || '高职',
  certificates: [],
  skills: data.skills,
  career_interest: data.career_interest,
  target_role: data.target_role || '待确定',
  current_level: Math.ceil(data.skill_score / 1.5) || 2,
  weekly_hours:
    data.daily_hours === '4小时以上' ? 28
    : data.daily_hours === '2-4小时' ? 21
    : data.daily_hours === '1-2小时' ? 14 : 7,
  learning_style: data.learning_style,
  learning_pace: data.learning_pace,
  budget: data.budget,
  created_at: new Date().toISOString(),
});

const buildMilestones = (path: CareerPath): Milestone[] => {
  const milestones: Milestone[] = [];
  let id = 1;
  path.stages.forEach((stage) => {
    const isFirst = stage.stage === 1;
    milestones.push({
      id: id++, path_id: path.id, stage: stage.stage,
      title: `${stage.name}启动 - ${stage.target_level}`,
      description: `完成${stage.name}核心学习任务，掌握${stage.courses.slice(0, 2).join('、')}等技能`,
      duration: `${stage.weeks_range}前半段（约${Math.floor(stage.estimated_hours / 2)}小时）`,
      status: isFirst ? 'current' : 'upcoming',
      progress: isFirst ? 30 : 0,
      skills: stage.courses,
      resources: [
        ...stage.github_projects.map((p) => ({
          type: 'github' as const, title: p.name,
          description: `${p.stars} ${p.description}`, url: p.url, badge: 'GitHub实训',
        })),
        ...stage.certificates.slice(0, 1).map((c) => ({
          type: 'certificate' as const, title: c, description: '建议同期备考', badge: '考证建议',
        })),
      ],
    });
    milestones.push({
      id: id++, path_id: path.id, stage: stage.stage,
      title: `${stage.name}冲刺 - 阶段达标`,
      description: `完成${stage.name}所有学习目标，准备阶段评估与考证`,
      duration: `${stage.weeks_range}后半段（约${Math.ceil(stage.estimated_hours / 2)}小时）`,
      status: 'upcoming', progress: 0,
      skills: stage.milestones || [],
      resources: stage.certificates.map((c) => ({
        type: 'certificate' as const, title: c, description: '阶段末参加考试', badge: '1+X考证',
      })),
    });
  });
  if (milestones.length > 0) { milestones[0].status = 'current'; milestones[0].progress = 30; }
  return milestones;
};

/** 保存里程碑进度到 localStorage（带时间戳） */
const saveProgress = (milestones: Milestone[]) => {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ milestones, savedAt: Date.now() }));
  } catch { /* ignore */ }
};

/** 从 localStorage 恢复进度（1小时内有效） */
const loadProgress = (): Milestone[] | null => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const { milestones, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > ONE_HOUR_MS) return null;
    return milestones as Milestone[];
  } catch { return null; }
};

// ---- Provider ----

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wizardPrefillRole, setWizardPrefillRole] = useState('');
  const [lastCompletedMilestoneTitle, setLastCompletedMilestoneTitle] = useState('');

  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AppState;
        // 尝试恢复里程碑进度（1小时TTL）
        const progress = loadProgress();
        if (progress && parsed.milestones?.length > 0) {
          // 用保存的进度覆盖 status/progress 字段
          const merged = parsed.milestones.map((m, i) => {
            const saved = progress.find((p) => p.id === m.id);
            return saved ? { ...m, status: saved.status, progress: saved.progress } : m;
          });
          return { ...parsed, milestones: merged, aiLoading: false, aiLoadingStep: '' };
        }
        return { ...parsed, aiLoading: false, aiLoadingStep: '' };
      }
    } catch { /* ignore */ }
    return {
      student: demoStudent, careerPath: demoCareerPath, milestones: demoMilestones,
      activeTab: 0, isDemo: true, aiLoading: false, aiLoadingStep: '',
    };
  });

  // 持久化到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* ignore */ }
  }, [state]);

  // 里程碑变更时保存进度
  useEffect(() => {
    if (state.milestones.length > 0) saveProgress(state.milestones);
  }, [state.milestones]);

  const setActiveTab = useCallback((tab: number) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  /** 引导页提交：优先调用 Dify API，失败则 fallback 本地 */
  const submitWizard = useCallback((data: WizardFormData) => {
    void (async () => {
    const student = buildStudent(data);

    // 如果未配置 Dify，直接走本地逻辑
    if (!isDifyConfigured()) {
      const careerPath = generateCareerPath(student);
      const milestones = buildMilestones(careerPath);
      setState({ student, careerPath, milestones, activeTab: 0, isDemo: false, aiLoading: false, aiLoadingStep: '' });
      toast.success('路径已生成！');
      return;
    }

    // 开始 AI 分析
    setState((prev) => ({ ...prev, aiLoading: true, aiLoadingStep: 'AI正在采集你的学习档案…' }));

    const profile: StudentProfile = {
      name: data.name, education: data.education as string, major: data.major,
      grade: data.grade as string, skills: data.skills, background: data.background,
      career_interest: data.career_interest, target_role: data.target_role,
      learning_goal: data.learning_goal, daily_hours: data.daily_hours,
      study_period: data.study_period,
    };

    try {
      // 节点1：画像采集
      await collectStudentProfile(profile).catch(() => null);

      // 节点2：差距分析
      setState((prev) => ({ ...prev, aiLoadingStep: 'AI正在分析你的能力差距…' }));
      const gapResult = await analyzeSkillGap(profile, student.current_level).catch(() => null);

      // 节点4：路径生成
      setState((prev) => ({ ...prev, aiLoadingStep: 'AI正在生成个性化学习路径…' }));
      const courseIds = courses.filter((c) => c.major === data.major).map((c) => String(c.id));
      const aiPath = gapResult
        ? await generatePathFromDify(profile, gapResult, courseIds).catch(() => null)
        : null;

      if (aiPath && aiPath.stages?.length > 0) {
        // AI 路径成功
        const milestones = buildMilestones(aiPath);
        setState({ student, careerPath: aiPath, milestones, activeTab: 0, isDemo: false, aiLoading: false, aiLoadingStep: '' });
        toast.success('AI路径已生成！');
      } else {
        throw new Error('AI返回数据不完整');
      }
    } catch {
      // Fallback：本地路径生成
      toast.warning('AI服务暂不可用，使用本地路径生成');
      const careerPath = generateCareerPath(student);
      const milestones = buildMilestones(careerPath);
      setState({ student, careerPath, milestones, activeTab: 0, isDemo: false, aiLoading: false, aiLoadingStep: '' });
    }
    })();
  }, []);

  const loadDemo = useCallback(() => {
    setState({
      student: demoStudent, careerPath: demoCareerPath, milestones: demoMilestones,
      activeTab: 0, isDemo: true, aiLoading: false, aiLoadingStep: '',
    });
  }, []);

  /** 加载预设场景（快速入门） */
  const loadPreset = useCallback((presetKey: 'java' | 'ai' | 'robot') => {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    const formData: WizardFormData = {
      name: '', education: '', major: '', grade: '', skill_score: 3,
      skills: [], background: [], career_interest: [], learning_goal: '',
      target_role: '', learning_methods: [], learning_style: '', learning_pace: '',
      daily_hours: '', study_period: '', budget: '',
      ...preset,
    };
    submitWizard(formData);
  }, [submitWizard]);

  const clearData = useCallback(() => {
    setState({ student: null, careerPath: null, milestones: [], activeTab: 1, isDemo: false, aiLoading: false, aiLoadingStep: '' });
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PROGRESS_KEY);
  }, []);

  const updateMilestone = useCallback((id: number, progress: number) => {
    setState((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) =>
        m.id === id ? { ...m, progress, status: progress >= 100 ? 'completed' : progress > 0 ? 'current' : 'upcoming' } : m
      ),
    }));
  }, []);

  const completeMilestone = useCallback((id: number) => {
    setState((prev) => {
      const idx = prev.milestones.findIndex((m) => m.id === id);
      if (idx === -1) return prev;
      const nextIdx = prev.milestones.findIndex((m, i) => i > idx && m.status === 'upcoming');
      const updated = prev.milestones.map((m, i) => {
        if (i === idx) return { ...m, status: 'completed' as const, progress: 100 };
        if (i === nextIdx) return { ...m, status: 'current' as const, progress: 0 };
        return m;
      });
      // 记录刚完成的里程碑 title，供 AI 顾问主动推送
      const completedTitle = prev.milestones[idx]?.title ?? '';
      setTimeout(() => setLastCompletedMilestoneTitle(completedTitle), 0);
      return { ...prev, milestones: updated };
    });
  }, []);

  const prefillTargetRole = useCallback((role: string) => {
    setWizardPrefillRole(role);
    setState((prev) => ({ ...prev, activeTab: 1 }));
    toast.info(`已预填目标岗位：${role}，请完成引导问卷`);
  }, []);

  return (
    <AppContext.Provider value={{
      ...state,
      setActiveTab, submitWizard, loadDemo, loadPreset,
      clearData, updateMilestone, completeMilestone,
      prefillTargetRole, wizardPrefillRole,
      lastCompletedMilestoneTitle,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

