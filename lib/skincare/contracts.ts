import { z } from "zod";

export const skinProfilePatchSchema = z
  .object({
    skin_type_id: z.string().uuid().nullable().optional(),
    skin_tone_id: z.string().uuid().nullable().optional(),
    main_concern_id: z.string().uuid().nullable().optional(),
    sensitivity_level: z.number().int().min(1).max(5).optional(),
    price_affinity_cents: z.number().int().min(0).nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe pelo menos um campo para atualizar."
  });

export const skincareRoutineQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(3).default(1)
});

export const skinScanCreateSchema = z.object({
  hydration_score: z.number().min(0).max(100),
  acne_score: z.number().min(0).max(100),
  pigmentation_score: z.number().min(0).max(100),
  redness_score: z.number().min(0).max(100),
  elasticity_score: z.number().min(0).max(100).optional(),
  pore_visibility: z.number().min(0).max(100).optional(),
  wrinkle_depth: z.number().min(0).max(100).optional(),
  scan_source: z.enum(["manual", "ai_scan", "imported"]).optional(),
  image_url: z.string().url().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const faceShieldScanCreateSchema = skinScanCreateSchema.extend({
  capture_metadata: z
    .object({
      brightness_score: z.number().min(0).max(1).optional(),
      centered_face_score: z.number().min(0).max(1).optional(),
      minimal_makeup_score: z.number().min(0).max(1).optional()
    })
    .passthrough()
    .optional(),
  liveness: z
    .object({
      texture_score: z.number().min(0).max(1).optional(),
      depth_score: z.number().min(0).max(1).optional(),
      blink_detected: z.boolean().optional(),
      head_movement: z.boolean().optional(),
      smile_detected: z.boolean().optional(),
      frown_detected: z.boolean().optional()
    })
    .optional()
});

export const skincareUsageStartSchema = z.object({
  cart_id: z.string().uuid().optional(),
  start_date: z.string().date().optional()
});

export const skinGptAskSchema = z.object({
  question: z.string().trim().min(8).max(1200)
});

export const skinSimulationQuerySchema = z.object({
  days: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return [30, 60, 90];

      const unique = [...new Set(value.split(",").map((item) => Number(item.trim())).filter(Number.isFinite))];
      const normalized = unique
        .filter((item) => item >= 7 && item <= 180)
        .sort((a, b) => a - b)
        .slice(0, 4);

      return normalized.length > 0 ? normalized : [30, 60, 90];
    })
});

export const skinSimulationPersistSchema = z.object({
  days: z
    .array(z.number().int().min(7).max(180))
    .max(4)
    .optional()
    .transform((value) => {
      const normalized = [...new Set((value ?? [30, 60, 90]).filter(Number.isFinite))]
        .sort((a, b) => a - b)
        .slice(0, 4);
      return normalized.length > 0 ? normalized : [30, 60, 90];
    }),
  routine_cart_id: z.string().uuid().nullable().optional()
});

export type SkinProfilePatchInput = z.infer<typeof skinProfilePatchSchema>;
export type SkincareRoutineQueryInput = z.infer<typeof skincareRoutineQuerySchema>;
export type SkinScanCreateInput = z.infer<typeof skinScanCreateSchema>;
export type FaceShieldScanCreateInput = z.infer<typeof faceShieldScanCreateSchema>;
export type SkincareUsageStartInput = z.infer<typeof skincareUsageStartSchema>;
export type SkinGptAskInput = z.infer<typeof skinGptAskSchema>;
export type SkinSimulationQueryInput = z.infer<typeof skinSimulationQuerySchema>;
export type SkinSimulationPersistInput = z.infer<typeof skinSimulationPersistSchema>;
