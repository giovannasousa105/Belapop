"use client";

import { useEffect, useState } from "react";

export function StickyMobileCTA() {
  const [show, setShow] = useState(false);
  const [atForm, setAtForm] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 280);
    window.addEventListener("scroll", handleScroll, { passive: true });

    const formEl = document.getElementById("inscrever");
    if (formEl) {
      const io = new IntersectionObserver(([e]) => setAtForm(e.isIntersecting), {
        threshold: 0.05,
      });
      io.observe(formEl);
      return () => {
        window.removeEventListener("scroll", handleScroll);
        io.disconnect();
      };
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const visible = show && !atForm;

  return (
    <div
      aria-hidden={!visible}
      className={`fixed bottom-0 inset-x-0 z-50 sm:hidden transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-4 mb-4 overflow-hidden rounded-2xl bg-bpBlack shadow-2xl ring-1 ring-white/5">
        <a
          href="#inscrever"
          className="flex items-center justify-between px-5 py-4"
        >
          <div>
            <p className="text-sm font-semibold tracking-wider text-white">
              Entrar no Círculo
            </p>
            <p className="mt-0.5 text-[10px] text-white/40">
              Drops quinzenais · WhatsApp exclusivo
            </p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm text-white">
            ↓
          </span>
        </a>
      </div>
    </div>
  );
}
