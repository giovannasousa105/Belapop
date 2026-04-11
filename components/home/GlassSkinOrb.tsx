"use client";

import { motion, useReducedMotion } from "framer-motion";

type GlassSkinOrbProps = {
  className?: string;
};

const ORB_PARTICLES = [
  { id: "p-1", left: "14%", top: "22%", size: 8, duration: 10.5, delay: 0.2, dx: 10, dy: -8 },
  { id: "p-2", left: "78%", top: "28%", size: 6, duration: 12, delay: 1.1, dx: -12, dy: 10 },
  { id: "p-3", left: "24%", top: "74%", size: 7, duration: 9.5, delay: 0.6, dx: 8, dy: -10 },
  { id: "p-4", left: "68%", top: "76%", size: 10, duration: 11.2, delay: 1.8, dx: -9, dy: -7 },
  { id: "p-5", left: "52%", top: "10%", size: 5, duration: 8.8, delay: 0.9, dx: 0, dy: 10 }
];

const ORB_RINGS = [
  { id: "r-1", inset: "8%", duration: 5.4, delay: 0 },
  { id: "r-2", inset: "14%", duration: 6.2, delay: 0.4 },
  { id: "r-3", inset: "21%", duration: 5.8, delay: 0.8 }
];

function motionPropsOrStatic<T>(reduceMotion: boolean, animated: T, fallback: T) {
  return reduceMotion ? fallback : animated;
}

export function GlassSkinOrb({ className = "" }: GlassSkinOrbProps) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div
      aria-hidden="true"
      className={[
        "relative aspect-square w-full overflow-visible",
        "min-h-[210px] min-w-[210px] max-w-[520px] sm:min-h-[260px] sm:min-w-[260px]",
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="absolute inset-[-18%] rounded-full bg-[radial-gradient(circle,rgba(244,218,223,0.96)_0%,rgba(235,194,203,0.62)_32%,rgba(246,232,234,0.16)_68%,transparent_82%)] blur-3xl" />
      <div className="absolute inset-[-8%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.84)_0%,rgba(246,232,234,0.24)_45%,transparent_76%)] blur-2xl" />

      <motion.div
        className="absolute inset-[12%] rounded-full border border-[rgba(216,160,172,0.22)] bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.42)_28%,rgba(244,218,223,0.24)_58%,rgba(216,160,172,0.10)_76%,rgba(255,255,255,0.18)_100%)] shadow-[0_22px_70px_rgba(91,49,56,0.14),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-[18px]"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={motionPropsOrStatic(
          reduceMotion,
          {
            opacity: 1,
            scale: [1, 1.018, 1],
            boxShadow: [
              "0 22px 70px rgba(91,49,56,0.14), inset 0 1px 0 rgba(255,255,255,0.7)",
              "0 26px 90px rgba(91,49,56,0.18), inset 0 1px 0 rgba(255,255,255,0.78)",
              "0 22px 70px rgba(91,49,56,0.14), inset 0 1px 0 rgba(255,255,255,0.7)"
            ]
          },
          { opacity: 1, scale: 1 }
        )}
        transition={motionPropsOrStatic(
          reduceMotion,
          { duration: 6, ease: "easeInOut", repeat: Infinity },
          { duration: 0.45, ease: "easeOut" }
        )}
      >
        <div className="absolute left-[18%] top-[10%] h-[30%] w-[36%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.84)_0%,rgba(255,255,255,0.22)_72%,transparent_100%)] blur-xl" />
        <div className="absolute bottom-[12%] right-[16%] h-[16%] w-[34%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.42)_0%,rgba(255,255,255,0.08)_70%,transparent_100%)] blur-lg" />

        {ORB_RINGS.map((ring) => (
          <motion.div
            key={ring.id}
            className="absolute rounded-full border border-[rgba(216,160,172,0.18)]"
            style={{ inset: ring.inset }}
            animate={motionPropsOrStatic(
              reduceMotion,
              {
                scale: [1, 1.03, 1],
                opacity: [0.36, 0.18, 0.36]
              },
              { scale: 1, opacity: 0.28 }
            )}
            transition={motionPropsOrStatic(
              reduceMotion,
              {
                duration: ring.duration,
                delay: ring.delay,
                ease: "easeInOut",
                repeat: Infinity
              },
              { duration: 0 }
            )}
          />
        ))}

        <motion.div
          className="absolute bottom-[11%] left-[50%] top-[9%] w-[14%] -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.45)_14%,rgba(216,160,172,0.26)_50%,rgba(255,255,255,0.45)_86%,rgba(255,255,255,0)_100%)] blur-[10px]"
          animate={motionPropsOrStatic(
            reduceMotion,
            { x: ["-165%", "160%"] },
            { x: "0%" }
          )}
          transition={motionPropsOrStatic(
            reduceMotion,
            { duration: 7, ease: "easeInOut", repeat: Infinity },
            { duration: 0 }
          )}
        />

        <motion.div
          className="absolute inset-[34%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.92)_0%,rgba(244,218,223,0.72)_24%,rgba(216,160,172,0.28)_56%,rgba(255,255,255,0)_82%)] shadow-[0_0_40px_rgba(244,218,223,0.9)]"
          animate={motionPropsOrStatic(
            reduceMotion,
            {
              scale: [1, 1.06, 1],
              opacity: [0.88, 1, 0.88]
            },
            { scale: 1, opacity: 0.92 }
          )}
          transition={motionPropsOrStatic(
            reduceMotion,
            { duration: 6, ease: "easeInOut", repeat: Infinity },
            { duration: 0 }
          )}
        />

        <div className="absolute inset-[29%] rounded-full bg-[radial-gradient(circle_at_50%_36%,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.08)_70%,transparent_100%)]" />

        {ORB_PARTICLES.map((particle) => (
          <motion.span
            key={particle.id}
            className="absolute rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95)_0%,rgba(216,160,172,0.74)_48%,rgba(216,160,172,0.06)_100%)] shadow-[0_0_16px_rgba(235,194,203,0.7)]"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size
            }}
            animate={motionPropsOrStatic(
              reduceMotion,
              {
                x: [0, particle.dx, 0],
                y: [0, particle.dy, 0],
                opacity: [0.58, 0.95, 0.58]
              },
              { x: 0, y: 0, opacity: 0.72 }
            )}
            transition={motionPropsOrStatic(
              reduceMotion,
              {
                duration: particle.duration,
                delay: particle.delay,
                ease: "easeInOut",
                repeat: Infinity
              },
              { duration: 0 }
            )}
          />
        ))}
      </motion.div>
    </div>
  );
}
