/**
 * 增强的轻量 i18n - 支持运行时切换 + 监听器
 *
 * 用法：
 *   import { t, setLocale, getLocale, onLocaleChange } from '@/lib/i18n';
 *   const text = t('common.cancel');
 *   setLocale('en');
 *   onLocaleChange((loc) => console.log('locale →', loc));
 */
import { brand } from '@/config';

export type Locale = 'zh' | 'en';

const STORAGE_KEY = 'miaoda-locale';
type Listener = (loc: Locale) => void;
const listeners = new Set<Listener>();

function readInitialLocale(): Locale {
  // 1. localStorage 优先（用户手动设置）
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored === 'en' || stored === 'zh') return stored;
    } catch {
      /* noop */
    }
  }
  // 2. 环境变量
  const envLoc = import.meta.env.VITE_LOCALE as Locale | undefined;
  if (envLoc === 'en' || envLoc === 'zh') return envLoc;
  // 3. 浏览器 navigator.language
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('en')) return 'en';
  }
  return 'zh';
}

let currentLocale: Locale = readInitialLocale();

const dict: Record<Locale, Record<string, string>> = {
  zh: {
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.submit': '提交',
    'common.loading': '加载中...',
    'common.error': '出错了',
    'common.retry': '重试',
    'common.signin': '登录',
    'common.signout': '登出',
    'wizard.next': '下一步',
    'wizard.prev': '上一步',
    'wizard.step_n_of': '第 {n} / {total} 步',
    'wizard.submit': '提交',
    'theme.toggle': '切换主题',
    'theme.light': '浅色',
    'theme.dark': '深色',
    'theme.system': '跟随系统',
    'lang.toggle': '切换语言',
    'lang.zh': '中文',
    'lang.en': 'English',
    'brand.label': '当前品牌',
    'network.offline': '当前离线 — 仅可访问已缓存的内容',
    'network.online': '已恢复在线',
  },
  en: {
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.submit': 'Submit',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.retry': 'Retry',
    'common.signin': 'Sign in',
    'common.signout': 'Sign out',
    'wizard.next': 'Next',
    'wizard.prev': 'Previous',
    'wizard.step_n_of': 'Step {n} / {total}',
    'wizard.submit': 'Submit',
    'theme.toggle': 'Toggle theme',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
    'lang.toggle': 'Toggle language',
    'lang.zh': '中文',
    'lang.en': 'English',
    'brand.label': 'Active brand',
    'network.offline': 'Currently offline — cached content only',
    'network.online': 'Back online',
  },
};

function interpolate(tpl: string, params?: Record<string, string | number>): string {
  if (!params) return tpl;
  return tpl.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}

export function t(key: string, params?: Record<string, string | number>): string {
  if (key.startsWith('brand.copy.')) {
    const k = key.slice('brand.copy.'.length) as keyof typeof brand.copy;
    const v = brand.copy[k];
    if (v) return interpolate(v, params);
  }
  const tpl = dict[currentLocale]?.[key] ?? dict.zh[key] ?? key;
  return interpolate(tpl, params);
}

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(next: Locale): void {
  if (currentLocale === next) return;
  currentLocale = next;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next === 'en' ? 'en' : 'zh-CN';
    } catch {
      /* noop */
    }
  }
  for (const l of listeners) {
    try {
      l(next);
    } catch {
      /* noop */
    }
  }
}

export function onLocaleChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** React Hook：组件订阅 locale 变化（避免直接订阅 + setState 模板） */
import { useEffect, useState } from 'react';

export function useLocale(): [Locale, (next: Locale) => void] {
  const [loc, setLoc] = useState<Locale>(() => currentLocale);
  useEffect(() => onLocaleChange(setLoc), []);
  return [loc, setLocale];
}

/** 列出所有已注册 locale */
export function listLocales(): Locale[] {
  return Object.keys(dict) as Locale[];
}
