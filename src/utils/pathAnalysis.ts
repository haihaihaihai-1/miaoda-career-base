// 能力差距分析逻辑
import { courses } from '@/data/courses';
import type { GapItem, PathStage, CareerPath, Student } from '@/types/types';

/** 目标岗位 → 所需技能映射 */
const ROLE_SKILL_MAP: Record<string, string[]> = {
  'Java开发工程师': ['Java', 'Spring Boot', 'MySQL', 'Vue.js', 'Git', 'Maven', 'Redis基础', '软件测试', '微服务架构'],
  'Web前端开发工程师': ['HTML/CSS', 'JavaScript', 'Vue.js', 'TypeScript', '响应式设计', 'Git', 'Webpack'],
  'Python开发工程师': ['Python', 'FastAPI', 'MySQL', 'Redis基础', 'Docker', 'Git', '单元测试'],
  'AI应用开发工程师': ['Python', '机器学习', '大语言模型API调用', 'FastAPI', 'Docker', 'Prompt工程', '模型部署'],
  '数据分析师': ['Python', 'SQL', 'Pandas', '数据可视化', '统计分析', 'Excel', '业务分析'],
  '工业机器人运维工程师': ['ABB编程', 'PLC编程', '机器视觉', '系统集成', '示教编程', '离线仿真', '故障诊断'],
  '智能制造系统集成工程师': ['MES', 'RFID', '产线设计', 'OPC UA', 'SCADA', 'PLC编程', '边缘计算', '系统集成'],
  // 兼容旧数据
  '前端开发工程师': ['HTML/CSS', 'JavaScript', 'Vue.js', 'TypeScript', '响应式设计', 'Git'],
  '数据分析工程师': ['Python', 'SQL', 'Pandas', '数据可视化', '统计分析'],
  '软件测试工程师': ['测试用例设计', '接口测试', 'Postman', 'JUnit', 'Python/Java', 'Git'],
  '云计算运维工程师': ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'Git'],
  '大数据开发工程师': ['Java', 'SQL', 'Hadoop', 'Spark', 'Kafka', 'Hive']
};

/** 技能优先级映射 */
const SKILL_PRIORITY_MAP: Record<string, 'high' | 'medium' | 'low'> = {
  // 软件技术
  'Spring Boot': 'high', 'Vue.js': 'high', Java: 'high', MySQL: 'high',
  'HTML/CSS': 'high', JavaScript: 'high',
  Maven: 'medium', 'Redis基础': 'medium', '微服务架构': 'medium', Docker: 'medium',
  TypeScript: 'medium', Linux: 'medium', SQL: 'medium', Webpack: 'medium',
  '软件测试': 'low', Git: 'low',
  // AI
  Python: 'high', '机器学习': 'high', '大语言模型API调用': 'high',
  FastAPI: 'medium', 'Prompt工程': 'medium', '模型部署': 'medium',
  Pandas: 'medium', '数据可视化': 'medium', '统计分析': 'medium',
  // 智能制造
  'PLC编程': 'high', 'ABB编程': 'high', 'MES': 'high',
  'OPC UA': 'medium', SCADA: 'medium', '边缘计算': 'medium',
  RFID: 'low', '产线设计': 'medium', '系统集成': 'high',
  '示教编程': 'high', '离线仿真': 'medium', '故障诊断': 'medium'
};

/** 技能 → 类别映射 */
const SKILL_CATEGORY_MAP: Record<string, string> = {
  // 软件技术
  Java: 'Java后端', 'Spring Boot': 'Java后端框架', 'Vue.js': '前端框架',
  MySQL: '数据库', SQL: '数据库', Git: '版本控制', Maven: '构建工具',
  'Redis基础': '缓存/中间件', '微服务架构': '架构设计', Docker: '容器化',
  'HTML/CSS': '前端基础', JavaScript: '前端基础', TypeScript: '前端进阶',
  '软件测试': '质量保障', '测试用例设计': '质量保障',
  Linux: '运维', Kubernetes: '容器编排', Hadoop: '大数据处理',
  Spark: '大数据计算', Webpack: '前端工程化',
  // AI
  Python: 'Python编程', '机器学习': 'AI/ML', '大语言模型API调用': '大模型应用',
  FastAPI: 'Python后端', 'Prompt工程': '大模型应用', '模型部署': 'MLOps',
  Pandas: '数据处理', '数据可视化': '数据分析', '统计分析': '数据分析',
  '业务分析': '数据分析', Excel: '数据工具',
  // 智能制造
  'PLC编程': '工控编程', 'ABB编程': '机器人编程', '示教编程': '机器人编程',
  '离线仿真': '机器人仿真', MES: '智能制造系统', RFID: '物联网',
  '产线设计': '制造工程', 'OPC UA': '工业通信', SCADA: '监控系统',
  '边缘计算': '工业互联网', '系统集成': '工程集成', '故障诊断': '运维技能'
};

/** 技能预估学时 */
const SKILL_HOURS_MAP: Record<string, number> = {
  // 软件技术
  'Spring Boot': 72, 'Vue.js': 54, Maven: 18, 'Redis基础': 24,
  '微服务架构': 72, '软件测试': 36, Docker: 24, TypeScript: 36,
  JavaScript: 54, Linux: 36, SQL: 36, Kubernetes: 48, Webpack: 20,
  // AI
  Python: 64, '机器学习': 64, '大语言模型API调用': 48, FastAPI: 30,
  'Prompt工程': 24, '模型部署': 48, Pandas: 32, '数据可视化': 24,
  '统计分析': 32, '业务分析': 24, Excel: 16,
  // 智能制造
  'PLC编程': 64, 'ABB编程': 64, '示教编程': 48, '离线仿真': 32,
  MES: 48, RFID: 24, '产线设计': 48, 'OPC UA': 32,
  SCADA: 32, '边缘计算': 32, '系统集成': 64, '故障诊断': 32
};

/** 分析能力差距 */
export const analyzeGap = (studentSkills: string[], targetRole: string): GapItem[] => {
  const requiredSkills = ROLE_SKILL_MAP[targetRole] || [];
  const normalizedStudentSkills = studentSkills.map((s) => s.toLowerCase());

  return requiredSkills
    .filter((skill) => !normalizedStudentSkills.includes(skill.toLowerCase()))
    .map((skill) => ({
      skill,
      category: SKILL_CATEGORY_MAP[skill] || '专业技能',
      current_status: Math.random() > 0.7 ? '部分掌握' : '未掌握',
      required_level: skill === '微服务架构' || skill === 'Docker' ? 4 : 3,
      priority: SKILL_PRIORITY_MAP[skill] || 'low',
      estimated_hours: SKILL_HOURS_MAP[skill] || 30
    }));
};

/** 根据专业和差距生成学习路径 */
export const generateCareerPath = (student: Student): CareerPath => {
  const gapItems = analyzeGap(student.skills, student.target_role);

  // 从本校课程中匹配相关课程
  const majorCourses = courses.filter((c) => c.major === student.major);

  // 按技能等级分层课程
  const basicCourses = majorCourses
    .filter((c) => c.skill_level <= 2 && c.semester.includes('大一'))
    .map((c) => c.name);
  const midCourses = majorCourses
    .filter((c) => c.skill_level === 3)
    .map((c) => c.name);
  const advCourses = majorCourses
    .filter((c) => c.skill_level >= 4)
    .map((c) => c.name);

  const stages: PathStage[] = [
    {
      stage: 1,
      name: '基础期',
      target_level: '中级工（L3）',
      weeks_range: '第1-8周',
      estimated_hours: 112,
      courses: basicCourses.slice(0, 3),
      github_projects: [
        {
          name: 'spring-petclinic',
          stars: '7.5K★',
          description: 'Spring Boot官方示例项目，适合入门实践',
          url: 'https://github.com/spring-projects/spring-petclinic',
          tags: ['Spring Boot', 'MySQL', '入门']
        }
      ],
      certificates: ['Web前端开发1+X初级证书'],
      milestones: ['完成基础课程学习', '提交GitHub入门项目']
    },
    {
      stage: 2,
      name: '强化期',
      target_level: '高级工（L4）',
      weeks_range: '第9-20周',
      estimated_hours: 168,
      courses: midCourses.slice(0, 3),
      github_projects: [
        {
          name: 'RuoYi-Vue',
          stars: '21K★',
          description: '企业级Java快速开发平台',
          url: 'https://github.com/yangzongzhuan/RuoYi-Vue',
          tags: ['Spring Boot', 'Vue.js', '企业级']
        },
        {
          name: 'mall',
          stars: '75K★',
          description: '电商系统完整实现',
          url: 'https://github.com/macrozheng/mall',
          tags: ['Spring Boot', 'MyBatis', '完整项目']
        }
      ],
      certificates: ['Web前端开发1+X中级证书', 'Java Web开发工程师认证'],
      milestones: ['完成企业级项目改造', '通过1+X中级考试']
    },
    {
      stage: 3,
      name: '冲刺期',
      target_level: '岗位胜任',
      weeks_range: '第21-30周',
      estimated_hours: 140,
      courses: advCourses.slice(0, 2),
      github_projects: [
        {
          name: 'mall',
          stars: '75K★',
          description: '深度参与mall项目开发实战',
          url: 'https://github.com/macrozheng/mall',
          tags: ['综合实战', '全栈', '部署']
        }
      ],
      certificates: ['云计算开发与运维1+X初级', 'Java高级开发工程师认证'],
      milestones: ['完成独立项目开发', '项目部署上线', '通过模拟面试']
    }
  ];

  return {
    id: Date.now(),
    student_id: student.id,
    target_role: student.target_role,
    total_weeks: 30,
    total_hours: 420,
    stages,
    gap_items: gapItems,
    created_at: new Date().toISOString()
  };
};

/** 计算路径匹配度 */
export const calcMatchRate = (studentSkills: string[], targetRole: string): number => {
  const requiredSkills = ROLE_SKILL_MAP[targetRole] || [];
  if (requiredSkills.length === 0) return 0;
  const normalizedStudentSkills = studentSkills.map((s) => s.toLowerCase());
  const matched = requiredSkills.filter((skill) =>
    normalizedStudentSkills.includes(skill.toLowerCase())
  );
  return Math.round((matched.length / requiredSkills.length) * 100);
};

/** 获取目标岗位所需技能（用于雷达图） */
export const getRequiredSkills = (targetRole: string): string[] =>
  ROLE_SKILL_MAP[targetRole] || [];
