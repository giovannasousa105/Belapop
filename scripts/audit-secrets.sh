#!/bin/bash
# Auditoria de secrets — rodar antes de qualquer deploy.
# Uso: bash scripts/audit-secrets.sh

set -euo pipefail

echo "🔍 Auditoria de secrets BelaPop"
ERROS=0

# ── 1. Verificar que nenhum secret está hardcoded no código ──────────────────
echo "--- Verificando secrets hardcoded..."

PADROES=(
  "sk_live_"
  "sk_test_"
  "whsec_"
  "eyJhbGciOiJIUzI"
  "postgresql://"
  "postgres://"
  "redis://default:"
  "SUPABASE_SERVICE_ROLE_KEY="
  "re_[A-Za-z0-9_]{24}"
)

for padrao in "${PADROES[@]}"; do
  ENCONTRADO=$(grep -rn "$padrao" \
    app/ lib/ components/ \
    --include="*.ts" --include="*.tsx" \
    2>/dev/null \
    | grep -v "process\.env\|example\|\.example\|__tests__\|\.test\." \
    || true)

  if [ -n "$ENCONTRADO" ]; then
    echo "❌ ERRO: '$padrao' encontrado hardcoded:"
    echo "$ENCONTRADO"
    ERROS=$((ERROS + 1))
  fi
done

# ── 2. Verificar que .env não está no git ─────────────────────────────────────
echo "--- Verificando .env no git..."

for envfile in .env .env.local .env.production; do
  if git ls-files --error-unmatch "$envfile" 2>/dev/null; then
    echo "❌ ERRO: $envfile está sendo rastreado pelo git!"
    echo "   Rodar: git rm --cached $envfile && echo '$envfile' >> .gitignore"
    ERROS=$((ERROS + 1))
  fi
done

# ── 3. Verificar secrets obrigatórios em produção ─────────────────────────────
echo "--- Verificando secrets obrigatórios..."

OBRIGATORIOS=(
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "NEXT_PUBLIC_SUPABASE_URL"
  "SUPABASE_SERVICE_ROLE_KEY"
  "CRON_SECRET"
  "INTERNAL_API_KEY"
  "REDIS_URL"
  "RESEND_API_KEY"
)

for secret in "${OBRIGATORIOS[@]}"; do
  val="${!secret:-}"
  if [ -z "$val" ]; then
    echo "⚠️  AVISO: $secret não está configurado (pode ser esperado fora de produção)"
  fi
done

# ── 4. Verificar .gitignore ───────────────────────────────────────────────────
echo "--- Verificando .gitignore..."

GITIGNORE_ENTRIES=(".env" ".env.local" ".env.production")
for entry in "${GITIGNORE_ENTRIES[@]}"; do
  if ! grep -qF "$entry" .gitignore 2>/dev/null; then
    echo "❌ ERRO: '$entry' não está no .gitignore"
    ERROS=$((ERROS + 1))
  fi
done

# ── 5. Verificar CSP no proxy/config ──────────────────────────────────────────
echo "--- Verificando headers de segurança..."

# Este projeto define CSP em next.config.mjs (não em middleware/proxy)
if [ -f "next.config.mjs" ]; then
  if ! grep -q "Content-Security-Policy" next.config.mjs; then
    echo "❌ ERRO: Content-Security-Policy ausente no next.config.mjs"
    ERROS=$((ERROS + 1))
  fi
else
  echo "⚠️  AVISO: next.config.mjs não encontrado"
fi

# Verificar que proxy.ts existe (middleware do projeto)
if [ ! -f "proxy.ts" ]; then
  echo "⚠️  AVISO: proxy.ts não encontrado"
fi

# ── Resultado ─────────────────────────────────────────────────────────────────
echo ""
if [ "$ERROS" -eq 0 ]; then
  echo "✅ Auditoria de secrets: nenhum problema crítico encontrado"
else
  echo "❌ Auditoria de secrets: $ERROS problema(s) encontrado(s)"
  exit 1
fi
