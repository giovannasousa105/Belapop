export const FACE_SHIELD_FRAME_FIELDS = [
  "neutral_frame",
  "blink_frame",
  "smile_frame",
  "frown_frame",
  "turn_frame"
] as const;

export type FaceShieldFrameField = (typeof FACE_SHIELD_FRAME_FIELDS)[number];

export type FaceShieldCaptureMode =
  | "guided_camera"
  | "single_photo_upload"
  | "multi_photo_upload";

export type FaceShieldFrameFiles = Record<FaceShieldFrameField, File>;

export type FaceShieldGuidedStep = {
  field: FaceShieldFrameField;
  title: string;
  shortLabel: string;
  instruction: string;
  helper: string;
};

export const FACE_SHIELD_GUIDED_STEPS: FaceShieldGuidedStep[] = [
  {
    field: "neutral_frame",
    title: "Rosto relaxado",
    shortLabel: "Neutra",
    instruction: "Olhe para a câmera com o rosto relaxado.",
    helper: "Mantenha o rosto centralizado, sem filtro e com boa luz frontal."
  },
  {
    field: "blink_frame",
    title: "Piscada natural",
    shortLabel: "Piscada",
    instruction: "Pisque naturalmente.",
    helper: "Feche e abra os olhos de forma natural, sem tirar o rosto do centro."
  },
  {
    field: "smile_frame",
    title: "Sorriso leve",
    shortLabel: "Sorriso",
    instruction: "Dê um sorriso leve.",
    helper: "Um sorriso discreto já é suficiente para a leitura."
  },
  {
    field: "frown_frame",
    title: "Testa levemente franzida",
    shortLabel: "Testa",
    instruction: "Franza levemente a testa.",
    helper: "Não precisa forçar. Só queremos ler a expressão com clareza."
  },
  {
    field: "turn_frame",
    title: "Rosto levemente lateral",
    shortLabel: "Lateral",
    instruction: "Vire o rosto levemente para o lado.",
    helper: "Gire só um pouco, mantendo a mandíbula e a testa visíveis."
  }
];

type CaptureVideoFrameOptions = {
  fileName: string;
  mimeType?: string;
  quality?: number;
};

function ensureVideoFrameReady(video: HTMLVideoElement) {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    throw new Error("A câmera ainda não estabilizou a imagem.");
  }

  if (!video.videoWidth || !video.videoHeight) {
    throw new Error("Não foi possível ler a imagem da câmera.");
  }
}

export async function captureVideoFrameToFile(
  video: HTMLVideoElement,
  options: CaptureVideoFrameOptions
) {
  ensureVideoFrameReady(video);

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Não foi possível preparar a captura da câmera.");
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (nextBlob) => {
        if (!nextBlob) {
          reject(new Error("Não foi possível gerar a imagem da captura."));
          return;
        }

        resolve(nextBlob);
      },
      options.mimeType ?? "image/jpeg",
      options.quality ?? 0.92
    );
  });

  return new File([blob], options.fileName, {
    type: options.mimeType ?? "image/jpeg",
    lastModified: Date.now()
  });
}

export async function createImagePreviewDataUrl(
  file: Blob,
  options?: {
    maxSide?: number;
    mimeType?: string;
    quality?: number;
  }
) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();

      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("Não foi possivel preparar o preview da captura."));
      nextImage.src = objectUrl;
    });

    const maxSide = options?.maxSide ?? 640;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Não foi possivel montar o preview da captura.");
    }

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL(options?.mimeType ?? "image/jpeg", options?.quality ?? 0.72);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function cloneImageFile(file: File, fileName: string) {
  return new File([file], fileName, {
    type: file.type || "image/jpeg",
    lastModified: file.lastModified || Date.now()
  });
}

export function buildFaceShieldFormData(
  files: FaceShieldFrameFiles,
  captureMode: FaceShieldCaptureMode
) {
  const formData = new FormData();

  for (const field of FACE_SHIELD_FRAME_FIELDS) {
    formData.set(field, files[field], files[field].name);
  }

  formData.set("capture_mode", captureMode);

  return formData;
}

export function stopMediaStream(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((track) => track.stop());
}
