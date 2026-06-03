import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const contactMethods = [
  {
    title: "在线客服",
    description: "7×24小时在线服务",
    detail: "即时响应，快速解决问题",
    icon: "💬",
    action: "立即咨询",
    available: true
  },
  {
    title: "电话咨询",
    description: "400-123-4567",
    detail: "工作日 9:00-18:00",
    icon: "📞",
    action: "拨打电话",
    available: true
  },
  {
    title: "邮件联系",
    description: "xxxxx@163.com",
    detail: "24小时内回复",
    icon: "✉️",
    action: "发送邮件",
    available: true
  },
  {
    title: "预约面谈",
    description: "线下/视频咨询",
    detail: "专业导师一对一服务",
    icon: "🤝",
    action: "预约咨询",
    available: true
  }
];

const mentors = [
  {
    name: "张晓明",
    title: "资深职业规划师",
    experience: "15年",
    specialty: "IT行业转型",
    rating: "4.9",
    consultations: "1200+",
    avatar: "👨‍💼"
  },
  {
    name: "李美华",
    title: "人力资源专家",
    experience: "12年",
    specialty: "金融行业发展",
    rating: "4.8",
    consultations: "980+",
    avatar: "👩‍💼"
  },
  {
    name: "王建国",
    title: "企业管理顾问",
    experience: "18年", 
    specialty: "管理层晋升",
    rating: "5.0",
    consultations: "750+",
    avatar: "👨‍💻"
  }
];

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("提交成功！", { description: "我们将在24小时内与您联系，请保持手机畅通。" });
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section id="contact" className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            联系我们
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            专业的职业指导团队随时为您服务。无论是职业困惑、求职难题，还是发展规划，我们都有专业的解决方案。
          </p>
        </div>
        
        <Tabs defaultValue="contact" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-12">
            <TabsTrigger value="contact">联系方式</TabsTrigger>
            <TabsTrigger value="mentors">专业导师</TabsTrigger>
            <TabsTrigger value="form">在线咨询</TabsTrigger>
          </TabsList>
          
          {/* Contact Methods */}
          <TabsContent value="contact" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {contactMethods.map((method, index) => (
                <Card key={index} className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1">
                  <div className="p-6 text-center">
                    <div className="text-4xl mb-4">{method.icon}</div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {method.title}
                    </h3>
                    <p className="text-primary font-semibold mb-2">
                      {method.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {method.detail}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Office Info */}
            <Card className="bg-card">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
                  办公地址
                </h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-foreground mb-4">总部 - 北京</h4>
                    <div className="space-y-2 text-muted-foreground">
                      <p>📍 北京市朝阳区建外SOHO A座 15层</p>
                      <p>🚇 地铁1号线、10号线国贸站 C口出</p>
                      <p>🚌 公交1路、4路、37路国贸站</p>
                      <p>🅿️ 地下停车场B1-B3层</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-4">分部 - 上海</h4>
                    <div className="space-y-2 text-muted-foreground">
                      <p>📍 上海市浦东新区陆家嘴金茂大厦 28层</p>
                      <p>🚇 地铁2号线陆家嘴站 6号出口</p>
                      <p>🚌 公交81路、82路陆家嘴站</p>
                      <p>🅿️ 金茂大厦地下车库</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          {/* Mentors Tab */}
          <TabsContent value="mentors" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {mentors.map((mentor, index) => (
                <Card key={index} className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1">
                  <div className="p-6 text-center">
                    <div className="text-6xl mb-4">{mentor.avatar}</div>
                    
                    <h3 className="text-xl font-bold text-foreground mb-1">
                      {mentor.name}
                    </h3>
                    <p className="text-primary font-semibold mb-2">
                      {mentor.title}
                    </p>
                    <Badge className="mb-4 bg-success/10 text-success">
                      {mentor.experience}经验
                    </Badge>
                    
                    <div className="space-y-2 text-sm text-muted-foreground mb-6">
                      <p>⭐ {mentor.rating}/5.0 评分</p>
                      <p>👥 {mentor.consultations}次咨询</p>
                      <p>🎯 专长：{mentor.specialty}</p>
                    </div>
                    
                    <Button 
                      variant="success" 
                      className="w-full"
                      onClick={() => {
                        toast.success(`预约成功！`, { description: `已为您预约${mentor.name}的咨询服务，稍后客服会联系您确认时间。` });
                      }}
                    >
                      预约咨询
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Contact Form */}
          <TabsContent value="form" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <Card className="bg-card">
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
                    在线咨询表单
                  </h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          姓名 *
                        </label>
                        <Input
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="请输入您的姓名"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          手机号 *
                        </label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          placeholder="请输入您的手机号"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        邮箱
                      </label>
                      <Input
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="请输入您的邮箱（选填）"
                        type="email"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        咨询主题 *
                      </label>
                      <Input
                        value={formData.subject}
                        onChange={(e) => handleInputChange("subject", e.target.value)}
                        placeholder="请简要描述您的咨询主题"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        详细描述 *
                      </label>
                      <Textarea
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        placeholder="请详细描述您的问题或需求，我们将为您提供针对性的建议"
                        rows={5}
                        required
                      />
                    </div>
                    
                    <Button type="submit" variant="primary" className="w-full">
                      提交咨询
                    </Button>
                  </form>
                  
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
      </div>
    </section>
  );
}