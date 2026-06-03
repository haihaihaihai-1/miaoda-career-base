import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import careerAssessment from "@/assets/career-assessment.jpg";
import resourceLibrary from "@/assets/resource-library.jpg";
import mentorConsultation from "@/assets/mentor-consultation.jpg";
import jobTools from "@/assets/job-tools.jpg";

const features = [
  {
    title: "职业测评",
    description: "专业的职业兴趣、性格特质、技能评估，为您量身定制职业发展方向。",
    image: careerAssessment,
    color: "primary",
    details: ["MBTI性格测试", "职业兴趣量表", "技能评估报告", "发展建议"]
  },
  {
    title: "资源库",
    description: "海量职业发展资源，包括行业报告、技能课程、案例分析等。",
    image: resourceLibrary,
    color: "success",
    details: ["行业趋势报告", "技能提升课程", "求职案例库", "职场工具包"]
  },
  {
    title: "导师咨询",
    description: "连接500+资深职场导师，获得一对一专业指导和职业规划建议。",
    image: mentorConsultation,
    color: "warning",
    details: ["一对一咨询", "行业专家指导", "职业规划建议", "面试辅导"]
  },
  {
    title: "求职工具",
    description: "完整的求职工具套件，从简历优化到面试准备，全方位支持。",
    image: jobTools,
    color: "primary",
    details: ["简历优化器", "面试模拟", "薪资谈判", "职位推荐"]
  }
];

export function FeaturesSection() {
  return (
    <section id="services" className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            四大核心服务
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            从职业探索到成功就业，我们为您提供全方位的专业支持
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={feature.title}
              className="group hover:shadow-professional transition-all duration-300 hover:-translate-y-2 bg-card border-0"
            >
              <div className="p-6 h-full flex flex-col">
                
                {/* Feature Image */}
                <div className="relative mb-6 overflow-hidden rounded-lg">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t from-${feature.color}/20 to-transparent`}></div>
                </div>
                
                {/* Content */}
                <div className="flex-grow space-y-4">
                  <h3 className="text-2xl font-bold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Feature Details */}
                  <ul className="space-y-2">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center text-sm text-muted-foreground">
                        <div className={`w-2 h-2 bg-${feature.color} rounded-full mr-3`}></div>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* CTA Button */}
                <div className="pt-6">
                  <Button 
                    variant={feature.color as any} 
                    className="w-full group-hover:shadow-lg transition-shadow"
                    onClick={() => {
                      if (feature.title === "职业测评") {
                        document.getElementById('assessment')?.scrollIntoView({ behavior: 'smooth' });
                      } else if (feature.title === "资源库") {
                        document.getElementById('resources')?.scrollIntoView({ behavior: 'smooth' });
                      } else if (feature.title === "导师咨询") {
                        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    了解详情
                  </Button>
                </div>
                
              </div>
            </Card>
          ))}
        </div>
        
      </div>
    </section>
  );
}