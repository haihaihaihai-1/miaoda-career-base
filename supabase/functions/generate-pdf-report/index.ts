// Edge Function: generate-pdf-report
// 使用 pdf-lib 在服务端生成结构化职业路径 PDF 报告
// 注意：pdf-lib 不支持中文字体内嵌（StandardFonts 仅含拉丁字符集）
// 解决方案：中文内容通过 html2canvas 客户端截图后附加到报告中，
//           报告封面、信息栏等固定英文部分由 pdf-lib 绘制
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@1.17.1";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ReportData {
  studentName: string;
  targetRole: string;
  major: string;
  grade: string;
  matchRate: number;
  totalWeeks: number;
  totalHours: number;
  completedMilestones: number;
  totalMilestones: number;
  stages: Array<{
    stage: number;
    name: string;
    weeks: string;
    hours: number;
    courses: string[];
    certificates: string[];
  }>;
  gapSkills: string[];
  // 客户端传来的截图 base64（可选）
  screenshotBase64?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  let data: ReportData;
  try {
    data = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "无效请求体" }), {
      status: 400, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // ---- 创建 PDF ----
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const A4W = 595;
  const A4H = 842;
  const margin = 48;
  const primaryR = 0.1, primaryG = 0.34, primaryB = 0.86; // #1a56db

  // ---- 页1：封面 ----
  const page1 = pdfDoc.addPage([A4W, A4H]);

  // 顶部色块
  page1.drawRectangle({ x: 0, y: A4H - 180, width: A4W, height: 180, color: rgb(primaryR, primaryG, primaryB) });

  // 标题
  page1.drawText("Career Path Report", {
    x: margin, y: A4H - 70, size: 28, font: fontBold, color: rgb(1, 1, 1),
  });
  page1.drawText("Vocational Career Navigator", {
    x: margin, y: A4H - 105, size: 14, font: fontRegular, color: rgb(0.85, 0.9, 1),
  });

  // 生成日期
  const now = new Date();
  const dateStr = `Generated: ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  page1.drawText(dateStr, {
    x: margin, y: A4H - 140, size: 10, font: fontRegular, color: rgb(0.75, 0.85, 1),
  });

  // 学生信息卡
  let yPos = A4H - 230;
  const drawInfoRow = (label: string, value: string) => {
    page1.drawText(label + ":", { x: margin, y: yPos, size: 10, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
    page1.drawText(value, { x: margin + 100, y: yPos, size: 10, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
    yPos -= 22;
  };
  page1.drawText("Student Information", { x: margin, y: yPos + 24, size: 13, font: fontBold, color: rgb(primaryR, primaryG, primaryB) });
  yPos -= 8;
  drawInfoRow("Student", data.studentName);
  drawInfoRow("Target Role", data.targetRole);
  drawInfoRow("Major", data.major);
  drawInfoRow("Grade", data.grade);
  drawInfoRow("Match Rate", `${data.matchRate}%`);
  drawInfoRow("Total Weeks", `${data.totalWeeks} weeks`);
  drawInfoRow("Total Hours", `${data.totalHours} hrs`);
  drawInfoRow("Progress", `${data.completedMilestones} / ${data.totalMilestones} milestones`);

  // 分隔线
  yPos -= 16;
  page1.drawLine({ start: { x: margin, y: yPos }, end: { x: A4W - margin, y: yPos }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
  yPos -= 28;

  // 三阶段摘要
  page1.drawText("Learning Path Overview", { x: margin, y: yPos, size: 13, font: fontBold, color: rgb(primaryR, primaryG, primaryB) });
  yPos -= 24;

  for (const stage of data.stages) {
    // 阶段标题行
    page1.drawRectangle({ x: margin, y: yPos - 4, width: A4W - margin * 2, height: 20, color: rgb(0.94, 0.96, 1) });
    page1.drawText(`Stage ${stage.stage}: ${stage.name}  |  ${stage.weeks}  |  ${stage.hours}h`, {
      x: margin + 8, y: yPos, size: 10, font: fontBold, color: rgb(primaryR, primaryG, primaryB),
    });
    yPos -= 22;

    // 课程
    if (stage.courses.length > 0) {
      const courseText = "Courses: " + stage.courses.slice(0, 4).join(" / ");
      page1.drawText(courseText.length > 80 ? courseText.slice(0, 77) + "..." : courseText, {
        x: margin + 12, y: yPos, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3),
      });
      yPos -= 16;
    }

    // 证书
    if (stage.certificates.length > 0) {
      const certText = "Certificates: " + stage.certificates.slice(0, 2).join(", ");
      page1.drawText(certText.length > 80 ? certText.slice(0, 77) + "..." : certText, {
        x: margin + 12, y: yPos, size: 9, font: fontRegular, color: rgb(0.1, 0.5, 0.2),
      });
      yPos -= 16;
    }
    yPos -= 8;

    // 若空间不足就翻页
    if (yPos < 100) {
      pdfDoc.addPage([A4W, A4H]);
      yPos = A4H - 60;
    }
  }

  // 技能差距
  if (data.gapSkills.length > 0) {
    yPos -= 8;
    page1.drawLine({ start: { x: margin, y: yPos }, end: { x: A4W - margin, y: yPos }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
    yPos -= 24;
    page1.drawText("Skills to Develop", { x: margin, y: yPos, size: 13, font: fontBold, color: rgb(primaryR, primaryG, primaryB) });
    yPos -= 20;
    const skills = data.gapSkills.slice(0, 12);
    const cols = 3;
    skills.forEach((skill, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      page1.drawText(`• ${skill}`, {
        x: margin + col * 165, y: yPos - row * 18, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2),
      });
    });
  }

  // ---- 若有截图，添加页2 ----
  if (data.screenshotBase64) {
    const imgBytes = Uint8Array.from(atob(data.screenshotBase64.replace(/^data:image\/[a-z]+;base64,/, "")), (c) => c.charCodeAt(0));
    let embeddedImg;
    try {
      embeddedImg = await pdfDoc.embedPng(imgBytes);
    } catch {
      try { embeddedImg = await pdfDoc.embedJpg(imgBytes); } catch { /* skip */ }
    }
    if (embeddedImg) {
      const page2 = pdfDoc.addPage([A4W, A4H]);
      page2.drawText("Learning Path Details", {
        x: margin, y: A4H - 44, size: 14, font: fontBold, color: rgb(primaryR, primaryG, primaryB),
      });
      const imgDims = embeddedImg.scaleToFit(A4W - margin * 2, A4H - 100);
      page2.drawImage(embeddedImg, {
        x: margin, y: A4H - 80 - imgDims.height, width: imgDims.width, height: imgDims.height,
      });
    }
  }

  // ---- 页脚（所有页）----
  const totalPages = pdfDoc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const pg = pdfDoc.getPage(i);
    pg.drawText(`Career Path Navigator  |  Page ${i + 1} / ${totalPages}  |  ${dateStr}`, {
      x: margin, y: 24, size: 8, font: fontRegular, color: rgb(0.6, 0.6, 0.6),
    });
    pg.drawLine({ start: { x: margin, y: 36 }, end: { x: A4W - margin, y: 36 }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });
  }

  const pdfBytes = await pdfDoc.save();

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      ...CORS,
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="career-report-${data.studentName}.pdf"`,
    },
  });
});
