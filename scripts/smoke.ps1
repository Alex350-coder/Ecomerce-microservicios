# Smoke test: verifica /health (200) en los 8 servicios + frontend.
# - gateway y frontend se prueban por el puerto publicado en el host.
# - los servicios internos se prueban DENTRO de su contenedor (no publican puertos).
# Requiere `docker compose up -d --build` ejecutado previamente.
param(
  [string]$ComposeFile = "docker-compose.yml"
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

$services = @(
  @{ Name = 'gateway';        Internal = $false; Url = 'http://localhost:8001/health' },
  @{ Name = 'auth-service';   Internal = $true;  Port = 3002 },
  @{ Name = 'user-service';   Internal = $true;  Port = 3001 },
  @{ Name = 'product-service';Internal = $true;  Port = 3003 },
  @{ Name = 'cart-service';   Internal = $true;  Port = 3004 },
  @{ Name = 'order-service';  Internal = $true;  Port = 3005 },
  @{ Name = 'inventory-service'; Internal = $true; Port = 3006 },
  @{ Name = 'payment-service';Internal = $true;  Port = 3007 },
  @{ Name = 'frontend';       Internal = $false; Url = 'http://localhost:5173/' }
)

Push-Location $root
try {
  $healthy = 0
  foreach ($s in $services) {
    $ok = $false
    if ($s.Internal) {
      docker compose exec -T $s.Name sh -c "wget -qO- http://localhost:$($s.Port)/health | grep -q ok"
      $ok = ($LASTEXITCODE -eq 0)
    } else {
      try {
        $resp = Invoke-WebRequest -Uri $s.Url -UseBasicParsing -TimeoutSec 5
        $ok = ($resp.StatusCode -eq 200)
      } catch {
        $ok = $false
      }
    }
    if ($ok) {
      Write-Host "$($s.Name) : OK" -ForegroundColor Green
      $healthy++
    } else {
      Write-Host "$($s.Name) : FAIL" -ForegroundColor Red
    }
  }
  if ($healthy -lt $services.Count) {
    Write-Host "`nSMOKE FAILED ($healthy/$($services.Count))" -ForegroundColor Red
    exit 1
  }
  Write-Host "`nSMOKE OK ($healthy/$($services.Count))" -ForegroundColor Green
  exit 0
} finally {
  Pop-Location
}
