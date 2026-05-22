import { z } from "zod";

export const assistantFlowSchema = z.enum([
  "routine",
  "gift",
  "repurchase",
  "post_scan",
  "cart_assist"
]);

export const routineObjectiveSchema = z.enum([
  "hidratação",
  "acne",
  "manchas",
  "oleosidade",
  "sensibilidade",
  "glow",
  "antissinais"
]);

export const routineSkinTypeSchema = z.enum([
  "oleosa",
  "seca",
  "mista",
  "sensível",
  "nao_sei"
]);

export const routineDepthSchema = z.enum(["simples", "completa"]);
export const budgetSchema = z.enum(["essencial", "intermediaria", "premium"]);

export const giftInterestSchema = z.enum([
  "skincare",
  "maquiagem",
  "cabelo",
  "autocuidado"
]);

export const giftSafetySchema = z.enum(["seguro", "sofisticado"]);

export const assistantCartItemSchema = z.object({
  productId: z.string().trim().min(1),
  sellerId: z.string().trim().min(1).optional(),
  quantity: z.number().int().positive().default(1)
});

export const assistantRequestSchema = z.object({
  flow: assistantFlowSchema,
  origin: z.string().trim().optional(),
  currentProductSlug: z.string().trim().nullish(),
  cartItems: z.array(assistantCartItemSchema).optional().default([]),
  shippingTotalCents: z.number().int().min(0).nullish(),
  routine: z
    .object({
      objective: routineObjectiveSchema,
      skinType: routineSkinTypeSchema,
      depth: routineDepthSchema,
      budget: budgetSchema
    })
    .partial()
    .optional(),
  gift: z
    .object({
      recipient: z.string().trim().min(1).max(120).optional(),
      occasion: z.string().trim().min(1).max(120).optional(),
      priceBand: budgetSchema.optional(),
      interest: giftInterestSchema.optional(),
      tone: giftSafetySchema.optional()
    })
    .partial()
    .optional(),
  scanContext: z
    .object({
      summary: z.string().trim().optional(),
      priority: z.string().trim().optional(),
      tags: z.array(z.string().trim().min(1)).optional().default([])
    })
    .partial()
    .optional()
});

export type AssistantFlow = z.infer<typeof assistantFlowSchema>;
export type AssistantRequest = z.infer<typeof assistantRequestSchema>;
export type RoutineObjective = z.infer<typeof routineObjectiveSchema>;
export type RoutineSkinType = z.infer<typeof routineSkinTypeSchema>;
export type RoutineDepth = z.infer<typeof routineDepthSchema>;
export type AssistantBudget = z.infer<typeof budgetSchema>;
export type GiftInterest = z.infer<typeof giftInterestSchema>;
export type GiftTone = z.infer<typeof giftSafetySchema>;

export type AssistantRecommendationCard = {
  productId: string;
  slug: string;
  title: string;
  category: string | null;
  priceCents: number;
  imageUrl: string | null;
  sellerId: string;
  sellerName: string;
  saleOrigin: "própria" | "marketplace";
  reason: string;
  roleLabel?: string | null;
};

export type AssistantRecommendationSection = {
  id: string;
  label: string;
  reason: string;
  product: AssistantRecommendationCard | null;
  optional?: boolean;
};

export type AssistantKit = {
  name: string;
  benefit: string;
  items: AssistantRecommendationCard[];
  totalPriceCents: number;
  ctaLabel: string;
};

export type AssistantRepurchaseAction = {
  orderId: string;
  productId: string | null;
  label: string;
};

export type AssistantRecommendationResponse = {
  flow: AssistantFlow;
  headline: string;
  summary: string;
  priority: string | null;
  sections: AssistantRecommendationSection[];
  recommendations: AssistantRecommendationCard[];
  primaryProduct: AssistantRecommendationCard | null;
  complementaryProduct: AssistantRecommendationCard | null;
  kit: AssistantKit | null;
  followUpLabel: string | null;
  followUpHref: string | null;
  emptyMessage: string | null;
  packagingNote: string | null;
  repurchaseAction: AssistantRepurchaseAction | null;
  freeShippingMessage: string | null;
};
