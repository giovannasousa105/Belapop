import "server-only";

import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

import { VARIANTES, buildStoragePath, type VarianteKey } from "./imageVariants";

// ─── Cliente Supabase (service_role para upload) ──────────────────────────────

function getStorageClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars ausentes.");
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Detecção de tipo de imagem ───────────────────────────────────────────────

export type TipoImagem = "packshot" | "editorial";

export async function detectarTipoImagem(buffer: Buffer): Promise<TipoImagem> {
  const { data } = await sharp(buffer)
    .resize(50, 50, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Array.from(data as Uint8Array);
  const luminosidadeMedia = pixels.reduce((sum, v) => sum + v, 0) / pixels.length;

  // Luminosidade alta → fundo branco/claro → packshot
  return luminosidadeMedia > 220 ? "packshot" : "editorial";
}

// ─── Processamento por variante ───────────────────────────────────────────────

interface ProcessarImagemParams {
  buffer:      Buffer;
  produto_id:  string;
  imagem_id:   string;
  variantes:   VarianteKey[];
}

export async function processarImagemProduto(
  params: ProcessarImagemParams,
): Promise<Record<VarianteKey, string>> {
  const supabase = getStorageClient();
  const urls: Partial<Record<VarianteKey, string>> = {};

  await Promise.all(
    params.variantes.map(async (key) => {
      const v = VARIANTES[key];

      const processado = await sharp(params.buffer)
        .resize(v.largura, v.altura, {
          fit:                  v.fit,
          background:           v.background,
          withoutEnlargement:   false,
        })
        .webp({ quality: v.quality })
        .toBuffer();

      const storagePath = buildStoragePath(params.produto_id, params.imagem_id, key);

      const { error } = await supabase.storage
        .from("produtos")
        .upload(storagePath, processado, {
          contentType:  "image/webp",
          cacheControl: "31536000",   // 1 ano — imutável pelo ID
          upsert:       true,
        });

      if (error) throw new Error(`Upload falhou [${key}]: ${error.message}`);

      const { data: { publicUrl } } = supabase.storage
        .from("produtos")
        .getPublicUrl(storagePath);

      urls[key] = publicUrl;
    }),
  );

  return urls as Record<VarianteKey, string>;
}

// ─── Validação de dimensões mínimas ──────────────────────────────────────────

export const RESOLUCAO_MINIMA = 800;

export async function validarResolucao(buffer: Buffer): Promise<void> {
  const meta = await sharp(buffer).metadata();
  const { width = 0, height = 0 } = meta;

  if (width < RESOLUCAO_MINIMA || height < RESOLUCAO_MINIMA) {
    throw new Error(
      `Imagem muito pequena (${width}×${height}px). ` +
      `Envie imagens com pelo menos ${RESOLUCAO_MINIMA}×${RESOLUCAO_MINIMA}px ` +
      `para garantir qualidade na PDP.`,
    );
  }
}
