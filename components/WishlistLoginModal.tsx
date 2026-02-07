"use client";

import Link from "next/link";

type WishlistLoginModalProps = {
  open: boolean;
  onClose: () => void;
};

export const WishlistLoginModal = ({
  open,
  onClose
}: WishlistLoginModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 shadow-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
          Favoritos
        </p>
        <h2 className="mt-3 font-display text-2xl text-noir-950">
          Entre para salvar seus favoritos
        </h2>
        <p className="mt-2 text-sm text-noir-600">
          Guarde seus rituais preferidos e acompanhe a curadoria com uma conta
          BelaPop.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-full bg-[#B80F5A] px-5 py-2 text-xs uppercase tracking-[0.3em] text-white shadow-sm"
          >
            Ir para login
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/10 px-5 py-2 text-xs uppercase tracking-[0.3em] text-noir-700"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
};
