"use client";

type DiaryPreviewProps = {
  title: string;
  subtitle: string;
  content: string;
};

export const DiaryPreview = ({ title, subtitle, content }: DiaryPreviewProps) => {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((text) => text.trim())
    .filter(Boolean);

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
        Preview editorial
      </p>
      <h3 className="mt-3 font-display text-2xl text-noir-950">
        {title || "Título do conteúdo"}
      </h3>
      <p className="mt-2 text-sm text-noir-600">
        {subtitle || "Subtítulo institucional para o Diário."}
      </p>
      <div className="mt-6 space-y-4 text-sm text-noir-600">
        {paragraphs.length === 0 ? (
          <p className="text-sm text-noir-500">
            O conteúdo aparecerá aqui conforme o texto for inserido.
          </p>
        ) : (
          paragraphs.map((paragraph, index) => (
            <p key={`${paragraph}-${index}`}>{paragraph}</p>
          ))
        )}
      </div>
    </div>
  );
};
