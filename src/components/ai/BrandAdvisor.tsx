/**
 * BrandAdvisor - 全局 AI 悬浮按钮（brand-aware）
 *
 * 调度策略：
 *   - default brand 继续用 AIAdvisorWidget（紧耦合 useApp/Student）
 *   - 其他 brand 用通用 ChatWidget + 对应 ChatProvider
 *   - brand.features.aiAdvisor=false 时不渲染
 */
import { useEffect, useState } from 'react';
import { brand } from '@/config';
import AIAdvisorWidget from './AIAdvisorWidget';
import ChatWidget from './ChatWidget';
import {
  getActiveProvider,
  onActiveProviderChange,
  type ChatProvider,
} from '@/services/aiProvider';

const PROMPTS: Record<string, string> = {
  hireflow:
    '你好！我是 HR 评估助手，可以帮你分析候选人胜任力、规划面试问题、对比岗位匹配度。',
  teaching:
    '你好！我是 AI 助教，可以回答课程问题、给出个性化学习建议、解释知识点。',
  campus: '你好！我是校园智能助手。可以问我选课、办事流程、宿舍、就业等问题。',
  'lai-lu': '你好！我是 Lai-Lu 助手。',
  default: '你好！我是 AI 顾问。',
};

export default function BrandAdvisor() {
  if (!brand.features.aiAdvisor) return null;

  // default brand 走原版 AIAdvisorWidget（紧耦合 AppContext）
  if (brand.id === 'default') return <AIAdvisorWidget />;

  return <BrandAwareChat />;
}

function BrandAwareChat() {
  const [provider, setProvider] = useState<ChatProvider>(() => getActiveProvider(brand.id));

  useEffect(() => {
    const off = onActiveProviderChange((b, _id) => {
      if (b !== brand.id) return;
      setProvider(getActiveProvider(brand.id));
    });
    return off;
  }, []);

  return (
    <ChatWidget
      provider={provider}
      initialMessage={PROMPTS[brand.id] ?? PROMPTS.default}
    />
  );
}
