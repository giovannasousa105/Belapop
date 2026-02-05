import { SectionFrame } from "@/components/SectionFrame";
import { fetchDiaryPosts, AdminDiaryRow } from "@/lib/admin/data";
import { LuxuryButton } from "@/components/LuxuryButton";

export default async function AdminDiaryPage() {
  const posts = await fetchDiaryPosts();

  return (
    <div className="flex flex-col gap-6">
      <SectionFrame>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Diário BelaPop</p>
          <h1 className="font-display text-3xl text-noir-950">Conteúdo editorial</h1>
          <p className="text-sm text-noir-600">
            Crie, publique ou edite posts com fácil acesso aos principais conteúdos.
          </p>
        </div>
      </SectionFrame>
      <SectionFrame>
        <div className="flex items-center justify-between">
          <p className="text-sm text-noir-600">
            {posts.length} posts encontrados.
          </p>
          <LuxuryButton variant="primary" href="/admin/diario/new">
            Novo post
          </LuxuryButton>
        </div>
        <div className="mt-4 space-y-3">
          {posts.map((post) => (
            <DiaryRow key={post.id} post={post} />
          ))}
          {posts.length === 0 && (
            <p className="text-sm text-noir-600">Nenhum post cadastrado.</p>
          )}
        </div>
      </SectionFrame>
    </div>
  );
}

const DiaryRow = ({ post }: { post: AdminDiaryRow }) => (
  <div className="rounded-2xl border border-[#F6D6E2] p-4">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-noir-500">{post.category}</p>
        <h2 className="text-lg font-semibold text-noir-900">{post.title}</h2>
      </div>
      <div className="text-right text-xs text-noir-500">
        <p>{post.published ? "Publicado" : "Rascunho"}</p>
        <p>
          {post.created_at ? new Date(post.created_at).toLocaleDateString("pt-BR") : "—"}
        </p>
      </div>
    </div>
    <div className="mt-3 flex gap-2">
      <LuxuryButton variant="secondary" href={`/admin/diario/${post.id}`}>
        Editar
      </LuxuryButton>
      <LuxuryButton variant="primary" href={`/admin/diario/${post.id}`}>
        Publicar
      </LuxuryButton>
    </div>
  </div>
);
