import { Button } from "@/components/ui/button";
import heroImage from "@/assets/career-hero.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary-light to-primary-glow">
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div className="text-white space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                一站式
                <span className="block bg-gradient-to-r from-success-light to-warning bg-clip-text text-transparent">
                  职业指导平台
                </span>
              </h1>
              <p className="text-xl lg:text-2xl text-white/90 max-w-lg">
                专业测评 • 资源库 • 导师咨询 • 求职工具
              </p>
              <p className="text-lg text-white/80 max-w-2xl">
                面向大学生、职场新人、转行者及中高层管理者，覆盖全职业生命周期需求，助力您的职业发展每一步。
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="success" 
                size="lg" 
                className="text-lg px-8 py-4"
                onClick={() => document.getElementById('assessment')?.scrollIntoView({ behavior: 'smooth' })}
              >
                开始职业测评
              </Button>
              <Button 
                variant="outline-white" 
                size="lg" 
                className="text-lg px-8 py-4"
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              >
                了解更多
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-sm text-white/70">服务用户</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">500+</div>
                <div className="text-sm text-white/70">专业导师</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">95%</div>
                <div className="text-sm text-white/70">满意度</div>
              </div>
            </div>
          </div>
          
          {/* Right Image */}
          <div className="relative">
            <div className="relative z-10 transform hover:scale-105 transition-transform duration-500">
              <img 
                src={heroImage} 
                alt="职业指导服务" 
                className="rounded-2xl shadow-2xl w-full"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-success/20 to-warning/20 rounded-2xl transform translate-x-4 translate-y-4"></div>
          </div>
          
        </div>
      </div>
      
      {/* Background decorations */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-success/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 left-20 w-40 h-40 bg-warning/10 rounded-full blur-xl"></div>
    </section>
  );
}