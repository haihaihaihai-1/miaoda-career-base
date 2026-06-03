/**
 * pdfWatermark 测试 - 不真正生成 PDF，验证 helper 函数行为
 */
import { describe, it, expect, vi } from 'vitest';
import {
  generateAccessToken,
  buildWatermarkText,
  applyWatermarkToAllPages,
  applyWatermarkToCurrentPage,
} from '@/lib/pdfWatermark';

describe('generateAccessToken', () => {
  it('默认前缀 mc', () => {
    const t = generateAccessToken();
    expect(t).toMatch(/^mc-[a-z0-9]+-[a-z0-9]+$/);
  });
  it('支持自定义前缀', () => {
    const t = generateAccessToken('rep');
    expect(t.startsWith('rep-')).toBe(true);
  });
  it('两次调用产生不同 token', () => {
    const a = generateAccessToken();
    const b = generateAccessToken();
    expect(a).not.toBe(b);
  });
});

describe('buildWatermarkText', () => {
  it('包含 brand + 候选人姓名', () => {
    const r = buildWatermarkText({
      brand: 'HireFlow',
      candidateName: 'Alice',
      token: 'rep-xxx',
    });
    expect(r.text).toContain('HireFlow');
    expect(r.text).toContain('Alice');
    expect(r.subText).toContain('rep-xxx');
  });
  it('无候选人姓名时只 brand', () => {
    const r = buildWatermarkText({ brand: 'Brand-X' });
    expect(r.text).toBe('Brand-X');
    expect(r.subText).toBeTruthy();
  });
});

describe('applyWatermark (with mock jsPDF)', () => {
  function createMockPdf() {
    return {
      internal: {
        pageSize: { getWidth: () => 595, getHeight: () => 842 },
      },
      saveGraphicsState: vi.fn(),
      restoreGraphicsState: vi.fn(),
      setGState: vi.fn(),
      GState: vi.fn(),
      setTextColor: vi.fn(),
      setFontSize: vi.fn(),
      text: vi.fn(),
      getNumberOfPages: vi.fn(() => 2),
      setPage: vi.fn(),
    };
  }

  it('applyWatermarkToCurrentPage 调用 text + saveGraphicsState', () => {
    const pdf = createMockPdf();
    applyWatermarkToCurrentPage(pdf as never, { text: 'X' });
    expect(pdf.saveGraphicsState).toHaveBeenCalled();
    expect(pdf.restoreGraphicsState).toHaveBeenCalled();
    expect(pdf.text).toHaveBeenCalled();
  });

  it('applyWatermarkToAllPages 遍历所有页', () => {
    const pdf = createMockPdf();
    applyWatermarkToAllPages(pdf as never, { text: 'X' });
    expect(pdf.setPage).toHaveBeenCalledWith(1);
    expect(pdf.setPage).toHaveBeenCalledWith(2);
  });

  it('subText 触发底部文字', () => {
    const pdf = createMockPdf();
    applyWatermarkToCurrentPage(pdf as never, { text: 'X', subText: '时间戳' });
    const calls = pdf.text.mock.calls as unknown[][];
    const hasSubText = calls.some((c) => c[0] === '时间戳');
    expect(hasSubText).toBe(true);
  });
});
