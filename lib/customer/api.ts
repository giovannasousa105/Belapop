import { z } from "zod";

import {
  parseCustomerOrderDto,
  parseCustomerOrdersListDto,
  parseCustomerOrderSubOrdersListDto,
  parseCustomerTicketDto,
  parseCustomerTicketListDto,
  parseCustomerTicketMessagesListDto,
  parseCustomerTrackingByOrderDto,
  type CustomerOrderDto,
  type CustomerOrderSubOrdersListDto,
  type CustomerOrdersListDto,
  type CustomerTicketDto,
  type CustomerTicketListDto,
  type CustomerTicketMessagesListDto
} from "@/lib/customer/dto";
import type { OrderRow, SubOrderRow } from "@/lib/customer/portal";

const jsonHeaders = {
  "Content-Type": "application/json"
};

const toCents = (value: number) => Math.round(value * 100);

const dateOnlyToDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

const diffDaysFromDateOnly = (baseIso: string, targetDateOnly: string | null) => {
  if (!targetDateOnly) return null;
  const base = new Date(baseIso);
  if (Number.isNaN(base.getTime())) return null;
  const target = dateOnlyToDate(targetDateOnly);
  if (Number.isNaN(target.getTime())) return null;
  const diff = Math.ceil((target.getTime() - base.getTime()) / 86_400_000);
  return Number.isFinite(diff) ? Math.max(0, diff) : null;
};

const normalizeReasonLabel = (reason: string) => {
  const map: Record<string, string> = {
    NOT_RECEIVED: "Nao chegou",
    DAMAGED_ITEM: "Avaria",
    WRONG_ITEM: "Produto errado",
    QUALITY_ISSUE: "Qualidade",
    SERVICE_ISSUE: "Atendimento",
    OTHER: "Outros"
  };
  return map[reason] ?? "Suporte";
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

async function requestJson<T>(
  path: string,
  parser: (payload: unknown) => T,
  options: RequestOptions = {}
): Promise<T> {
  const response = await fetch(path, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: options.body === undefined ? undefined : jsonHeaders,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const raw = await response.text();
  const payload = raw ? (JSON.parse(raw) as unknown) : null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error?: unknown }).error ?? "Falha na API.")
        : `Falha na API (${response.status}).`;
    throw new Error(message);
  }

  return parser(payload);
}

const MeSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email().nullable(),
    full_name: z.string().nullable(),
    role: z.string(),
    created_at: z.string().nullable(),
    email_verified: z.boolean(),
    phone_verified: z.boolean(),
    cpf: z.string().nullable(),
    phone: z.string().nullable(),
    birth_date: z.string().nullable(),
    cpf_required: z.boolean(),
    preferences: z.object({
      order_updates: z.object({
        email: z.boolean(),
        whatsapp: z.boolean()
      }),
      support_updates: z.object({
        email: z.boolean(),
        whatsapp: z.boolean()
      }),
      marketing: z.object({
        email: z.boolean(),
        whatsapp: z.boolean()
      }),
      push: z.boolean()
    })
  })
  .strict();

const NotificationPreferencesSchema = z
  .object({
    order_updates: z.object({
      email: z.boolean(),
      whatsapp: z.boolean()
    }),
    support_updates: z.object({
      email: z.boolean(),
      whatsapp: z.boolean()
    }),
    marketing: z.object({
      email: z.boolean(),
      whatsapp: z.boolean()
    }),
    push: z.boolean()
  })
  .strict();

const AddressSchema = z
  .object({
    id: z.string().uuid(),
    label: z.string().nullable(),
    full_name: z.string().nullable(),
    street: z.string().nullable(),
    number: z.string().nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    zip: z.string().nullable(),
    complement: z.string().nullable(),
    is_default: z.boolean().nullable(),
    created_at: z.string().optional()
  })
  .strict();

const AddressListSchema = z
  .object({
    items: z.array(AddressSchema)
  })
  .strict();

const NotificationsSchema = z
  .object({
    items: z.array(
      z
        .object({
          id: z.string().uuid(),
          type: z.string().nullable().optional(),
          title: z.string(),
          body: z.string(),
          cta_label: z.string().nullable().optional(),
          cta_href: z.string().nullable().optional(),
          metadata: z.unknown().optional(),
          is_read: z.boolean().optional(),
          created_at: z.string()
        })
        .strict()
    )
  })
  .strict();

const FavoritesSchema = z
  .object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    items: z.array(
      z
        .object({
          id: z.string().uuid()
        })
        .strict()
    )
  })
  .strict();

const RecommendationsSchema = z
  .object({
    items: z.array(
      z
        .object({
          id: z.string().uuid(),
          name: z.string(),
          title: z.string(),
          slug: z.string(),
          price_cents: z.number().int().nullable(),
          brand: z.string().nullable(),
          category: z.string().nullable(),
          hero_image_url: z.string().nullable(),
          badges: z.array(z.string()).nullable(),
          tags: z.array(z.string()).nullable()
        })
        .strict()
    )
  })
  .strict();

const SkinTypeOptionSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    name: z.string(),
    description: z.string().nullable().optional()
  })
  .strict();

const SkinToneOptionSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    name: z.string(),
    description: z.string().nullable()
  })
  .strict();

const SkinConcernOptionSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    name: z.string(),
    description: z.string().nullable()
  })
  .strict();

const RoutineStepOptionSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    name: z.string(),
    step_order: z.number().int()
  })
  .strict();

const SkinProfileSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    skin_type_id: z.string().uuid().nullable(),
    skin_tone_id: z.string().uuid().nullable(),
    main_concern_id: z.string().uuid().nullable(),
    sensitivity_level: z.number().int().min(1).max(5),
    price_affinity_cents: z.number().int().nullable(),
    metadata: z.record(z.string(), z.unknown()),
    created_at: z.string(),
    updated_at: z.string(),
    skin_type: SkinTypeOptionSchema.nullable(),
    skin_tone: SkinToneOptionSchema.nullable(),
    main_concern: SkinConcernOptionSchema.nullable()
  })
  .strict();

const SkinProfileResponseSchema = z
  .object({
    profile: SkinProfileSchema.nullable(),
    options: z.object({
      skin_types: z.array(SkinTypeOptionSchema),
      skin_tones: z.array(SkinToneOptionSchema),
      skin_concerns: z.array(SkinConcernOptionSchema),
      routine_steps: z.array(RoutineStepOptionSchema)
    })
  })
  .strict();

const SkinProfilePatchResponseSchema = z
  .object({
    ok: z.boolean(),
    profile: SkinProfileSchema
  })
  .strict();

const RoutineRecommendationSchema = z
  .object({
    product_id: z.string().uuid(),
    product_name: z.string(),
    seller_id: z.string().uuid(),
    price_cents: z.number().int(),
    hero_image_url: z.string().nullable(),
    score: z.number(),
    ingredient_match_score: z.number(),
    rating_score: z.number(),
    skin_type_match_score: z.number(),
    price_affinity_score: z.number()
  })
  .strict();

const RoutineGroupSchema = z
  .object({
    routine_step_id: z.string().uuid(),
    routine_step_slug: z.string(),
    routine_step_name: z.string(),
    step_order: z.number().int(),
    recommendations: z.array(RoutineRecommendationSchema)
  })
  .strict();

const RoutineSummarySchema = z
  .object({
    steps_count: z.number().int().nonnegative(),
    recommended_products_count: z.number().int().nonnegative(),
    total_price_cents: z.number().int().nonnegative()
  })
  .strict();

const SkincareRoutineResponseSchema = z
  .object({
    profile_required: z.boolean(),
    profile: SkinProfileSchema.nullable(),
    steps: z.array(RoutineGroupSchema),
    summary: RoutineSummarySchema,
    options: z.object({
      skin_types: z.array(SkinTypeOptionSchema),
      skin_tones: z.array(SkinToneOptionSchema),
      skin_concerns: z.array(SkinConcernOptionSchema),
      routine_steps: z.array(RoutineStepOptionSchema)
    })
  })
  .strict();

const RoutineCartItemSchema = z
  .object({
    cart_id: z.string().uuid(),
    product_id: z.string().uuid(),
    routine_step_id: z.string().uuid().nullable(),
    position: z.number().int().positive(),
    routine_step: RoutineStepOptionSchema.nullable(),
    product: z
      .object({
        id: z.string().uuid(),
        name: z.string(),
        seller_id: z.string().uuid(),
        price_cents: z.number().int(),
        hero_image_url: z.string().nullable()
      })
      .nullable()
  })
  .strict();

const RoutineCartSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    created_at: z.string(),
    items: z.array(RoutineCartItemSchema),
    total_price_cents: z.number().int().nonnegative()
  })
  .strict();

const SkincareRoutineCartResponseSchema = z
  .object({
    ok: z.boolean(),
    profile: SkinProfileSchema,
    cart: RoutineCartSchema
  })
  .strict();

const SkinMetricSetSchema = z
  .object({
    hydration_level: z.number(),
    elasticity_level: z.number(),
    pigmentation_level: z.number(),
    acne_level: z.number(),
    redness_level: z.number(),
    pore_visibility: z.number(),
    wrinkle_depth: z.number()
  })
  .strict();

const SkinTwinSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    latest_scan_id: z.string().uuid().nullable(),
    hydration_level: z.number(),
    elasticity_level: z.number(),
    pigmentation_level: z.number(),
    acne_level: z.number(),
    redness_level: z.number(),
    pore_visibility: z.number(),
    wrinkle_depth: z.number(),
    confidence_score: z.number(),
    created_at: z.string(),
    updated_at: z.string()
  })
  .strict();

const SkinScanSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    skin_twin_id: z.string().uuid().nullable(),
    hydration_score: z.number(),
    elasticity_score: z.number(),
    pigmentation_score: z.number(),
    acne_score: z.number(),
    redness_score: z.number(),
    pore_visibility: z.number(),
    wrinkle_depth: z.number(),
    scan_source: z.string(),
    image_url: z.string().nullable(),
    metadata: z.record(z.string(), z.unknown()),
    created_at: z.string()
  })
  .strict();

const SkinTwinSnapshotSchema = z
  .object({
    id: z.string().uuid(),
    skin_twin_id: z.string().uuid(),
    skin_scan_id: z.string().uuid().nullable(),
    hydration_level: z.number(),
    elasticity_level: z.number(),
    pigmentation_level: z.number(),
    acne_level: z.number(),
    redness_level: z.number(),
    pore_visibility: z.number(),
    wrinkle_depth: z.number(),
    confidence_score: z.number(),
    created_at: z.string()
  })
  .strict();

const TreatmentOutcomeSummarySchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    before_scan_id: z.string().uuid(),
    after_scan_id: z.string().uuid(),
    improvement_score: z.number(),
    metrics_delta: z.record(z.string(), z.unknown()),
    created_at: z.string()
  })
  .strict();

const SkinImageSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    skin_scan_id: z.string().uuid().nullable(),
    face_scan_id: z.string().uuid().nullable(),
    image_url: z.string(),
    heatmap_url: z.string().nullable(),
    image_kind: z.enum(["scan", "heatmap", "overlay", "neutral", "blink", "smile", "frown", "turn"]),
    source: z.enum(["manual", "faceshield", "imported", "generated"]),
    metadata: z.record(z.string(), z.unknown()),
    created_at: z.string(),
    updated_at: z.string()
  })
  .strict();

const SimilarSkinProfileSchema = z
  .object({
    similar_user_id: z.string().uuid(),
    face_scan_id: z.string().uuid().nullable(),
    skin_scan_id: z.string().uuid().nullable(),
    similarity: z.number(),
    overall_score: z.number().nullable(),
    latest_improvement_score: z.number().nullable(),
    skin_type: z.string().nullable(),
    main_concern: z.string().nullable(),
    hydration_level: z.number().nullable(),
    pigmentation_level: z.number().nullable(),
    acne_level: z.number().nullable(),
    redness_level: z.number().nullable()
  })
  .strict();

const SkinTwinResponseSchema = z
  .object({
    profile: SkinProfileSchema.nullable(),
    twin: SkinTwinSchema.nullable(),
    recent_scans: z.array(SkinScanSchema),
    snapshots: z.array(SkinTwinSnapshotSchema),
    latest_outcome: TreatmentOutcomeSummarySchema.nullable(),
    recent_simulations: z.array(
      z
        .object({
          id: z.string().uuid(),
          skin_twin_id: z.string().uuid(),
          routine_cart_id: z.string().uuid().nullable(),
          simulation_period_days: z.number().int().positive(),
          predicted_improvement: z.number(),
          confidence_score: z.number(),
          current_metrics: SkinMetricSetSchema,
          predicted_metrics: SkinMetricSetSchema,
          metadata: z.record(z.string(), z.unknown()),
          created_at: z.string()
        })
        .strict()
    ),
    recent_images: z.array(SkinImageSchema),
    similar_profiles: z.array(SimilarSkinProfileSchema),
    active_usage: z
      .object({
        started_at: z.string(),
        total_products: z.number().int().nonnegative(),
        routine_cart_id: z.string().uuid().nullable()
      })
      .nullable(),
    current_metrics: SkinMetricSetSchema,
    baseline_source: z.enum(["twin", "scan", "profile", "default"]),
    options: z.object({
      skin_types: z.array(SkinTypeOptionSchema),
      skin_tones: z.array(SkinToneOptionSchema),
      skin_concerns: z.array(SkinConcernOptionSchema),
      routine_steps: z.array(RoutineStepOptionSchema)
    })
  })
  .strict();

const SkinScanCreateResponseSchema = z
  .object({
    ok: z.boolean(),
    profile: SkinProfileSchema.nullable(),
    twin: SkinTwinSchema.nullable(),
    recent_scans: z.array(SkinScanSchema),
    snapshots: z.array(SkinTwinSnapshotSchema),
    latest_outcome: TreatmentOutcomeSummarySchema.nullable(),
    recent_simulations: z.array(
      z
        .object({
          id: z.string().uuid(),
          skin_twin_id: z.string().uuid(),
          routine_cart_id: z.string().uuid().nullable(),
          simulation_period_days: z.number().int().positive(),
          predicted_improvement: z.number(),
          confidence_score: z.number(),
          current_metrics: SkinMetricSetSchema,
          predicted_metrics: SkinMetricSetSchema,
          metadata: z.record(z.string(), z.unknown()),
          created_at: z.string()
        })
        .strict()
    ),
    recent_images: z.array(SkinImageSchema),
    similar_profiles: z.array(SimilarSkinProfileSchema),
    current_metrics: SkinMetricSetSchema.nullable()
  })
  .strict();

const FaceShieldLivenessSchema = z
  .object({
    id: z.string().uuid().optional(),
    scan_id: z.string().uuid(),
    blink_detected: z.boolean(),
    head_movement: z.boolean(),
    smile_detected: z.boolean().optional(),
    frown_detected: z.boolean().optional(),
    depth_score: z.number(),
    texture_score: z.number(),
    confidence: z.number(),
    created_at: z.string().optional(),
    updated_at: z.string().optional()
  })
  .strict();

const FaceShieldFindingSchema = z
  .object({
    id: z.string().uuid(),
    scan_id: z.string().uuid(),
    finding_type: z.enum([
      "nevus_melanocytic",
      "cherry_angioma",
      "keratosis",
      "melanoma_triage",
      "scc_triage"
    ]),
    region_slug: z.string(),
    confidence_score: z.number(),
    severity_score: z.number(),
    position_x: z.number(),
    position_y: z.number(),
    radius: z.number(),
    appearance_status: z.enum(["stable", "new", "changed"]),
    requires_clinical_review: z.boolean(),
    metadata: z.record(z.string(), z.unknown()),
    created_at: z.string(),
    updated_at: z.string()
  })
  .strict();

const FaceShieldScoreSchema = z
  .object({
    scan_id: z.string().uuid(),
    overall_score: z.number(),
    skin_type: z.string().nullable(),
    main_concern: z.string().nullable(),
    created_at: z.string().optional(),
    updated_at: z.string().optional()
  })
  .strict();

const FaceShieldHeatmapRegionSchema = z
  .object({
    id: z.string().uuid(),
    scan_id: z.string().uuid(),
    condition_type: z.enum(["acne", "hydration", "pigmentation", "pores", "wrinkles", "redness"]),
    region_slug: z.string(),
    intensity: z.number(),
    position_x: z.number(),
    position_y: z.number(),
    radius: z.number(),
    created_at: z.string().optional()
  })
  .strict();

const FaceShieldProgressSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    scan_id: z.string().uuid(),
    previous_scan_id: z.string().uuid().nullable(),
    improvement_score: z.number(),
    created_at: z.string()
  })
  .strict();

const FaceShieldScanItemSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    skin_scan_id: z.string().uuid().nullable(),
    image_url: z.string().nullable(),
    heatmap_url: z.string().nullable(),
    liveness_score: z.number(),
    scan_status: z.enum(["pending", "validated", "rejected"]),
    capture_metadata: z.record(z.string(), z.unknown()),
    created_at: z.string(),
    updated_at: z.string(),
    liveness: FaceShieldLivenessSchema.nullable(),
    score: FaceShieldScoreSchema.nullable(),
    progress: FaceShieldProgressSchema.nullable(),
    heatmap_regions: z.array(FaceShieldHeatmapRegionSchema),
    findings: z.array(FaceShieldFindingSchema),
    frame_assets: z.record(z.string(), z.string()).optional()
  })
  .strict();

const FaceShieldScansResponseSchema = z
  .object({
    items: z.array(FaceShieldScanItemSchema)
  })
  .strict();

const FaceShieldScanCreateResponseSchema = z
  .object({
    ok: z.boolean(),
    message: z.string().nullable().optional(),
    face_scan: FaceShieldScanItemSchema
  })
  .strict();

const FaceShieldScanDeleteResponseSchema = z
  .object({
    ok: z.boolean(),
    deleted_scan_id: z.string().uuid(),
    items: z.array(FaceShieldScanItemSchema)
  })
  .strict();

const ProductEffectivenessSchema = z
  .object({
    acne_effectiveness: z.number(),
    hydration_effectiveness: z.number(),
    pigmentation_effectiveness: z.number(),
    redness_effectiveness: z.number(),
    confidence_score: z.number()
  })
  .strict();

const SkincareSimulationScenarioSchema = z
  .object({
    days: z.number().int().positive(),
    predicted_improvement: z.number(),
    confidence_score: z.number(),
    predicted_metrics: SkinMetricSetSchema,
    key_effects: z.array(
      z
        .object({
          ingredient_name: z.string(),
          target_metric: z.string(),
          improvement_rate: z.number()
        })
        .strict()
    )
  })
  .strict();

const SkincareSimulationResponseSchema = z
  .object({
    profile_required: z.boolean(),
    profile: SkinProfileSchema.nullable(),
    twin: SkinTwinSchema.nullable(),
    current_metrics: SkinMetricSetSchema,
    baseline_source: z.enum(["twin", "scan", "profile", "default"]),
    latest_outcome: TreatmentOutcomeSummarySchema.nullable(),
    top_products: z.array(
      z
        .object({
          product_id: z.string().uuid(),
          product_name: z.string(),
          seller_id: z.string().uuid(),
          routine_step_name: z.string(),
          routine_step_slug: z.string(),
          price_cents: z.number().int(),
          hero_image_url: z.string().nullable(),
          score: z.number(),
          effectiveness: ProductEffectivenessSchema.nullable()
        })
        .strict()
    ),
    scenarios: z.array(SkincareSimulationScenarioSchema)
  })
  .strict();

const SavedSimulationSchema = z
  .object({
    id: z.string().uuid(),
    skin_twin_id: z.string().uuid(),
    routine_cart_id: z.string().uuid().nullable(),
    simulation_period_days: z.number().int().positive(),
    predicted_improvement: z.number(),
    confidence_score: z.number(),
    current_metrics: SkinMetricSetSchema,
    predicted_metrics: SkinMetricSetSchema,
    metadata: z.record(z.string(), z.unknown()),
    created_at: z.string()
  })
  .strict();

const SkincareSimulationSaveResponseSchema = z
  .object({
    ok: z.boolean(),
    batch_id: z.string(),
    profile_required: z.boolean(),
    profile: SkinProfileSchema.nullable(),
    twin: SkinTwinSchema.nullable(),
    current_metrics: SkinMetricSetSchema,
    baseline_source: z.enum(["twin", "scan", "profile", "default"]),
    latest_outcome: TreatmentOutcomeSummarySchema.nullable(),
    top_products: z.array(
      z
        .object({
          product_id: z.string().uuid(),
          product_name: z.string(),
          seller_id: z.string().uuid(),
          routine_step_name: z.string(),
          routine_step_slug: z.string(),
          price_cents: z.number().int(),
          hero_image_url: z.string().nullable(),
          score: z.number(),
          effectiveness: ProductEffectivenessSchema.nullable()
        })
        .strict()
    ),
    scenarios: z.array(SkincareSimulationScenarioSchema),
    saved_simulations: z.array(SavedSimulationSchema)
  })
  .strict();

const SkincareUsageStartResponseSchema = z
  .object({
    ok: z.boolean(),
    cart_id: z.string().uuid(),
    start_date: z.string(),
    total_products: z.number().int().nonnegative(),
    items: z.array(
      z
        .object({
          product_id: z.string().uuid(),
          name: z.string(),
          hero_image_url: z.string().nullable()
        })
        .strict()
    )
  })
  .strict();

const SkinGptAnswerSchema = z
  .object({
    answer: z.string(),
    highlights: z.array(z.string()),
    suggested_ingredients: z.array(z.string()),
    suggested_routine_focus: z.array(z.string()),
    citations: z.array(z.string()),
    disclaimers: z.array(z.string()),
    source_mode: z.enum(["fallback", "llm"])
  })
  .strict();

const SkinGptResponseSchema = z
  .object({
    question: z.string(),
    context: z.object({
      skin_type: z.string().nullable(),
      main_concern: z.string().nullable(),
      overall_score: z.number().nullable(),
      metrics: SkinMetricSetSchema
    }),
    knowledge_documents: z.array(
      z
        .object({
          id: z.string().uuid(),
          slug: z.string(),
          title: z.string(),
          topic_slug: z.string(),
          body: z.string(),
          source_label: z.string().nullable(),
          source_url: z.string().nullable()
        })
        .strict()
    ),
    answer: SkinGptAnswerSchema
  })
  .strict();

const StatusHistorySchema = z
  .object({
    history: z.array(
      z
        .object({
          id: z.string(),
          status: z.string(),
          created_at: z.string()
        })
        .strict()
    )
  })
  .strict();

const CustomerReorderResponseSchema = z
  .object({
    ok: z.boolean(),
    order_id: z.string().uuid(),
    items: z.array(
      z
        .object({
          product_id: z.string().uuid(),
          product_name: z.string(),
          seller_id: z.string().uuid(),
          quantity: z.number().int().positive()
        })
        .strict()
    ),
    unavailable_items: z.array(
      z
        .object({
          product_id: z.string().uuid(),
          product_name: z.string(),
          reason: z.enum(["missing", "unpublished", "out_of_stock"])
        })
        .strict()
    ),
    summary: z
      .object({
        products_count: z.number().int().nonnegative(),
        items_count: z.number().int().nonnegative()
      })
      .strict()
  })
  .strict();

const TicketMessageSchema = z
  .object({
    message_id: z.string(),
    sender_type: z.enum(["CUSTOMER", "STORE", "SUPPORT"]),
    text: z.string(),
    attachment_ids: z.array(z.string()),
    sent_at: z.string().datetime({ offset: true })
  })
  .strict();

export type CustomerMeResponse = z.infer<typeof MeSchema>;
export type CustomerNotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;
export type CustomerAddress = z.infer<typeof AddressSchema>;
export type CustomerNotification = z.infer<typeof NotificationsSchema>["items"][number];
export type CustomerRecommendation = z.infer<typeof RecommendationsSchema>["items"][number];
export type CustomerStatusHistory = z.infer<typeof StatusHistorySchema>["history"][number];
export type CustomerReorderResponse = z.infer<typeof CustomerReorderResponseSchema>;
export type CustomerTicketMessage = z.infer<typeof TicketMessageSchema>;
export type CustomerSkinTypeOption = z.infer<typeof SkinTypeOptionSchema>;
export type CustomerSkinToneOption = z.infer<typeof SkinToneOptionSchema>;
export type CustomerSkinConcernOption = z.infer<typeof SkinConcernOptionSchema>;
export type CustomerRoutineStepOption = z.infer<typeof RoutineStepOptionSchema>;
export type CustomerSkinProfile = z.infer<typeof SkinProfileSchema>;
export type CustomerSkinProfileResponse = z.infer<typeof SkinProfileResponseSchema>;
export type CustomerRoutineGroup = z.infer<typeof RoutineGroupSchema>;
export type CustomerRoutineSummary = z.infer<typeof RoutineSummarySchema>;
export type CustomerSkincareRoutineResponse = z.infer<typeof SkincareRoutineResponseSchema>;
export type CustomerRoutineCart = z.infer<typeof RoutineCartSchema>;
export type CustomerSkincareRoutineCartResponse = z.infer<typeof SkincareRoutineCartResponseSchema>;
export type CustomerSkinMetricSet = z.infer<typeof SkinMetricSetSchema>;
export type CustomerSkinTwin = z.infer<typeof SkinTwinSchema>;
export type CustomerSkinScan = z.infer<typeof SkinScanSchema>;
export type CustomerSkinTwinSnapshot = z.infer<typeof SkinTwinSnapshotSchema>;
export type CustomerTreatmentOutcomeSummary = z.infer<typeof TreatmentOutcomeSummarySchema>;
export type CustomerSkinImage = z.infer<typeof SkinImageSchema>;
export type CustomerSimilarSkinProfile = z.infer<typeof SimilarSkinProfileSchema>;
export type CustomerSkinTwinResponse = z.infer<typeof SkinTwinResponseSchema>;
export type CustomerSkinScanCreateResponse = z.infer<typeof SkinScanCreateResponseSchema>;
export type CustomerFaceShieldLiveness = z.infer<typeof FaceShieldLivenessSchema>;
export type CustomerFaceShieldScore = z.infer<typeof FaceShieldScoreSchema>;
export type CustomerFaceShieldHeatmapRegion = z.infer<typeof FaceShieldHeatmapRegionSchema>;
export type CustomerFaceShieldProgress = z.infer<typeof FaceShieldProgressSchema>;
export type CustomerFaceShieldFinding = z.infer<typeof FaceShieldFindingSchema>;
export type CustomerFaceShieldScanItem = z.infer<typeof FaceShieldScanItemSchema>;
export type CustomerFaceShieldScansResponse = z.infer<typeof FaceShieldScansResponseSchema>;
export type CustomerFaceShieldScanCreateResponse = z.infer<typeof FaceShieldScanCreateResponseSchema>;
export type CustomerFaceShieldScanDeleteResponse = z.infer<typeof FaceShieldScanDeleteResponseSchema>;
export type CustomerSkincareSimulationScenario = z.infer<typeof SkincareSimulationScenarioSchema>;
export type CustomerSkincareSimulationResponse = z.infer<typeof SkincareSimulationResponseSchema>;
export type CustomerSkincareSimulationSaveResponse = z.infer<typeof SkincareSimulationSaveResponseSchema>;
export type CustomerSkincareUsageStartResponse = z.infer<typeof SkincareUsageStartResponseSchema>;
export type CustomerSkinGptAnswer = z.infer<typeof SkinGptAnswerSchema>;
export type CustomerSkinGptResponse = z.infer<typeof SkinGptResponseSchema>;

export const mapOrderDtoToLegacyRow = (order: CustomerOrderDto): OrderRow & {
  payment_status: string | null;
  address: {
    street?: string;
    number?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
} => ({
  id: order.order_id,
  status: order.status,
  total_order_cents: toCents(order.totals.grand_total),
  created_at: order.created_at,
  payment_provider: order.payment.provider,
  payment_status: order.payment.status,
  address: {
    street: order.delivery_address.street,
    number: order.delivery_address.number,
    city: order.delivery_address.city,
    state: order.delivery_address.state,
    zip: order.delivery_address.postal_code
  }
});

const mapSummarySubOrderToLegacy = (order: CustomerOrderDto): SubOrderRow[] =>
  order.sub_orders.map((subOrder) => ({
    id: subOrder.sub_order_id,
    order_id: order.order_id,
    seller_id: subOrder.seller_id,
    status: subOrder.status,
    shipping_service: null,
    shipping_days: subOrder.shipping_eta_days,
    shipping_total_cents: toCents(subOrder.shipping_cost),
    product_total_cents: 0,
    created_at: order.created_at,
    items: [],
    shipping: {
      estimated_delivery_date: null
    }
  }));

export const mapDetailedSubOrderToLegacy = (
  subOrder: CustomerOrderSubOrdersListDto["items"][number]
): SubOrderRow => {
  const shippingDays = diffDaysFromDateOnly(subOrder.shipping.posted_at, subOrder.shipping.estimated_delivery_date);
  return {
    id: subOrder.sub_order_id,
    order_id: subOrder.order_id,
    seller_id: subOrder.seller.seller_id,
    status: subOrder.status,
    shipping_service: subOrder.shipping.service_level,
    shipping_days: shippingDays,
    shipping_total_cents: toCents(subOrder.shipping.shipping_cost),
    product_total_cents: toCents(subOrder.pricing.items_subtotal),
    created_at: subOrder.shipping.posted_at,
    items: subOrder.items.map((item) => ({
      itemId: item.item_id,
      productId: item.product_id,
      quantity: item.quantity
    })),
    shipping: {
      estimated_delivery_date: subOrder.shipping.estimated_delivery_date
    }
  };
};

export const mapTicketSummaryToLegacy = (ticket: CustomerTicketListDto["items"][number]) => ({
  id: ticket.ticket_id,
  status: ticket.status,
  subject: `${normalizeReasonLabel(ticket.reason)} - ${ticket.protocol}`,
  created_at: ticket.created_at
});

export const mapOrdersListToLegacy = (payload: CustomerOrdersListDto) => {
  const orders = payload.items.map(mapOrderDtoToLegacyRow);
  const subOrders = payload.items.flatMap(mapSummarySubOrderToLegacy);
  const sellerMap = payload.items.reduce<Record<string, string>>((acc, order) => {
    for (const subOrder of order.sub_orders) {
      acc[subOrder.seller_id] = subOrder.seller_name;
    }
    return acc;
  }, {});
  return { orders, subOrders, sellerMap };
};

export async function getCustomerMe() {
  return requestJson("/api/v1/me", (payload) => MeSchema.parse(payload));
}

export async function patchCustomerMe(body: {
  full_name: string;
  cpf: string;
  phone: string;
  birth_date: string | null;
  marketing_opt_in: boolean;
}) {
  return requestJson(
    "/api/v1/me",
    (payload) => z.object({ ok: z.boolean() }).parse(payload),
    { method: "PATCH", body }
  );
}

export async function getCustomerNotificationPreferences() {
  return requestJson(
    "/api/v1/me/notification-preferences",
    (payload) => NotificationPreferencesSchema.parse(payload)
  );
}

export async function putCustomerNotificationPreferences(
  body: z.infer<typeof NotificationPreferencesSchema>
) {
  return requestJson(
    "/api/v1/me/notification-preferences",
    (payload) =>
      z
        .object({
          ok: z.boolean(),
          preferences: NotificationPreferencesSchema
        })
        .parse(payload),
    { method: "PUT", body }
  );
}

export async function getCustomerAddresses() {
  return requestJson("/api/v1/me/addresses", (payload) => AddressListSchema.parse(payload));
}

export async function postCustomerAddress(body: {
  label: string;
  full_name: string;
  street: string;
  number: string;
  city: string;
  state: string;
  zip: string;
  complement: string;
}) {
  return requestJson("/api/v1/me/addresses", (payload) => AddressSchema.parse(payload), {
    method: "POST",
    body
  });
}

export async function getCustomerOrders(params?: {
  status?: string;
  seller_id?: string;
  store_id?: string;
  date_from?: string;
  date_to?: string;
  q?: string;
  page?: number;
  page_size?: number;
}) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.seller_id) search.set("seller_id", params.seller_id);
  else if (params?.store_id) search.set("store_id", params.store_id);
  if (params?.date_from) search.set("date_from", params.date_from);
  if (params?.date_to) search.set("date_to", params.date_to);
  if (params?.q) search.set("q", params.q);
  if (params?.page) search.set("page", String(params.page));
  if (params?.page_size) search.set("page_size", String(params.page_size));
  const suffix = search.toString();
  return requestJson(
    `/api/v1/orders${suffix ? `?${suffix}` : ""}`,
    (payload) => parseCustomerOrdersListDto(payload)
  );
}

export async function getCustomerOrder(orderId: string) {
  return requestJson(`/api/v1/orders/${orderId}`, (payload) => parseCustomerOrderDto(payload));
}

export async function getCustomerOrderSubOrders(orderId: string) {
  return requestJson(
    `/api/v1/orders/${orderId}/sub-orders`,
    (payload) => parseCustomerOrderSubOrdersListDto(payload)
  );
}

export async function getCustomerTrackingByOrder(orderId: string) {
  return requestJson(
    `/api/v1/tracking/by-order/${orderId}`,
    (payload) => parseCustomerTrackingByOrderDto(payload)
  );
}

export async function postCustomerReorder(
  orderId: string,
  body?: {
    sub_order_id?: string;
    product_id?: string;
  }
) {
  return requestJson(
    `/api/v1/orders/${orderId}/reorder`,
    (payload) => CustomerReorderResponseSchema.parse(payload),
    { method: "POST", body: body ?? {} }
  );
}

export async function getCustomerSupportTickets(params?: {
  status?: string;
  order_id?: string;
  seller_id?: string;
  store_id?: string;
  q?: string;
  page?: number;
  page_size?: number;
}) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.order_id) search.set("order_id", params.order_id);
  if (params?.seller_id) search.set("seller_id", params.seller_id);
  else if (params?.store_id) search.set("store_id", params.store_id);
  if (params?.q) search.set("q", params.q);
  if (params?.page) search.set("page", String(params.page));
  if (params?.page_size) search.set("page_size", String(params.page_size));
  const suffix = search.toString();
  return requestJson(
    `/api/v1/support/tickets${suffix ? `?${suffix}` : ""}`,
    (payload) => parseCustomerTicketListDto(payload)
  );
}

export async function postCustomerSupportTicket(body: {
  order_id: string;
  sub_order_id?: string;
  seller_id?: string;
  store_id?: string;
  item_ids?: string[];
  reason: string;
  description: string;
  desired_resolution: string;
}) {
  return requestJson("/api/v1/support/tickets", (payload) => parseCustomerTicketDto(payload), {
    method: "POST",
    body
  });
}

export async function getCustomerSupportTicket(ticketId: string) {
  return requestJson(
    `/api/v1/support/tickets/${ticketId}`,
    (payload) => parseCustomerTicketDto(payload)
  );
}

export async function getCustomerSupportTicketMessages(ticketId: string, limit = 100) {
  return requestJson(
    `/api/v1/support/tickets/${ticketId}/messages?limit=${limit}`,
    (payload) => parseCustomerTicketMessagesListDto(payload)
  );
}

export async function postCustomerSupportTicketMessage(
  ticketId: string,
  body: { text: string; attachment_ids?: string[] }
) {
  return requestJson(
    `/api/v1/support/tickets/${ticketId}/messages`,
    (payload) => TicketMessageSchema.parse(payload),
    { method: "POST", body }
  );
}

export async function getCustomerNotifications(limit = 30) {
  return requestJson(
    `/api/v1/notifications?limit=${Math.max(1, Math.min(100, limit))}`,
    (payload) => NotificationsSchema.parse(payload)
  );
}

export async function getCustomerFavoritesSummary(page = 1, pageSize = 1) {
  return requestJson(
    `/api/v1/favorites?page=${page}&page_size=${pageSize}`,
    (payload) => FavoritesSchema.parse(payload)
  );
}

export async function getCustomerRecommendations(limit = 4) {
  return requestJson(
    `/api/v1/products/recommendations?limit=${Math.max(1, Math.min(20, limit))}`,
    (payload) => RecommendationsSchema.parse(payload)
  );
}

export async function getCustomerOrderStatusHistory(orderId: string) {
  return requestJson(
    `/api/v1/orders/${orderId}/status-history`,
    (payload) => StatusHistorySchema.parse(payload)
  );
}

export async function getCustomerSkinProfile() {
  return requestJson("/api/v1/me/skin-profile", (payload) => SkinProfileResponseSchema.parse(payload));
}

export async function patchCustomerSkinProfile(body: {
  skin_type_id?: string | null;
  skin_tone_id?: string | null;
  main_concern_id?: string | null;
  sensitivity_level?: number;
  price_affinity_cents?: number | null;
  metadata?: Record<string, unknown>;
}) {
  return requestJson(
    "/api/v1/me/skin-profile",
    (payload) => SkinProfilePatchResponseSchema.parse(payload),
    { method: "PATCH", body }
  );
}

export async function getCustomerSkincareRoutine(limit = 1) {
  return requestJson(
    `/api/v1/skincare/routine?limit=${Math.max(1, Math.min(3, limit))}`,
    (payload) => SkincareRoutineResponseSchema.parse(payload)
  );
}

export async function postCustomerSkincareRoutineCart() {
  return requestJson(
    "/api/v1/skincare/routine",
    (payload) => SkincareRoutineCartResponseSchema.parse(payload),
    { method: "POST" }
  );
}

export async function getCustomerSkinTwin() {
  return requestJson("/api/v1/me/skin-twin", (payload) => SkinTwinResponseSchema.parse(payload));
}

export async function postCustomerSkinScan(body: {
  hydration_score: number;
  acne_score: number;
  pigmentation_score: number;
  redness_score: number;
  elasticity_score?: number;
  pore_visibility?: number;
  wrinkle_depth?: number;
  scan_source?: "manual" | "ai_scan" | "imported";
  image_url?: string | null;
  metadata?: Record<string, unknown>;
}) {
  return requestJson(
    "/api/v1/me/skin-twin",
    (payload) => SkinScanCreateResponseSchema.parse(payload),
    { method: "POST", body }
  );
}

export async function getCustomerFaceShieldScans() {
  return requestJson("/api/v1/faceshield/scans", (payload) => FaceShieldScansResponseSchema.parse(payload));
}

export async function postCustomerFaceShieldScan(body: {
  hydration_score: number;
  acne_score: number;
  pigmentation_score: number;
  redness_score: number;
  elasticity_score?: number;
  pore_visibility?: number;
  wrinkle_depth?: number;
  scan_source?: "manual" | "ai_scan" | "imported";
  image_url?: string | null;
  metadata?: Record<string, unknown>;
  capture_metadata?: {
    brightness_score?: number;
    centered_face_score?: number;
    minimal_makeup_score?: number;
    [key: string]: unknown;
  };
  liveness?: {
    texture_score?: number;
    depth_score?: number;
    blink_detected?: boolean;
    head_movement?: boolean;
    smile_detected?: boolean;
    frown_detected?: boolean;
  };
}) {
  return requestJson(
    "/api/v1/faceshield/scans",
    (payload) => FaceShieldScanCreateResponseSchema.parse(payload),
    { method: "POST", body }
  );
}

export async function postCustomerFaceShieldAnalyze(formData: FormData) {
  const response = await fetch("/api/v1/faceshield/analyze", {
    method: "POST",
    credentials: "include",
    body: formData
  });

  const raw = await response.text();
  const payload = raw ? (JSON.parse(raw) as unknown) : null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error?: unknown }).error ?? "Falha na API.")
        : `Falha na API (${response.status}).`;
    throw new Error(message);
  }

  return FaceShieldScanCreateResponseSchema.parse(payload);
}

export async function deleteCustomerFaceShieldScan(scanId: string) {
  return requestJson(
    `/api/v1/faceshield/scans/${scanId}`,
    (payload) => FaceShieldScanDeleteResponseSchema.parse(payload),
    { method: "DELETE" }
  );
}

export async function getCustomerSkincareSimulations(days?: number[]) {
  const filtered = (days ?? [30, 60, 90]).filter((item) => Number.isFinite(item) && item > 0);
  const params = filtered.length ? `?days=${filtered.join(",")}` : "";
  return requestJson(
    `/api/v1/skincare/simulations${params}`,
    (payload) => SkincareSimulationResponseSchema.parse(payload)
  );
}

export async function postCustomerSkincareSimulations(body?: {
  days?: number[];
  routine_cart_id?: string | null;
}) {
  return requestJson(
    "/api/v1/skincare/simulations",
    (payload) => SkincareSimulationSaveResponseSchema.parse(payload),
    { method: "POST", body: body ?? {} }
  );
}

export async function postCustomerSkincareUsage(body?: {
  cart_id?: string;
  start_date?: string;
}) {
  return requestJson(
    "/api/v1/skincare/usage",
    (payload) => SkincareUsageStartResponseSchema.parse(payload),
    { method: "POST", body: body ?? {} }
  );
}

export async function postCustomerSkinGptQuestion(body: { question: string }) {
  return requestJson(
    "/api/v1/skingpt/ask",
    (payload) => SkinGptResponseSchema.parse(payload),
    { method: "POST", body }
  );
}

export type CustomerBelaCodeLiveness = CustomerFaceShieldLiveness;
export type CustomerBelaCodeScore = CustomerFaceShieldScore;
export type CustomerBelaCodeHeatmapRegion = CustomerFaceShieldHeatmapRegion;
export type CustomerBelaCodeProgress = CustomerFaceShieldProgress;
export type CustomerBelaCodeFinding = CustomerFaceShieldFinding;
export type CustomerBelaCodeScanItem = CustomerFaceShieldScanItem;
export type CustomerBelaCodeScansResponse = CustomerFaceShieldScansResponse;
export type CustomerBelaCodeScanCreateResponse = CustomerFaceShieldScanCreateResponse;
export type CustomerBelaCodeScanDeleteResponse = CustomerFaceShieldScanDeleteResponse;

export const getCustomerBelaCodeScans = getCustomerFaceShieldScans;
export const postCustomerBelaCodeScan = postCustomerFaceShieldScan;
export const postCustomerBelaCodeAnalyze = postCustomerFaceShieldAnalyze;
export const deleteCustomerBelaCodeScan = deleteCustomerFaceShieldScan;
export const postCustomerSkinBelaQuestion = postCustomerSkinGptQuestion;

