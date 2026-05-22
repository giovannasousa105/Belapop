"use client";

import { useEffect, useState } from "react";

interface StreakBadgeProps {
  streak: number;
  onDone: () => void;
}

function mensagemStreak(streak: number): string {
  if (streak >= 42) return "6 semanas de consistência";
  if (streak >= 21) return "21 dias — sua pele está notando";
  return `${streak} dias seguidos 🌱`;
}

export function StreakBadge({ streak, onDone }: StreakBadgeProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setVisible(false);
    }, 2000);
    const doneTimer = setTimeout(onDone, 2400);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        background: "rgba(52, 199, 89, 0.08)",
        border: "0.5px solid rgba(52, 199, 89, 0.28)",
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.01em",
        color: "#1a7a35",
        marginBottom: "0.5rem",
        transition: "opacity 400ms ease-out, transform 400ms ease-out",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-6px)",
        pointerEvents: "none",
        userSelect: "none",
        willChange: "opacity, transform",
      }}
    >
      {mensagemStreak(streak)}
    </div>
  );
}
