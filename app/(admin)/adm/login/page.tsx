import Link from "next/link";

import { LoginForm } from "@/components/adm/auth/LoginForm";
import { ADM_MOCK_DEFAULT_PASSWORD } from "@/lib/adm/auth/config";
import { getAdmMockProfiles, isAdmMockShortcutEnabled } from "@/lib/adm/auth/current-user";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const readParam = (
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) => {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
};

export default async function AdmLoginPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const nextPath = readParam(resolvedSearchParams, "next");
  const reason = readParam(resolvedSearchParams, "reason");
  const showMockProfiles = isAdmMockShortcutEnabled();
  const mockProfiles = getAdmMockProfiles();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6f2ea,#f1ece2)] text-[#231f1c]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1240px] items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="hidden rounded-[36px] border border-[#d9d1c4] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),rgba(239,232,220,0.86))] p-10 lg:block">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#776e63]">
              BelaPop Internal Access
            </p>
            <h2 className="mt-6 max-w-xl font-editorial text-6xl leading-none text-[#1f1b18]">
              Governanca silenciosa para um ADM real.
            </h2>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#5f564d]">
              A nova camada do backoffice foi organizada para receber sessao server-side,
              provider externo de autenticacao e regras de acesso por papel sem quebrar o App Router.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-[#ddd5c9] bg-white/75 p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#756d62]">RBAC</p>
                <p className="mt-3 text-sm text-[#403932]">
                  Roles, permissions, guards por rota e acoes sensiveis centralizadas.
                </p>
              </div>
              <div className="rounded-3xl border border-[#ddd5c9] bg-white/75 p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#756d62]">Server First</p>
                <p className="mt-3 text-sm text-[#403932]">
                  Sessao validada no server antes do layout administrativo renderizar.
                </p>
              </div>
              <div className="rounded-3xl border border-[#ddd5c9] bg-white/75 p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#756d62]">Mock preparado</p>
                <p className="mt-3 text-sm text-[#403932]">
                  Cookie assinado local hoje, troca futura para backend real sem refazer a arquitetura.
                </p>
              </div>
              <div className="rounded-3xl border border-[#ddd5c9] bg-white/75 p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#756d62]">UX premium</p>
                <p className="mt-3 text-sm text-[#403932]">
                  Navegacao limpa por permissao, estados discretos e topbar contextual com perfil atual.
                </p>
              </div>
            </div>
            <div className="mt-10 text-xs uppercase tracking-[0.18em] text-[#6c645a]">
              <Link href="/" className="underline underline-offset-4">
                Voltar ao site publico
              </Link>
            </div>
          </section>

          <section className="flex items-center">
            <LoginForm
              nextPath={nextPath}
              reason={reason}
              mockProfiles={mockProfiles}
              showMockProfiles={showMockProfiles}
              mockPasswordHint={showMockProfiles ? ADM_MOCK_DEFAULT_PASSWORD : undefined}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
