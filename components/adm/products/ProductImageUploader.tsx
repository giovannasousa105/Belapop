"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export function ProductImageUploader({
  productId,
  initialImageUrl
}: {
  productId: string;
  initialImageUrl: string | null;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/adm/products/${productId}/upload-image`, {
        method: "POST",
        body: form
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setUploadError(data.error ?? "Erro no upload.");
        return;
      }
      setImageUrl(data.url ?? null);
    } catch {
      setUploadError("Erro de conexão no upload.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-xl border border-[#ddd8ce] bg-white p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#6f675f]">Imagem do produto</p>
      <div className="mt-3 flex items-start gap-4">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-[#ece8e0] bg-[#faf8f4]">
          {imageUrl ? (
            <Image src={imageUrl} alt="Imagem do produto" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-center text-[10px] text-[#9e9589]">
              Sem imagem real
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#ddd8ce] border-t-black" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-[#ddd8ce] px-4 py-2 text-xs font-medium text-[#27231f] transition-colors hover:border-[#a89f93] disabled:opacity-50"
          >
            {imageUrl ? "Substituir imagem" : "Enviar imagem real"}
          </button>
          <p className="text-[11px] text-[#9e9589]">JPG, PNG, WebP ou GIF · máx. 5 MB</p>
          {uploadError && <p className="text-[11px] text-red-600">{uploadError}</p>}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleImageUpload(event)}
      />
    </div>
  );
}
