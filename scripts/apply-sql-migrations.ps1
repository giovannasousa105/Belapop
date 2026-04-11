param(
  [string[]]$ProjectRefs = @("zvlxxtdkjjcjaxbsphhh", "vbtxdkytnbydsdzmdget"),
  [string]$MigrationsPath = "supabase/migrations",
  [string]$StartFrom = "20260303_0100",
  [switch]$ContinueOnError
)

$ErrorActionPreference = "Stop"

function Get-SupabaseToken {
  if ($env:SUPABASE_ACCESS_TOKEN) {
    return $env:SUPABASE_ACCESS_TOKEN
  }

  $py = @'
import ctypes, ctypes.wintypes as w, sys, re
CRED_TYPE_GENERIC = 1
class FILETIME(ctypes.Structure):
    _fields_=[('dwLowDateTime', w.DWORD),('dwHighDateTime', w.DWORD)]
class CREDENTIALW(ctypes.Structure):
    _fields_=[
      ('Flags', w.DWORD),('Type', w.DWORD),('TargetName', w.LPWSTR),('Comment', w.LPWSTR),
      ('LastWritten', FILETIME),('CredentialBlobSize', w.DWORD),('CredentialBlob', ctypes.POINTER(ctypes.c_ubyte)),
      ('Persist', w.DWORD),('AttributeCount', w.DWORD),('Attributes', w.LPVOID),('TargetAlias', w.LPWSTR),('UserName', w.LPWSTR)
    ]
PCREDENTIALW=ctypes.POINTER(CREDENTIALW)
CredReadW=ctypes.windll.advapi32.CredReadW
CredReadW.argtypes=[w.LPCWSTR,w.DWORD,w.DWORD,ctypes.POINTER(PCREDENTIALW)]
CredReadW.restype=w.BOOL
CredFree=ctypes.windll.advapi32.CredFree
CredFree.argtypes=[w.LPVOID]
CredFree.restype=None
pcred=PCREDENTIALW()
if not CredReadW('Supabase CLI:supabase', CRED_TYPE_GENERIC, 0, ctypes.byref(pcred)):
    sys.exit(1)
cred=pcred.contents
blob=ctypes.string_at(cred.CredentialBlob, cred.CredentialBlobSize)
out=''
for enc in ('utf-8','latin1','utf-16le'):
    try:
        s=blob.decode(enc)
        if not s:
            continue
        m=re.search(r'(sbp_[A-Za-z0-9]+)', s)
        if m:
            out=m.group(1)
            break
    except Exception:
        pass
CredFree(pcred)
if not out:
    sys.exit(2)
print(out)
'@

  try {
    $token = $py | py -3 -
    if (-not $token) {
      throw "Token vazio do Credential Manager."
    }
    return $token.Trim()
  } catch {
    throw "Nao foi possivel obter SUPABASE_ACCESS_TOKEN. Defina a env SUPABASE_ACCESS_TOKEN ou autentique o Supabase CLI."
  }
}

function Invoke-SupabaseQuery {
  param(
    [string]$ProjectRef,
    [string]$Token,
    [string]$Sql,
    [int]$MaxRetries = 5
  )

  $headers = @{
    Authorization = "Bearer $Token"
    apikey = $Token
    "Content-Type" = "application/json"
  }

  $body = @{ query = $Sql } | ConvertTo-Json -Compress -Depth 10
  $uri = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"

  for ($attempt = 1; $attempt -le $MaxRetries; $attempt++) {
    try {
      return Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body $body
    } catch {
      $errText = $_.Exception.Message
      $isLast = ($attempt -eq $MaxRetries)

      $isRetryable = $false
      if ($errText -match "Failed to perform authorization check") { $isRetryable = $true }
      if ($errText -match "timed out|timeout|temporarily unavailable|429|5\\d\\d") { $isRetryable = $true }

      if (-not $isRetryable -or $isLast) {
        throw
      }

      Start-Sleep -Seconds ([Math]::Min(20, 2 * $attempt))
    }
  }
}

function Escape-SqlLiteral {
  param([string]$Value)
  return $Value.Replace("'", "''")
}

function Ensure-TrackingTable {
  param([string]$ProjectRef, [string]$Token)
  $sql = @"
create table if not exists public.codex_applied_sql_files (
  filename text primary key,
  checksum text not null,
  applied_at timestamptz not null default now()
);
"@
  Invoke-SupabaseQuery -ProjectRef $ProjectRef -Token $Token -Sql $sql | Out-Null
}

function Get-RemoteChecksum {
  param([string]$ProjectRef, [string]$Token, [string]$Filename)
  $f = Escape-SqlLiteral $Filename
  $sql = "select checksum from public.codex_applied_sql_files where filename = '$f' limit 1;"
  $resp = Invoke-SupabaseQuery -ProjectRef $ProjectRef -Token $Token -Sql $sql
  if ($resp -and $resp.Count -gt 0 -and $resp[0].checksum) {
    return [string]$resp[0].checksum
  }
  return $null
}

function Mark-Applied {
  param([string]$ProjectRef, [string]$Token, [string]$Filename, [string]$Checksum)
  $f = Escape-SqlLiteral $Filename
  $c = Escape-SqlLiteral $Checksum
  $sql = @"
insert into public.codex_applied_sql_files(filename, checksum, applied_at)
values ('$f', '$c', now())
on conflict (filename) do update
set checksum = excluded.checksum,
    applied_at = now();
"@
  Invoke-SupabaseQuery -ProjectRef $ProjectRef -Token $Token -Sql $sql | Out-Null
}

$token = Get-SupabaseToken

if (-not (Test-Path $MigrationsPath)) {
  throw "Diretorio de migrations nao encontrado: $MigrationsPath"
}

$files = Get-ChildItem -Path $MigrationsPath -File -Filter "*.sql" |
  Sort-Object Name |
  Where-Object { [System.IO.Path]::GetFileNameWithoutExtension($_.Name) -ge $StartFrom }

if ($files.Count -eq 0) {
  Write-Host "Nenhuma migration encontrada a partir de $StartFrom em $MigrationsPath."
  exit 0
}

foreach ($project in $ProjectRefs) {
  Write-Host ""
  Write-Host "=== Projeto: $project ==="
  Ensure-TrackingTable -ProjectRef $project -Token $token

  foreach ($file in $files) {
    $filename = $file.Name
    $sql = Get-Content $file.FullName -Raw
    $checksum = (Get-FileHash -Path $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    $remoteChecksum = Get-RemoteChecksum -ProjectRef $project -Token $token -Filename $filename

    if ($remoteChecksum -and $remoteChecksum -eq $checksum) {
      Write-Host "SKIP  $filename (checksum igual)"
      continue
    }

    Write-Host "APPLY $filename"
    try {
      Invoke-SupabaseQuery -ProjectRef $project -Token $token -Sql $sql | Out-Null
      Mark-Applied -ProjectRef $project -Token $token -Filename $filename -Checksum $checksum
      Write-Host "OK    $filename"
    } catch {
      Write-Host "FAIL  $filename"
      if ($ContinueOnError) {
        continue
      }
      throw
    }
  }
}

Write-Host ""
Write-Host "Concluido."
