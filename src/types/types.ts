// 职业路径导航器 - 类型定义

/** 技能等级（中国8级职业技能等级标准） */
export interface SkillLevel {
  id: number;
  level_num: number; // 1-8
  level_name: string; // 学徒工/初级工/中级工/高级工/技师/高级技师/特级技师/首席技师
  description: string;
  typical_duration: string; // 典型培养周期
  education_equivalent: string; // 对应学历
}

/** 课程 */
export interface Course {
  id: number;
  major: string; // 所属专业
  name: string;
  semester: string; // 学期
  credits: number;
  hours: number;
  skill_level: number; // 对应技能等级 2-4
  skills: string[]; // 培养的技能
}

/** 能力差距项 */
export interface GapItem {
  skill: string; // 技能名称
  category: string; // 类别
  current_status: '未掌握' | '部分掌握'; // 当前状态
  required_level: number; // 所需等级
  priority: 'high' | 'medium' | 'low'; // 优先级
  estimated_hours: number; // 预估学时
}

/** GitHub 项目推荐 */
export interface GitHubProject {
  name: string;
  stars: string;
  description: string;
  url: string;
  tags: string[];
}

/** 学习资源 */
export interface LearningResource {
  type: 'course' | 'github' | 'certificate' | 'book'; // 资源类型
  title: string;
  description?: string;
  url?: string;
  badge?: string;
}

/** 学习阶段 */
export interface PathStage {
  stage: number; // 1/2/3
  name: string; // 基础期/强化期/冲刺期
  target_level: string; // 目标等级
  weeks_range: string; // 周数区间
  estimated_hours: number; // 预估学时
  courses: string[]; // 推荐课程名称
  github_projects: GitHubProject[];
  certificates: string[]; // 考证建议
  milestones: string[]; // 里程碑检查点
}

/** 里程碑状态 */
export type MilestoneStatus = 'completed' | 'current' | 'upcoming';

/** 里程碑 */
export interface Milestone {
  id: number;
  path_id: number;
  stage: number;
  title: string;
  description: string;
  duration: string; // 持续时长描述
  status: MilestoneStatus;
  progress: number; // 0-100
  skills: string[];
  resources: LearningResource[];
}

/** 职业路径 */
export interface CareerPath {
  id: number;
  student_id: number;
  target_role: string;
  total_weeks: number;
  total_hours: number;
  stages: PathStage[];
  gap_items: GapItem[];
  created_at: string;
}

/** 学生信息 */
export interface Student {
  id: number;
  name: string;
  major: string;
  grade: '大一' | '大二' | '大三';
  education: '中职' | '高职' | '本科';
  certificates: string[];
  skills: string[];
  career_interest: string[];
  target_role: string;
  current_level: number; // 1-8
  weekly_hours: number; // 每周学习时间（小时）
  learning_style?: string;
  learning_pace?: string;
  budget?: string;
  created_at: string;
}

/** 热门岗位 */
export interface JobRole {
  id: number;
  title: string;
  required_level: string;    // 目标技能等级，如"高级工（L4）"
  required_level_num: number;
  level_range: string;        // 技能等级区间，如"L3中级工→L4高级工"
  major_group: string;        // 所属专业群，用于筛选
  recommended_majors: string[];
  avg_salary: string;         // 展示文本
  salary_max: number;         // 最高年薪（万），用于排序
  skills_required: string[];
  description: string;
  industry: string;
  icon: string;               // lucide icon name
}

/** 表单数据（引导页使用） */
export interface WizardFormData {
  // 步骤1：个人信息
  name: string;
  education: '中职' | '高职' | '本科' | '';
  major: string;
  grade: '大一' | '大二' | '大三' | '';

  // 步骤2：技能评估
  skill_score: number; // 1-5 基础技能评分
  skills: string[]; // 已有技能多选
  background: string[]; // 背景经历

  // 步骤3：职业目标
  career_interest: string[]; // 兴趣方向
  learning_goal: string;
  target_role: string;

  // 步骤4：学习偏好
  learning_methods: string[]; // 学习方式偏好
  learning_style: string; // 学习风格
  learning_pace: string; // 学习节奏

  // 步骤5：时间投入
  daily_hours: string; // 每天学习时间
  study_period: string; // 学习周期
  budget: string; // 每月预算
}

/** 雷达图数据点 */
export interface RadarDataPoint {
  skill: string;
  value: number; // 0-100
  maxValue: number;
}
