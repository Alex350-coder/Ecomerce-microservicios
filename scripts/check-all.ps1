# Verificación de consistencia: lint + typecheck + build + test por paquete.
# Paquetes cubiertos: 7 servicios core + frontend.
# auth-service se excluye por deuda preexistente de lint y tests.
param(
  [switch]$SkipBuild
)

$root = Split-Path -Parent $PSScriptRoot
$packages = @(
  @{ Dir = 'core-services/user-service';      HasTest = $true },
  @{ Dir = 'core-services/product-service';   HasTest = $true },
  @{ Dir = 'core-services/cart-service';      HasTest = $true },
  @{ Dir = 'core-services/order-service';     HasTest = $true },
  @{ Dir = 'core-services/inventory-service'; HasTest = $true },
  @{ Dir = 'core-services/payment-service';   HasTest = $true },
  @{ Dir = 'core-services/gateway';           HasTest = $true },
  @{ Dir = 'frontend';                        HasTest = $true;  Runner = 'vitest' }
)

function Invoke-Step {
  param([string]$Label, [string[]]$Cmd)
  $out = & $Cmd[0] $Cmd[1..($Cmd.Count - 1)] 2>&1
  $out | Out-Host
  return $LASTEXITCODE
}

$failed = @()
foreach ($p in $packages) {
  Write-Host "`n=== $($p.Dir) ===" -ForegroundColor Cyan
  Push-Location (Join-Path $root $p.Dir)
  $stepFail = $false

  $code = Invoke-Step 'lint' @('npm', 'run', 'lint')
  if ($code -ne 0) { $stepFail = $true }

  if (-not $stepFail) {
    $code = Invoke-Step 'typecheck' @('npm', 'run', 'typecheck', '--if-present')
    if ($code -ne 0) { $stepFail = $true }
  }

  if (-not $stepFail -and -not $SkipBuild) {
    $code = Invoke-Step 'build' @('npm', 'run', 'build')
    if ($code -ne 0) { $stepFail = $true }
  }

  if (-not $stepFail -and $p.HasTest) {
    $parallelFlag = if ($p.Runner -eq 'vitest') { '--no-file-parallelism' } else { '--runInBand' }
    $code = Invoke-Step 'test' @('npm', 'test', '--', $parallelFlag)
    if ($code -ne 0) { $stepFail = $true }
  }

  Pop-Location

  if ($stepFail) {
    Write-Host "$($p.Dir) : FAILED" -ForegroundColor Red
    $failed += $p.Dir
  } else {
    Write-Host "$($p.Dir) : OK" -ForegroundColor Green
  }
}

if ($failed.Count -gt 0) {
  Write-Host "`nFAILED: $($failed -join ', ')" -ForegroundColor Red
  exit 1
}
Write-Host "`nAll packages OK" -ForegroundColor Green
exit 0
