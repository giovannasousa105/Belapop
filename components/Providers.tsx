"use client";

import React from "react";
import { PosthogProvider } from "@/components/analytics/PosthogProvider";
import { ConsultoraBelaPopProvider } from "@/components/assistant/ConsultoraBelaPop";
import { AuthProvider } from "@/lib/AuthContext";
import { CartProvider } from "@/lib/CartContext";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <PosthogProvider>
      <AuthProvider>
        <CartProvider>
          <ConsultoraBelaPopProvider>{children}</ConsultoraBelaPopProvider>
        </CartProvider>
      </AuthProvider>
    </PosthogProvider>
  );
};
