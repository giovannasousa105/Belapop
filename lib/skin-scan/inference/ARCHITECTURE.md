# Skin Scan — Arquitetura de Privacidade (On-Device Inference)

## Invariante central

> **A imagem facial nunca deixa o dispositivo.** Apenas `UploadableFeatures` — índices derivados não identificáveis — podem ser enviados ao servidor, e somente mediante consentimento explícito e revogável.

---

## Fluxo de dados

```
Câmera / upload
     │
     ▼
ImageData (main thread)
     │ postMessage([imageData.data.buffer])  ← transferência de posse
     ▼                                         buffer neutered na main thread
Web Worker (skin-scan.worker.ts)
     │
     ▼
OnnxSkinModel.infer(imageData)
     │  → Float32Array normalizado (NCHW)
     │  → ONNX session.run(...)
     │  → 7 logits sigmoid → RawSkinScores
     │  → pixels.fill(0)   ← buffer apagado
     ▼
ScanResult { scores, tipoPele, preocupacoes, durationMs, modelVersion }
     │ postMessage({ type: "RESULT", result })   ← sem imageData
     ▼
Main thread → InferenceClient.toUploadable(result)
     │
     ▼
UploadableFeatures (10 campos, nenhum reversível para imagem)
     │  se consent_data_sharing ativo
     ▼
POST /api/scan/contribute
```

---

## Tabelas e separação de propósitos

| Tabela | Vinculado a user? | Propósito LGPD | Deletável (art. 18)? |
|---|---|---|---|
| `scan_consents` | Sim | Registro de consentimentos | Revogável (não deletado, apenas revoked_at) |
| `scan_history` | Sim | Histórico longitudinal (Digital Twin) | **Sim** — DELETE /api/scan/data |
| `scan_contributions` | **Não** (pseudonym_id) | Dataset coletivo para treino | **Não** — hash irreversível sem salt |

`pseudonym_id = SHA-256(CONTRIBUTION_SALT + user_id)` — sem o salt interno do servidor, a reidentificação é computacionalmente inviável. Esta limitação é comunicada ao usuário **antes** do consentimento `consent_data_sharing`.

---

## Consentimentos LGPD (art. 11 — dado pessoal sensível)

| Tipo | Obrigatório | Revogável | O que autoriza |
|---|---|---|---|
| `consent_scan` | Sim (bloqueia o recurso se ausente) | Sim | Uso do Skin Scan + gravação em `scan_history` |
| `consent_data_sharing` | Não | Sim | Gravação em `scan_contributions` (dataset coletivo) |

Cada consentimento tem `policy_version` e `granted_at` — permite invalidar versões antigas ao atualizar os termos.

---

## Defesa em profundidade (campos proibidos)

1. **TypeScript**: `UploadableFeatures` não declara `imageData`, `landmarks`, `scores`, etc. — erro de compilação.
2. **`assertNoForbiddenFields`**: verifica em runtime (recursivamente) antes do upload.
3. **`UploadableSchema.strict()`**: Zod rejeita campos extras no servidor.
4. **Sentry `scrubBiometric`**: filtra campos biométricos de todos os eventos antes de enviar (client, server, edge).

---

## Modelo ONNX

- Arquivo: `/public/models/skin_analysis.onnx` (não versionado no git — deploy separado)
- Entrada: `float32[1,3,224,224]` NCHW, normalização ImageNet
- Saída: `float32[1,7]` logits → sigmoid → `[acne, poros, textura, oleosidade, pigmentacao, vermelhidao, ressecamento]`
- Runtime: ONNX Runtime Web (`onnxruntime-web`) — preferência WebGPU, fallback WASM
- Instalar: `npm install onnxruntime-web`

---

## Rotas de API

| Método | Rota | Função |
|---|---|---|
| GET | `/api/scan/consent` | Estado atual dos dois consentimentos |
| POST | `/api/scan/consent` | Concede ou revoga um consentimento |
| POST | `/api/scan/contribute` | Grava features (history + opcionalmente contributions) |
| DELETE | `/api/scan/data` | Elimina dados do usuário (art. 18 LGPD) |

As rotas de Flow A (`/api/skin-scan/analyze`) e Flow B (BullMQ) continuam funcionando em paralelo — o path on-device é **aditivo**, não substitutivo.
