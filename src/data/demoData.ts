// 演示数据 - 张三的完整学习路径
import type { Student, CareerPath, Milestone } from '@/types/types';

/** 演示学生：张三 */
export const demoStudent: Student = {
  id: 1,
  name: '张三',
  major: '软件技术',
  grade: '大二',
  education: '高职',
  certificates: ['计算机一级证书'],
  skills: ['Java', 'HTML/CSS', 'SQL', 'Git'],
  career_interest: ['Web开发', '后端开发'],
  target_role: 'Java开发工程师',
  current_level: 2, // 初级工
  weekly_hours: 14, // 每天2小时 × 7天
  learning_style: '动手型',
  learning_pace: '稳健',
  budget: '500元以下',
  created_at: '2026-03-01T08:00:00Z'
};

/** 演示职业路径 */
export const demoCareerPath: CareerPath = {
  id: 1,
  student_id: 1,
  target_role: 'Java开发工程师',
  total_weeks: 30,
  total_hours: 420,
  stages: [
    {
      stage: 1,
      name: '基础期',
      target_level: '中级工（L3）',
      weeks_range: '第1-8周',
      estimated_hours: 112,
      courses: ['Spring Boot', 'Vue.js', 'Git协作开发'],
      github_projects: [
        {
          name: 'spring-petclinic',
          stars: '7.5K★',
          description: 'Spring Boot官方示例项目，宠物诊所管理系统，适合入门实践',
          url: 'https://github.com/spring-projects/spring-petclinic',
          tags: ['Spring Boot', 'Thymeleaf', 'MySQL', '入门']
        }
      ],
      certificates: ['Web前端开发1+X初级证书', 'Java程序设计基础认证'],
      milestones: ['完成Spring Boot基础学习', '独立搭建Spring Boot项目', '提交第一个GitHub项目']
    },
    {
      stage: 2,
      name: '强化期',
      target_level: '高级工（L4）',
      weeks_range: '第9-20周',
      estimated_hours: 168,
      courses: ['软件测试', '微服务架构'],
      github_projects: [
        {
          name: 'RuoYi-Vue',
          stars: '21K★',
          description: '若依前后端分离版，企业级Java快速开发平台，包含权限管理、代码生成等核心功能',
          url: 'https://github.com/yangzongzhuan/RuoYi-Vue',
          tags: ['Spring Boot', 'Vue.js', 'MyBatis Plus', '企业级']
        },
        {
          name: 'mall',
          stars: '75K★',
          description: '电商系统完整实现，涵盖商品管理、订单、支付、权限等完整后台功能',
          url: 'https://github.com/macrozheng/mall',
          tags: ['Spring Boot', 'MyBatis', 'Elasticsearch', '完整项目']
        }
      ],
      certificates: ['Web前端开发1+X中级证书', 'Java Web开发工程师认证'],
      milestones: [
        '完成RuoYi-Vue二次开发实践',
        '掌握微服务核心概念',
        '通过1+X Web中级证书考试',
        '个人GitHub仓库达10个提交'
      ]
    },
    {
      stage: 3,
      name: '冲刺期',
      target_level: '岗位胜任',
      weeks_range: '第21-30周',
      estimated_hours: 140,
      courses: ['项目实战'],
      github_projects: [
        {
          name: 'mall',
          stars: '75K★',
          description: '深度参与mall项目，尝试添加新功能模块，提升复杂业务逻辑处理能力',
          url: 'https://github.com/macrozheng/mall',
          tags: ['综合实战', '全栈', '微服务', '部署']
        }
      ],
      certificates: ['云计算开发与运维1+X初级证书', 'Java高级开发工程师认证'],
      milestones: [
        '完成毕设级别独立项目开发',
        '项目部署上线（云服务器）',
        '准备简历和面试',
        '通过模拟技术面试'
      ]
    }
  ],
  gap_items: [
    {
      skill: 'Spring Boot',
      category: 'Java后端框架',
      current_status: '部分掌握',
      required_level: 3,
      priority: 'high',
      estimated_hours: 72
    },
    {
      skill: 'Vue.js',
      category: '前端框架',
      current_status: '未掌握',
      required_level: 3,
      priority: 'high',
      estimated_hours: 54
    },
    {
      skill: 'Maven',
      category: '构建工具',
      current_status: '未掌握',
      required_level: 3,
      priority: 'medium',
      estimated_hours: 18
    },
    {
      skill: 'Redis基础',
      category: '缓存/数据库',
      current_status: '未掌握',
      required_level: 3,
      priority: 'medium',
      estimated_hours: 24
    },
    {
      skill: '微服务架构',
      category: '架构设计',
      current_status: '未掌握',
      required_level: 4,
      priority: 'medium',
      estimated_hours: 72
    },
    {
      skill: '软件测试',
      category: '质量保障',
      current_status: '未掌握',
      required_level: 3,
      priority: 'low',
      estimated_hours: 36
    },
    {
      skill: 'Docker',
      category: '容器化/运维',
      current_status: '未掌握',
      required_level: 4,
      priority: 'low',
      estimated_hours: 24
    }
  ],
  created_at: '2026-03-01T10:00:00Z'
};

/** 演示里程碑列表 */
export const demoMilestones: Milestone[] = [
  // ===== 基础期 里程碑 =====
  {
    id: 1,
    path_id: 1,
    stage: 1,
    title: 'Spring Boot 基础入门',
    description: '学习Spring Boot核心概念，完成petclinic示例项目，掌握RESTful API开发',
    duration: '第1-4周（约56小时）',
    status: 'completed',
    progress: 100,
    skills: ['Spring Boot', 'RESTful API', 'Maven', 'Spring MVC'],
    resources: [
      { type: 'course', title: 'Spring Boot课程', description: '本校Spring Boot课程（72学时）', badge: '本校课程' },
      { type: 'github', title: 'spring-petclinic', description: '7.5K★ Spring Boot官方示例项目', url: 'https://github.com/spring-projects/spring-petclinic', badge: 'GitHub实训' },
      { type: 'certificate', title: 'Java程序设计基础认证', description: '建议同期准备', badge: '考证建议' }
    ]
  },
  {
    id: 2,
    path_id: 1,
    stage: 1,
    title: 'Vue.js 前端框架学习',
    description: '掌握Vue.js组件化开发，实现前后端分离架构，完成一个简单的管理界面',
    duration: '第5-8周（约56小时）',
    status: 'completed',
    progress: 100,
    skills: ['Vue.js', '组件化开发', 'Vue Router', 'Axios', '前后端分离'],
    resources: [
      { type: 'course', title: 'Vue.js课程', description: '本校Vue.js课程（54学时）', badge: '本校课程' },
      { type: 'certificate', title: 'Web前端开发1+X初级证书', description: '第8周末参加考试', badge: '1+X考证' }
    ]
  },
  // ===== 强化期 里程碑 =====
  {
    id: 3,
    path_id: 1,
    stage: 2,
    title: 'RuoYi-Vue 企业级项目实践',
    description: '深度学习RuoYi-Vue企业级框架，添加自定义功能模块，理解权限管理和代码生成',
    duration: '第9-14周（约84小时）',
    status: 'current',
    progress: 45,
    skills: ['Spring Boot进阶', 'MyBatis Plus', '权限管理', 'Redis', 'Vue.js进阶'],
    resources: [
      { type: 'github', title: 'RuoYi-Vue', description: '21K★ 企业级Java快速开发平台', url: 'https://github.com/yangzongzhuan/RuoYi-Vue', badge: 'GitHub实训' },
      { type: 'course', title: '软件测试课程', description: '本校软件测试课程（54学时）', badge: '本校课程' },
      { type: 'certificate', title: 'Web前端开发1+X中级证书', description: '建议第14周参加考试', badge: '1+X考证' }
    ]
  },
  {
    id: 4,
    path_id: 1,
    stage: 2,
    title: '微服务架构深入学习',
    description: '学习Spring Cloud微服务架构，掌握Nacos注册中心、Gateway网关等核心组件',
    duration: '第15-20周（约84小时）',
    status: 'upcoming',
    progress: 0,
    skills: ['Spring Cloud', 'Docker', 'Nacos', 'Gateway', 'Feign', 'Sentinel'],
    resources: [
      { type: 'course', title: '微服务架构课程', description: '本校微服务架构课程（72学时）', badge: '本校课程' },
      { type: 'github', title: 'mall', description: '75K★ 完整电商系统，含微服务版本', url: 'https://github.com/macrozheng/mall', badge: 'GitHub实训' },
      { type: 'certificate', title: 'Java Web开发工程师认证', description: '第20周参加认证考试', badge: '职业认证' }
    ]
  },
  // ===== 冲刺期 里程碑 =====
  {
    id: 5,
    path_id: 1,
    stage: 3,
    title: '独立全栈项目开发',
    description: '独立完成一个具有完整业务逻辑的全栈项目，包含需求分析、设计、开发、测试全流程',
    duration: '第21-26周（约84小时）',
    status: 'upcoming',
    progress: 0,
    skills: ['项目管理', '需求分析', '系统设计', '全栈开发', 'Git Flow'],
    resources: [
      { type: 'course', title: '项目实战课程', description: '本校综合项目实战（120学时）', badge: '本校课程' },
      { type: 'certificate', title: '云计算开发与运维1+X初级', description: '建议同期准备', badge: '1+X考证' }
    ]
  },
  {
    id: 6,
    path_id: 1,
    stage: 3,
    title: '项目部署上线 & 面试准备',
    description: '将项目部署到云服务器，准备技术简历和面试，完成模拟面试练习',
    duration: '第27-30周（约56小时）',
    status: 'upcoming',
    progress: 0,
    skills: ['Linux部署', 'Nginx配置', '简历撰写', '技术面试', '项目介绍'],
    resources: [
      { type: 'certificate', title: 'Java高级开发工程师认证', description: '第30周参加认证考试', badge: '职业认证' },
      { type: 'book', title: 'Java面试题精讲', description: '系统整理常见面试题', badge: '面试准备' }
    ]
  }
];
