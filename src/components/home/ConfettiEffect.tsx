// 纯 CSS confetti 庆祝动画 — 里程碑完成时触发，2秒后自动消失
import { useEffect, useRef } from 'react';

interface Props {
  active: boolean;
  onDone: () => void;
}

// 彩带颜色池
const COLORS = ['#1a56db', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// 每片彩带的随机参数
interface Piece {
  x: number;      // 横向起始位置 0-100vw
  color: string;
  size: number;   // 宽度 px
  delay: number;  // 动画延迟 ms
  dur: number;    // 动画时长 ms
  rot: number;    // 初始旋转角度
  swayAmp: number; // 水平摆动幅度 vw
  swayDir: number; // 摆动方向 +1/-1
}

const PIECE_COUNT = 72;

function randomPieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, () => ({
    x: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 6,
    delay: Math.random() * 800,
    dur: 1200 + Math.random() * 800,
    rot: Math.random() * 360,
    swayAmp: 3 + Math.random() * 5,
    swayDir: Math.random() > 0.5 ? 1 : -1,
  }));
}

const ConfettiEffect: React.FC<Props> = ({ active, onDone }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pieces = useRef<Piece[]>(randomPieces());

  useEffect(() => {
    if (!active) return;
    // 重新随机
    pieces.current = randomPieces();
    // 2s 后通知父组件结束
    timerRef.current = setTimeout(onDone, 2200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, onDone]);

  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[999] pointer-events-none overflow-hidden"
    >
      {/* 中央庆祝文字 */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ animation: 'confetti-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-xl flex items-center gap-2 border border-white">
          <span className="text-2xl">🎉</span>
          <span className="text-base font-bold text-foreground">里程碑完成！</span>
          <span className="text-2xl">🎊</span>
        </div>
      </div>

      {/* 彩带片 */}
      {pieces.current.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '-20px',
            left: `${p.x}vw`,
            width: `${p.size}px`,
            height: `${p.size * 0.5}px`,
            borderRadius: '2px',
            backgroundColor: p.color,
            transform: `rotate(${p.rot}deg)`,
            animation: `confetti-fall ${p.dur}ms ${p.delay}ms ease-in both,
                         confetti-sway ${p.dur * 0.5}ms ${p.delay}ms ease-in-out alternate infinite`,
          }}
        />
      ))}

      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
        }
        @keyframes confetti-sway {
          0%   { margin-left: 0; }
          100% { margin-left: calc(var(--sway, 4) * 1vw); }
        }
        @keyframes confetti-pop {
          0%   { transform: scale(0.4); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ConfettiEffect;
