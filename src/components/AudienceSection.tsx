import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const audiences = [
  {
    title: "大学生",
    description: "从专业选择到职业规划，为即将踏入职场的您提供全面指导。",
    features: ["专业职业匹配", "实习机会推荐", "求职技能培训", "校招准备"],
    color: "bg-primary/10 text-primary",
    gradient: "from-primary/20 to-primary/5"
  },
  {
    title: "职场新人",
    description: "入职适应、技能提升、职业发展路径规划，助力职场成长。",
    features: ["职场适应指导", "技能提升计划", "晋升路径规划", "导师匹配"],
    color: "bg-success/10 text-success",
    gradient: "from-success/20 to-success/5"
  },
  {
    title: "转行者",
    description: "跨行业转换支持，重新定位职业方向，制定转行策略。",
    features: ["转行可行性分析", "技能迁移指导", "行业入门培训", "人脉资源对接"],
    color: "bg-warning/10 text-warning",
    gradient: "from-warning/20 to-warning/5"
  },
  {
    title: "中高层管理者",
    description: "领导力提升、战略思维培养、高级职位发展咨询。",
    features: ["领导力评估", "战略思维训练", "高管职位推荐", "企业文化适配"],
    color: "bg-primary-light/10 text-primary",
    gradient: "from-primary-light/20 to-primary-light/5"
  }
];

export function AudienceSection() {
  return (
    <section id="audience" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            覆盖全职业生命周期
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            无论您处于职业生涯的哪个阶段，我们都为您提供专业、个性化的指导服务
          </p>
        </div>
        
        {/* Audience Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {audiences.map((audience, index) => (
            <Card 
              key={audience.title}
              className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1 border-0 overflow-hidden cursor-pointer"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <div className={`h-2 bg-gradient-to-r ${audience.gradient}`}></div>
              
              <div className="p-6">
                {/* Title with Badge */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">
                  {audience.title}
                </h3>
                <Badge 
                  className={`${audience.color} cursor-pointer hover:opacity-80 transition-opacity`}
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  专业服务
                </Badge>
              </div>
                
                {/* Description */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {audience.description}
                </p>
                
                {/* Features List */}
                <div className="space-y-3">
                  {audience.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 flex-shrink-0"></div>
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* Hover Effect */}
                <div className="mt-6 pt-4 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-xs text-muted-foreground text-center">
                    点击了解更多服务详情 →
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-primary mb-2">10,000+</div>
            <div className="text-muted-foreground">服务用户</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-success mb-2">500+</div>
            <div className="text-muted-foreground">专业导师</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-warning mb-2">95%</div>
            <div className="text-muted-foreground">满意度</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-light mb-2">24/7</div>
            <div className="text-muted-foreground">在线支持</div>
          </div>
        </div>
        
      </div>
    </section>
  );
}