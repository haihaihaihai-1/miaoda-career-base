// 本校课程数据 - 种子数据
import type { Course } from '@/types/types';

export const courses: Course[] = [
  // ===== 软件技术专业（10门）=====
  {
    id: 1,
    major: '软件技术',
    name: 'Java程序设计',
    semester: '大一上',
    credits: 4,
    hours: 72,
    skill_level: 2,
    skills: ['Java', '面向对象编程', '基础算法', 'JVM基础']
  },
  {
    id: 2,
    major: '软件技术',
    name: 'MySQL数据库',
    semester: '大一下',
    credits: 3,
    hours: 54,
    skill_level: 2,
    skills: ['SQL', 'MySQL', '数据库设计', 'JDBC']
  },
  {
    id: 3,
    major: '软件技术',
    name: 'HTML5+CSS3',
    semester: '大一上',
    credits: 3,
    hours: 54,
    skill_level: 2,
    skills: ['HTML/CSS', '响应式布局', 'Flexbox', 'CSS动画']
  },
  {
    id: 4,
    major: '软件技术',
    name: 'JavaScript',
    semester: '大一下',
    credits: 3,
    hours: 54,
    skill_level: 2,
    skills: ['JavaScript', 'DOM操作', 'ES6+', '异步编程']
  },
  {
    id: 5,
    major: '软件技术',
    name: 'Spring Boot',
    semester: '大二上',
    credits: 4,
    hours: 72,
    skill_level: 3,
    skills: ['Spring Boot', 'RESTful API', 'Maven', 'Spring MVC', 'Spring Security基础']
  },
  {
    id: 6,
    major: '软件技术',
    name: 'Vue.js',
    semester: '大二上',
    credits: 3,
    hours: 54,
    skill_level: 3,
    skills: ['Vue.js', '组件化开发', 'Vuex', 'Vue Router', '前后端分离']
  },
  {
    id: 7,
    major: '软件技术',
    name: '软件测试',
    semester: '大二下',
    credits: 3,
    hours: 54,
    skill_level: 3,
    skills: ['单元测试', 'JUnit', '接口测试', '测试用例设计', 'Postman']
  },
  {
    id: 8,
    major: '软件技术',
    name: '微服务架构',
    semester: '大二下',
    credits: 4,
    hours: 72,
    skill_level: 4,
    skills: ['Spring Cloud', 'Docker', '微服务', 'Nacos', 'Gateway']
  },
  {
    id: 9,
    major: '软件技术',
    name: 'Git协作开发',
    semester: '大一下',
    credits: 2,
    hours: 36,
    skill_level: 2,
    skills: ['Git', 'GitHub/Gitee', '团队协作', '代码审查', 'CI/CD基础']
  },
  {
    id: 10,
    major: '软件技术',
    name: '项目实战',
    semester: '大三',
    credits: 6,
    hours: 120,
    skill_level: 4,
    skills: ['项目管理', '需求分析', '系统设计', '全栈开发', '部署运维']
  },

  // ===== 人工智能技术应用专业（8门）=====
  {
    id: 11,
    major: '人工智能技术应用',
    name: 'Python程序设计',
    semester: '学期1',
    credits: 4,
    hours: 64,
    skill_level: 2,
    skills: ['Python语法', '函数与模块', '文件操作']
  },
  {
    id: 12,
    major: '人工智能技术应用',
    name: '数据采集与预处理',
    semester: '学期2',
    credits: 3,
    hours: 48,
    skill_level: 3,
    skills: ['网络爬虫', '数据清洗', 'Pandas']
  },
  {
    id: 13,
    major: '人工智能技术应用',
    name: '机器学习基础',
    semester: '学期3',
    credits: 4,
    hours: 64,
    skill_level: 3,
    skills: ['Scikit-learn', '分类回归', '聚类']
  },
  {
    id: 14,
    major: '人工智能技术应用',
    name: '深度学习与框架',
    semester: '学期3',
    credits: 4,
    hours: 64,
    skill_level: 3,
    skills: ['PyTorch', 'CNN', 'RNN']
  },
  {
    id: 15,
    major: '人工智能技术应用',
    name: '自然语言处理',
    semester: '学期4',
    credits: 3,
    hours: 48,
    skill_level: 4,
    skills: ['文本分类', '序列标注', '大模型API调用']
  },
  {
    id: 16,
    major: '人工智能技术应用',
    name: '计算机视觉',
    semester: '学期4',
    credits: 3,
    hours: 48,
    skill_level: 4,
    skills: ['图像分类', '目标检测', 'OpenCV']
  },
  {
    id: 17,
    major: '人工智能技术应用',
    name: 'AI模型部署',
    semester: '学期5',
    credits: 3,
    hours: 48,
    skill_level: 4,
    skills: ['FastAPI', 'Docker', '模型优化']
  },
  {
    id: 18,
    major: '人工智能技术应用',
    name: 'AI项目实战',
    semester: '学期5',
    credits: 6,
    hours: 96,
    skill_level: 4,
    skills: ['端到端项目', '数据管道', '模型部署']
  },

  // ===== 智能制造装备技术专业（7门）=====
  {
    id: 19,
    major: '智能制造装备技术',
    name: '机械制图与CAD',
    semester: '学期1',
    credits: 4,
    hours: 64,
    skill_level: 2,
    skills: ['机械制图', 'AutoCAD', 'SolidWorks']
  },
  {
    id: 20,
    major: '智能制造装备技术',
    name: '电工电子技术',
    semester: '学期2',
    credits: 4,
    hours: 64,
    skill_level: 2,
    skills: ['电路分析', '电子元器件', '传感器']
  },
  {
    id: 21,
    major: '智能制造装备技术',
    name: 'PLC编程与应用',
    semester: '学期3',
    credits: 4,
    hours: 64,
    skill_level: 3,
    skills: ['梯形图', 'S7-1200', 'HMI组态']
  },
  {
    id: 22,
    major: '智能制造装备技术',
    name: '工业机器人操作与编程',
    semester: '学期3',
    credits: 4,
    hours: 64,
    skill_level: 3,
    skills: ['示教编程', 'ABB编程', '离线仿真']
  },
  {
    id: 23,
    major: '智能制造装备技术',
    name: '智能制造产线集成',
    semester: '学期4',
    credits: 4,
    hours: 64,
    skill_level: 4,
    skills: ['MES', 'RFID', '产线设计']
  },
  {
    id: 24,
    major: '智能制造装备技术',
    name: '工业互联网与数据采集',
    semester: '学期4',
    credits: 3,
    hours: 48,
    skill_level: 4,
    skills: ['OPC UA', 'SCADA', '边缘计算']
  },
  {
    id: 25,
    major: '智能制造装备技术',
    name: '综合实训',
    semester: '学期5',
    credits: 6,
    hours: 96,
    skill_level: 4,
    skills: ['产线调试', '系统集成', '故障诊断']
  }
];

/** 按专业获取课程 */
export const getCoursesByMajor = (major: string): Course[] =>
  courses.filter((c) => c.major === major);

/** 获取指定技能等级的课程 */
export const getCoursesByLevel = (level: number): Course[] =>
  courses.filter((c) => c.skill_level === level);

/** 所有专业列表 */
export const MAJORS = [...new Set(courses.map((c) => c.major))];
