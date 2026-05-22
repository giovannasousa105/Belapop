"use client";

import type { RefObject } from "react";

type CameraFullScreenProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
};

export default function CameraFullScreen({ videoRef }: CameraFullScreenProps) {
  return (
    <div className="fixed inset-0 z-[9999] h-[100dvh] w-screen bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="h-full w-full object-cover object-center"
        style={{ transform: "scaleX(-1)" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.32)_0%,rgba(0,0,0,0.02)_24%,rgba(0,0,0,0.02)_66%,rgba(0,0,0,0.44)_100%)]" />
    </div>
  );
}
