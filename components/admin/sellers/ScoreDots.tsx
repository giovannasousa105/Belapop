type Props = {
  score: number;
  maxScore?: number;
  dots?: number;
};

export function ScoreDots({ score, maxScore = 100, dots = 5 }: Props) {
  const filled = Math.round((score / maxScore) * dots);
  const color = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: dots }).map((_, index) => (
        <span
          key={index}
          className="h-2 w-2 rounded-full transition-colors"
          style={{
            background: index < filled ? color : "rgba(139, 94, 60, 0.14)"
          }}
        />
      ))}
    </div>
  );
}
