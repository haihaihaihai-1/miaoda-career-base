// 雷达图组件 - SVG 实现
import type { RadarDataPoint } from '@/types/types';
import { cn } from '@/lib/utils';

interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  className?: string;
}

const RadarChart: React.FC<RadarChartProps> = ({ data, size = 200, className }) => {
  if (!data || data.length < 3) return null;

  const center = size / 2;
  const radius = size * 0.38;
  const count = data.length;

  // 计算各顶点坐标
  const getPoint = (index: number, r: number): [number, number] => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  // 生成多边形路径
  const polygonPath = (values: number[]): string => {
    return values
      .map((v, i) => {
        const r = (v / 100) * radius;
        const [x, y] = getPoint(i, r);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ') + ' Z';
  };

  // 背景网格层级
  const gridLevels = [20, 40, 60, 80, 100];

  const acquiredValues = data.map((d) => d.value);
  const maxValues = data.map(() => 100);

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 背景网格 */}
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={Array.from({ length: count }, (_, i) => {
              const [x, y] = getPoint(i, (level / 100) * radius);
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="0.8"
          />
        ))}

        {/* 轴线 */}
        {data.map((_, i) => {
          const [x, y] = getPoint(i, radius);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="hsl(var(--border))"
              strokeWidth="0.8"
            />
          );
        })}

        {/* 最大值区域（浅蓝背景） */}
        <path
          d={polygonPath(maxValues)}
          fill="hsl(var(--primary) / 0.06)"
          stroke="hsl(var(--primary) / 0.2)"
          strokeWidth="1"
        />

        {/* 已掌握区域（深蓝填充） */}
        <path
          d={polygonPath(acquiredValues)}
          fill="hsl(var(--primary) / 0.25)"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
        />

        {/* 数据点 */}
        {data.map((d, i) => {
          const r = (d.value / 100) * radius;
          const [x, y] = getPoint(i, r);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill="hsl(var(--primary))"
              stroke="white"
              strokeWidth="1.5"
            />
          );
        })}

        {/* 标签 */}
        {data.map((d, i) => {
          const [x, y] = getPoint(i, radius + 18);
          const anchor = x < center - 5 ? 'end' : x > center + 5 ? 'start' : 'middle';
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="9"
              fill="hsl(var(--foreground))"
              fontWeight="500"
            >
              {d.skill}
            </text>
          );
        })}
      </svg>

      {/* 图例 */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-sm bg-primary/25 border border-primary" />
          已掌握
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-sm bg-primary/6 border border-primary/20" />
          目标要求
        </span>
      </div>
    </div>
  );
};

export default RadarChart;
