"use client";

import type { ReactElement, ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";

type SentryBoundaryProps = {
  children: ReactNode;
  fallback?: ReactElement;
  nome: string;
};

function FallbackPadrao() {
  return (
    <div
      role="status"
      className="rounded-[12px] border border-[#eadedf] bg-[#fffafa] px-4 py-3 text-sm leading-6 text-[#5f5457]"
    >
      Algo saiu do lugar por aqui. Nossa equipe já foi avisada.
    </div>
  );
}

export function SentryBoundary({
  children,
  fallback,
  nome
}: SentryBoundaryProps) {
  return (
    <Sentry.ErrorBoundary
      fallback={fallback ?? <FallbackPadrao />}
      beforeCapture={(scope) => {
        scope.setTag("boundary", nome);
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
