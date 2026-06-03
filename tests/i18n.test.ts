/**
 * i18n 运行时切换测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  t,
  getLocale,
  setLocale,
  onLocaleChange,
  useLocale,
  listLocales,
} from '@/lib/i18n';

describe('i18n', () => {
  beforeEach(() => {
    localStorage.clear();
    setLocale('zh');
  });

  it('listLocales 包含 zh / en', () => {
    const list = listLocales();
    expect(list).toContain('zh');
    expect(list).toContain('en');
  });

  it('默认 zh 翻译', () => {
    expect(t('common.cancel')).toBe('取消');
    expect(t('wizard.next')).toBe('下一步');
  });

  it('切换 en 后翻译变化', () => {
    setLocale('en');
    expect(t('common.cancel')).toBe('Cancel');
    expect(t('wizard.next')).toBe('Next');
    expect(getLocale()).toBe('en');
  });

  it('未知 key 回退到 key 本身', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('插值参数', () => {
    expect(t('wizard.step_n_of', { n: 2, total: 5 })).toBe('第 2 / 5 步');
    setLocale('en');
    expect(t('wizard.step_n_of', { n: 2, total: 5 })).toBe('Step 2 / 5');
  });

  it('brand.copy.* 走 brand 配置', () => {
    // default brand 的 wizardIntro
    const intro = t('brand.copy.wizardIntro');
    expect(intro).toBeTruthy();
    expect(intro).not.toBe('brand.copy.wizardIntro');
  });

  it('localStorage 持久化', () => {
    setLocale('en');
    expect(localStorage.getItem('miaoda-locale')).toBe('en');
  });

  it('onLocaleChange 触发 + unsubscribe', () => {
    const log: string[] = [];
    const off = onLocaleChange((loc) => log.push(loc));
    setLocale('en');
    setLocale('zh');
    off();
    setLocale('en');
    expect(log).toEqual(['en', 'zh']);
  });

  it('useLocale hook 在切换后重新渲染', () => {
    const { result } = renderHook(() => useLocale());
    expect(result.current[0]).toBe('zh');
    act(() => {
      result.current[1]('en');
    });
    expect(result.current[0]).toBe('en');
  });

  it('相同 locale 重复 setLocale 不触发 listener', () => {
    const log: string[] = [];
    const off = onLocaleChange((loc) => log.push(loc));
    setLocale('zh'); // 已经是 zh，不应触发
    expect(log).toEqual([]);
    off();
  });
});
