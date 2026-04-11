"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { useAuth } from "@/lib/AuthContext";

type LogoutButtonProps = {
  redirectTo?: string;
  className?: string;
  children?: ReactNode;
};

export default function LogoutButton({
  redirectTo = "/login",
  className,
  children
}: LogoutButtonProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await logout();
    } finally {
      router.replace(redirectTo);
      router.refresh();
      setIsSubmitting(false);
    }
  };

  return (
    <button onClick={handleLogout} disabled={isSubmitting} className={className}>
      {children ?? (isSubmitting ? "Saindo..." : "Sair")}
    </button>
  );
}
