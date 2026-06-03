// 学习路径分享卡片弹窗
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { Download, Link2, X, Share2, BookOpen } from 'lucide-react';
import type { Student, CareerPath } from '@/types/types';

const APP_URL = typeof window !== 'undefined' ? window.location.origin : '';

interface Props {
  open: boolean;
  onClose: () => void;
  student: Student;
  careerPath: CareerPath;
  matchRate?: number;
}

const ShareCardModal: React.FC<Props> = ({ open, onClose, student, careerPath, matchRate = 72 }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    QRCode.toString(APP_URL, { type: 'svg', width: 120, margin: 1, color: { dark: '#1a56db', light: '#ffffff' } })
      .then(setQrSvg)
      .catch(() => setQrSvg(''));
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `${student.name}_${student.target_role}_路径分享.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('图片已保存');
    } catch {
      toast.error('截图失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('链接已复制');
    } catch {
      toast.error('复制失败，请手动复制');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm flex flex-col gap-3">
        {/* 分享卡片（截图区域） */}
        <div
          ref={cardRef}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* 顶部品牌条 */}
          <div className="bg-[#1a56db] px-5 pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-white">职业路径导航器</span>
            </div>
            <p className="text-[11px] text-white/70">高职学子精准成长平台</p>
          </div>

          {/* 学生信息 */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#1a56db]/10 flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-[#1a56db]">{student.name.slice(0, 1)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{student.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{student.major}</p>
                <p className="text-xs text-[#1a56db] font-medium mt-0.5">
                  目标：{student.target_role}
                </p>
              </div>
            </div>
            {/* 等级进阶 */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                初级工 L2
              </span>
              <span className="text-gray-300 text-xs">→</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1a56db]/10 text-[#1a56db] font-medium">
                高级工 L4
              </span>
            </div>
          </div>

          {/* 关键数据 */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
            {[
              { label: '匹配度', value: `${matchRate}%` },
              { label: '总学时', value: `${careerPath.total_hours}h` },
              { label: '预计周期', value: `${careerPath.total_weeks}周` },
            ].map(({ label, value }) => (
              <div key={label} className="px-3 py-3 text-center">
                <p className="text-base font-bold text-[#1a56db]">{value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* 3阶段摘要 */}
          <div className="px-5 py-3 space-y-2">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">学习阶段</p>
            {careerPath.stages.map((stage) => (
              <div key={stage.stage} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#1a56db] flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-white">{stage.stage}</span>
                </div>
                <p className="text-xs text-gray-700 flex-1 min-w-0 truncate">
                  {stage.name}
                </p>
                <span className="text-[10px] text-gray-400 shrink-0">
                  {stage.courses.length}门课 · {stage.estimated_hours}h
                </span>
              </div>
            ))}
          </div>

          {/* 底部二维码区 */}
          <div className="px-5 pb-4 pt-2 flex items-center gap-3 border-t border-gray-100">
            {/* 真实二维码 120×120 */}
            <div className="w-[60px] h-[60px] shrink-0 flex items-center justify-center">
              {qrSvg ? (
                <div
                  className="w-[60px] h-[60px]"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              ) : (
                <div className="w-[60px] h-[60px] rounded border border-dashed border-gray-200 bg-gray-50" />
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-700">扫码查看完整路径</p>
              <p className="text-[10px] text-gray-400 mt-0.5">职业路径导航器</p>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 h-10 text-xs gap-1.5"
            onClick={handleSave}
            disabled={saving}
          >
            <Download className="w-3.5 h-3.5" />
            保存图片
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-10 text-xs gap-1.5 bg-white"
            onClick={handleCopy}
          >
            <Link2 className="w-3.5 h-3.5" />
            复制链接
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 text-white/80 hover:text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export { Share2 };
export default ShareCardModal;
