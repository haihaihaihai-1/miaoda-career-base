// Tab2 - 引导页：6步问卷
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import type { WizardFormData } from '@/types/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  User, Star, Target, BookOpen, Clock, CheckSquare,
  ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import { toast } from 'sonner';

const STEPS = [
  { icon: User, label: '个人信息' },
  { icon: Star, label: '技能评估' },
  { icon: Target, label: '职业目标' },
  { icon: BookOpen, label: '学习偏好' },
  { icon: Clock, label: '时间投入' },
  { icon: CheckSquare, label: '确认提交' }
];

/** 预设岗位列表（优先展示软件技术/AI/智能制造三大核心专业） */
const PRESET_ROLES = [
  // 软件技术
  'Java开发工程师',
  'Web前端开发工程师',
  'Python开发工程师',
  '软件测试工程师',
  '移动应用开发工程师',
  // 人工智能
  'AI应用开发工程师',
  '机器学习工程师',
  'NLP算法工程师',
  '计算机视觉工程师',
  '数据分析师',
  // 智能制造
  '工业机器人运维工程师',
  '智能制造系统集成工程师',
  'PLC编程工程师',
  '自动化设备工程师',
  '机电一体化工程师',
  // 其他核心岗位
  '大数据开发工程师',
  '云计算运维工程师',
  '网络安全工程师',
  '游戏开发工程师',
  'UI/UX设计师',
];

const INITIAL_FORM: WizardFormData = {
  name: '',
  education: '',
  major: '',
  grade: '',
  skill_score: 3,
  skills: [],
  background: [],
  career_interest: [],
  learning_goal: '',
  target_role: '',
  learning_methods: [],
  learning_style: '',
  learning_pace: '',
  daily_hours: '',
  study_period: '',
  budget: ''
};

/** 一键填充演示数据 */
const DEMO_FORM: WizardFormData = {
  name: '张三',
  education: '高职',
  major: '软件技术',
  grade: '大二',
  skill_score: 3,
  skills: ['Java', 'HTML/CSS', 'SQL', 'Git'],
  background: ['项目经验'],
  career_interest: ['Web开发', '后端开发'],
  learning_goal: '掌握企业级Java后端开发技术，成为合格的Java工程师',
  target_role: 'Java开发工程师',
  learning_methods: ['项目', '视频'],
  learning_style: '动手型',
  learning_pace: '稳健',
  daily_hours: '1-2小时',
  study_period: '6个月',
  budget: '500元以下'
};

// 多选选项组件
const MultiSelect: React.FC<{
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}> = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const checked = value.includes(opt);
      return (
        <button
          key={opt}
          type="button"
          onClick={() => {
            onChange(checked ? value.filter((v) => v !== opt) : [...value, opt]);
          }}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            checked
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-foreground border-border hover:border-primary/50'
          )}
        >
          {opt}
        </button>
      );
    })}
  </div>
);

// 单选选项组件
const SingleSelect: React.FC<{
  options: string[];
  value: string;
  onChange: (v: string) => void;
}> = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => (
      <button
        key={opt}
        type="button"
        onClick={() => onChange(opt)}
        className={cn(
          'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
          value === opt
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-background text-foreground border-border hover:border-primary/50'
        )}
      >
        {opt}
      </button>
    ))}
  </div>
);

// 技能等级实时标签配置
const SKILL_TAG: Record<string, { label: string; className: string }> = {
  low:    { label: '需提升', className: 'bg-warning/15 text-warning border-warning/40' },
  mid:    { label: '基础水平', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  high:   { label: '已掌握', className: 'bg-success/15 text-success border-success/40' },
};

const getSkillTag = (v: number) =>
  v <= 2 ? SKILL_TAG.low : v === 3 ? SKILL_TAG.mid : SKILL_TAG.high;

// 星级评分（含实时技能标签）
const StarRating: React.FC<{
  value: number;
  onChange: (v: number) => void;
}> = ({ value, onChange }) => {
  const tag = value > 0 ? getSkillTag(value) : null;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-1 transition-transform active:scale-90"
        >
          <Star
            className={cn('w-7 h-7', n <= value ? 'fill-warning text-warning' : 'text-muted-foreground')}
          />
        </button>
      ))}
      <span className="text-sm text-muted-foreground ml-1">
        {['', '入门', '了解', '熟悉', '掌握', '精通'][value]}
      </span>
      {tag && (
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full border font-medium transition-all duration-200',
            tag.className
          )}
        >
          {tag.label}
        </span>
      )}
    </div>
  );
};

const WizardPage: React.FC = () => {
  const { submitWizard, aiLoading, aiLoadingStep, wizardPrefillRole } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardFormData>(INITIAL_FORM);

  // 消费从发现页传入的预填岗位
  useEffect(() => {
    if (wizardPrefillRole) {
      setForm((prev) => ({ ...prev, target_role: wizardPrefillRole }));
      // 跳到职业目标步骤（step 2）
      setStep(2);
    }
  }, [wizardPrefillRole]);

  const updateForm = <K extends keyof WizardFormData>(key: K, value: WizardFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const fillDemo = () => {
    setForm(DEMO_FORM);
    toast.success('已填充张三的示例数据');
  };

  const next = () => {
    if (step < 5) setStep((s) => s + 1);
  };
  const prev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.target_role) {
      toast.error('请填写姓名和目标岗位');
      return;
    }
    submitWizard(form);
  };

  const progress = ((step + 1) / 6) * 100;

  // AI加载全屏遮罩
  if (aiLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-8 py-16 bg-background">
        <div className="relative w-20 h-20">
          <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-base font-bold text-foreground text-balance">{aiLoadingStep || 'AI正在分析你的能力差距…'}</p>
          <p className="text-sm text-muted-foreground text-pretty">请稍候，这通常需要10-30秒</p>
        </div>
        <div className="w-full max-w-xs space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">姓名</Label>
              <Input
                placeholder="请输入姓名"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                className="h-11 text-sm px-3"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">学历</Label>
              <SingleSelect
                options={['中职', '高职', '本科']}
                value={form.education}
                onChange={(v) => updateForm('education', v as WizardFormData['education'])}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">专业</Label>
              <Input
                placeholder="如：软件技术、人工智能技术等"
                value={form.major}
                onChange={(e) => updateForm('major', e.target.value)}
                className="h-11 text-sm px-3"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">年级</Label>
              <SingleSelect
                options={['大一', '大二', '大三']}
                value={form.grade}
                onChange={(v) => updateForm('grade', v as WizardFormData['grade'])}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-normal">基础技能自评（1-5星）</Label>
              <StarRating value={form.skill_score} onChange={(v) => updateForm('skill_score', v)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-normal">已掌握技能（可多选）</Label>
              <MultiSelect
                options={['Java', 'Python', 'SQL', 'HTML/CSS', 'JavaScript', 'Vue.js', 'React', 'Git', 'Linux', 'Docker', 'C语言', 'C#']}
                value={form.skills}
                onChange={(v) => updateForm('skills', v)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-normal">背景经历（可多选）</Label>
              <MultiSelect
                options={['实习经历', '项目经验', '竞赛获奖', '开源贡献', '无']}
                value={form.background}
                onChange={(v) => updateForm('background', v)}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-normal">兴趣方向（可多选）</Label>
              <MultiSelect
                options={['Web开发', '后端开发', '前端开发', 'AI/机器学习', '数据分析', '移动开发', '运维/云计算', '软件测试', '游戏开发', '嵌入式', '智能制造']}
                value={form.career_interest}
                onChange={(v) => updateForm('career_interest', v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">目标岗位</Label>
              {/* 下拉快捷选择 */}
              <Select
                value={PRESET_ROLES.includes(form.target_role) ? form.target_role : '__custom__'}
                onValueChange={(v) => {
                  if (v !== '__custom__') updateForm('target_role', v);
                }}
              >
                <SelectTrigger className="h-11 text-sm">
                  <SelectValue placeholder="从常见岗位中选择..." />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">其他（手动输入）</SelectItem>
                </SelectContent>
              </Select>
              {/* 手动输入框 */}
              <Input
                placeholder="或手动输入目标岗位，如：嵌入式软件工程师"
                value={form.target_role}
                onChange={(e) => updateForm('target_role', e.target.value)}
                className="h-11 text-sm px-3"
              />
              {form.target_role && (
                <p className="text-xs text-primary">
                  已选：{form.target_role}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">学习目标</Label>
              <Input
                placeholder="如：掌握Java后端开发，找到满意工作"
                value={form.learning_goal}
                onChange={(e) => updateForm('learning_goal', e.target.value)}
                className="h-11 text-sm px-3"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-normal">学习方式偏好（可多选）</Label>
              <MultiSelect
                options={['视频课程', '阅读文档', '项目实战', '练习测验', '直播课']}
                value={form.learning_methods}
                onChange={(v) => updateForm('learning_methods', v)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-normal">学习风格</Label>
              <SingleSelect
                options={['视觉型', '听觉型', '读写型', '动手型']}
                value={form.learning_style}
                onChange={(v) => updateForm('learning_style', v)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-normal">学习节奏</Label>
              <SingleSelect
                options={['快速突破', '稳健推进', '灵活调整']}
                value={form.learning_pace}
                onChange={(v) => updateForm('learning_pace', v)}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-normal">每天学习时间</Label>
              <SingleSelect
                options={['1小时以内', '1-2小时', '2-4小时', '4小时以上']}
                value={form.daily_hours}
                onChange={(v) => updateForm('daily_hours', v)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-normal">计划学习周期</Label>
              <SingleSelect
                options={['3个月', '6个月', '1年', '2年']}
                value={form.study_period}
                onChange={(v) => updateForm('study_period', v)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-normal">每月学习预算</Label>
              <SingleSelect
                options={['免费', '500元以下', '500-2000元', '2000元以上']}
                value={form.budget}
                onChange={(v) => updateForm('budget', v)}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-pretty">请确认以下信息，提交后将为你生成定制化学习路径。</p>
            <div className="space-y-2">
              {[
                { label: '姓名', value: form.name || '未填写' },
                { label: '学历', value: form.education || '未选择' },
                { label: '专业', value: form.major || '未填写' },
                { label: '年级', value: form.grade || '未选择' },
                { label: '目标岗位', value: form.target_role || '未填写' },
                { label: '技能评分', value: `${form.skill_score}星` },
                { label: '已有技能', value: form.skills.join('、') || '暂无' },
                { label: '兴趣方向', value: form.career_interest.join('、') || '暂无' },
                { label: '每天时间', value: form.daily_hours || '未选择' },
                { label: '学习周期', value: form.study_period || '未选择' }
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0">
                  <span className="text-xs text-muted-foreground shrink-0 w-20">{label}</span>
                  <span className="text-xs text-foreground text-right flex-1 break-words">{value}</span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* 顶部进度区 */}
      <div className="bg-card border-b border-border px-4 pt-4 pb-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">职业规划引导</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={fillDemo}
            className="text-xs h-7 px-2 text-primary hover:text-primary hover:bg-accent gap-1"
          >
            <Zap className="w-3 h-3" />
            一键示例
          </Button>
        </div>

        {/* 进度条 */}
        <Progress value={progress} className="h-1.5 mb-3" />

        {/* 步骤指示器 */}
        <div className="flex items-center justify-between">
          {STEPS.map(({ icon: Icon, label }, idx) => {
            const isDone = idx < step;
            const isCurrent = idx === step;
            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center transition-colors',
                  isDone ? 'bg-success text-success-foreground' :
                  isCurrent ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                )}>
                  <Icon className="w-3 h-3" />
                </div>
                <span className={cn(
                  'text-[9px] leading-none whitespace-nowrap',
                  isCurrent ? 'text-primary font-semibold' : 'text-muted-foreground'
                )}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 表单内容 */}
      <div className="flex-1 px-4 py-5 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          {(() => {
            const { icon: Icon } = STEPS[step];
            return <Icon className="w-4 h-4 text-primary shrink-0" />;
          })()}
          <h3 className="text-sm font-bold text-foreground">{STEPS[step].label}</h3>
          <span className="text-xs text-muted-foreground ml-auto">{step + 1} / 6</span>
        </div>
        {renderStep()}
      </div>

      {/* 底部按钮 */}
      <div className="sticky bottom-0 bg-card border-t border-border px-4 py-3 flex gap-3">
        {step > 0 && (
          <Button
            variant="outline"
            onClick={prev}
            className="flex-1 h-11 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            上一步
          </Button>
        )}
        {step < 5 ? (
          <Button
            onClick={next}
            className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground"
          >
            下一步
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground"
          >
            生成我的路径
          </Button>
        )}
      </div>
    </div>
  );
};

export default WizardPage;
