"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Sparkles, Workflow } from "lucide-react";
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

function resolveAuthSurfaceMessage(searchParams: { get(name: string): string | null }) {
  if (searchParams.get("forbidden") === "1") {
    return "Sua conta nao tem permissao para acessar esta area.";
  }

  if (searchParams.get("auth_error") === "1") {
    return "Nao foi possivel concluir sua autenticacao. Tente novamente.";
  }

  if (searchParams.get("otp_fallback") === "1") {
    return "O link de acesso nao pode ser validado. Solicite um novo envio.";
  }

  if (!searchParams.get("oauth_error")) {
    return null;
  }

  switch (searchParams.get("oauth_error")) {
    case "facebook_provider_misconfigured":
      return "Login com Facebook indisponivel no momento. O provider ainda nao foi configurado corretamente.";
    case "facebook_start_failed":
      return "Nao foi possivel iniciar o login com Facebook agora. Tente novamente em instantes.";
    case "oauth_cancelled":
      return "Login social cancelado. Voce pode tentar novamente quando quiser.";
    case "oauth_start_failed":
      return "Nao foi possivel iniciar o login social agora. Tente novamente em instantes.";
    case "oauth_provider_invalid":
      return "O provedor de autenticacao solicitado e invalido.";
    case "oauth_env_missing":
      return "Login social indisponivel neste ambiente.";
    case "oauth_session_exchange_failed":
    case "oauth_session_missing":
    case "oauth_session_sync_failed":
      return "Nao foi possivel concluir o login social com seguranca. Tente novamente.";
    case "otp_type_invalid":
    case "otp_verification_failed":
    case "otp_session_missing":
      return "Nao foi possivel validar o link de acesso recebido por e-mail.";
    default:
      return "Nao foi possivel concluir o login social. Tente novamente.";
  }
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
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<"google" | "facebook" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isLogin = authMode === "login";
  const returnTo = normalizeReturnTo(searchParams.get("returnTo"), "/conta");
  const authRedirectHref = `/auth/redirect?audience=customer&returnTo=${encodeURIComponent(returnTo)}`;
  const oauthCallbackHref = `/auth/callback?audience=customer&returnTo=${encodeURIComponent(returnTo)}`;
  const surfaceMessage = resolveAuthSurfaceMessage(searchParams);
  const visibleMessage = message ?? surfaceMessage;

  useEffect(() => {
    if (mode !== "live" || !ready || !user) return;
    router.replace(authRedirectHref);
  }, [authRedirectHref, mode, ready, router, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (loading) return;

    if (!email.trim() || !password.trim()) {
      setMessage("Preencha e-mail e senha para continuar.");
      return;
    }

    if (!isLogin && !name.trim()) {
      setMessage("Informe seu nome completo.");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setMessage("A confirmacao de senha nao confere.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(email, password);

        if (!result.ok) {
          setMessage(result.message ?? "Nao foi possivel entrar.");
          return;
        }

        router.push(authRedirectHref);
        return;
      }

      const result = await registerCustomer(name, email, password);

      if (!result.ok) {
        setMessage(result.message ?? "Nao foi possivel criar sua conta.");
        return;
      }

      router.push(authRedirectHref);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setMessage(null);

    if (loading) return;

    if (!email.trim()) {
      setMessage("Informe seu e-mail para receber o link de acesso.");
      return;
    }

    setLoading(true);

    try {
      const result = await loginWithMagicLink(email, oauthCallbackHref);
      setMessage(result.message ?? (result.ok ? "Link enviado com sucesso." : "Nao foi possivel enviar o link."));
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
        setMessage(result.message ?? "Nao foi possivel iniciar o login social.");
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
                A Essencia da
                <br />
                Beleza Curada
              </h2>
              <p className="mt-6 max-w-sm text-sm uppercase tracking-[0.2em] text-white/70">
                Descubra uma curadoria exclusiva de cosmeticos de luxo e experiencias de bem-estar.
              </p>
            </div>
          </section>

          <section
            className={`flex w-full items-start justify-center bg-[#fcf9f8] px-5 pb-14 ${
              mode === "live" ? "pt-0" : "pt-[92px]"
            } sm:px-8 sm:pb-16 md:w-[53%] md:px-14 md:pb-20 md:pt-20 lg:px-16 xl:px-20`}
          >
            <div className="w-full max-w-md">
              <div className="mb-12 overflow-hidden bg-[#ddd9d7] md:hidden">
                <div className="relative aspect-[4/5]">
                  <img
                    alt="Editorial mobile BelaPop"
                    className="absolute inset-0 h-full w-full object-contain object-top"
                    src={editorialImage}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                  <div className="absolute inset-x-5 bottom-5 text-white">
                    <p className="text-[10px] uppercase tracking-[0.26em] text-white/70">
                      Ritual editorial
                    </p>
                    <p className={`${previewHeadlineFont.className} mt-2 text-2xl font-bold leading-tight`}>
                      Entre na sua
                      <br />
                      colecao privada
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-12 text-center md:hidden">
                <span className={`${previewHeadlineFont.className} text-3xl font-bold tracking-[-0.05em] text-black`}>
                  BelaPop
                </span>
              </div>

              <div className="mb-8 md:mb-10">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#747878]">
                  Acesso ao atelier digital
                </p>
              </div>

              <div className="mb-14 flex gap-8 border-b border-black/10 md:mb-16">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setMessage(null);
                  }}
                  className={`${previewHeadlineFont.className} relative pb-3 text-2xl transition-colors ${
                    isLogin ? "text-black" : "text-[#444748]/40 hover:text-black"
                  }`}
                >
                  Entrar
                  {isLogin ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-black" /> : null}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setMessage(null);
                  }}
                  className={`${previewHeadlineFont.className} relative pb-3 text-2xl transition-colors ${
                    !isLogin ? "text-black" : "text-[#444748]/40 hover:text-black"
                  }`}
                >
                  Criar Conta
                  {!isLogin ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-black" /> : null}
                </button>
              </div>

              <form className="space-y-8 md:space-y-9" onSubmit={handleSubmit}>
                {!isLogin ? (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-[#444748]">
                      Nome completo
                    </label>
                    <input
                      className={previewInputClass}
                      placeholder="Como no documento"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-[#444748]">
                    E-mail
                  </label>
                  <input
                    className={previewInputClass}
                    placeholder="seu@email.com"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-end justify-between gap-4">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-[#444748]">
                      Senha
                    </label>
                    {isLogin ? (
                      <button
                        type="button"
                        onClick={handleMagicLink}
                        className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#444748]/70 underline-offset-4 transition-colors hover:text-[#ef75ce] hover:underline"
                      >
                        Esqueceu a senha?
                      </button>
                    ) : null}
                  </div>
                  <input
                    className={previewInputClass}
                    placeholder="********"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>

                {!isLogin ? (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-[#444748]">
                      Confirmar senha
                    </label>
                    <input
                      className={previewInputClass}
                      placeholder="********"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </div>
                ) : null}

                {visibleMessage ? (
                  <div className="rounded-[20px] border border-[#b42318]/16 bg-[#fff5f4] px-4 py-3 text-sm text-[#b42318]">
                    {visibleMessage}
                  </div>
                ) : null}

                <div className="pt-6 md:pt-8">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`${previewAccentButtonClass} w-full text-xs tracking-[0.3em] active:scale-[0.98]`}
                  >
                    {loading ? "Processando..." : isLogin ? "Acessar Colecao" : "Criar Conta"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-black/10" />
                  <span className="text-[9px] uppercase tracking-[0.2em] text-[#444748]/60">
                    Ou continue com
                  </span>
                  <div className="h-px flex-1 bg-black/10" />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void handleOAuthLogin("google")}
                    disabled={loading || oauthLoadingProvider !== null}
                    className={`${previewSecondaryButtonClass} px-4 text-[10px] font-bold hover:border-[#ef75ce]`}
                  >
                    <Workflow className="h-4 w-4" />
                    {oauthLoadingProvider === "google" ? "Abrindo Google..." : "Conectar com Google"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleOAuthLogin("facebook")}
                    disabled={loading || oauthLoadingProvider !== null}
                    className={`${previewSecondaryButtonClass} px-4 text-[10px] font-bold`}
                  >
                    <Sparkles className="h-4 w-4" />
                    {oauthLoadingProvider === "facebook" ? "Abrindo Facebook..." : "Entrar com Facebook"}
                  </button>
                </div>
              </form>

              <p className="mx-auto mt-14 max-w-xs text-center text-[10px] leading-relaxed text-[#444748]/70 md:mt-16">
                Ao continuar, voce concorda com nossos{" "}
                <Link href="/termos-e-condicoes" className="text-black underline underline-offset-4">
                  Termos e Condicoes
                </Link>{" "}
                e{" "}
                <Link href="/aviso-de-privacidade" className="text-black underline underline-offset-4">
                  Politica de Privacidade
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
