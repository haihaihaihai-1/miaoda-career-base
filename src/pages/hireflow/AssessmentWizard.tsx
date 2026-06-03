/**
 * HireFlow brand - 5 步评估向导（基于 WizardShell 重构）
 *
 * 重构亮点：
 *   - 步骤定义从命令式 switch/case 改为声明式 WizardStep[]
 *   - 草稿持久化（localStorage）开箱即用（draftKey）
 *   - 校验逻辑下沉到每个 step.validate
 *   - 失去 Progress / Cancel / Submit 这些控件由 WizardShell 统一处理 → 缩减 ~200 行
 */
import { useMemo } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Briefcase, Target, Gauge, MessageSquare } from 'lucide-react';
import WizardShell from '@/components/wizard/WizardShell';
import type { WizardStep } from '@/components/wizard/types';
import {
  COMPETENCY_DIMENSIONS,
  POSITION_REQUIREMENTS,
  getPositionRequirement,
  runAssessment,
} from '@/services/competencyAnalysis';
import { scoreAllCaseAnswers } from '@/services/aiScoring';
import type {
  Assessment,
  AssessmentAnswer,
  Candidate,
  CompetencyDimension,
  HireflowWizardFormData,
  InterviewStage,
} from '@/types/hireflow';
import { captureException, logEvent } from '@/lib/observability';

/** Wizard 完成事件 payload —— 父组件可同时写 candidate + assessment */
export interface WizardCompletion {
  candidate: Candidate;
  /** 评估记录所需的全部字段（不含 candidate_id，由父组件注入） */
  assessment: Omit<Assessment, 'id' | 'candidate_id' | 'assessor_id' | 'created_at'>;
}

interface Props {
  onComplete: (result: WizardCompletion) => void;
  onCancel: () => void;
}

const initialForm: HireflowWizardFormData = {
  name: '',
  email: '',
  phone: '',
  experience_years: 0,
  current_role: '',
  current_company: '',
  target_position: 'Senior Software Engineer',
  self_assessment: {
    professional: 50,
    learning: 50,
    communication: 50,
    resilience: 50,
    leadership: 50,
  },
  case_answers: COMPETENCY_DIMENSIONS.map((d) => ({
    dimension: d.key,
    answer: '',
  })),
};

const demoForm: HireflowWizardFormData = {
  name: '张三',
  email: 'zhangsan@example.com',
  phone: '13800000000',
  experience_years: 5,
  current_role: 'Software Engineer',
  current_company: 'TechCorp',
  target_position: 'Senior Software Engineer',
  self_assessment: {
    professional: 80,
    learning: 75,
    communication: 70,
    resilience: 72,
    leadership: 60,
  },
  case_answers: COMPETENCY_DIMENSIONS.map((d) => ({
    dimension: d.key,
    answer:
      '在最近的项目中，我主导了一次架构重构。识别瓶颈后，分析多种方案、与团队对齐，最终落地并把响应时间从 800ms 降到 200ms。',
  })),
};

function caseQuestionFor(dim: CompetencyDimension): string {
  const map: Record<CompetencyDimension, string> = {
    professional: '请举例描述一个你近期处理过的、最有挑战的技术问题。',
    learning: '上一次你为工作快速学会一项新技术是什么时候？过程如何？',
    communication: '描述一次你需要向非技术干系人解释复杂概念的经历。',
    resilience: '回忆一次重大失败或拒绝，你的反应与恢复过程是什么？',
    leadership: '描述一次你（不一定是 manager）推动团队对齐重要决定的经历。',
  };
  return map[dim];
}

function updateSelf(
  form: HireflowWizardFormData,
  update: (patch: Partial<HireflowWizardFormData>) => void,
  dim: CompetencyDimension,
  v: number,
) {
  update({
    self_assessment: { ...form.self_assessment, [dim]: v },
  });
}

function updateCase(
  form: HireflowWizardFormData,
  update: (patch: Partial<HireflowWizardFormData>) => void,
  dim: CompetencyDimension,
  v: string,
) {
  update({
    case_answers: form.case_answers.map((c) =>
      c.dimension === dim ? { ...c, answer: v } : c,
    ),
  });
}

export default function HireflowWizard({ onComplete, onCancel }: Props) {
  const steps = useMemo<WizardStep<HireflowWizardFormData>[]>(
    () => [
      {
        key: 'basic',
        label: '候选人基本信息',
        icon: User,
        validate: (f) => (f.name.trim() ? true : '请填写姓名'),
        render: (f, u) => (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">姓名 *</Label>
              <Input
                id="name"
                value={f.name}
                onChange={(e) => u({ name: e.target.value })}
                placeholder="例如：张三"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={f.email}
                onChange={(e) => u({ email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">电话</Label>
              <Input
                id="phone"
                value={f.phone}
                onChange={(e) => u({ phone: e.target.value })}
              />
            </div>
          </>
        ),
      },
      {
        key: 'experience',
        label: '工作经历',
        icon: Briefcase,
        validate: (f) => (f.experience_years >= 0 ? true : '工作年限不能为负'),
        render: (f, u) => (
          <>
            <div className="space-y-2">
              <Label htmlFor="years">工作年限</Label>
              <Input
                id="years"
                type="number"
                min={0}
                max={50}
                value={f.experience_years}
                onChange={(e) => u({ experience_years: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">当前角色</Label>
              <Input
                id="role"
                value={f.current_role ?? ''}
                onChange={(e) => u({ current_role: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">当前公司</Label>
              <Input
                id="company"
                value={f.current_company ?? ''}
                onChange={(e) => u({ current_company: e.target.value })}
              />
            </div>
          </>
        ),
      },
      {
        key: 'target',
        label: '目标岗位',
        icon: Target,
        validate: (f) => (f.target_position ? true : '请选择目标岗位'),
        render: (f, u) => (
          <div className="space-y-2">
            <Label>目标岗位</Label>
            <Select
              value={f.target_position}
              onValueChange={(v) => u({ target_position: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(POSITION_REQUIREMENTS).map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              内置 {Object.keys(POSITION_REQUIREMENTS).length} 个岗位模板，可通过 Supabase /
              dual_tower 扩展
            </p>
          </div>
        ),
      },
      {
        key: 'self',
        label: '5 维自评',
        icon: Gauge,
        description: '请基于候选人提供的信息为各维度打分（0-100）',
        render: (f, u) => (
          <div className="space-y-5">
            {COMPETENCY_DIMENSIONS.map((d) => (
              <div key={d.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{d.name}</Label>
                  <span className="text-sm font-bold text-primary">
                    {f.self_assessment[d.key]}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[f.self_assessment[d.key]]}
                  onValueChange={(v) => updateSelf(f, u, d.key, v[0] ?? 50)}
                />
                <p className="text-xs text-muted-foreground">{d.description}</p>
              </div>
            ))}
          </div>
        ),
      },
      {
        key: 'cases',
        label: '案例题（开放回答）',
        icon: MessageSquare,
        description: '越具体越能反映真实能力；提交后将由 AI 自动评分',
        render: (f, u) => (
          <div className="space-y-5">
            {COMPETENCY_DIMENSIONS.map((d) => {
              const c = f.case_answers.find((x) => x.dimension === d.key)!;
              return (
                <div key={d.key} className="space-y-2">
                  <Label>
                    {d.name}：
                    <span className="font-normal text-muted-foreground">
                      {caseQuestionFor(d.key)}
                    </span>
                  </Label>
                  <Textarea
                    rows={3}
                    value={c.answer}
                    onChange={(e) => updateCase(f, u, d.key, e.target.value)}
                    placeholder="不限字数"
                  />
                </div>
              );
            })}
          </div>
        ),
      },
    ],
    [],
  );

  const handleSubmit = async (form: HireflowWizardFormData): Promise<void> => {
    logEvent('hireflow.wizard.submit', { target: form.target_position });

    const answers: AssessmentAnswer[] = [];
    for (const dim of COMPETENCY_DIMENSIONS) {
      answers.push({
        question_id: `self-${dim.key}`,
        dimension: dim.key,
        question: `自评 - ${dim.name}`,
        answer: String(form.self_assessment[dim.key]),
        score: form.self_assessment[dim.key],
        source: 'self',
      });
    }

    try {
      const scoring = await scoreAllCaseAnswers(
        form.case_answers.map((c) => {
          const meta = COMPETENCY_DIMENSIONS.find((d) => d.key === c.dimension)!;
          return {
            dimension: c.dimension,
            question: `案例题 - ${meta.name}: ${caseQuestionFor(c.dimension)}`,
            answer: c.answer,
            target_position: form.target_position,
          };
        }),
      );

      form.case_answers.forEach((c, i) => {
        const meta = COMPETENCY_DIMENSIONS.find((d) => d.key === c.dimension)!;
        const result = scoring[i];
        answers.push({
          question_id: `case-${c.dimension}`,
          dimension: c.dimension,
          question: `案例题 - ${meta.name}`,
          answer: c.answer,
          score: result.score,
          source: result.source === 'dify' ? 'ai' : 'self',
        });
      });

      const req = getPositionRequirement(form.target_position);
      const result = runAssessment(answers, req);

      const stage: InterviewStage = 'initial';
      const now = new Date().toISOString();
      const candidate: Candidate = {
        id: `c-${Date.now()}`,
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        target_position: form.target_position,
        experience_years: form.experience_years,
        interview_stage: stage,
        competency_scores: result.scores,
        overall_match_rate: result.match_rate,
        notes: result.recommendation,
        created_at: now,
        updated_at: now,
      };

      onComplete({
        candidate,
        assessment: {
          stage,
          answers,
          scores: result.scores,
          match_rate: result.match_rate,
          recommendation: result.recommendation,
        },
      });
    } catch (e) {
      captureException(e, { stage: 'hireflow.scoring' });
      throw e;
    }
  };

  return (
    <WizardShell<HireflowWizardFormData>
      title="新建候选人评估"
      steps={steps}
      initial={initialForm}
      demoData={demoForm}
      draftKey="hireflow-assessment-v1"
      submitLabel="提交并生成报告"
      onCancel={onCancel}
      onSubmit={handleSubmit}
    />
  );
}
