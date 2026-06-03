/**
 * PDF 报告水印工具
 *
 * 使用 jspdf 在 PDF 页面叠加：
 *   1. 半透明对角线水印文字（候选人姓名 + 时间 + 来源）
 *   2. 可选的 token / 唯一访问标识（用于追溯泄露源）
 *
 * 不直接生成 PDF；而是接收 jsPDF 实例由调用方在 export 前/后注入
 */
import type jsPDF from 'jspdf';

export interface WatermarkOptions {
  /** 水印主文本（如"候选人姓名 · 评估机构"） */
  text: string;
  /** 副文本（如时间戳） */
  subText?: string;
  /** 颜色 hex */
  color?: string;
  /** 不透明度 0-1 */
  opacity?: number;
  /** 字号 pt */
  fontSize?: number;
  /** 倾斜角度（度） */
  angle?: number;
  /** 网格间距 px */
  gap?: number;
}

const DEFAULTS: Required<Omit<WatermarkOptions, 'subText'>> = {
  text: 'CONFIDENTIAL',
  color: '#999999',
  opacity: 0.18,
  fontSize: 36,
  angle: -32,
  gap: 220,
};

/**
 * 给当前页画上对角网格水印
 * @param pdf 已存在的 jsPDF 实例（任意页号）
 * @param opts 配置
 */
export function applyWatermarkToCurrentPage(
  pdf: jsPDF,
  opts: WatermarkOptions,
): void {
  const cfg = { ...DEFAULTS, ...opts };
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();

  pdf.saveGraphicsState();
  // jsPDF 类型对 GState 不友好，用宽类型断言临时绕过
  const pdfAny = pdf as unknown as { GState: new (opts: { opacity: number }) => unknown };
  pdf.setGState(new pdfAny.GState({ opacity: cfg.opacity }));
  pdf.setTextColor(cfg.color);
  pdf.setFontSize(cfg.fontSize);

  // 主文本 - 对角网格
  for (let y = -cfg.gap; y < h + cfg.gap; y += cfg.gap) {
    for (let x = -cfg.gap; x < w + cfg.gap; x += cfg.gap) {
      pdf.text(cfg.text, x, y, { angle: cfg.angle });
    }
  }

  // 副文本 - 底部居中（如时间戳）
  if (opts.subText) {
    pdf.setFontSize(8);
    pdf.text(opts.subText, w / 2, h - 8, { align: 'center' });
  }

  pdf.restoreGraphicsState();
}

/** 给 PDF 全部页面打水印（forEach 页号） */
export function applyWatermarkToAllPages(pdf: jsPDF, opts: WatermarkOptions): void {
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    applyWatermarkToCurrentPage(pdf, opts);
  }
}

/** 生成访问令牌（用于追溯 PDF 泄露源） */
export function generateAccessToken(prefix = 'mc'): string {
  const ts = Date.now().toString(36);
  // 简易随机段（非加密强度，仅追溯用）
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${ts}-${rand}`;
}

/** 构造完整水印文本（包含 token） */
export function buildWatermarkText(opts: {
  brand: string;
  candidateName?: string;
  token?: string;
}): { text: string; subText: string } {
  const parts = [opts.brand];
  if (opts.candidateName) parts.push(opts.candidateName);
  const text = parts.join(' · ');
  const ts = new Date().toLocaleString('zh-CN', { hour12: false });
  const subText = `${ts}${opts.token ? `  ·  ${opts.token}` : ''}`;
  return { text, subText };
}
