# Executa a migração do Copilot schema via Supabase Management API
# Uso: .\scripts\run-copilot-migration.ps1 -Token "sbp_seutokenaqui"

param(
  [Parameter(Mandatory=$true)]
  [string]$Token
)

$projectRef = "zvlxxtdkjjcjaxbsphhh"
$sql = Get-Content "$PSScriptRoot\..\supabase\migrations\20260515_0400_copilot_schema.sql" -Raw

$headers = @{
  "Authorization" = "Bearer $Token"
  "Content-Type"  = "application/json"
}

# Quebra o SQL em statements individuais para evitar limite de tamanho da API
$statements = $sql -split ";\s*\r?\n" | Where-Object { $_.Trim() -ne "" }

$ok = 0
$fail = 0

foreach ($stmt in $statements) {
  $trimmed = $stmt.Trim()
  if ($trimmed -eq "") { continue }

  $body = @{ query = "$trimmed;" } | ConvertTo-Json -Depth 5

  try {
    Invoke-RestMethod `
      -Uri "https://api.supabase.com/v1/projects/$projectRef/database/query" `
      -Method POST `
      -Headers $headers `
      -Body $body | Out-Null
    $ok++
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $msg = $reader.ReadToEnd()
    # Ignora "already exists" — migration é idempotente
    if ($msg -match "already exists|duplicate_object") {
      $ok++
    } else {
      Write-Host "ERRO ($code): $msg" -ForegroundColor Red
      Write-Host "Statement: $($trimmed.Substring(0, [Math]::Min(80, $trimmed.Length)))..." -ForegroundColor Yellow
      $fail++
    }
  }
}

Write-Host ""
if ($fail -eq 0) {
  Write-Host "Migração concluída: $ok statements aplicados com sucesso." -ForegroundColor Green
} else {
  Write-Host "Migração finalizada com $fail erro(s). $ok statements OK." -ForegroundColor Red
  exit 1
}
