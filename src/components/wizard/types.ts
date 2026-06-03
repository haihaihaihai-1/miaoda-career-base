/**
 * Wizard 步骤定义
 * 业务方提供 steps[]，WizardShell 负责切换 / 校验 / 进度条 / 草稿
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface WizardStep<T = unknown> {
  /** 唯一 key（用于 draft 恢复定位） */
  key: string;
  /** 显示名（也作 a11y 标签） */
  label: string;
  /** 可选图标 */
  icon?: LucideIcon;
  /** 渲染步骤主体 */
  render: (form: T, update: (patch: Partial<T>) => void) => ReactNode;
  /** 步骤校验（true 才能进入下一步） */
  validate?: (form: T) => boolean | string;
  /** 可选简短描述（顶部副标题） */
  description?: string;
}

export interface WizardProps<T> {
  /** 步骤数组 */
  steps: WizardStep<T>[];
  /** 初始表单数据 */
  initial: T;
  /** 提交按钮文案 */
  submitLabel?: string;
  /** 取消按钮文案；不传则不显示 */
  cancelLabel?: string;
  /** 草稿 key（启用 localStorage 自动保存恢复） */
  draftKey?: string;
  /** 顶部标题 */
  title?: string;
  /** 取消回调 */
  onCancel?: () => void;
  /** 提交回调，返回 Promise 时按钮显示 loading */
  onSubmit: (form: T) => void | Promise<void>;
  /** 一键填充演示数据 */
  demoData?: T;
}
