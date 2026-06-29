"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { Suspense, useEffect, useState } from "react";

import { normalizeReturnTo } from "@/lib/auth/redirects";
import { useAuth } from "@/lib/AuthContext";

import { EditorialPreviewFrame } from "./editorial-preview-frame";
import {
  previewAccentButtonClass,
  previewHeadlineFont,
  previewInputClass,
  previewSecondaryButtonClass
} from "./luxury-preview-theme";
import { type BelapopRenderMode } from "./routes";

const editorialImage = "/editorial/login-hero-original.jpg";

type LoginPreviewScreenProps = {
  mode?: BelapopRenderMode;
};

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function resolveAuthSurfaceMessage(searchParams: { get(name: string): string | null }) {
  if (searchParams.get("forbidden") === "1") {
    return "Sua conta não tem permissão para acessar esta área.";
  }

  if (searchParams.get("auth_error") === "1") {
    return "Não foi possível concluir sua autenticação. Tente novamente.";
  }

  if (searchParams.get("otp_fallback") === "1") {
    return "O link de acesso não pode ser validado. Solicite um novo envio.";
  }

  if (!searchParams.get("oauth_error")) {
    return null;
  }

  switch (searchParams.get("oauth_error")) {
    case "facebook_provider_misconfigured":
      return "Login com Facebook indisponível no momento. O provedor ainda não foi configurado corretamente.";
    case "facebook_start_failed":
      return "Não foi possível iniciar o login com Facebook agora. Tente novamente em instantes.";
    case "oauth_cancelled":
      return "Login social cancelado. Você pode tentar novamente quando quiser.";
    case "oauth_start_failed":
      return "Não foi possível iniciar o login social agora. Tente novamente em instantes.";
    case "oauth_provider_invalid":
      return "O provedor de autenticação solicitado é inválido.";
    case "oauth_env_missing":
      return "Login social indisponível neste ambiente.";
    case "oauth_session_exchange_failed":
    case "oauth_session_missing":
    case "oauth_session_sync_failed":
      return "Não foi possível concluir o login social com segurança. Tente novamente.";
    case "otp_type_invalid":
    case "otp_verification_failed":
    case "otp_session_missing":
      return "Não foi possível validar o link de acesso recebido por e-mail.";
    default:
      return "Não foi possível concluir o login social. Tente novamente.";
  }
}

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const strengthLabels = ["", "Fraca", "Regular", "Boa", "Forte"];
const strengthColors = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function LoginPreviewScreen(props: LoginPreviewScreenProps) {
  return (
    <Suspense fallback={null}>
      <LoginPreviewScreenContent {...props} />
    </Suspense>
  );
}

function LoginPreviewScreenContent({ mode = "preview" }: LoginPreviewScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithMagicLink, loginWithOAuth, ready, registerCustomer, user } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<"google" | "facebook" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const isLogin = authMode === "login";
  const returnTo = normalizeReturnTo(searchParams.get("returnTo"), "/conta");
  const passwordStrength = getPasswordStrength(password);

  const valueContext = returnTo.startsWith("/skin-scan")
    ? {
        headline: "Salve sua análise de pele",
        sub: "Veja sua rotina completa e acompanhe sua evolução ao longo do tempo.",
        bullets: [
          "Resultado do Skin Scan salvo",
          "Rotina personalizada gerada",
          "Histórico de evolução da pele"
        ]
      }
    : returnTo.startsWith("/carrinho") || returnTo.startsWith("/checkout")
    ? {
        headline: "Finalize sua compra",
        sub: "Faça login para concluir seu pedido e acumular pontos PopClub.",
        bullets: [
          "Histórico de pedidos acessível",
          "Pontos PopClub acumulados",
          "Checkout mais rápido"
        ]
      }
    : {
        headline: "Sua rotina personalizada te espera",
        sub: "Crie sua conta gratuita e aproveite todos os benefícios BelaPop.",
        bullets: [
          "Resultado do Skin Scan salvo",
          "Pontos PopClub acumulados",
          "Histórico de pedidos"
        ]
      };

  const authRedirectHref = `/auth/redirect?audience=customer&returnTo=${encodeURIComponent(returnTo)}`;
  const oauthCallbackHref = `/auth/callback?audience=customer&returnTo=${encodeURIComponent(returnTo)}`;
  const facebookOAuthEnabled = process.env.NEXT_PUBLIC_FACEBOOK_OAUTH_ENABLED === "true";
  const surfaceMessage = resolveAuthSurfaceMessage(searchParams);
  const visibleMessage = message ?? surfaceMessage;

  useEffect(() => {
    if (mode !== "live" || !ready || !user) return;
    router.replace(authRedirectHref);
  }, [authRedirectHref, mode, ready, router, user]);

  function switchMode(next: "login" | "signup") {
    setAuthMode(next);
    setMessage(null);
    setFieldErrors({});
    setMagicLinkSent(false);
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setFieldErrors({});

    if (loading) return;

    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = "E-mail obrigatório.";
    } else if (!validateEmail(email)) {
      errors.email = "E-mail inválido.";
    }

    if (!password) {
      errors.password = "Senha obrigatória.";
    } else if (password.length < 6) {
      errors.password = "Senha muito curta.";
    }

    if (!isLogin) {
      if (!name.trim()) errors.name = "Nome obrigatório.";
      if (password.length < 8) errors.password = "Mínimo 8 caracteres.";
      if (password !== confirmPassword) errors.confirm = "As senhas não coincidem.";
      if (!lgpdAccepted) errors.lgpd = "Aceite os termos para criar sua conta.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(email, password);
        if (!result.ok) {
          setMessage(result.message ?? "Não foi possível entrar.");
          return;
        }
        router.push(authRedirectHref);
        return;
      }

      const result = await registerCustomer(name, email, password);
      if (!result.ok) {
        setMessage(result.message ?? "Não foi possível criar sua conta.");
        return;
      }
      router.push(authRedirectHref);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setMessage(null);
    setFieldErrors({});
    if (loading) return;

    if (!email.trim()) {
      setFieldErrors({ email: "Informe seu e-mail para receber o link de acesso." });
      return;
    }
    if (!validateEmail(email)) {
      setFieldErrors({ email: "E-mail inválido." });
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithMagicLink(email, oauthCallbackHref);
      if (result.ok) {
        setMagicLinkSent(true);
      } else {
        setMessage(result.message ?? "Não foi possível enviar o link.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    if (oauthLoadingProvider || loading) return;
    setMessage(null);
    setOauthLoadingProvider(provider);
    try {
      const result = await loginWithOAuth(provider, oauthCallbackHref);
      if (!result.ok) {
        setMessage(result.message ?? "Não foi possível iniciar o login social.");
      }
    } finally {
      setOauthLoadingProvider(null);
    }
  };

  return (
    <EditorialPreviewFrame
      mode={mode}
      hideMobileHeader={mode === "live"}
      hideHeader={mode === "live"}
      hideFooter={mode === "live"}
    >
      <main className="mx-auto max-w-[1500px] bg-[#fcf9f8]">
        <div className="flex min-h-screen flex-col md:flex-row md:items-stretch">
          {/* Coluna esquerda — imagem editorial, só desktop */}
          <section className="relative hidden overflow-hidden bg-[#ddd9d7] md:block md:w-[47%] md:aspect-[4/5]">
            <img
              alt="Fotografia editorial de beleza"
              className="absolute inset-0 h-full w-full object-contain object-top"
              src={editorialImage}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-16 left-12 right-12 z-10 lg:left-16 lg:right-16">
              <h2
                className={`${previewHeadlineFont.className} text-4xl font-bold leading-tight tracking-[-0.04em] text-white lg:text-5xl`}
              >
                {valueContext.headline}
              </h2>
              <p className="mt-4 max-w-sm text-sm text-white/70">
                {valueContext.sub}
              </p>
              <ul className="mt-5 space-y-2">
                {valueContext.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-xs text-white/80">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#ed93d5]/80 text-[9px] font-bold text-white">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Coluna direita — formulário */}
          <section
            className={`flex w-full items-start justify-center bg-[#fcf9f8] px-5 pb-14 ${
              mode === "live" ? "pt-16 sm:pt-20" : "pt-[92px]"
            } sm:px-8 sm:pb-16 md:w-[53%] md:px-14 md:pb-20 md:pt-20 lg:px-16 xl:px-20`}
          >
            <div className="w-full max-w-md">
              {/* Logo mobile */}
              <div className="mb-10 text-center md:hidden">
                <span className={`${previewHeadlineFont.className} text-3xl font-bold tracking-[-0.05em] text-black`}>
                  BelaPop
                </span>
              </div>

              {/* Tabs */}
              <div className="mb-14 flex gap-8 border-b border-black/10 md:mb-16">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className={`${previewHeadlineFont.className} relative pb-3 text-2xl transition-colors ${
                    isLogin ? "text-black" : "text-[#444748]/40 hover:text-black"
                  }`}
                >
                  Entrar
                  {isLogin ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-black" /> : null}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className={`${previewHeadlineFont.className} relative pb-3 text-2xl transition-colors ${
                    !isLogin ? "text-black" : "text-[#444748]/40 hover:text-black"
                  }`}
                >
                  Criar Conta
                  {!isLogin ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-black" /> : null}
                </button>
              </div>

              {/* Magic link enviado */}
              {magicLinkSent ? (
                <div className="space-y-6 py-4 text-center">
                  <div className="text-4xl">✉️</div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Link enviado para {email}</p>
                    <p className="mt-2 text-xs text-[#444748]/70">
                      Clique no link no e-mail para entrar automaticamente. Verifique também a pasta de spam.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMagicLinkSent(false)}
                    className="text-xs text-[#444748]/70 underline underline-offset-4"
                  >
                    Tentar de outro jeito
                  </button>
                </div>
              ) : (
                <form
                  className="space-y-8 md:space-y-9"
                  onSubmit={handleSubmit}
                  autoComplete="on"
                  noValidate
                >
                  {/* Nome — só cadastro */}
                  {!isLogin ? (
                    <div className="space-y-2">
                      <label htmlFor="signup-name" className="block text-[10px] font-bold uppercase tracking-[0.22em] text-[#444748]">
                        Nome completo
                      </label>
                      <input
                        id="signup-name"
                        name="full_name"
                        type="text"
                        autoComplete="name"
                        required
                        className={previewInputClass}
                        placeholder="Seu nome completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      {fieldErrors.name && (
                        <p role="alert" className="text-xs text-red-600">{fieldErrors.name}</p>
                      )}
                    </div>
                  ) : null}

                  {/* E-mail */}
                  <div className="space-y-2">
                    <label htmlFor={isLogin ? "login-email" : "signup-email"} className="block text-[10px] font-bold uppercase tracking-[0.22em] text-[#444748]">
                      E-mail
                    </label>
                    <input
                      id={isLogin ? "login-email" : "signup-email"}
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className={previewInputClass}
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    {fieldErrors.email && (
                      <p role="alert" className="text-xs text-red-600">{fieldErrors.email}</p>
                    )}
                  </div>

                  {/* Senha */}
                  <div className="space-y-2">
                    <div className="flex items-end justify-between gap-4">
                      <label htmlFor={isLogin ? "login-password" : "signup-password"} className="block text-[10px] font-bold uppercase tracking-[0.22em] text-[#444748]">
                        Senha
                      </label>
                      {isLogin ? (
                        <Link
                          href={`/login/recuperar-senha${returnTo !== "/conta" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
                          className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#444748]/70 underline-offset-4 transition-colors hover:text-[#ef75ce] hover:underline"
                        >
                          Esqueci minha senha
                        </Link>
                      ) : null}
                    </div>
                    <div className="relative">
                      <input
                        id={isLogin ? "login-password" : "signup-password"}
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        required
                        minLength={isLogin ? 6 : 8}
                        className={`${previewInputClass} pr-10`}
                        placeholder="Sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[#747878]/60 hover:text-[#444748]"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p role="alert" className="text-xs text-red-600">{fieldErrors.password}</p>
                    )}
                    {/* Indicador de força — só no cadastro */}
                    {!isLogin && password && (
                      <div className="pt-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                i <= passwordStrength ? strengthColors[passwordStrength] : "bg-black/10"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="mt-1 text-[11px] text-[#444748]/60">
                          Força: {strengthLabels[passwordStrength] || "—"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirmar senha + LGPD — só cadastro */}
                  {!isLogin ? (
                    <>
                      <div className="space-y-2">
                        <label htmlFor="signup-confirm" className="block text-[10px] font-bold uppercase tracking-[0.22em] text-[#444748]">
                          Confirmar senha
                        </label>
                        <div className="relative">
                          <input
                            id="signup-confirm"
                            name="confirm_password"
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            required
                            className={`${previewInputClass} pr-10`}
                            placeholder="Repita a senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[#747878]/60 hover:text-[#444748]"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {fieldErrors.confirm && (
                          <p role="alert" className="text-xs text-red-600">{fieldErrors.confirm}</p>
                        )}
                      </div>

                      <div className="flex items-start gap-3">
                        <input
                          id="lgpd-consent"
                          name="lgpd_consent"
                          type="checkbox"
                          checked={lgpdAccepted}
                          onChange={(e) => setLgpdAccepted(e.target.checked)}
                          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-black"
                        />
                        <label htmlFor="lgpd-consent" className="cursor-pointer text-[11px] leading-5 text-[#444748]">
                          Li e aceito os{" "}
                          <Link href="/termos-e-condicoes" className="underline underline-offset-4" target="_blank">
                            Termos de Uso
                          </Link>{" "}
                          e a{" "}
                          <Link href="/aviso-de-privacidade" className="underline underline-offset-4" target="_blank">
                            Política de Privacidade
                          </Link>
                          . Autorizo o tratamento dos meus dados conforme a LGPD.
                        </label>
                      </div>
                      {fieldErrors.lgpd && (
                        <p role="alert" className="text-xs text-red-600">{fieldErrors.lgpd}</p>
                      )}
                    </>
                  ) : null}

                  {/* Mensagem de erro auth */}
                  {visibleMessage ? (
                    <div role="alert" className="rounded-[20px] border border-[#b42318]/16 bg-[#fff5f4] px-4 py-3 text-sm text-[#b42318]">
                      {visibleMessage}
                    </div>
                  ) : null}

                  <div className="space-y-3 pt-6 md:pt-8">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`${previewAccentButtonClass} w-full text-xs tracking-[0.3em] active:scale-[0.98]`}
                    >
                      {loading
                        ? "Processando..."
                        : isLogin
                        ? <>Entrar <ArrowRight className="h-4 w-4" /></>
                        : <>Criar minha conta <ArrowRight className="h-4 w-4" /></>
                      }
                    </button>

                    {/* Magic link — só no login */}
                    {isLogin ? (
                      <button
                        type="button"
                        onClick={() => void handleMagicLink()}
                        disabled={loading}
                        className="w-full text-center text-[11px] text-[#444748]/60 underline underline-offset-4 transition-colors hover:text-[#444748] disabled:opacity-50"
                      >
                        Prefiro receber um link por e-mail
                      </button>
                    ) : null}
                  </div>

                  {/* OAuth */}
                  <div className="flex items-center gap-4 py-2">
                    <div className="h-px flex-1 bg-black/10" />
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#444748]/60">
                      Ou continue com
                    </span>
                    <div className="h-px flex-1 bg-black/10" />
                  </div>

                  <div className={`grid grid-cols-1 gap-3 ${facebookOAuthEnabled ? "sm:grid-cols-2" : ""}`}>
                    <button
                      type="button"
                      onClick={() => void handleOAuthLogin("google")}
                      disabled={loading || oauthLoadingProvider !== null}
                      className={`${previewSecondaryButtonClass} px-4 text-[10px] font-bold hover:border-[#ef75ce]`}
                    >
                      <GoogleIcon />
                      {oauthLoadingProvider === "google" ? "Abrindo Google..." : "Conectar com Google"}
                    </button>
                    {facebookOAuthEnabled ? (
                      <button
                        type="button"
                        onClick={() => void handleOAuthLogin("facebook")}
                        disabled={loading || oauthLoadingProvider !== null}
                        className={`${previewSecondaryButtonClass} px-4 text-[10px] font-bold`}
                      >
                        <Sparkles className="h-4 w-4" />
                        {oauthLoadingProvider === "facebook" ? "Abrindo Facebook..." : "Entrar com Facebook"}
                      </button>
                    ) : null}
                  </div>
                </form>
              )}

              <p className="mx-auto mt-14 max-w-xs text-center text-[10px] leading-relaxed text-[#444748]/70 md:mt-16">
                Ao continuar, você concorda com nossos{" "}
                <Link href="/termos-e-condicoes" className="text-black underline underline-offset-4">
                  Termos e Condições
                </Link>{" "}
                e{" "}
                <Link href="/aviso-de-privacidade" className="text-black underline underline-offset-4">
                  Política de Privacidade
                </Link>
                .
              </p>
            </div>
          </section>
        </div>
      </main>
    </EditorialPreviewFrame>
  );
}
