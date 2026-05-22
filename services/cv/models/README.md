# Modelos CV BelaPop

Este diretório contém o(s) modelo(s) ONNX usados pelo serviço de visão computacional.
Arquivos `.onnx`, `.pt` e `.bin` estão no `.gitignore` — nunca commitar modelos no repositório.

## Sem modelo (desenvolvimento local)

Deixar a pasta vazia. O serviço detecta a ausência do arquivo e ativa o fallback heurístico:
- Scores derivados de estatísticas de pixel (brilho, variância, saturação)
- `confidence_geral` fixado em 0.40 para sinalizar saída não-ML
- Flag `FALLBACK_DEV` NÃO é usada aqui — o fallback só aparece no worker TypeScript quando `CV_SERVICE_URL` não está configurado

O pipeline TypeScript funciona normalmente sobre esses scores.

## Opção 1 — Modelo pré-treinado (HuggingFace)

```bash
pip install optimum onnx

# Exportar modelo de classificação de condições de pele
optimum-cli export onnx \
  --model truskovskyi/skin-condition-classifier \
  --task image-classification \
  skin_classifier/

# Renomear para o caminho esperado
mv skin_classifier/model.onnx services/cv/models/skin_analysis.onnx
```

O serviço espera o modelo em:
```
services/cv/models/skin_analysis.onnx   (path padrão)
```

Para usar outro path: `MODEL_PATH=/app/models/meu_modelo.onnx` via variável de ambiente.

**Contrato do modelo:**
- Input:  tensor `float32` shape `(1, 3, 224, 224)`, normalizado com média/desvio ImageNet
- Output: tensor `float32` com pelo menos 7 valores (um score bruto por marcador)
- Ordem dos marcadores: `acne, poros, textura, oleosidade, pigmentacao, vermelhidao, ressecamento`
- O serviço aplica sigmoid nos logits — o modelo pode retornar logits ou probabilidades

## Opção 2 — Modelo customizado BelaPop

Treinar com dataset anotado em `acne, poros, textura, oleosidade, pigmentacao, vermelhidao, ressecamento`.

Requisitos:
- Arquitetura: qualquer CNN compatível com ONNX opset >= 13
- Input: NCHW float32, normalizado ImageNet, 224×224
- Output: 7 valores sigmoidizados (0.0 a 1.0) ou logits brutos

Exportar do PyTorch:
```python
import torch

model.eval()
dummy = torch.zeros(1, 3, 224, 224)
torch.onnx.export(
    model, dummy,
    "services/cv/models/skin_analysis.onnx",
    input_names=["input"],
    output_names=["output"],
    opset_version=17,
    dynamic_axes={"input": {0: "batch"}}
)
```

## Adicionando ao container (docker-compose)

O `docker-compose.cv.yml` monta o diretório como volume read-only:

```yaml
volumes:
  - ./services/cv/models:/app/models:ro
```

Basta colocar o `.onnx` nesta pasta local — o container usa automaticamente sem rebuild.

## Segurança

- Modelos nunca são servidos via HTTP — apenas usados internamente
- O diretório está fora do contexto de build público
- Nenhum dado de paciente é armazenado junto aos modelos
