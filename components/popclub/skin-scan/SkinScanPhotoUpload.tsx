"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ImageUp, Sparkles, Upload } from "lucide-react";

import {
  cloneImageFile,
  type FaceShieldFrameFiles
} from "@/lib/skincare/capture";
import { assertValidClientImageFile } from "@/lib/skincare/clientImageQuality";

type UploadSlot = "front" | "blink" | "smile" | "frown" | "turn";

type UploadSlotState = {
  file: File | null;
  previewUrl: string | null;
  error: string | null;
  dimensions: string | null;
};

type Props = {
  disabled?: boolean;
  submitError?: string | null;
  onBack: () => void;
  onSubmit: (payload: {
    files: FaceShieldFrameFiles;
    captureMode: "single_photo_upload" | "multi_photo_upload";
  }) => Promise<void>;
  onChooseQuiz: () => void;
};

const slotMeta: Record<
  UploadSlot,
  { title: string; description: string; optional: boolean; acceptLabel: string }
> = {
  front: {
    title: "Foto frontal",
    description: "Obrigatória. Use luz natural, rosto centralizado e sem filtro.",
    optional: false,
    acceptLabel: "Frontal"
  },
  blink: {
    title: "Foto piscando",
    description: "Opcional. Se não enviar, usaremos a foto frontal.",
    optional: true,
    acceptLabel: "Piscando"
  },
  smile: {
    title: "Foto sorrindo",
    description: "Opcional. Um sorriso leve já é suficiente.",
    optional: true,
    acceptLabel: "Sorrindo"
  },
  frown: {
    title: "Foto franzindo",
    description: "Opcional. Ajuda a ler a expressão da testa.",
    optional: true,
    acceptLabel: "Franzindo"
  },
  turn: {
    title: "Foto lateral",
    description: "Opcional. Vire só um pouco o rosto para um dos lados.",
    optional: true,
    acceptLabel: "Lateral"
  }
};

const initialSlotState = (): Record<UploadSlot, UploadSlotState> => ({
  front: { file: null, previewUrl: null, error: null, dimensions: null },
  blink: { file: null, previewUrl: null, error: null, dimensions: null },
  smile: { file: null, previewUrl: null, error: null, dimensions: null },
  frown: { file: null, previewUrl: null, error: null, dimensions: null },
  turn: { file: null, previewUrl: null, error: null, dimensions: null }
});

function getFileExtension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export default function SkinScanPhotoUpload({
  disabled = false,
  submitError,
  onBack,
  onSubmit,
  onChooseQuiz
}: Props) {
  const inputRefs = useRef<Record<UploadSlot, HTMLInputElement | null>>({
    front: null,
    blink: null,
    smile: null,
    frown: null,
    turn: null
  });
  const uploadsRef = useRef<Record<UploadSlot, UploadSlotState>>(initialSlotState());
  const [uploads, setUploads] = useState<Record<UploadSlot, UploadSlotState>>(initialSlotState);
  const [screenError, setScreenError] = useState<string | null>(null);

  useEffect(() => {
    uploadsRef.current = uploads;
  }, [uploads]);

  useEffect(() => {
    return () => {
      for (const key of Object.keys(uploadsRef.current) as UploadSlot[]) {
        const previewUrl = uploadsRef.current[key].previewUrl;
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      }
    };
  }, []);

  const optionalCount = useMemo(
    () => (["blink", "smile", "frown", "turn"] as UploadSlot[]).filter((slot) => uploads[slot].file).length,
    [uploads]
  );

  const handleSelectFile = useCallback(async (slot: UploadSlot, file: File | null) => {
    if (!file) return;

    setScreenError(null);

    try {
      const validation = await assertValidClientImageFile(file);

      setUploads((current) => {
        const previousUrl = current[slot].previewUrl;
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }

        return {
          ...current,
          [slot]: {
            file,
            previewUrl: URL.createObjectURL(file),
            error: null,
            dimensions:
              validation.width && validation.height
                ? `${validation.width} x ${validation.height}px`
                : null
          }
        };
      });
    } catch (error) {
      setUploads((current) => {
        const previousUrl = current[slot].previewUrl;
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }

        return {
          ...current,
          [slot]: {
            file: null,
            previewUrl: null,
            error: error instanceof Error ? error.message : "Não foi possível validar a imagem.",
            dimensions: null
          }
        };
      });
    }
  }, []);

  const openPicker = useCallback((slot: UploadSlot) => {
    inputRefs.current[slot]?.click();
  }, []);

  const handleSubmit = useCallback(async () => {
    const frontal = uploads.front.file;

    if (!frontal) {
      setScreenError("Envie ao menos uma foto frontal para continuar.");
      return;
    }

    const captureMode = optionalCount > 0 ? "multi_photo_upload" : "single_photo_upload";
    const extension = getFileExtension(frontal);

    const files: FaceShieldFrameFiles = {
      neutral_frame: cloneImageFile(frontal, `neutral_frame.${extension}`),
      blink_frame: cloneImageFile(uploads.blink.file ?? frontal, `blink_frame.${getFileExtension(uploads.blink.file ?? frontal)}`),
      smile_frame: cloneImageFile(uploads.smile.file ?? frontal, `smile_frame.${getFileExtension(uploads.smile.file ?? frontal)}`),
      frown_frame: cloneImageFile(uploads.frown.file ?? frontal, `frown_frame.${getFileExtension(uploads.frown.file ?? frontal)}`),
      turn_frame: cloneImageFile(uploads.turn.file ?? frontal, `turn_frame.${getFileExtension(uploads.turn.file ?? frontal)}`)
    };

    await onSubmit({
      files,
      captureMode
    });
  }, [onSubmit, optionalCount, uploads]);

  return (
    <div className="min-h-screen bg-[#090909] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar para escolher outro modo de captura"
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-white/12 bg-white/6 px-4 text-xs uppercase tracking-[0.2em] text-white/78"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <p className="text-[11px] uppercase tracking-[0.26em] text-white/55">Enviar foto</p>
          <div className="w-11" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">Qualidade da imagem</p>
            <h1 className="mt-3 font-[var(--font-playfair)] text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Envie suas fotos com boa luz.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/74">
              Para uma leitura melhor, use uma foto em luz natural, sem filtro, sem maquiagem pesada e com o rosto centralizado.
            </p>

            <div className="mt-8 grid gap-4 xl:grid-cols-2">
              {(Object.keys(slotMeta) as UploadSlot[]).map((slot) => {
                const meta = slotMeta[slot];
                const item = uploads[slot];

                return (
                  <article key={slot} className="rounded-[28px] border border-white/10 bg-black/22 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-white/48">
                          {meta.optional ? "Opcional" : "Obrigatória"}
                        </p>
                        <h2 className="mt-2 font-medium text-white">{meta.title}</h2>
                        <p className="mt-2 text-sm leading-7 text-white/68">{meta.description}</p>
                      </div>
                      {item.file ? <Check className="mt-1 h-4 w-4 text-white/75" aria-hidden="true" /> : null}
                    </div>

                    <div className="mt-4 overflow-hidden rounded-[22px] border border-white/10 bg-white/6">
                      {item.previewUrl ? (
                        <img src={item.previewUrl} alt={meta.title} className="aspect-[4/5] w-full object-cover" />
                      ) : (
                        <div className="flex aspect-[4/5] w-full items-center justify-center px-6 text-center text-[11px] uppercase tracking-[0.22em] text-white/34">
                          Nenhuma imagem enviada
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs leading-6 text-white/52">
                        {item.dimensions ?? "JPEG, PNG ou WEBP até 8 MB"}
                      </div>
                      <button
                        type="button"
                        onClick={() => openPicker(slot)}
                        aria-label={`${item.file ? "Trocar" : "Enviar"} ${meta.acceptLabel}`}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/12 px-4 text-[11px] uppercase tracking-[0.22em] text-white/78"
                      >
                        <Upload className="h-4 w-4" aria-hidden="true" />
                        {item.file ? "Trocar" : "Enviar"}
                      </button>
                    </div>

                    {item.error ? <p className="mt-3 text-sm leading-7 text-[#f0b8c7]">{item.error}</p> : null}

                    <input
                      ref={(element) => {
                        inputRefs.current[slot] = element;
                      }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        void handleSelectFile(slot, file);
                        event.currentTarget.value = "";
                      }}
                    />
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="flex flex-col gap-4 rounded-[34px] border border-white/10 bg-white/5 p-5">
            <div className="rounded-[26px] border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">Como enviamos os frames</p>
              <p className="mt-3 text-sm leading-7 text-white/74">
                Se você enviar só a frontal, ela será reaproveitada como base para os cinco frames exigidos pelo serviço.
              </p>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-white/74">
              Quanto mais fotos complementares você enviar, melhor fica a leitura de expressão, textura e lateralidade.
            </div>

            {screenError ? (
              <div className="rounded-[24px] border border-[#a44a64]/35 bg-[#a44a64]/10 px-4 py-4 text-sm leading-7 text-white/84">
                {screenError}
              </div>
            ) : null}

            {submitError ? (
              <div className="rounded-[24px] border border-[#a44a64]/35 bg-[#a44a64]/10 px-4 py-4 text-sm leading-7 text-white/84">
                {submitError}
              </div>
            ) : null}

            <div className="mt-auto flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!uploads.front.file || disabled}
                className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-6 text-xs font-semibold uppercase tracking-[0.22em] text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {disabled ? "Enviando leitura..." : "Enviar para análise"}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  aria-label="Voltar para escolher outro modo"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 px-4 text-[11px] uppercase tracking-[0.2em] text-white/72"
                >
                  <ImageUp className="h-4 w-4" aria-hidden="true" />
                  Outro modo
                </button>
                <button
                  type="button"
                  onClick={onChooseQuiz}
                  aria-label="Seguir pelo quiz rápido"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 px-4 text-[11px] uppercase tracking-[0.2em] text-white/72"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Quiz rápido
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
