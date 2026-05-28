"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function BuscarRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  useEffect(() => {
    const dest = q ? `/catalogo?q=${encodeURIComponent(q)}` : "/catalogo";
    router.replace(dest);
  }, [q, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
    </div>
  );
}

export default function BuscarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
        </div>
      }
    >
      <BuscarRedirect />
    </Suspense>
  );
}
