/**
 * Hireflow brand - 评估报告 PDF 生成
 *
 * 独立于 default brand 的 `pdfReport.ts`，专为 Candidate / Assessment 设计：
 *   - 封面：候选人 + 岗位 + match_rate + recommendation
 *   - 详情：5 维 scores 表格 + Gap 列表
 *   - 案例题：question + answer + score
 *   - 全页水印（PII 防泄露）+ 唯一 token
 *
 * 不依赖 Supabase Edge Function，直接 jsPDF 客户端生成
 */
import {
  applyWatermarkToAllPages,
  buildWatermarkText,
  generateAccessToken,
} from '@/lib/pdfWatermark';
import { brand } from '@/config';
import { COMPETENCY_DIMENSIONS, analyzeCompetencyGap, getPositionRequirement } from '@/services/competencyAnalysis';
import type { Candidate } from '@/types/hireflow';
import { captureException, logEvent } from '@/lib/observability';

export interface HireflowReportOptions {
  candidate: Candidate;
  /** 可选：assessment 答题快照，用于附录页 */
  answers?: Array<{ question: string; answer: string; score: number; dimension: string }>;
  /** 可选：评估机构 */
  assessor?: string;
}

const W = 595;
const H = 842;
const M = 40;

function severityLabel(s: 'critical' | 'moderate' | 'minor' | 'none'): string {
  return { critical: '严重缺口', moderate: '中等缺口', minor: '小缺口', none: '已达标' }[s];
}

const recommendLabel: Record<string, string> = {
  strong_hire: '强烈录用',
  hire: '录用',
  on_hold: '待定',
  no_hire: '不录用',
};

export async function generateHireflowPdf(opts: HireflowReportOptions): Promise<string> {
  const token = generateAccessToken('hf');
  logEvent('hireflow.report.export', {
    candidate_id: opts.candidate.id,
    token,
    match: opts.candidate.overall_match_rate,
  });

  try {
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

    drawCover(pdf, opts);
    drawDetails(pdf, opts);
    if (opts.answers && opts.answers.length > 0) drawAnswersAppendix(pdf, opts);

    // 全页水印
    const { text, subText } = buildWatermarkText({
      brand: brand.name,
      candidateName: opts.candidate.name,
      token,
    });
    applyWatermarkToAllPages(pdf, { text, subText });

    pdf.save(`${brand.name}-${opts.candidate.name}-${token}.pdf`);
    return token;
  } catch (e) {
    captureException(e, { stage: 'hireflow.pdf' });
    throw e;
  }
}

// ============================================================================
// 各页绘制 —— 使用宽类型断言绕过 jsPDF 零散类型
// ============================================================================

type PdfLike = {
  internal: { pageSize: { getWidth(): number; getHeight(): number } };
  setFillColor(r: number, g?: number, b?: number): void;
  rect(x: number, y: number, w: number, h: number, style?: string): void;
  roundedRect(
    x: number,
    y: number,
    w: number,
    h: number,
    rx: number,
    ry: number,
    style?: string,
  ): void;
  setTextColor(r: number | string, g?: number, b?: number): void;
  setFontSize(size: number): void;
  text(text: string, x: number, y: number, options?: { align?: string }): void;
  addPage(): void;
  splitTextToSize(text: string, maxWidth: number): string[];
};

function drawCover(pdf: PdfLike, opts: HireflowReportOptions): void {
  const { candidate, assessor } = opts;
  pdf.setFillColor(26, 86, 219);
  pdf.rect(0, 0, W, 150, 'F');
  pdf.setTextColor(255);
  pdf.setFontSize(22);
  pdf.text('Candidate Assessment Report', M, 60);
  pdf.setFontSize(11);
  pdf.text(brand.name, M, 82);

  pdf.setTextColor(0);
  pdf.setFontSize(14);
  pdf.text(`Name: ${candidate.name}`, M, 195);
  pdf.text(`Target Position: ${candidate.target_position}`, M, 215);
  pdf.text(`Experience: ${candidate.experience_years} year(s)`, M, 235);
  if (assessor) pdf.text(`Assessor: ${assessor}`, M, 255);

  pdf.setFontSize(11);
  pdf.text(`Stage: ${candidate.interview_stage}`, M, 280);
  if (candidate.email) pdf.text(`Email: ${candidate.email}`, M, 300);

  // 大字 match rate
  if (candidate.overall_match_rate != null) {
    pdf.setFontSize(56);
    pdf.setTextColor(26, 86, 219);
    pdf.text(`${Math.round(candidate.overall_match_rate)}%`, W - M, 240, { align: 'right' });
    pdf.setFontSize(10);
    pdf.setTextColor(0);
    pdf.text('Match Rate', W - M, 258, { align: 'right' });
  }

  if (candidate.notes) {
    const rec = recommendLabel[candidate.notes] ?? candidate.notes;
    pdf.setFontSize(12);
    pdf.setTextColor(255);
    pdf.setFillColor(26, 86, 219);
    pdf.roundedRect(M, 380, 200, 30, 6, 6, 'F');
    pdf.text(`Recommendation: ${rec}`, M + 14, 400);
  }

  pdf.setTextColor(150);
  pdf.setFontSize(9);
  pdf.text(`Generated: ${new Date().toLocaleString('en-US')}`, M, H - 24);
}

function drawDetails(pdf: PdfLike, opts: HireflowReportOptions): void {
  const { candidate } = opts;
  if (!candidate.competency_scores) return;

  pdf.addPage();
  pdf.setTextColor(0);
  pdf.setFontSize(16);
  pdf.text('Competency Profile', M, 60);

  // 5 维分数 + 要求 + Gap
  const req = getPositionRequirement(candidate.target_position).required;
  const gaps = analyzeCompetencyGap(candidate.competency_scores, getPositionRequirement(candidate.target_position));

  pdf.setFontSize(10);
  pdf.setTextColor(80);
  let y = 95;
  // header
  pdf.setFillColor(240);
  pdf.rect(M, y - 14, W - M * 2, 22, 'F');
  pdf.setTextColor(0);
  pdf.text('Dimension', M + 8, y);
  pdf.text('Current', M + 220, y);
  pdf.text('Required', M + 290, y);
  pdf.text('Gap', M + 360, y);
  pdf.text('Severity', M + 410, y);
  y += 22;

  for (const dim of COMPETENCY_DIMENSIONS) {
    const cur = candidate.competency_scores[dim.key];
    const reqVal = req[dim.key];
    const gap = gaps.find((g) => g.dimension === dim.key)!;
    pdf.text(dim.name, M + 8, y);
    pdf.text(String(cur), M + 220, y);
    pdf.text(String(reqVal), M + 290, y);
    pdf.text(`${gap.gap > 0 ? '-' : ''}${Math.abs(gap.gap)}`, M + 360, y);
    pdf.text(severityLabel(gap.severity), M + 410, y);
    y += 22;
  }

  // 描述
  y += 16;
  pdf.setFontSize(11);
  pdf.text('Dimension Descriptions', M, y);
  y += 18;
  pdf.setFontSize(9);
  pdf.setTextColor(80);
  for (const dim of COMPETENCY_DIMENSIONS) {
    pdf.text(`${dim.name}：${dim.description}`, M, y);
    y += 14;
  }
}

function drawAnswersAppendix(pdf: PdfLike, opts: HireflowReportOptions): void {
  if (!opts.answers || opts.answers.length === 0) return;
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.setTextColor(0);
  pdf.text('Case Question Answers', M, 60);

  pdf.setFontSize(10);
  let y = 100;
  for (const a of opts.answers) {
    if (y > H - 80) {
      pdf.addPage();
      y = 60;
    }
    pdf.setTextColor(26, 86, 219);
    pdf.text(`[${a.dimension}] Score: ${a.score}`, M, y);
    y += 16;
    pdf.setTextColor(60);
    const lines = pdf.splitTextToSize(a.question, W - M * 2);
    for (const l of lines) {
      pdf.text(l, M, y);
      y += 14;
    }
    pdf.setTextColor(0);
    const ans = pdf.splitTextToSize(a.answer || '(no answer)', W - M * 2);
    for (const l of ans) {
      if (y > H - 60) {
        pdf.addPage();
        y = 60;
      }
      pdf.text(l, M, y);
      y += 14;
    }
    y += 12;
  }
}
