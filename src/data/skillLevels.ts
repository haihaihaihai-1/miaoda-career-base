// 中国8级职业技能等级标准 - 种子数据
import type { SkillLevel } from '@/types/types';

export const skillLevels: SkillLevel[] = [
  {
    id: 1,
    level_num: 1,
    level_name: '学徒工',
    description: '处于学习阶段，在指导下从事简单操作，掌握基本职业技能知识',
    typical_duration: '1年以内',
    education_equivalent: '在校实习生'
  },
  {
    id: 2,
    level_num: 2,
    level_name: '初级工',
    description: '能独立完成本职业常规工作，掌握基本专业知识和技能',
    typical_duration: '1-2年',
    education_equivalent: '中专/高职在校生'
  },
  {
    id: 3,
    level_num: 3,
    level_name: '中级工',
    description: '能熟练掌握本职业的技术理论知识，独立完成较复杂工作任务',
    typical_duration: '2-4年',
    education_equivalent: '高职毕业/大专'
  },
  {
    id: 4,
    level_num: 4,
    level_name: '高级工',
    description: '掌握本职业系统的技术理论知识，能解决技术难题，指导初中级工',
    typical_duration: '4-7年',
    education_equivalent: '本科/高职+实践'
  },
  {
    id: 5,
    level_num: 5,
    level_name: '技师',
    description: '具有精深的专业知识，能进行技术创新和技术攻关',
    typical_duration: '7-10年',
    education_equivalent: '本科+5年以上工作经验'
  },
  {
    id: 6,
    level_num: 6,
    level_name: '高级技师',
    description: '具有丰富的工作经验和高深的专业知识，能主持技术革新',
    typical_duration: '10年以上',
    education_equivalent: '本科及以上+8年以上工作经验'
  },
  {
    id: 7,
    level_num: 7,
    level_name: '特级技师',
    description: '在本职业领域具有较高声誉，能解决行业性重大技术难题',
    typical_duration: '15年以上',
    education_equivalent: '业界专家级别'
  },
  {
    id: 8,
    level_num: 8,
    level_name: '首席技师',
    description: '在本职业领域享有权威声誉，推动行业技术进步',
    typical_duration: '20年以上',
    education_equivalent: '业界权威/大师级别'
  }
];

export const getLevelByNum = (num: number): SkillLevel | undefined =>
  skillLevels.find((l) => l.level_num === num);

export const getLevelLabel = (num: number): string => {
  const level = getLevelByNum(num);
  return level ? `${level.level_name}（L${num}）` : `L${num}`;
};
