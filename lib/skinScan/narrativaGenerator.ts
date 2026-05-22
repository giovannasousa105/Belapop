import Anthropic from "@anthropic-ai/sdk";

import type { SkinProfile } from "./types";
import type { RotinaResult } from "./rotinaBuilder";
import {
  NARRATIVA_MAX_TOKENS,
  NARRATIVA_MODEL,
  NARRATIVA_SYSTEM_PROMPT,
} from "./prompts/narrativa";

// ─── Fallback ─────────────────────────────────────────────────────────────────
// Usado quando Claude não responde no prazo ou retorna erro.
// Nunca bloquear o resultado do scan por falha de API externa.

const FALLBACK_NARRATIVA =
  "Sua análise de pele foi concluída com base nos dados coletados. " +
  "Identificamos suas principais necessidades e montamos uma rotina personalizada com produtos compatíveis ao seu perfil. " +
  "Os ativos selecionados foram escolhidos pela afinidade com seu tipo de pele e nível de sensibilidade. " +
  "Siga a rotina sugerida com regularidade para observar resultados progressivos. " +
  "Este é um ponto de partida — sua pele evolui com consistência.";

const TIMEOUT_MS = 10_000;

// ─── User prompt ──────────────────────────────────────────────────────────────

function montarUserPrompt(
  skinProfile: SkinProfile,
  rotinasManha: RotinaResult,
  rotinasNoite: RotinaResult,
  fitzpatrick: number
): string {
  const nomesManh = rotinasManha.passos.map((p) => p.produto_nome).join(" → ");
  const nomesNoite = rotinasNoite.passos.map((p) => p.produto_nome).join(" → ");

  return `Perfil detectado:
Tipo de pele: ${skinProfile.tipo_pele}
Fototipo Fitzpatrick: ${fitzpatrick}
Nível de sensibilidade: ${skinProfile.nivel_sensibilidade}/5
Scores (0–100): ${JSON.stringify(skinProfile.scores_normalizados)}
Necessidades priorizadas: ${skinProfile.necessidades_rankeadas.join(", ")}
Ativos recomendados: ${skinProfile.ativos_recomendados.join(", ")}
Rotina manhã: ${nomesManh || "(nenhum produto disponível)"}
Rotina noite: ${nomesNoite || "(nenhum produto disponível)"}`;
}

// ─── Geração com timeout e fallback ──────────────────────────────────────────

export async function gerarNarrativa(
  skinProfile: SkinProfile,
  rotinasManha: RotinaResult,
  rotinasNoite: RotinaResult,
  fitzpatrick: number
): Promise<{ narrativa: string; usou_fallback: boolean }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userPrompt = montarUserPrompt(skinProfile, rotinasManha, rotinasNoite, fitzpatrick);

  const timeoutPromise = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), TIMEOUT_MS)
  );

  const claudePromise = client.messages
    .create({
      model: NARRATIVA_MODEL,
      max_tokens: NARRATIVA_MAX_TOKENS,
      system: NARRATIVA_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    })
    .catch((err: unknown) => {
      console.warn(
        "[narrativa] Claude API error:",
        err instanceof Error ? err.message : String(err)
      );
      return null;
    });

  const resultado = await Promise.race([claudePromise, timeoutPromise]);

  if (!resultado) {
    return { narrativa: FALLBACK_NARRATIVA, usou_fallback: true };
  }

  const bloco = resultado.content[0];
  if (bloco.type !== "text" || !bloco.text.trim()) {
    return { narrativa: FALLBACK_NARRATIVA, usou_fallback: true };
  }

  return { narrativa: bloco.text.trim(), usou_fallback: false };
}
