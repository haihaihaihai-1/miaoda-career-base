// 5维度能力差距雷达图 - SVG实现
// 维度：编程能力 / 数据库 / 框架应用 / 项目实战 / 软技能
import { cn } from '@/lib/utils';

export interface Dim5Data {
  label: string;        // 维度名称
  current: number;      // 已掌握 1-5
  required: number;     // 岗位要求 1-5
}

interface RadarChart5DProps {
  data: Dim5Data[];     // 必须 5 项
  size?: number;
  className?: string;
}

/** 最大差距的 top-N 标签 */
export const getTopGaps = (data: Dim5Data[], n = 3): string[] =>
  [...data]
    .map((d) => ({ label: d.label, gap: d.required - d.current }))
    .filter((d) => d.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, n)
    .map((d) => d.label);

const RadarChart5D: React.FC<RadarChart5DProps> = ({ data, size = 240, className }) => {
  if (!data || data.length !== 5) return null;

  const center = size / 2;
  const radius = size * 0.36;        // 多边形外接圆半径
  const labelOffset = size * 0.135;  // 标签到多边形顶点的额外偏移
  const count = data.length;
  const gridLevels = [1, 2, 3, 4, 5];

  /** 计算极坐标点 */
  const pt = (idx: number, val: number): [number, number] => {
    const angle = (Math.PI * 2 * idx) / count - Math.PI / 2;
    const r = (val / 5) * radius;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  /** 生成 SVG polygon points 字符串 */
  const polyPts = (vals: number[]) =>
    vals.map((v, i) => pt(i, v).join(',')).join(' ');

  const currentVals = data.map((d) => d.current);
  const requiredVals = data.map((d) => d.required);
  const topGaps = getTopGaps(data, 3);

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* 网格层 */}
        {gridLevels.map((lv) => (
          <polygon
            key={lv}
            points={polyPts(Array(count).fill(lv))}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={lv === 5 ? 1 : 0.6}
            strokeDasharray={lv === 5 ? undefined : '3 3'}
          />
        ))}

        {/* 轴线 */}
        {data.map((_, i) => {
          const [x, y] = pt(i, 5);
          return (
            <line
              key={i}
              x1={center} y1={center}
              x2={x} y2={y}
              stroke="hsl(var(--border))"
              strokeWidth="0.6"
            />
          );
        })}

        {/* 岗位要求区域（灰色虚线轮廓） */}
        <polygon
          points={polyPts(requiredVals)}
          fill="hsl(var(--muted) / 0.25)"
          stroke="hsl(var(--muted-foreground) / 0.55)"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />

        {/* 已掌握区域（蓝色填充） */}
        <polygon
          points={polyPts(currentVals)}
          fill="hsl(var(--primary) / 0.22)"
          stroke="hsl(var(--primary))"
          strokeWidth="1.8"
        />

        {/* 已掌握顶点圆点 */}
        {data.map((d, i) => {
          const [x, y] = pt(i, d.current);
          return (
            <circle
              key={i}
              cx={x} cy={y} r="3.5"
              fill="hsl(var(--primary))"
              stroke="white"
              strokeWidth="1.5"
            />
          );
        })}

        {/* 维度标签 */}
        {data.map((d, i) => {
          const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
          const lx = center + (radius + labelOffset) * Math.cos(angle);
          const ly = center + (radius + labelOffset) * Math.sin(angle);
          const anchor = lx < center - 8 ? 'end' : lx > center + 8 ? 'start' : 'middle';
          const hasGap = d.required > d.current;
          return (
            <text
              key={i}
              x={lx} y={ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="10"
              fontWeight="600"
              fill={hasGap ? 'hsl(var(--primary))' : 'hsl(var(--foreground))'}
            >
              {d.label}
            </text>
          );
        })}

        {/* 分值标注（最外圈） */}
        {[1, 3, 5].map((lv) => {
          const [x, y] = pt(1, lv); // 固定放在第2个轴方向
          return (
            <text
              key={lv}
              x={x + 4} y={y}
              fontSize="7"
              fill="hsl(var(--muted-foreground))"
              dominantBaseline="middle"
            >
              {lv}
            </text>
          );
        })}
      </svg>

      {/* 图例 */}
      <div className="flex items-center gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-7 h-[3px] rounded bg-primary" />
          已掌握
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-7 h-[2px] rounded"
            style={{ background: 'none', borderTop: '2px dashed hsl(var(--muted-foreground) / 0.55)' }}
          />
          岗位要求
        </span>
      </div>

      {/* 差距最大的3个技能 */}
      {topGaps.length > 0 && (
        <div className="w-full space-y-1.5">
          <p className="text-xs font-semibold text-foreground">差距最大维度</p>
          {topGaps.map((label, i) => {
            const dim = data.find((d) => d.label === label)!;
            const gap = dim.required - dim.current;
            const gapPct = Math.round((gap / dim.required) * 100);
            return (
              <div key={label} className="flex items-center gap-2 text-xs">
                <span className="shrink-0 w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                  {i + 1}
                </span>
                <span className="flex-1 text-foreground font-medium">{label}</span>
                <span className="text-muted-foreground shrink-0">{dim.current}/{dim.required}分</span>
                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round((dim.current / dim.required) * 100)}%` }}
                  />
                </div>
                <span className="text-destructive font-semibold shrink-0 w-8 text-right">
                  -{gapPct}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RadarChart5D;
