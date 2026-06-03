// Download utilities with proper UTF-8 encoding for Chinese text

export const formatReportContent = (report: any): string => {
  let content = `${report.title}\n`;
  content += `${report.subtitle}\n`;
  content += `发布时间：${report.publishDate}\n`;
  content += '='.repeat(50) + '\n\n';
  
  content += `【执行摘要】\n${report.executiveSummary}\n\n`;
  
  if (report.keyFindings) {
    content += '【核心发现】\n';
    report.keyFindings.forEach((finding: string, index: number) => {
      content += `${index + 1}. ${finding}\n`;
    });
    content += '\n';
  }
  
  if (report.sections) {
    report.sections.forEach((section: any) => {
      content += `${section.title}\n`;
      content += '-'.repeat(30) + '\n';
      content += `${section.content}\n\n`;
    });
  }
  
  if (report.actionableInsights) {
    report.actionableInsights.forEach((insight: any) => {
      content += `【${insight.title}】\n`;
      insight.points.forEach((point: string, index: number) => {
        content += `${index + 1}. ${point}\n`;
      });
      content += '\n';
    });
  }
  
  if (report.conclusion) {
    content += '【总结】\n';
    content += `${report.conclusion}\n\n`;
  }
  
  content += '='.repeat(50) + '\n';
  content += '本报告由一站式职业指导平台提供\n';
  content += '更多资源请访问我们的平台\n';
  
  return content;
};

export const downloadTextFile = (content: string, filename: string) => {
  // Create BOM for UTF-8 to ensure proper encoding
  const BOM = '\uFEFF';
  const textWithBOM = BOM + content;
  
  // Create blob with UTF-8 encoding
  const blob = new Blob([textWithBOM], { 
    type: 'text/plain;charset=utf-8' 
  });
  
  // Create download URL
  const url = window.URL.createObjectURL(blob);
  
  // Create temporary download link
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const downloadReport = (reportData: any, filename: string) => {
  const content = formatReportContent(reportData);
  downloadTextFile(content, filename);
};