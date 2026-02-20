"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/AuthContext";

const MENU_ITEMS = [{ label: "Perfil", href: "/account/profile" }];

const triggerChat = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("open-curadoria-chat"));
};

export const AccountHeader = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLDivElement | null>(null);

  const handleDocumentClick = useCallback(
    (event: MouseEvent) => {
      if (toggleRef.current && !toggleRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    },
    []
  );

  useEffect(() => {
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [handleDocumentClick]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const greeting = user?.name ? `Olá, ${user.name.split(" ")[0]}` : "Olá";
  const initial = user?.name?.[0]?.toUpperCase() ?? "B";

  return (
    <div className="rounded-3xl border border-black/10 bg-white px-6 py-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-bpGraphite/70">BelaPop</p>
          <p className="text-lg font-display text-bpBlack">
            Curadoria &amp; autocuidado
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-bpGraphite/80">{greeting}</p>
          <div ref={toggleRef} className="relative">
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-full border border-black/10 bg-bpBlackSoft/5 px-4 py-2 text-sm text-bpBlackSoft shadow-sm transition hover:bg-bpBlackSoft/10"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-bpBlackSoft/5 text-sm font-semibold text-bpBlackSoft">
                {initial}
              </span>
              <span className="text-[11px] uppercase tracking-[0.4em] text-bpGraphite/70">
                Conta
              </span>
            </button>
            {open ? (
              <div className="absolute right-0 top-full mt-3 w-44 rounded-2xl border border-black/10 bg-white shadow-lg">
                <ul className="space-y-1 p-2">
                  {MENU_ITEMS.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="block rounded-xl px-3 py-2 text-sm text-bpBlackSoft transition hover:bg-bpOffWhite"
                        onClick={() => setOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <button
                      className="w-full rounded-xl px-3 py-2 text-left text-sm text-bpBlackSoft transition hover:bg-bpOffWhite"
                      onClick={() => {
                        setOpen(false);
                        triggerChat();
                      }}
                    >
                      Ajuda
                    </button>
                  </li>
                  <li>
                    <button
                      className="w-full rounded-xl px-3 py-2 text-left text-sm text-bpBlackSoft transition hover:bg-bpOffWhite"
                      onClick={handleLogout}
                    >
                      Sair
                    </button>
                  </li>
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
