# CÓDEX — Tags Oficiais (Brasilidades + Editorial)
Objetivo: padronizar tags para filtros inteligentes, inclusão real e curadoria premium.
Regra: tags são em `snake_case`, sem acento, sem espaços.

---

## 1) Regras de Governança (OBRIGATÓRIO)
1) Nunca criar tag nova “na hora” sem registrar aqui.
2) Tag sempre descreve:
   - público/uso (hair/skin)
   - propriedade/benefício (no_white_cast, high_pigment)
3) Um produto deve ter no máximo 6–8 tags (para não virar bagunça).
4) Tags são feitas para filtro e curadoria; não para “texto bonito”.
5) Se o produto serve para vários públicos, use tags com honestidade (sem exagero).

---

## 2) Dicionário Oficial — Brasilidades (P0)
### Cabelo
- hair_crespo         = indicado/compatível com cabelo crespo (4A–4C)
- hair_cacheado       = indicado/compatível com cabelo cacheado (2C–3C)
- hair_ondulado       = indicado/compatível com cabelo ondulado (2A–2C) [opcional]
- hair_transicao      = indicado para transição capilar

### Pele (tons e necessidades)
- skin_tone_deep      = pele negra (tons profundos)
- skin_tone_rich      = pele retinta
- skin_tone_medium    = pele morena (média) [opcional]
- skin_hyperpigmentation = foco em manchas/hiperpigmentação

### Make/Acabamento e compatibilidade
- no_gray_cast        = não acinzenta em tons profundos (make/finish)
- no_white_cast       = sem “esbranquiçar” (principalmente protetor solar)
- high_pigment        = alta pigmentação (batom, blush, base, corretivo)

---

## 3) Dicionário Editorial (P0/P1)
### Curadoria & identidade
- bp_curated          = Curadoria BelaPop (também pode usar `is_featured`)
- giftable            = presenteável
- sensory             = sensorial (cheiro/textura marcantes)

### Valores (se fizer sentido real)
- vegan               = vegano
- cruelty_free        = cruelty-free
- fragrance_free      = sem fragrância
- sensitive_skin      = pele sensível (skincare)
- barrier_support     = suporte de barreira (skincare)

### Ritual (se preferir tag ao invés de coluna)
- ritual_noturno
- ritual_diurno
- ritual_evento
- ritual_pos_banho
- ritual_plantao

OBS: Se você já tem coluna `ritual`, prefira a coluna e não duplicar em tags.

---

## 4) Checklist — como preencher tags no produto (passo a passo)
### Passo 1: Determine a categoria do item
- Skincare
- Haircare
- Make
- Perfume / corpo

### Passo 2: Aplique tags de “compatibilidade”
**Haircare**
- Se é finalizador/creme de pentear/gelatina/óleo de nutrição:
  - marcar hair_cacheado e/ou hair_crespo quando apropriado
- Se é “transição capilar” (definição + hidratação + anti-frizz leve):
  - marcar hair_transicao

**Skincare**
- Se trata manchas/tonalidade irregular:
  - skin_hyperpigmentation
- Se é para pele sensível / sem irritantes:
  - sensitive_skin e/ou fragrance_free e/ou barrier_support

**Make**
- Se tem alta pigmentação:
  - high_pigment
- Se a base/corretivo/contorno NÃO acinzenta em tons profundos:
  - no_gray_cast

**Protetor solar**
- Se NÃO esbranquiça:
  - no_white_cast
- Se serve bem para tons profundos (além do no_white_cast):
  - skin_tone_deep (se aplicável e comprovado)

### Passo 3: Aplique valores (somente se verdadeiro)
- vegan / cruelty_free

### Passo 4: Limite de tags
Meta: 4–6 tags por produto (máximo 8).

---

## 5) Exemplos prontos (para padronizar)
### Exemplo A — Protetor solar invisível
tags:
- no_white_cast
- sensitive_skin (se verdadeiro)
- bp_curated (se curadoria)

### Exemplo B — Base que não acinzenta e é bem pigmentada
tags:
- no_gray_cast
- high_pigment
- skin_tone_deep (se comprovado)
- bp_curated

### Exemplo C — Creme de pentear para cacheados e crespos
tags:
- hair_cacheado
- hair_crespo (se serve bem para ambos)
- hair_transicao (se tem proposta para transição)
- sensory (se fragrância/textura é destaque)

### Exemplo D — Sérum para manchas
tags:
- skin_hyperpigmentation
- barrier_support (se verdadeiro)
- fragrance_free (se verdadeiro)
- bp_curated

---

## 6) Protocolo de criação de novas tags (quando precisar)
Toda nova tag precisa:
1) Nome em snake_case
2) Descrição curta (1 linha)
3) Categoria (hair/skin/make/editorial)
4) Exemplo de uso (1 produto)

Sem isso, não entra no sistema.
