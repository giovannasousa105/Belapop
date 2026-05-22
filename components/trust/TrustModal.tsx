"use client";

import type { ReactNode } from "react";

type TrustModalProviderProps = {
  children: ReactNode;
};

export function TrustModalProvider({ children }: TrustModalProviderProps) {
  return <>{children}</>;
}
