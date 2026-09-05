import { TelemetryEvent, APMStats, Project } from "../types";

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-beekman",
    name: "Beekman B2B Portal & Shops",
    slug: "beekman",
    domains: ["beekman.local", "shop.local", "b2b.beekman.local"],
    environment: "production",
    total_requests: 184200,
    total_runs: 160,
    last_seen: "Zojuist",
    color: "#3b82f6",
    framework: "laravel-blade"
  },
  {
    id: "proj-partsnl",
    name: "PartsNL Multi-Shop Platform",
    slug: "partsnl",
    domains: ["partsnl.local", "onderdelen.local"],
    environment: "production",
    total_requests: 94100,
    total_runs: 84,
    last_seen: "1m geleden",
    color: "#10b981",
    framework: "laravel-blade"
  },
  {
    id: "proj-backoffice",
    name: "Operations & ERP Backoffice",
    slug: "backoffice",
    domains: ["backoffice.test", "admin.local"],
    environment: "staging",
    total_requests: 24100,
    total_runs: 22,
    last_seen: "5m geleden",
    color: "#8b5cf6",
    framework: "laravel-vue",
    vue_version: "3.4.21"
  }
];

export const INITIAL_STATS: APMStats = {
  requests_per_second: "42.8",
  avg_latency_ms: 142,
  p95_latency_ms: 286,
  p99_latency_ms: 480,
  error_count: 1,
  error_rate_pct: "0.14",
  slow_queries_count: 3,
  active_queue_workers: 8,
  queue_backlog: 0,
  redis_hit_ratio_pct: 94.6,
  cpu_usage_pct: 12.4,
  memory_usage_mb: 48.2,
  total_events: 184200,
  sentinel_status: "healthy"
};

export const INITIAL_EVENTS: TelemetryEvent[] = [
  {
    id: "EXAMPLE-REQUEST-0001",
    type: "exception",
    timestamp: Date.now() - 1000 * 60 * 1,
    level: "critical",
    title: "RuntimeException: Order processing failed",
    message: "Order processing failed in OrderProcessingService.php:142",
    durationMs: 152.4,
    metadata: {
      project: "beekman",
      domain: "shop.local",
      exception_class: "RuntimeException",
      file: "app/Services/OrderProcessingService.php",
      line: 142,
      raw_exception: {
        class: "RuntimeException",
        code: 0,
        message: "Order processing failed",
        file: "app/Services/OrderProcessingService.php",
        line: 142,
        snippet: {
          file: "app/Services/OrderProcessingService.php",
          line: 142,
          lines: {
            "137": "        DB::beginTransaction();",
            "138": "",
            "139": "        $order = Order::lockForUpdate()->findOrFail($orderId);",
            "140": "        $inventory = Inventory::where('product_id', $order->product_id)",
            "141": "            ->lockForUpdate()->firstOrFail();",
            "142": "        throw new RuntimeException('Order processing failed');",
            "143": "",
            "144": "        $order->update(['status' => 'processing']);",
            "145": "        DB::commit();",
            "146": "    }"
          }
        }
      },
      code_snippet: [
        { line: 137, code: "        DB::beginTransaction();" },
        { line: 139, code: "        $order = Order::lockForUpdate()->findOrFail($orderId);" },
        { line: 140, code: "        $inventory = Inventory::where('product_id', $order->product_id)" },
        { line: 141, code: "            ->lockForUpdate()->firstOrFail();" },
        { line: 142, code: "        throw new RuntimeException('Order processing failed');", highlight: true },
        { line: 144, code: "        $order->update(['status' => 'processing']);" },
        { line: 145, code: "        DB::commit();" }
      ],
      breadcrumbs: [
        { type: "request", message: "POST /api/v1/orders/48102/process", offset_ms: 0 },
        { type: "route", message: "POST /api/v1/orders/{order}/process", offset_ms: 31 },
        { type: "auth", message: "Authenticated user a94a8fe5ccb1 (auth:sanctum)", offset_ms: 40 },
        { type: "http", message: "GET https://inventory.example.test/products/{value} [200, 31.40ms]", offset_ms: 73 },
        { type: "query", message: "18 queries [64.70ms total], last: update orders set status = ? where id = ? [4.20ms]", offset_ms: 117 },
        { type: "warning", message: "warning: Order processing required a retry", offset_ms: 128 },
        { type: "exception", message: "RuntimeException: Order processing failed", offset_ms: 151 }
      ],
      request: {
        method: "POST",
        url: "/api/v1/orders/48102/process",
        status: 500,
        user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        ip: "192.168.1.144",
        user_id: "a94a8fe5ccb1",
        user_email: "operator@shop.local"
      },
      auth_user: {
        id: "a94a8fe5ccb1",
        guard: "auth:sanctum"
      },
      db_queries_count: 18,
      db_time_ms: 64.7,
      external_http_time_ms: 31.4,
      models_count: 5,
      occurrences_last_24h: 12,
      affected_users: 7,
      status: "unresolved",
      tags: { env: "local", release: "v2.15.0", profile: "full", source_id: "web:100" }
    }
  },
  {
    id: "evt-req-parts-01",
    type: "request",
    timestamp: Date.now() - 1000 * 60 * 2,
    level: "warning",
    title: "GET /aansluitmateriaal/gas",
    durationMs: 458.5,
    metadata: {
      status: 200,
      memory_peak_mb: 10.2,
      db_queries_count: 73,
      db_time_ms: 278.4,
      external_http_time_ms: 0,
      php_execution_time_ms: 180.1,
      controller: "App\\Http\\Controllers\\Frontend\\CategoryController@getFallbackIndex",
      route_pattern: "GET {fallbackPlaceholder}",
      domain: "partsnl.local",
      run_id: "run-160",
      view_name: "frontend.categories.fallback",
      models_count: 1201,
      middleware: ["web", "safesefparts", "extraheaders", "force.noss1"],
      lifecycle_phases: {
        bootstrap_ms: 7.8,
        routing_ms: 64.8,
        middleware_before_ms: 30.7,
        controller_ms: 498.6,
        render_ms: 61.2,
        middleware_after_ms: 15.1,
        response_ms: 0.1,
        unassigned_ms: 0.4,
        total_ms: 458.5
      },
      breakdown: {
        database_pct: 60,
        external_pct: 0,
        php_pct: 40
      }
    }
  },
  {
    id: "evt-req-01",
    type: "request",
    timestamp: Date.now() - 1000 * 60 * 3,
    level: "warning",
    title: "GET /api/v1/reports/revenue-monthly",
    durationMs: 2450,
    metadata: {
      project: "beekman",
      domain: "beekman.local",
      status: 200,
      memory_peak_mb: 74.2,
      db_queries_count: 42,
      db_time_ms: 1820,
      external_http_time_ms: 320,
      php_execution_time_ms: 310,
      controller: "App\\Http\\Controllers\\ReportController@monthlyRevenue",
      middleware: ["web", "auth:sanctum", "throttle:60,1"],
      breakdown: {
        database_pct: 74,
        external_pct: 13,
        php_pct: 13
      }
    }
  }
];
