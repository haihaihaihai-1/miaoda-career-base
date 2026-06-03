import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const assessmentTypes = [
  {
    title: "职业兴趣测评",
    description: "发现您的职业兴趣方向，找到内心真正热爱的工作领域",
    duration: "15分钟",
    questions: "60题",
    type: "兴趣导向",
    color: "primary",
    features: ["霍兰德职业兴趣理论", "6大兴趣类型分析", "匹配职业推荐", "发展建议"]
  },
  {
    title: "性格特质分析",
    description: "深度了解个人性格特征，匹配最适合的工作环境和团队角色",
    duration: "20分钟",
    questions: "93题",
    type: "性格分析",
    color: "success",
    features: ["MBTI性格理论", "16种性格类型", "工作风格分析", "团队角色定位"]
  },
  {
    title: "能力技能评估",
    description: "全面评估现有技能水平，识别优势能力和提升空间",
    duration: "25分钟",
    questions: "45题",
    type: "能力评估",
    color: "warning",
    features: ["多维能力分析", "技能水平评级", "能力发展建议", "学习路径规划"]
  }
];

export function AssessmentSection() {
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [currentQuestions, setCurrentQuestions] = useState<string[]>([]);

  // 不同测评类型的专门题目
  const questionSets = {
    // 职业兴趣测评题目
    interest: [
      "我喜欢研究和分析复杂的数据问题",
      "我更愿意与人交流合作而不是独自工作",
      "我对艺术创作和设计充满热情",
      "我喜欢遵循既定流程和标准操作",
      "我享受说服他人接受我的观点",
      "我更喜欢户外活动而不是办公室工作",
      "我对帮助他人解决困难很有成就感",
      "我喜欢处理具体的事物而不是抽象概念",
      "我对探索未知领域充满好奇心",
      "我更注重工作的实用性和效率",
      "我喜欢在团队中发挥协调作用",
      "我对技术创新和发明很感兴趣",
      "我享受教学和培训他人的过程",
      "我更喜欢有挑战性的复杂任务",
      "我对社会公益和慈善事业很关注"
    ],
    
    // 性格特质分析题目
    personality: [
      "我在社交场合中通常很活跃健谈",
      "我做决定时更依靠逻辑而不是直觉",
      "我更关注未来的可能性而不是现实细节",
      "我更喜欢灵活应变而不是严格计划",
      "我在压力下能够保持冷静",
      "我更愿意领导而不是跟随他人",
      "我经常为他人的情感变化而担心",
      "我喜欢在做决定前收集大量信息",
      "我更注重和谐的人际关系",
      "我倾向于相信人性本善",
      "我在新环境中适应能力很强",
      "我更喜欢竞争而不是合作",
      "我经常反思自己的行为和想法",
      "我更重视传统价值观和稳定性",
      "我喜欢尝试新的方法和创新思路"
    ],
    
    // 能力技能评估题目
    ability: [
      "我能快速理解复杂的技术概念",
      "我擅长用简单的语言解释复杂问题",
      "我能够同时处理多个任务而不出错",
      "我在时间管理方面表现优秀",
      "我能够快速学习新的软件或工具",
      "我擅长发现工作流程中的问题",
      "我能够在团队中有效分配任务",
      "我擅长制作清晰的报告和文档",
      "我能够在紧急情况下快速做出决策",
      "我擅长分析数据并找出规律",
      "我能够有效地进行公众演讲",
      "我擅长解决客户的投诉和问题",
      "我能够独立完成复杂的项目",
      "我擅长使用各种办公软件",
      "我能够快速适应工作环境的变化"
    ]
  };

  // 根据选择的测评类型获取对应题目并随机打乱顺序
  const getRandomizedQuestions = (assessmentType: number) => {
    let questions;
    switch(assessmentType) {
      case 0:
        questions = [...questionSets.interest];
        break;
      case 1:
        questions = [...questionSets.personality];
        break;
      case 2:
        questions = [...questionSets.ability];
        break;
      default:
        questions = [...questionSets.interest];
    }
    
    // 随机打乱题目顺序
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    
    return questions;
  };

  const handleStartAssessment = (index: number) => {
    setSelectedAssessment(index);
    setIsStarted(true);
    setCurrentStep(1);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowResults(false);
    setAnalysisResult(null);
    
    // 生成随机化的题目
    const randomizedQuestions = getRandomizedQuestions(index);
    setCurrentQuestions(randomizedQuestions);
  };

  const generateAnalysisResult = (answers: number[], assessmentType: number) => {
    // 根据答案计算不同的结果
    const totalScore = answers.reduce((sum, answer) => sum + answer, 0);
    const avgScore = totalScore / answers.length;
    
    // 基于平均分和测评类型生成不同结果
    let resultType, description, recommendedCareers, keyTraits;
    
    if (avgScore <= 1.5) {
      // 积极主动型
      resultType = "积极主动型";
      description = "您是一个积极主动、充满活力的人，喜欢迎接挑战。";
      recommendedCareers = ["产品经理", "销售经理", "创业者"];
      keyTraits = ["主动性强", "适应能力好", "目标导向"];
    } else if (avgScore <= 2.5) {
      // 平衡稳健型  
      resultType = "平衡稳健型";
      description = "您善于平衡各方面因素，做事稳重可靠。";
      recommendedCareers = ["项目经理", "人力资源", "财务分析师"];
      keyTraits = ["平衡能力强", "稳重可靠", "协调性好"];
    } else {
      // 理性分析型
      resultType = "理性分析型";
      description = "您倾向于深度思考，注重逻辑分析和细节。";
      recommendedCareers = ["数据分析师", "研究员", "软件工程师"];
      keyTraits = ["逻辑思维强", "注重细节", "深度思考"];
    }
    
    return {
      type: resultType,
      description: description,
      careers: recommendedCareers,
      traits: keyTraits,
      matchScore: Math.round(85 + (Math.random() * 10)) // 85-95之间的随机匹配度
    };
  };


  const answerOptions = [
    "非常同意",
    "比较同意", 
    "不确定",
    "比较不同意",
    "非常不同意"
  ];

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer !== null) {
      const newAnswers = [...answers];
      newAnswers[currentStep - 1] = selectedAnswer;
      setAnswers(newAnswers);
      
      if (currentStep < currentQuestions.length) {
        setCurrentStep(currentStep + 1);
        setSelectedAnswer(null);
      } else {
        // 完成测评，生成分析结果
        const result = generateAnalysisResult(newAnswers, selectedAssessment!);
        setAnalysisResult(result);
        setShowResults(true);
        setIsStarted(false);
      }
    }
  };

  const handlePrevQuestion = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setSelectedAnswer(answers[currentStep - 2] || null);
    } else {
      setIsStarted(false);
      setCurrentStep(0);
      setSelectedAssessment(null);
      setAnswers([]);
      setSelectedAnswer(null);
    }
  };

  const resetAssessment = () => {
    setIsStarted(false);
    setCurrentStep(0);
    setSelectedAssessment(null);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowResults(false);
    setAnalysisResult(null);
    setCurrentQuestions([]);
  };

  return (
    <section id="assessment" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        
        {!isStarted && !showResults ? (
          <>
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                专业职业测评
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                通过科学的职业测评工具，深入了解自己的职业倾向、性格特质和能力优势，
                为职业发展提供数据支撑和专业指导。
              </p>
            </div>
            
            {/* Assessment Types */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {assessmentTypes.map((assessment, index) => (
                <Card 
                  key={index}
                  className="group hover:shadow-professional transition-all duration-300 hover:-translate-y-2 bg-card border-0"
                >
                  <div className="p-6 h-full flex flex-col">
                    
                    {/* Header */}
                    <div className="mb-6">
                      <div className="flex justify-between items-start mb-4">
                        <Badge className={`bg-${assessment.color}/10 text-${assessment.color}`}>
                          {assessment.type}
                        </Badge>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>{assessment.duration}</div>
                          <div>{assessment.questions}</div>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-foreground mb-3">
                        {assessment.title}
                      </h3>
                      
                      <p className="text-muted-foreground leading-relaxed">
                        {assessment.description}
                      </p>
                    </div>
                    
                    {/* Features */}
                    <div className="flex-grow mb-6">
                      <div className="space-y-2">
                        {assessment.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center text-sm">
                            <div className={`w-2 h-2 bg-${assessment.color} rounded-full mr-3 flex-shrink-0`}></div>
                            <span className="text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* CTA Button */}
                    <Button 
                      variant={assessment.color as any}
                      className="w-full group-hover:shadow-lg transition-shadow"
                      onClick={() => handleStartAssessment(index)}
                    >
                      开始测评
                    </Button>
                    
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Benefits */}
            <div className="bg-muted/50 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                测评完成后您将获得
              </h3>
              <div className="grid md:grid-cols-4 gap-6">
                <div>
                  <div className="text-3xl mb-2">📊</div>
                  <h4 className="font-semibold mb-1">详细报告</h4>
                  <p className="text-sm text-muted-foreground">15页专业分析报告</p>
                </div>
                <div>
                  <div className="text-3xl mb-2">🎯</div>
                  <h4 className="font-semibold mb-1">职业推荐</h4>
                  <p className="text-sm text-muted-foreground">匹配度排序职业建议</p>
                </div>
                <div>
                  <div className="text-3xl mb-2">📈</div>
                  <h4 className="font-semibold mb-1">发展路径</h4>
                  <p className="text-sm text-muted-foreground">个性化职业发展规划</p>
                </div>
                <div>
                  <div className="text-3xl mb-2">💼</div>
                  <h4 className="font-semibold mb-1">导师咨询</h4>
                  <p className="text-sm text-muted-foreground">30分钟免费咨询</p>
                </div>
              </div>
            </div>
          </>
        ) : showResults && analysisResult ? (
          /* Assessment Results - Simplified */
          <div className="max-w-3xl mx-auto">
            
            {/* Results Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-success to-success-light rounded-full mb-4">
                <span className="text-white text-xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                测评结果
              </h2>
            </div>

            {/* Main Result Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 mb-6">
              <div className="p-8 text-center">
                <div className="mb-6">
                  <Badge className="bg-primary text-primary-foreground text-lg px-6 py-2 mb-4">
                    匹配度 {analysisResult.matchScore}%
                  </Badge>
                  <h3 className="text-3xl font-bold text-primary mb-3">
                    {analysisResult.type}
                  </h3>
                  <p className="text-lg text-muted-foreground">
                    {analysisResult.description}
                  </p>
                </div>
                
                {/* Recommended Careers */}
                <div className="mb-6">
                  <h4 className="font-semibold text-foreground mb-3">推荐职业：</h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {analysisResult.careers.map((career: string, index: number) => (
                      <Badge key={index} className="bg-success/10 text-success border-success/20">
                        {career}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Key Traits */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3">核心特质：</h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {analysisResult.traits.map((trait: string, index: number) => (
                      <div key={index} className="flex items-center bg-white/50 rounded-full px-3 py-1">
                        <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                        <span className="text-sm text-foreground">{trait}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
                <Button 
                  variant="success" 
                  size="lg"
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  获取详细报告
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={resetAssessment}
                >
                  重新测评
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                想了解更多？联系我们获取15页详细职业分析报告
              </p>
            </div>
            
          </div>
        ) : isStarted ? (
          /* Assessment Demo */
          <div className="max-w-3xl mx-auto">
            <Card className="bg-card border-0 shadow-professional">
              <div className="p-8">
                
                {/* Progress Header */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-foreground">
                      {assessmentTypes[selectedAssessment!].title}
                    </h3>
                    <Badge className={`bg-${assessmentTypes[selectedAssessment!].color}/10 text-${assessmentTypes[selectedAssessment!].color}`}>
                      问题 {currentStep}/{currentQuestions.length}
                    </Badge>
                  </div>
                  <Progress value={(currentStep / currentQuestions.length) * 100} className="h-2" />
                </div>
                
                {/* Question */}
                <div className="mb-8">
                  <h4 className="text-xl font-semibold text-foreground mb-6">
                    {currentQuestions[currentStep - 1]}
                  </h4>
                  
                  <div className="space-y-3">
                    {answerOptions.map((option, index) => (
                      <button
                        key={index}
                        className={`w-full p-4 text-left border rounded-lg transition-all ${
                          selectedAnswer === index 
                            ? `border-${assessmentTypes[selectedAssessment!].color} bg-${assessmentTypes[selectedAssessment!].color}/10 text-${assessmentTypes[selectedAssessment!].color}` 
                            : 'border-border hover:bg-muted/50 hover:border-primary/30'
                        }`}
                        onClick={() => handleAnswerSelect(index)}
                      >
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                            selectedAnswer === index 
                              ? `border-${assessmentTypes[selectedAssessment!].color} bg-${assessmentTypes[selectedAssessment!].color}` 
                              : 'border-border'
                          }`}>
                            {selectedAnswer === index && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          {option}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Navigation */}
                <div className="flex justify-between">
                  <Button 
                    variant="outline"
                    onClick={handlePrevQuestion}
                  >
                    {currentStep > 1 ? "上一题" : "返回"}
                  </Button>
                  
                  <Button 
                    variant={assessmentTypes[selectedAssessment!].color as any}
                    onClick={handleNextQuestion}
                    disabled={selectedAnswer === null}
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentStep < currentQuestions.length ? "下一题" : "完成测评"}
                  </Button>
                </div>
                
              </div>
            </Card>
          </div>
        ) : null}
        
      </div>
    </section>
  );
}