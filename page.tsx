"use client";

import Link from "next/link";

export default function AdminLoginPage() {
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Define o cookie de sessão administrativa válido para o path /adm
    // Usamos samesite=lax para segurança básica em navegação
    document.cookie = "belapop_admin_session=active; path=/adm; max-age=86400; samesite=lax";
    window.location.href = "/adm"; 
  };

  return (
    <div className="min-h-screen bg-[#0b0b10] flex flex-col items-center justify-center px-6">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#B80F5A]/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#1d0a16] blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-[440px] z-10">
        {/* Brand Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl text-white tracking-tight">
            Bela<span className="text-[#F7BFD1]">Pop</span>
          </h1>
          <p className="mt-4 text-[11px] uppercase tracking-[0.5em] text-[#F7BFD1]/60">
            Backoffice Premium
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-[32px] border border-white/10 bg-[#151018]/80 backdrop-blur-xl p-8 md:p-10 shadow-2xl">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-display text-white">Entrar no Sistema</h2>
            <p className="text-sm text-[#F7BFD1]/50 mt-2">
              Acesso exclusivo para curadores e administradores.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#F7BFD1]/80 mb-2 ml-1">
                E-mail Corporativo
              </label>
              <input
                type="email"
                className="w-full h-12 bg-white/5 border border-white/10 rounded-full px-6 text-sm text-white focus:outline-none focus:border-[#B80F5A]/50 transition-colors"
                placeholder="admin@belapop.com"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#F7BFD1]/80 mb-2 ml-1">
                Senha de Acesso
              </label>
              <input
                type="password"
                className="w-full h-12 bg-white/5 border border-white/10 rounded-full px-6 text-sm text-white focus:outline-none focus:border-[#B80F5A]/50 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 mt-4 rounded-full bg-gradient-to-r from-[#B80F5A] to-[#D11469] text-white text-[11px] font-semibold uppercase tracking-[0.3em] shadow-[0_15px_35px_rgba(184,15,90,0.3)] hover:scale-[1.02] transition-transform"
            >
              Autenticar
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <Link
              href="/"
              className="text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-[#F7BFD1] transition-colors"
            >
              ← Voltar para a Boutique
            </Link>
          </div>
        </div>

        {/* Footer Security Note */}
        <p className="mt-8 text-center text-[10px] text-white/20 uppercase tracking-[0.2em]">
          Ambiente Monitorado &bull; BelaPop Security
        </p>
      </div>
    </div>
  );
}