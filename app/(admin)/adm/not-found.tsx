import { AccessDenied } from "@/components/adm/auth/AccessDenied";

export default function AdmNotFoundPage() {
  return (
    <AccessDenied
      eyebrow="Rota interna"
      title="Pagina do ADM nao encontrada"
      description="A rota solicitada nao existe nesta estrutura administrativa ou ainda nao foi disponibilizada para este fluxo."
      actionHref="/adm"
      actionLabel="Voltar ao hub"
    />
  );
}
