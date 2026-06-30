# Pattern: Resilience Toolkit（生產韌性工程模式集）

**Category**: Resilience
**Maturity**: Production
**Score**: 88/100
**Source**: MyCodexVantaOS Core Archive

---

## Problem

分散式系統中，下游服務的不穩定性是常態而非例外。若缺乏韌性設計：

- 下游故障會立即傳播，造成連鎖崩潰
- transient errors 導致不必要的請求失敗
- 沒有降級策略，用戶體驗完全依賴所有服務正常
- 監控缺失，故障發生時無法快速定位

## Context

適用於：

- 任何依賴外部 API 或服務的應用
- 微服務架構中的服務間通訊
- AI 系統中的 LLM API 調用
- 任何需要 production-grade 可靠性的服務

## Solution

```text
Resilience Toolkit
  ├── Circuit Breaker     — 防止故障擴散
  ├── Retry Policy        — 處理 transient errors
  ├── Fallback Policy     — 降級響應
  ├── Health Check Registry — Liveness/Readiness probes
  ├── Metrics Instrumentation — Prometheus 指標
  ├── Redis Cache Adapter — 減少重複計算
  └── Failure Mode Reporter — 故障模式分析
```

## Implementation Guide

### Circuit Breaker

```typescript
// packages/resilience/circuit-breaker.ts
enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime?: number;

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime! > this.timeout) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new CircuitOpenError("Circuit is OPEN");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
    }
  }
}
```

### Retry with Exponential Backoff

```typescript
// packages/resilience/retry-policy.ts
interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitter: boolean;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {
    maxAttempts: 3,
    baseDelayMs: 100,
    maxDelayMs: 5000,
    jitter: true,
  }
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < options.maxAttempts) {
        const delay = Math.min(options.baseDelayMs * Math.pow(2, attempt - 1), options.maxDelayMs);
        const jitter = options.jitter ? Math.random() * delay * 0.1 : 0;
        await sleep(delay + jitter);
      }
    }
  }

  throw lastError!;
}
```

### Health Check

```typescript
// packages/resilience/health-registry.ts
interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
  critical: boolean;
}

class HealthCheckRegistry {
  private checks: HealthCheck[] = [];

  register(check: HealthCheck): void {
    this.checks.push(check);
  }

  async liveness(): Promise<{ status: string }> {
    // Liveness: 服務是否在運行
    return { status: "alive" };
  }

  async readiness(): Promise<{ status: string; details: Record<string, boolean> }> {
    // Readiness: 服務是否準備接受流量
    const results: Record<string, boolean> = {};
    let allHealthy = true;

    for (const check of this.checks) {
      const healthy = await check.check().catch(() => false);
      results[check.name] = healthy;
      if (!healthy && check.critical) {
        allHealthy = false;
      }
    }

    return {
      status: allHealthy ? "ready" : "not-ready",
      details: results,
    };
  }
}
```

## CI Enforcement

```yaml
name: Resilience Pattern Check
on:
  pull_request:
    paths:
      - "services/**"

jobs:
  resilience-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check circuit breaker coverage
        run: |
          # 確保所有外部服務調用都有 circuit breaker
          python scripts/check-resilience-coverage.py \
            --require-circuit-breaker \
            --require-retry \
            --require-health-check
```

## Security Considerations

- Circuit breaker 的閾值設定必須根據業務 SLA 謹慎調整
- Health check endpoints 不應暴露敏感的系統資訊
- Retry policy 必須防止 retry storms（使用 jitter）
- Cache 必須有 TTL，防止 stale data

## Example Structure

```text
packages/resilience/
├── circuit-breaker.ts
├── retry-policy.ts
├── fallback-policy.ts
├── health-registry.ts
├── metrics-instrumentation.ts
├── cache-adapter.ts
└── failure-reporter.ts
```

---

_Pattern Score: 88/100 | Priority: High | Related Skill: SM-05-A_
