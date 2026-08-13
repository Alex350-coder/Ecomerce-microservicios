#!/usr/bin/env bash
# Smoke test CI: verifica /health (200) en los 8 servicios + frontend.
# - gateway y frontend se prueban por el puerto publicado en el host.
# - los servicios internos se prueban DENTRO de su contenedor (no publican puertos).
set -euo pipefail
cd "$(dirname "$0")/.."

check_service() {
  local svc=$1 port=$2
  if docker compose exec -T "$svc" sh -c "wget -qO- http://localhost:$port/health | grep -q ok" 2>/dev/null; then
    echo "$svc : OK"
  else
    echo "$svc : FAIL"
    return 1
  fi
}

check_host() {
  local name=$1 url=$2
  if curl -sf -o /dev/null -w "" "$url"; then
    echo "$name : OK"
  else
    echo "$name : FAIL"
    return 1
  fi
}

fail=0
check_host "gateway" "http://localhost:8001/health" || fail=1
check_service "auth-service" 3002 || fail=1
check_service "user-service" 3001 || fail=1
check_service "product-service" 3003 || fail=1
check_service "cart-service" 3004 || fail=1
check_service "order-service" 3005 || fail=1
check_service "inventory-service" 3006 || fail=1
check_service "payment-service" 3007 || fail=1
check_host "frontend" "http://localhost:5173/" || fail=1

if [ "$fail" -eq 1 ]; then
  echo "SMOKE FAILED (8/9)" >&2
  exit 1
fi
echo "SMOKE OK (9/9)"
