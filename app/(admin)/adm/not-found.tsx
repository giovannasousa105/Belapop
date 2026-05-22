import { AccessDenied } from "@/components/adm/auth/AccessDenied";

export default function AdmNotFoundPage() {
  return (
    <AccessDenied
      eyebrow="Rota interna"
      title="Pagina do ADM não encontrada"
      description="A rota solicitada não existe nesta estrutura administrativa ou ainda não foi disponibilizada para este fluxo."
      actionHref="/adm"
      actionLabel="Voltar ao hub"
    />
  );
}
