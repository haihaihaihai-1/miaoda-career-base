import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary-light to-primary-glow relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 left-10 w-40 h-40 bg-success/20 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-warning/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <div className="p-12 text-center">
            
            {/* Main CTA */}
            <div className="mb-12">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                开启您的职业发展新篇章
              </h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
                专业测评 + 个性化指导 + 资源支持 + 持续跟进
                <br />
                让每一步职业选择都更加明智和自信
              </p>
              
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="success" 
                size="lg" 
                className="text-lg px-10 py-4"
                onClick={() => document.getElementById('assessment')?.scrollIntoView({ behavior: 'smooth' })}
              >
                立即开始免费测评
              </Button>
              <Button 
                variant="outline-white" 
                size="lg" 
                className="text-lg px-10 py-4"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              >
                预约专业咨询
              </Button>
            </div>
            </div>
            
            {/* Features Highlights */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">精准匹配</h3>
                <p className="text-white/80">基于科学测评的个性化职业推荐</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">专家指导</h3>
                <p className="text-white/80">500+资深导师一对一咨询服务</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-light/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📈</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">持续成长</h3>
                <p className="text-white/80">全职业生命周期陪伴式服务</p>
              </div>
            </div>
            
            {/* Contact Info */}
            <div className="text-center text-white/80">
              <p className="mb-2">咨询热线：400-123-4567 | 在线客服：7×24小时</p>
              <p>邮箱：xxxxx@163.com</p>
            </div>
            
          </div>
        </Card>
        
      </div>
    </section>
  );
}