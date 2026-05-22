export const CLIENT_IMAGE_MAX_SIZE_BYTES = 8 * 1024 * 1024;
export const CLIENT_IMAGE_MIN_DIMENSION = 600;
export const CLIENT_IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type ClientImageQualityResult = {
  ok: boolean;
  errors: string[];
  width: number | null;
  height: number | null;
};

export async function loadClientImageDimensions(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight
        });
      };

      image.onerror = () => {
        reject(new Error("Não conseguimos abrir essa imagem."));
      };

      image.src = objectUrl;
    });

    return dimensions;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function validateClientImageFile(
  file: File | null | undefined
): Promise<ClientImageQualityResult> {
  if (!file) {
    return {
      ok: false,
      errors: ["Envie uma imagem para continuar."],
      width: null,
      height: null
    };
  }

  const errors: string[] = [];

  if (!CLIENT_IMAGE_ALLOWED_TYPES.includes(file.type as (typeof CLIENT_IMAGE_ALLOWED_TYPES)[number])) {
    errors.push("Use uma imagem JPEG, PNG ou WEBP.");
  }

  if (file.size > CLIENT_IMAGE_MAX_SIZE_BYTES) {
    errors.push("Cada imagem deve ter no máximo 8 MB.");
  }

  let width: number | null = null;
  let height: number | null = null;

  try {
    const dimensions = await loadClientImageDimensions(file);
    width = dimensions.width;
    height = dimensions.height;

    if (width < CLIENT_IMAGE_MIN_DIMENSION || height < CLIENT_IMAGE_MIN_DIMENSION) {
      errors.push("Use uma imagem com pelo menos 600 x 600 pixels.");
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Não conseguimos validar essa imagem.");
  }

  return {
    ok: errors.length === 0,
    errors,
    width,
    height
  };
}

export async function assertValidClientImageFile(file: File | null | undefined) {
  const result = await validateClientImageFile(file);

  if (!result.ok) {
    throw new Error(result.errors[0] ?? "Não conseguimos validar a imagem.");
  }

  return result;
}
