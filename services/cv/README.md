# BelaPop CV Service

Serviço Python de visão computacional para análise de pele. Recebe imagem de rosto e retorna 7 marcadores clínicos de pele com confidence scores.

## Stack

- **Python 3.11** + **FastAPI** + **Uvicorn**
- **MediaPipe FaceMesh** — detecção de landmarks faciais
- **ONNX Runtime** — inferência de skin condition classifier
- **OpenCV + NumPy** — processamento de imagem e estimativa de fototipo Fitzpatrick
- **Pillow** — decodificação de imagem

## Endpoint

```
POST /analyze
Content-Type: multipart/form-data
X-Internal-Key: <INTERNAL_API_KEY>

fields:
  image   File    jpeg|png, max 10MB
  scan_id string
  focos   string  JSON array
```

### Resposta

```json
{
  "scan_id": "uuid",
  "face_detectada": true,
  "face_bbox": { "x": 0, "y": 0, "w": 224, "h": 224 },
  "fitzpatrick_estimado": 3,
  "scores": {
    "acne": 0.35,
    "poros": 0.40,
    "textura": 0.30,
    "oleosidade": 0.55,
    "pigmentacao": 0.25,
    "vermelhidao": 0.20,
    "ressecamento": 0.15
  },
  "confidence_geral": 0.82,
  "flags": [],
  "modelo_versao": "dummy-v0.1",
  "duracao_ms": 320
}
```

**Flags possíveis:** `LOW_CONFIDENCE`, `ILUMINACAO_RUIM`, `IMAGEM_BORRADA`, `ROSTO_LONGE`, `FALLBACK_DEV`

## Desenvolvimento local

```bash
cd services/cv
pip install -r requirements.txt
INTERNAL_API_KEY=dev uvicorn main:app --reload --port 8001
```

O Next.js chama `http://cv-service/analyze` via `CV_SERVICE_URL` no `.env`.
Em desenvolvimento local, usar `CV_SERVICE_URL=http://localhost:8001`.

**Se `CV_SERVICE_URL` não estiver configurado**, o worker BullMQ usa o fallback de dev com scores fixos plausíveis — o pipeline funciona sem o serviço Python.

## Build Docker

```bash
docker build -t belapop-cv-service .
docker run -p 8001:8000 -e INTERNAL_API_KEY=secret belapop-cv-service
```

## Segurança

- **Imagem nunca salva em disco** — processada em memória via `BytesIO`
- **Header `X-Image-Retained: false`** em todas as respostas
- Endpoint acessível **apenas na rede interna** — não exposto publicamente
- Nenhum dado de pixel é logado

## Estimativa de fototipo Fitzpatrick

Baseado em ITA° (Individual Typology Angle) calculado na região das bochechas em espaço L\*a\*b\*:

| ITA° | Fototipo |
|------|----------|
| > 55 | I |
| 41–55 | II |
| 28–41 | III |
| 10–28 | IV |
| -30–10 | V |
| < -30 | VI |

## Fallback de desenvolvimento

Quando `CV_SERVICE_URL` não está configurado no Next.js:

```
scores:
  acne: 0.35  poros: 0.40  textura: 0.30
  oleosidade: 0.55  pigmentacao: 0.25
  vermelhidao: 0.20  ressecamento: 0.15
confidence_geral: 0.72
fitzpatrick_estimado: 3
flags: ['FALLBACK_DEV']
```

O scoring clínico TypeScript funciona normalmente sobre esses scores.
