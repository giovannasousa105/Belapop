# Aplica migrations pendentes + cria bucket drops via Supabase Management API
# Uso: .\scripts\run-pending-migrations.ps1 -Token "sbp_seutokenaqui"

param(
  [Parameter(Mandatory=$true)]
  [string]$Token
)

$projectRef = "zvlxxtdkjjcjaxbsphhh"
$root       = Split-Path $PSScriptRoot -Parent

$migrations = @(
  "$root\supabase\migrations\20260515_0400_copilot_schema.sql",
  "$root\supabase\migrations\20260618_0200_drops_subtitle_description_cover.sql"
)

$headers = @{
  "Authorization" = "Bearer $Token"
  "Content-Type"  = "application/json"
}

# ── Helper: executa statement SQL ─────────────────────────────────────────────

function Invoke-SqlStatement([string]$stmt) {
  $body = @{ query = "$stmt;" } | ConvertTo-Json -Depth 5
  try {
    Invoke-RestMethod `
      -Uri "https://api.supabase.com/v1/projects/$projectRef/database/query" `
      -Method POST -Headers $headers -Body $body | Out-Null
    return $null
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    try {
      $stream = $_.Exception.Response.GetResponseStream()
      $msg = [System.IO.StreamReader]::new($stream).ReadToEnd()
    } catch { $msg = $_.Exception.Message }
    return "HTTP $code : $msg"
  }
}

# ── Validar token ─────────────────────────────────────────────────────────────

Write-Host "Validando token..." -ForegroundColor Cyan
$testErr = Invoke-SqlStatement "SELECT 1"
if ($testErr) {
  Write-Host "Token inválido ou sem permissão: $testErr" -ForegroundColor Red
  exit 1
}
Write-Host "Token OK.`n" -ForegroundColor Green

# ── Migrations ────────────────────────────────────────────────────────────────

$totalOk = 0; $totalFail = 0

foreach ($file in $migrations) {
  if (-not (Test-Path $file)) {
    Write-Host "Arquivo não encontrado: $file" -ForegroundColor Yellow
    continue
  }

  $name = Split-Path $file -Leaf
  Write-Host "Migração: $name" -ForegroundColor Cyan

  $sql      = Get-Content $file -Raw
  $stmts    = $sql -split ";\s*(\r?\n|$)" | Where-Object { $_.Trim() -ne "" }
  $fileOk   = 0; $fileFail = 0

  foreach ($stmt in $stmts) {
    $t = $stmt.Trim()
    if ($t -eq "") { continue }

    $err = Invoke-SqlStatement $t

    if ($null -eq $err) {
      $fileOk++
    } elseif ($err -match "already exists|duplicate_object|duplicate_table|duplicate_column") {
      $fileOk++   # idempotente — ok
    } else {
      Write-Host "  ERRO: $err" -ForegroundColor Red
      Write-Host "  SQL:  $($t.Substring(0, [Math]::Min(120,$t.Length)))..." -ForegroundColor Yellow
      $fileFail++
    }
  }

  $totalOk   += $fileOk
  $totalFail += $fileFail

  if ($fileFail -eq 0) {
    Write-Host "  $fileOk statements OK" -ForegroundColor Green
  } else {
    Write-Host "  $fileOk OK / $fileFail ERRO(S)" -ForegroundColor Red
  }
  Write-Host ""
}

# ── Reload schema cache (PostgREST) ──────────────────────────────────────────

Write-Host "Reload schema cache (PostgREST)..." -ForegroundColor Cyan
$cacheErr = Invoke-SqlStatement "NOTIFY pgrst, 'reload schema'"
if ($null -eq $cacheErr) {
  Write-Host "  Cache recarregado." -ForegroundColor Green
} else {
  Write-Host "  Aviso: $cacheErr" -ForegroundColor Yellow
}
Write-Host ""

# ── Criar bucket "drops" (público) ───────────────────────────────────────────

Write-Host "Criando bucket 'drops' no Supabase Storage..." -ForegroundColor Cyan

$bucketBody = @{
  id     = "drops"
  name   = "drops"
  public = $true
} | ConvertTo-Json

try {
  Invoke-RestMethod `
    -Uri "https://api.supabase.com/v1/projects/$projectRef/storage/buckets" `
    -Method POST -Headers $headers -Body $bucketBody | Out-Null
  Write-Host "  Bucket 'drops' criado (público)." -ForegroundColor Green
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  try {
    $stream = $_.Exception.Response.GetResponseStream()
    $msg = [System.IO.StreamReader]::new($stream).ReadToEnd()
  } catch { $msg = $_.Exception.Message }

  if ($msg -match "already exists|Duplicate") {
    Write-Host "  Bucket 'drops' já existe — ok." -ForegroundColor Green
  } else {
    Write-Host "  ERRO ao criar bucket (HTTP $code): $msg" -ForegroundColor Red
    $totalFail++
  }
}

# ── Resumo ────────────────────────────────────────────────────────────────────

Write-Host ""
if ($totalFail -eq 0) {
  Write-Host "Tudo pronto! $totalOk statements aplicados + bucket configurado." -ForegroundColor Green
} else {
  Write-Host "Concluído com $totalFail erro(s). $totalOk OK." -ForegroundColor Red
  exit 1
}
