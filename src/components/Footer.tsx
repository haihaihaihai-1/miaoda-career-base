import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="bg-muted py-12">
      <div className="container mx-auto px-6">
        
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">职</span>
              </div>
              <span className="font-bold text-lg text-foreground">职业指导平台</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              专业的职业指导服务平台，致力于为用户提供全方位的职业发展支持，助力每个人实现职业梦想。
            </p>
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                <span className="text-xs">微</span>
              </div>
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                <span className="text-xs">博</span>
              </div>
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                <span className="text-xs">知</span>
              </div>
            </div>
          </div>
          
          {/* Services */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">核心服务</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">职业测评</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">资源库</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">导师咨询</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">求职工具</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">职业规划</a></li>
            </ul>
          </div>
          
          {/* Target Users */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">服务对象</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">大学生</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">职场新人</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">转行者</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">中高层管理者</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">自由职业者</a></li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">联系我们</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>咨询热线：400-123-4567</p>
              <p>邮箱：xxxxx@163.com</p>
              <p>地址：北京市朝阳区职业发展大厦</p>
              <p>服务时间：7×24小时在线</p>
            </div>
          </div>
          
        </div>
        
        <Separator className="mb-6" />
        
        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © 2024 一站式职业指导平台. 保留所有权利.
          </div>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">隐私政策</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">服务条款</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">帮助中心</a>
          </div>
        </div>
        
      </div>
    </footer>
  );
}