/**
 * Load sanity test: 50 concurrent requests to GET /products
 *
 * Usage:
 *   BASE_URL=http://localhost:8000 npx tsx e2e/load-sanity.ts
 *
 * Verifies:
 * - All 50 requests succeed (200)
 * - p95 latency < 3000ms (generous for local)
 * - No server errors (5xx)
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8000';
const CONCURRENCY = 50;
const PRODUCT_ENDPOINT = `${BASE_URL}/products`;

interface RequestResult {
  status: number;
  latencyMs: number;
  error?: string;
}

async function singleRequest(): Promise<RequestResult> {
  const start = Date.now();
  try {
    const res = await fetch(PRODUCT_ENDPOINT, {
      headers: { 'Content-Type': 'application/json' },
    });
    return {
      status: res.status,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      status: 0,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function main(): Promise<void> {
  console.log(`\nLoad sanity: ${CONCURRENCY} concurrent requests to ${PRODUCT_ENDPOINT}\n`);

  const results = await Promise.all(
    Array.from({ length: CONCURRENCY }, () => singleRequest()),
  );

  const latencies = results
    .filter((r) => r.status > 0)
    .map((r) => r.latencyMs)
    .sort((a, b) => a - b);

  const succeeded = results.filter((r) => r.status >= 200 && r.status < 300).length;
  const clientErrors = results.filter((r) => r.status >= 400 && r.status < 500).length;
  const serverErrors = results.filter((r) => r.status >= 500).length;
  const networkErrors = results.filter((r) => r.status === 0).length;

  const p50 = latencies.length > 0 ? percentile(latencies, 50) : 0;
  const p95 = latencies.length > 0 ? percentile(latencies, 95) : 0;
  const p99 = latencies.length > 0 ? percentile(latencies, 99) : 0;
  const max = latencies.length > 0 ? latencies[latencies.length - 1] : 0;

  console.log(`Results:`);
  console.log(`  Total:      ${results.length}`);
  console.log(`  2xx:        ${succeeded}`);
  console.log(`  4xx:        ${clientErrors}`);
  console.log(`  5xx:        ${serverErrors}`);
  console.log(`  Network:    ${networkErrors}`);
  console.log(`\nLatency:`);
  console.log(`  p50:        ${p50}ms`);
  console.log(`  p95:        ${p95}ms`);
  console.log(`  p99:        ${p99}ms`);
  console.log(`  max:        ${max}ms`);

  const allOk = succeeded === CONCURRENCY && serverErrors === 0 && networkErrors === 0;
  const p95UnderThreshold = p95 < 3000;

  console.log(`\nVerdict:`);
  console.log(`  All 200:    ${allOk ? 'PASS' : 'FAIL'}`);
  console.log(`  p95 < 3s:   ${p95UnderThreshold ? 'PASS' : 'FAIL'}`);

  if (!allOk || !p95UnderThreshold) {
    console.log(`\nFAILED`);
    process.exit(1);
  }

  console.log(`\nPASSED`);
}

main().catch((err) => {
  console.error('Load sanity test failed:', err);
  process.exit(1);
});
