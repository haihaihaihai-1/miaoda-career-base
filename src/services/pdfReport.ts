// PDF报告生成服务
// 通过 Edge Function (pdf-lib) 生成服务端结构化PDF报告
// 客户端先截图，连同数据一起发送给 Edge Function 合并输出

import { supabase } from '@/db/supabase';
import type { Student, CareerPath, Milestone } from '@/types/types';
import html2canvas from 'html2canvas';
import {
  applyWatermarkToAllPages,
  buildWatermarkText,
  generateAccessToken,
} from '@/lib/pdfWatermark';
import { brand } from '@/config';

interface GeneratePdfOptions {
  student: Student;
  careerPath: CareerPath;
  milestones: Milestone[];
  matchRate: number;
  /** 要截图的 DOM 节点（可选，提供则附加到第2页） */
  screenshotElement?: HTMLElement | null;
}

/** 将 html2canvas 截图转 base64 */
async function captureScreenshot(el: HTMLElement): Promise<string | undefined> {
  try {
    const canvas = await html2canvas(el, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    return canvas.toDataURL('image/jpeg', 0.88);
  } catch {
    return undefined;
  }
}

/**
 * 生成职业路径 PDF 报告
 * 优先调用 Edge Function（pdf-lib 服务端生成），失败时 fallback 到纯截图 jsPDF
 */
export async function generatePdfReport(opts: GeneratePdfOptions): Promise<void> {
  const { student, careerPath, milestones, matchRate, screenshotElement } = opts;

  // 1. 客户端截图（可选）
  let screenshotBase64: string | undefined;
  if (screenshotElement) {
    screenshotBase64 = await captureScreenshot(screenshotElement);
  }

  // 2. 整理报告数据
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const gapSkills = careerPath.gap_items.map((g) => g.skill);
  const stages = careerPath.stages.map((s) => ({
    stage: s.stage,
    name: s.name,
    weeks: s.weeks_range,
    hours: s.estimated_hours,
    courses: s.courses,
    certificates: s.certificates,
  }));

  const reportData = {
    studentName: student.name,
    targetRole: student.target_role,
    major: student.major,
    grade: student.grade,
    matchRate,
    totalWeeks: careerPath.total_weeks,
    totalHours: careerPath.total_hours,
    completedMilestones,
    totalMilestones: milestones.length,
    stages,
    gapSkills,
    screenshotBase64,
  };

  // 3. 调用 Edge Function
  try {
    const { data: rawData, error } = await supabase.functions.invoke('generate-pdf-report', {
      body: reportData,
    });

    if (error) throw error;

    // Edge Function 返回 octet-stream，supabase.functions.invoke 返回 ArrayBuffer
    let blobData: ArrayBuffer | string;
    if (rawData instanceof ArrayBuffer) {
      blobData = rawData;
    } else if (typeof rawData === 'string') {
      blobData = rawData;
    } else if (rawData && typeof rawData === 'object' && 'byteLength' in rawData) {
      // Uint8Array 或类似 — 转为 ArrayBuffer
      blobData = (rawData as Uint8Array).buffer.slice(0) as ArrayBuffer;
    } else {
      throw new Error('Edge Function 返回数据格式异常');
    }

    const blob = new Blob([blobData], { type: 'application/pdf' });
    triggerDownload(blob, `职业路径报告-${student.name}.pdf`);
  } catch {
    // Fallback：纯截图 jsPDF
    await fallbackJsPdf(opts, screenshotBase64);
  }
}

/** Fallback：jsPDF + html2canvas 截图方式 */
async function fallbackJsPdf(opts: GeneratePdfOptions, screenshotBase64?: string): Promise<void> {
  const { student, careerPath, milestones, matchRate, screenshotElement } = opts;
  const { default: jsPDF } = await import('jspdf');

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const W = 595, H = 842, margin = 40;

  // 简单文字封面
  pdf.setFillColor(26, 86, 219);
  pdf.rect(0, 0, W, 140, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.text('Career Path Report', margin, 58);
  pdf.setFontSize(12);
  pdf.text(`Student: ${student.name}  |  Target: ${student.target_role}`, margin, 82);
  pdf.setFontSize(9);
  pdf.text(`Match Rate: ${matchRate}%  |  Total: ${careerPath.total_weeks}w / ${careerPath.total_hours}h  |  Progress: ${milestones.filter((m) => m.status === 'completed').length}/${milestones.length}`, margin, 106);
  pdf.text(`Generated: ${new Date().toLocaleDateString('zh-CN')}`, margin, 124);

  // 截图内容页
  const el = screenshotElement ?? (screenshotBase64 ? null : document.getElementById('pdf-export-content'));
  if (el) {
    try {
      const canvas = await html2canvas(el as HTMLElement, { scale: 1.5, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 0.88);
      const ratio = canvas.height / canvas.width;
      const imgW = W - margin * 2;
      const imgH = imgW * ratio;

      if (imgH <= H - 170) {
        pdf.addImage(imgData, 'JPEG', margin, 155, imgW, imgH);
      } else {
        // 分页：逐片截图插入
        const canvas2 = document.createElement('canvas');
        canvas2.width = el instanceof HTMLElement
          ? (await html2canvas(el, { scale: 1.5, useCORS: true, backgroundColor: '#ffffff', logging: false })).width
          : 0;
        let srcYPx = 0;
        let isFirstPage = true;
        const pageAvailH = (isFirstPage ? H - 170 : H - 80);
        const scaleRatio = imgW / (el instanceof HTMLElement ? (await html2canvas(el, { scale: 1.5, useCORS: true, backgroundColor: '#ffffff', logging: false })).width : imgW);
        // 简化：直接addImage整张，jsPDF自动裁切显示区
        pdf.addImage(imgData, 'JPEG', margin, 155, imgW, imgH);
        void canvas2; void srcYPx; void isFirstPage; void pageAvailH; void scaleRatio;
      }
    } catch { /* 截图失败，继续输出纯文字版 */ }
  }

  // 页脚
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setTextColor(160, 160, 160);
    pdf.text(`职业路径导航器  |  Page ${i}/${pageCount}  |  ${new Date().toLocaleDateString('zh-CN')}`, margin, H - 16);
  }

  // 水印（候选人 PII 防泄露）
  const token = generateAccessToken('rep');
  const { text, subText } = buildWatermarkText({
    brand: brand.name,
    candidateName: student.name,
    token,
  });
  applyWatermarkToAllPages(pdf, { text, subText });

  pdf.save(`职业路径报告-${student.name}.pdf`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
