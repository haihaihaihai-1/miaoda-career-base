import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";
import { workplaceTrends2024 } from "@/data/reports/workplace-trends-2024";
import { aiCareerTransformationGuide } from "@/data/reports/ai-career-transformation-guide";
import { remoteWorkHandbook } from "@/data/reports/remote-work-handbook";
import { downloadReport } from "@/utils/downloadUtils";
import { toast } from "sonner";

const reportDataMap = {
  "2024年职场趋势报告": workplaceTrends2024,
  "AI时代职业转型指南": aiCareerTransformationGuide,
  "远程工作完全手册": remoteWorkHandbook
};

const resources = {
  reports: [
    {
      title: "2024年职场趋势报告",
      description: "深度分析当前就业市场趋势，涵盖热门行业发展前景",
      category: "行业报告",
      difficulty: "入门级",
      downloads: "2.3K",
      dataKey: "2024年职场趋势报告"
    },
    {
      title: "AI时代职业转型指南",
      description: "如何在人工智能浪潮中找到自己的职业定位",
      category: "转型指导", 
      difficulty: "进阶级",
      downloads: "1.8K",
      dataKey: "AI时代职业转型指南"
    },
    {
      title: "远程工作完全手册",
      description: "数字游民生活方式与远程工作技能全攻略",
      category: "工作模式",
      difficulty: "中级",
      downloads: "3.1K",
      dataKey: "远程工作完全手册"
    }
  ],
  courses: [
    {
      title: "职业规划基础课程",
      description: "系统学习职业规划方法论，制定个人发展路径",
      category: "职业规划",
      difficulty: "入门级",
      duration: "4小时",
      students: "5.2K"
    },
    {
      title: "面试技巧进阶训练",
      description: "提升面试表现，掌握各类面试场景应对策略",
      category: "求职技能",
      difficulty: "中级", 
      duration: "6小时",
      students: "3.7K"
    },
    {
      title: "领导力发展课程",
      description: "培养管理思维，提升团队领导和沟通能力",
      category: "管理技能",
      difficulty: "高级",
      duration: "8小时",
      students: "2.1K"
    }
  ],
  tools: [
    {
      title: "简历优化工具",
      description: "AI驱动的简历分析和优化建议",
      category: "求职工具",
      type: "在线工具",
      users: "12.5K"
    },
    {
      title: "薪资对比器",
      description: "实时薪资数据对比，了解市场行情",
      category: "薪资工具",
      type: "数据查询",
      users: "8.3K"
    },
    {
      title: "职位匹配器",
      description: "基于技能和兴趣的智能职位推荐",
      category: "求职工具",
      type: "推荐系统",
      users: "15.7K"
    }
  ]
};

export function ResourcesSection() {
  const handleDownload = (report: { title: string; dataKey: string }) => {
    try {
      const reportData = reportDataMap[report.dataKey as keyof typeof reportDataMap];
      const filename = `${report.title}.txt`;
      downloadReport(reportData, filename);
      toast.success("下载成功", { description: `${report.title} 已下载到您的设备` });
    } catch {
      toast.error("下载失败", { description: "文件下载时出现错误，请重试" });
    }
  };

  const handleExternalClick = () => {
    const externalUrl = import.meta.env.VITE_EXTERNAL_RESOURCE_URL ?? '/';
    window.open(externalUrl, '_blank');
  };

  return (
    <section id="resources" className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            资源中心
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            精选职业发展资源，助力您的每一步成长。从行业洞察到实用工具，这里有您需要的一切。
          </p>
        </div>
        
        {/* Resource Tabs */}
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-12">
            <TabsTrigger value="reports">行业报告</TabsTrigger>
            <TabsTrigger value="courses">在线课程</TabsTrigger>
            <TabsTrigger value="tools">实用工具</TabsTrigger>
          </TabsList>
          
          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.reports.map((report, index) => (
                <Card key={index} className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className="bg-primary/10 text-primary">{report.category}</Badge>
                      <Badge variant="outline">{report.difficulty}</Badge>
                    </div>
                    
                    <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {report.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                      {report.description}
                    </p>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>⬇️ {report.downloads}次下载</span>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleDownload(report)}
                      variant="outline" 
                      size="sm" 
                      className="w-full group-hover:border-primary group-hover:text-primary"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      下载报告
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.courses.map((course, index) => (
                <Card 
                  key={index} 
                  className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  onClick={handleExternalClick}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className="bg-success/10 text-success">{course.category}</Badge>
                      <Badge variant="outline">{course.difficulty}</Badge>
                    </div>
                    
                    <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-success transition-colors">
                      {course.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                      {course.description}
                    </p>
                    
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>⏱️ {course.duration}</span>
                      <span>👥 {course.students}学员</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.tools.map((tool, index) => (
                <Card 
                  key={index} 
                  className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  onClick={handleExternalClick}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className="bg-warning/10 text-warning">{tool.category}</Badge>
                      <Badge variant="outline">{tool.type}</Badge>
                    </div>
                    
                    <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-warning transition-colors">
                      {tool.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                      {tool.description}
                    </p>
                    
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>👤 {tool.users}用户使用</span>
                      <span>🔥 热门工具</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
      </div>
    </section>
  );
}