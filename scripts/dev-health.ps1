param(
  [int]$Port = 3000,
  [switch]$KeepDevServer,
  [string]$ProductionBaseUrl = "https://belapopoficial.com.br",
  [switch]$SkipProductionChecks
)

$ErrorActionPreference = "Stop"
$script:Results = @()

function Add-Result {
  param(
    [string]$Name,
    [string]$Status,
    [string]$Detail,
    [bool]$Critical = $false
  )

  $script:Results += [pscustomobject]@{
    Name     = $Name
    Status   = $Status
    Detail   = $Detail
    Critical = $Critical
  }
}

function Get-HttpResult {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Url
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop
    return [pscustomobject]@{
      Ok       = $true
      Status   = [int]$response.StatusCode
      Location = $response.Headers["Location"]
      Body     = $response.Content
      Error    = $null
    }
  } catch {
    if ($_.Exception.Response) {
      $resp = $_.Exception.Response
      $statusCode = [int]$resp.StatusCode
      $location = $resp.Headers["Location"]
      $body = ""
      try {
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $body = $reader.ReadToEnd()
      } catch {
        $body = ""
      }
      return [pscustomobject]@{
        Ok       = $false
        Status   = $statusCode
        Location = $location
        Body     = $body
        Error    = $_.Exception.Message
      }
    }

    return [pscustomobject]@{
      Ok       = $false
      Status   = 0
      Location = $null
      Body     = ""
      Error    = $_.Exception.Message
    }
  }
}

function Test-LocalPort {
  param([int]$TargetPort)
  $connections = Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction SilentlyContinue
  return [bool]$connections
}

function Wait-LocalServer {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 45
  )

  $start = Get-Date
  while (((Get-Date) - $start).TotalSeconds -lt $TimeoutSeconds) {
    $result = Get-HttpResult -Url $Url
    if ($result.Status -ge 200 -and $result.Status -lt 500) {
      return $true
    }
    Start-Sleep -Milliseconds 700
  }
  return $false
}

function Read-EnvValue {
  param(
    [string]$Path,
    [string]$Key
  )

  if (-not (Test-Path $Path)) {
    return $null
  }

  $line = Get-Content $Path | Where-Object { $_ -match "^\s*$Key\s*=" } | Select-Object -First 1
  if (-not $line) {
    return $null
  }

  return ($line -replace "^\s*$Key\s*=\s*", "").Trim()
}

$projectRoot = (Resolve-Path ".").Path
$localBaseUrl = "http://localhost:$Port"
$devLog = Join-Path $projectRoot "dev-health.dev.log"
$devErr = Join-Path $projectRoot "dev-health.dev.err"
$devProcess = $null
$startedByScript = $false

Write-Host "Running BELAPOPSITE dev-health on $localBaseUrl" -ForegroundColor Cyan

try {
  if (Test-Path $devLog) { Remove-Item $devLog -Force -ErrorAction SilentlyContinue }
  if (Test-Path $devErr) { Remove-Item $devErr -Force -ErrorAction SilentlyContinue }

  if (Test-LocalPort -TargetPort $Port) {
    Add-Result -Name "Local server on port $Port" -Status "PASS" -Detail "Port already in use (assuming dev server is running)." -Critical $true
  } else {
    try {
      $devProcess = Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "dev", "--", "--port", "$Port") -WorkingDirectory $projectRoot -RedirectStandardOutput $devLog -RedirectStandardError $devErr -PassThru
      $startedByScript = $true
      if (Wait-LocalServer -Url "$localBaseUrl/" -TimeoutSeconds 60) {
        Add-Result -Name "Start local dev server" -Status "PASS" -Detail "Started npm dev (PID $($devProcess.Id))." -Critical $true
      } else {
        Add-Result -Name "Start local dev server" -Status "FAIL" -Detail "Server did not become ready on $localBaseUrl." -Critical $true
      }
    } catch {
      Add-Result -Name "Start local dev server" -Status "FAIL" -Detail $_.Exception.Message -Critical $true
    }
  }

  # Route checks (local)
  $localChecks = @(
    @{ Path = "/"; Expected = "200" },
    @{ Path = "/login"; Expected = "200" },
    @{ Path = "/catalogo"; Expected = "200" },
    @{ Path = "/parceiro/onboarding"; Expected = "200 or 307->/login?tab=partner" },
    @{ Path = "/api/me/role"; Expected = "200 with role payload" }
  )

  foreach ($check in $localChecks) {
    $url = "$localBaseUrl$($check.Path)"
    $result = Get-HttpResult -Url $url
    $ok = $false
    $detail = "status=$($result.Status)"

    switch ($check.Path) {
      "/" { $ok = ($result.Status -eq 200) }
      "/login" { $ok = ($result.Status -eq 200) }
      "/catalogo" { $ok = ($result.Status -eq 200) }
      "/parceiro/onboarding" {
        $ok = ($result.Status -eq 200) -or ($result.Status -eq 307 -and $result.Location -like "/login?tab=partner*")
        if ($result.Location) { $detail = "$detail location=$($result.Location)" }
      }
      "/api/me/role" {
        $body = ($result.Body -replace "\s+", " ").Trim()
        $ok = ($result.Status -eq 200 -and $body -match '"role"')
        $detail = "$detail body=$body"
      }
      default { $ok = $result.Status -ge 200 -and $result.Status -lt 400 }
    }

    Add-Result -Name "Local $($check.Path)" -Status ($(if ($ok) { "PASS" } else { "FAIL" })) -Detail "$detail expected=$($check.Expected)" -Critical $true
  }

  # Env checks (OAuth mismatch hints)
  $envLocalPath = Join-Path $projectRoot ".env.local"
  $envPath = Join-Path $projectRoot ".env"
  $expectedLocalUrl = $localBaseUrl

  $siteUrl = Read-EnvValue -Path $envLocalPath -Key "NEXT_PUBLIC_SITE_URL"
  if ($siteUrl) {
    $ok = ($siteUrl -eq $expectedLocalUrl)
    Add-Result -Name "NEXT_PUBLIC_SITE_URL" -Status ($(if ($ok) { "PASS" } else { "WARN" })) -Detail "value=$siteUrl expected=$expectedLocalUrl" -Critical $false
  } else {
    Add-Result -Name "NEXT_PUBLIC_SITE_URL" -Status "WARN" -Detail "Missing in .env.local" -Critical $false
  }

  $nextAuthUrl = Read-EnvValue -Path $envLocalPath -Key "NEXTAUTH_URL"
  if ($nextAuthUrl) {
    $ok = ($nextAuthUrl -eq $expectedLocalUrl)
    Add-Result -Name "NEXTAUTH_URL" -Status ($(if ($ok) { "PASS" } else { "WARN" })) -Detail "value=$nextAuthUrl expected=$expectedLocalUrl" -Critical $false
  }

  $contains3001 = $false
  if (Test-Path $envLocalPath) {
    $contains3001 = $contains3001 -or [bool](Select-String -Path $envLocalPath -Pattern "3001" -Quiet)
  }
  if (Test-Path $envPath) {
    $contains3001 = $contains3001 -or [bool](Select-String -Path $envPath -Pattern "3001" -Quiet)
  }
  Add-Result -Name "Port mismatch hint (3001)" -Status ($(if ($contains3001) { "WARN" } else { "PASS" })) -Detail ($(if ($contains3001) { "Found ':3001' in env files." } else { "No ':3001' found in .env/.env.local." })) -Critical $false

  # Secret exposure hint
  $hasPublicServiceRole = $false
  if (Test-Path $envLocalPath) {
    $hasPublicServiceRole = [bool](Select-String -Path $envLocalPath -Pattern "^NEXT_PUBLIC_.*SERVICE_ROLE|^NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY" -Quiet)
  }
  Add-Result -Name "Service role exposed as NEXT_PUBLIC" -Status ($(if ($hasPublicServiceRole) { "FAIL" } else { "PASS" })) -Detail ($(if ($hasPublicServiceRole) { "NEXT_PUBLIC service role key found. Remove immediately." } else { "No NEXT_PUBLIC service role key found." })) -Critical $true

  # Proxy/middleware checks
  $proxyPath = Join-Path $projectRoot "proxy.ts"
  $middlewarePath = Join-Path $projectRoot "middleware.ts"

  Add-Result -Name "proxy.ts exists" -Status ($(if (Test-Path $proxyPath) { "PASS" } else { "FAIL" })) -Detail $proxyPath -Critical $true
  Add-Result -Name "middleware.ts removed" -Status ($(if (-not (Test-Path $middlewarePath)) { "PASS" } else { "WARN" })) -Detail "middleware.ts should not exist for Next 16 convention." -Critical $false

  if (Test-Path $proxyPath) {
    $proxyContent = Get-Content -Raw $proxyPath
    $hasXPathname = $proxyContent -match "x-pathname"
    Add-Result -Name "proxy injects x-pathname" -Status ($(if ($hasXPathname) { "PASS" } else { "WARN" })) -Detail "Needed by partner/admin layout guards that read headers()." -Critical $false
  }

  # Route discovery hints
  $loginRouteFiles = Get-ChildItem -Path (Join-Path $projectRoot "app") -Recurse -Filter "page.tsx" |
    Where-Object { $_.FullName -match "login" } |
    Select-Object -ExpandProperty FullName

  if ($loginRouteFiles) {
    Add-Result -Name "Login route files detected" -Status "PASS" -Detail ($loginRouteFiles -join " | ") -Critical $false
  } else {
    Add-Result -Name "Login route files detected" -Status "WARN" -Detail "No page.tsx file with 'login' in path." -Critical $false
  }

  # Production smoke (optional)
  if (-not $SkipProductionChecks) {
    $prodChecks = @("/login", "/catalogo", "/parceiro/onboarding", "/api/me/role")
    foreach ($path in $prodChecks) {
      $res = Get-HttpResult -Url "$ProductionBaseUrl$path"
      $ok = $false
      $detail = "status=$($res.Status)"
      if ($path -eq "/parceiro/onboarding") {
        $ok = ($res.Status -eq 200) -or ($res.Status -eq 307 -and $res.Location -like "/login?tab=partner*")
        if ($res.Location) { $detail = "$detail location=$($res.Location)" }
      } elseif ($path -eq "/api/me/role") {
        $body = ($res.Body -replace "\s+", " ").Trim()
        $ok = ($res.Status -eq 200 -and $body -match '"role"')
        $detail = "$detail body=$body"
      } else {
        $ok = ($res.Status -eq 200)
      }

      Add-Result -Name "Production $path" -Status ($(if ($ok) { "PASS" } else { "WARN" })) -Detail $detail -Critical $false
    }
  }
}
finally {
  if ($startedByScript -and $devProcess -and -not $KeepDevServer) {
    try {
      if (-not $devProcess.HasExited) {
        Stop-Process -Id $devProcess.Id -Force
      }
    } catch {
      # no-op
    }
  }
}

Write-Host ""
Write-Host "=== BELAPOPSITE DEV HEALTH REPORT ===" -ForegroundColor Cyan
$script:Results | Format-Table -AutoSize

$criticalFailures = $script:Results | Where-Object { $_.Critical -and $_.Status -eq "FAIL" }
if ($criticalFailures) {
  Write-Host ""
  Write-Host "Critical checks failed." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Health check completed." -ForegroundColor Green
exit 0

