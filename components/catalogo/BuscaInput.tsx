"use client";

import { useRef, useState } from "react";

interface Props {
  valor?: string;
  placeholder?: string;
  onBuscar: (query: string) => void;
  className?: string;
}

export function BuscaInput({ valor = "", placeholder = "Buscar produtos…", onBuscar, className = "" }: Props) {
  const [local, setLocal] = useState(valor);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setLocal(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onBuscar(v), 400);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (timerRef.current) clearTimeout(timerRef.current);
    onBuscar(local);
  }

  return (
    <form onSubmit={handleSubmit} role="search" className={`relative flex items-center ${className}`}>
      <input
        type="search"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label="Buscar produtos"
        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
      />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none"
        aria-hidden
      >
        <circle cx="11" cy="11" r="8" />
        <path strokeLinecap="round" d="m21 21-4.35-4.35" />
      </svg>
    </form>
  );
}
