type Props = {
  score: number;
  label?: string;
  size?: number;
};

export function RiskScoreGauge({ score, label = "Score Médio", size = 120 }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - 16) / 2;
  const circumference = Math.PI * radius;
  const dashoffset = circumference * (1 - clamped / 100);

  const color =
    clamped >= 80 ? "#10B981" : clamped >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`} overflow="visible">
        {/* Track */}
        <path
          d={`M 8 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2}`}
          fill="none"
          stroke="rgba(139,94,60,0.10)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Progress */}
        <path
          d={`M 8 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        {/* Score text */}
        <text
          x={size / 2}
          y={size / 2 - 4}
          textAnchor="middle"
          dominantBaseline="auto"
          fontSize="22"
          fontWeight="500"
          fill={color}
          fontFamily="serif"
        >
          {clamped.toFixed(0)}
        </text>
      </svg>
      <p className="text-[10px] font-semibold uppercase tracking-[0.10em] text-[#9E9589]">{label}</p>
    </div>
  );
}
