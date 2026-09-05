import { TelemetryEvent, APMStats, Project } from "../types";
import { RUN_160_REQ_216_QUERIES, RUN_160_REQ_217_QUERIES } from "./devstackRun160";

export const APPLICATION_DOMAINS = [
  { domain: "all", label: "Alle domeinen (5)", count: 5 },
  { domain: "partsnl.local", label: "partsnl.local (Shop)", count: 1 },
  { domain: "ersatzteileshop.local", label: "ersatzteileshop.local (DE)", count: 1 },
  { domain: "onderdelen.local", label: "onderdelen.local (NL)", count: 1 },
  { domain: "beekman.local", label: "beekman.local (B2B)", count: 1 },
  { domain: "rest.beekman.local", label: "rest.beekman.local (API)", count: 1 },
];

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
    domains: ["backoffice.test", "admin.beekman.local"],
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
    id: "evt-req-parts-01",
    type: "request",
    timestamp: Date.now() - 1000 * 60 * 2,
    level: "warning",
    title: "GET /aansluitmateriaal/gas",
    durationMs: 458.5,
    metadata: {
      status: 200,
      memory_peak_mb: 8.0,
      db_queries_count: 73,
      db_time_ms: 249.03,
      external_http_time_ms: 0,
      php_execution_time_ms: 209.5,
      queries: RUN_160_REQ_216_QUERIES,
      controller: "App\\Http\\Controllers\\Frontend\\CategoryController@getFallbackIndex",
      route_pattern: "GET {fallbackPlaceholder}",
      domain: "partsnl.local",
      run_id: "run-160",
      view_name: "theme::shop.category",
      models_count: 1255,
      loaded_models_count: 1255,
      log_warnings_count: 20,
      middleware: ["web", "safesefparts", "extraheaders", "force.nossl"],
      laravel_context: {
        markers: {
          provider_ready: 7943823,
          laravel_booted: 60806335,
          before_middleware_started: 60808837,
          route_matched: 62393354,
          action_started: 88496961,
          controller_started: 88513547,
          controller_finished: 350660175,
          preparing_response: 458022538,
          render_started: 350681108,
          response_prepared: 458071669,
          after_middleware_started: 446571846,
          sending_started: 458116629,
          request_handled: 458119628
        }
      },
      loaded_models: {
        "Beekman\\Shops\\Models\\Configurations\\Overrides": 710,
        "Beekman\\Shops\\Models\\Configurations": 230,
        "Beekman\\Shops\\Models\\Articles\\ArticlePrices": 108,
        "App\\Models\\Brand": 48,
        "Beekman\\Shops\\Models\\PriceCache\\ConsumerPriceCache": 48,
        "Beekman\\Shops\\Models\\Assortment\\Articles\\Articles": 24,
        "App\\Models\\Article": 24,
        "Beekman\\Config\\Models\\Configs": 13,
        "App\\Models\\RemoteReview": 10,
        "Beekman\\Config\\Models\\Applications": 9,
        "Beekman\\Shops\\Models\\Sales\\Finance\\VatTypes": 6,
        "App\\Models\\CategoryLevel": 5,
        "App\\Models\\Category": 3,
        "App\\Models\\News": 3,
        "Beekman\\Shops\\Models\\Debtors": 2,
        "App\\Models\\ShippingCondition": 2,
        "Beekman\\Security\\Models\\IpDetails": 1,
        "App\\Models\\WebtypeHostname": 1,
        "App\\Models\\CategoryContent": 1,
        "App\\Models\\CategoryContentValue": 1,
        "App\\Models\\CanvasElement": 1,
        "App\\Models\\Template": 1,
        "App\\Models\\Tip": 1,
        "App\\Models\\Banner": 1,
        "App\\Models\\RemoteReviewType": 1,
        "App\\Models\\RemoteReviewCount": 1
      },
      lifecycle_phases: {
        bootstrap_ms: 60.8,
        routing_ms: 27.7,
        middleware_before_ms: 27.7,
        controller_ms: 262.2,
        render_ms: 107.4,
        middleware_after_ms: 11.6,
        response_ms: 0.1,
        unassigned_ms: 0.4,
        total_ms: 458.5
      },
      breakdown: {
        database_pct: 54,
        external_pct: 0,
        php_pct: 46
      }
    }
  },
  {
    id: "evt-req-parts-02",
    type: "request",
    timestamp: Date.now() - 1000 * 60 * 2 + 558,
    level: "info",
    title: "GET /doe-het-zelf",
    durationMs: 402.5,
    metadata: {
      status: 200,
      memory_peak_mb: 10.0,
      db_queries_count: 61,
      db_time_ms: 213.95,
      external_http_time_ms: 0,
      php_execution_time_ms: 188.5,
      queries: RUN_160_REQ_217_QUERIES,
      controller: "App\\Http\\Controllers\\Frontend\\CategoryController@getFallbackIndex",
      route_pattern: "GET {fallbackPlaceholder}",
      domain: "partsnl.local",
      run_id: "run-160",
      view_name: "theme::shop.category",
      models_count: 1221,
      loaded_models_count: 1221,
      log_warnings_count: 24,
      flow_offset_ms: 558.0,
      middleware: ["web", "safesefparts", "extraheaders", "force.nossl"],
      laravel_context: {
        markers: {
          provider_ready: 7839737,
          laravel_booted: 52691791,
          before_middleware_started: 52695242,
          route_matched: 54351569,
          action_started: 69163632,
          controller_started: 69177848,
          controller_finished: 382084097,
          preparing_response: 402119757,
          render_started: 382104130,
          response_prepared: 402167494,
          after_middleware_started: 395580457,
          sending_started: 402203139,
          request_handled: 402205039
        }
      },
      loaded_models: {
        "Beekman\\Shops\\Models\\Configurations\\Overrides": 710,
        "Beekman\\Shops\\Models\\Configurations": 230,
        "App\\Models\\Brand": 99,
        "Beekman\\Shops\\Models\\PriceCache\\ConsumerPriceCache": 48,
        "Beekman\\Shops\\Models\\Articles\\ArticlePrices": 34,
        "Beekman\\Shops\\Models\\Assortment\\Articles\\Articles": 24,
        "App\\Models\\Article": 24,
        "Beekman\\Config\\Models\\Configs": 13,
        "Beekman\\Config\\Models\\Applications": 9,
        "Beekman\\Shops\\Models\\Sales\\Finance\\VatTypes": 6,
        "App\\Models\\CategoryContentValue": 5,
        "App\\Models\\CanvasElement": 5,
        "App\\Models\\Tip": 5,
        "App\\Models\\Category": 2,
        "Beekman\\Shops\\Models\\Debtors": 2,
        "Beekman\\Security\\Models\\IpDetails": 1,
        "App\\Models\\WebtypeHostname": 1,
        "App\\Models\\CategoryLevel": 1,
        "App\\Models\\CategoryContent": 1,
        "App\\Models\\Template": 1
      },
      lifecycle_phases: {
        bootstrap_ms: 52.7,
        routing_ms: 16.5,
        middleware_before_ms: 16.5,
        controller_ms: 312.9,
        render_ms: 20.1,
        middleware_after_ms: 6.6,
        response_ms: 0.1,
        unassigned_ms: 0.4,
        total_ms: 402.5
      },
      breakdown: {
        database_pct: 53,
        external_pct: 0,
        php_pct: 47
      }
    }
  },
  {
    id: "evt-req-baseline-159",
    type: "request",
    timestamp: Date.now() - 1000 * 60 * 30,
    level: "critical",
    title: "GET /aansluitmateriaal/gas (Baseline vóór optimalisatie)",
    durationMs: 1420.2,
    metadata: {
      status: 200,
      memory_peak_mb: 22.4,
      db_queries_count: 198,
      db_time_ms: 1085.4,
      external_http_time_ms: 0,
      php_execution_time_ms: 334.8,
      controller: "App\\Http\\Controllers\\Frontend\\CategoryController@getFallbackIndex",
      domain: "partsnl.local",
      run_id: "run-159",
      models_count: 2480,
      loaded_models_count: 2480,
      breakdown: {
        database_pct: 76,
        external_pct: 0,
        php_pct: 24
      }
    }
  },
  {
    id: "evt-req-rest-01",
    type: "request",
    timestamp: Date.now() - 1000 * 60 * 5,
    level: "info",
    title: "GET /v1/articles/search?q=gasslang",
    durationMs: 185.2,
    metadata: {
      status: 200,
      memory_peak_mb: 14.5,
      db_queries_count: 14,
      db_time_ms: 48.2,
      external_http_time_ms: 0,
      php_execution_time_ms: 137.0,
      controller: "App\\Http\\Controllers\\Api\\ArticleSearchController@search",
      domain: "rest.beekman.local",
      models_count: 48,
      breakdown: {
        database_pct: 26,
        external_pct: 0,
        php_pct: 74
      }
    }
  },
  {
    id: "evt-req-de-01",
    type: "request",
    timestamp: Date.now() - 1000 * 60 * 8,
    level: "info",
    title: "GET /kategorie/gas-zubehoer",
    durationMs: 442.0,
    metadata: {
      status: 200,
      memory_peak_mb: 8.5,
      db_queries_count: 68,
      db_time_ms: 228.4,
      external_http_time_ms: 0,
      php_execution_time_ms: 213.6,
      controller: "App\\Http\\Controllers\\Frontend\\CategoryController@getFallbackIndex",
      domain: "ersatzteileshop.local",
      models_count: 1180,
      breakdown: {
        database_pct: 52,
        external_pct: 0,
        php_pct: 48
      }
    }
  },
  {
    id: "evt-err-01",
    type: "exception",
    timestamp: Date.now() - 1000 * 60 * 1,
    level: "critical",
    title: "QueryException: SQLSTATE[HY000] [2002] Connection timed out (130.0.1.42:3306 beekman_live)",
    message: "SQLSTATE[HY000] [2002] Connection timed out on mysql remote connection to 130.0.1.42:3306 (database: beekman_live)",
    durationMs: 3004.2,
    metadata: {
      project: "beekman",
      domain: "partsnl.local",
      exception_class: "Illuminate\\Database\\QueryException",
      file: "app/Repositories/ArticlePriceRepository.php",
      line: 84,
      code_snippet: [
        { line: 81, code: "        $connection = DB::connection('mysql_remote');" },
        { line: 82, code: "        return $connection->table('article_prices')" },
        { line: 83, code: "            ->whereIn('article_id', $articleIds)" },
        { line: 84, code: "            ->where('debtor_id', $debtorId)->get();", highlight: true },
        { line: 85, code: "    }" }
      ],
      breadcrumbs: [
        { type: "request", message: "GET /aansluitmateriaal/gas", offset_ms: 0 },
        { type: "route", message: "GET {fallbackPlaceholder} (safesefparts)", offset_ms: 62 },
        { type: "cache", message: "Redis GET price_cache:partsnl:gas [MISS, 1.2ms]", offset_ms: 88 },
        { type: "query", message: "SELECT FROM `article_prices` on 130.0.1.42:3306 [TIMEOUT, 3000ms]", offset_ms: 3088 },
        { type: "exception", message: "QueryException: Connection timed out to 130.0.1.42:3306", offset_ms: 3090 }
      ],
      request: {
        method: "GET",
        url: "/aansluitmateriaal/gas",
        status: 500,
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        ip: "82.161.44.19"
      },
      db_queries_count: 73,
      db_time_ms: 3249.0,
      occurrences_last_24h: 3,
      affected_users: 2,
      status: "unresolved",
      tags: { env: "local", connection: "mysql_remote", host: "130.0.1.42" }
    }
  },
  {
    id: "evt-err-02",
    type: "exception",
    timestamp: Date.now() - 1000 * 60 * 18,
    level: "error",
    title: "Illuminate\\Database\\Eloquent\\ModelNotFoundException: No query results for model [App\\Models\\Category] onbekend-onderdeel",
    message: "No query results for model [App\\Models\\Category] with slug: 'onbekend-onderdeel' in CategoryController.php:112",
    metadata: {
      project: "partsnl",
      domain: "partsnl.local",
      exception_class: "Illuminate\\Database\\Eloquent\\ModelNotFoundException",
      file: "app/Http/Controllers/Frontend/CategoryController.php",
      line: 112,
      code_snippet: [
        { line: 110, code: "    public function show(string $slug) {" },
        { line: 111, code: "        $category = Category::where('slug', $slug)" },
        { line: 112, code: "            ->where('is_active', 1)->firstOrFail();", highlight: true },
        { line: 113, code: "        return view('theme::shop.category', compact('category'));" }
      ],
      request: {
        method: "GET",
        url: "/onbekend-onderdeel",
        status: 404,
        ip: "84.241.19.12"
      },
      occurrences_last_24h: 8,
      affected_users: 6,
      status: "unresolved",
      tags: { env: "local", subsystem: "SEF Fallback Resolver" }
    }
  },
  {
    id: "evt-qry-01",
    type: "query",
    timestamp: Date.now() - 1000 * 60 * 6,
    level: "warning",
    title: "N+1 Query Bottleneck: Beekman\\Shops\\Models\\Articles\\ArticlePrices",
    message: "Executed 108 individual queries in loop: `SELECT * FROM article_prices WHERE article_id = ? AND debtor_id = ?`",
    durationMs: 840,
    metadata: {
      project: "partsnl",
      domain: "partsnl.local",
      sql: "SELECT * FROM `article_prices` WHERE `article_prices`.`article_id` = ? AND `article_prices`.`debtor_id` = 2 AND `valid_until` >= NOW() LIMIT 1",
      execution_count: 108,
      total_time_ms: 840,
      origin: "App\\Http\\Controllers\\Frontend\\CategoryController::getFallbackIndex (line 148)",
      code_snippet: [
        { line: 146, code: "    foreach ($articles as $article) {" },
        { line: 147, code: "        // N+1 query loop: missing with(['articlePrices']) eager loading" },
        { line: 148, code: "        $price = $article->articlePrices()->where('debtor_id', $debtorId)->first();", highlight: true },
        { line: 149, code: "        $article->resolved_price = $price?->price_cents;" },
        { line: 150, code: "    }" }
      ],
      explain_plan: {
        select_type: "SIMPLE",
        table: "article_prices",
        type: "ref",
        possible_keys: "idx_article_debtor",
        key: "idx_article_debtor",
        rows_examined: 108,
        cost: "42.0"
      },
      tags: { route: "GET /aansluitmateriaal/gas", framework: "Laravel 11.20" }
    }
  },
  {
    id: "evt-qry-02",
    type: "query",
    timestamp: Date.now() - 1000 * 60 * 14,
    level: "warning",
    title: "Slow Remote Query: 130.0.1.42 (beekman_live) -> category_images",
    message: "Query to remote MySQL (130.0.1.42) took 148ms due to network round-trip overhead.",
    durationMs: 148,
    metadata: {
      project: "beekman",
      domain: "beekman.local",
      sql: "SELECT `ci`.* FROM `category_images` AS `ci` INNER JOIN `categories` AS `c` ON `ci`.`category_id` = `c`.`id` WHERE `c`.`code` = 'aansluitmateriaal-gas' AND `ci`.`is_active` = 1",
      execution_count: 1,
      total_time_ms: 148,
      origin: "Beekman\\Shops\\Models\\Category::images (line 52)",
      tags: { host: "130.0.1.42", database: "beekman_live" }
    }
  },
  {
    id: "evt-job-01",
    type: "job",
    timestamp: Date.now() - 1000 * 60 * 12,
    level: "error",
    title: "App\\Jobs\\SyncArticlePricesJob - MaxAttemptsExceededException",
    message: "Job failed after 3 attempts. QueryException: Lock wait timeout exceeded on table article_prices during ERP delta sync from 130.0.1.42",
    durationMs: 18400,
    metadata: {
      project: "beekman",
      domain: "rest.beekman.local",
      job_class: "App\\Jobs\\SyncArticlePricesJob",
      queue: "pricing-sync",
      attempts: 3,
      max_tries: 3,
      backoff: [30, 60, 180],
      payload: { source: "mysql_remote 130.0.1.42", articles_count: 2450, delta_type: "b2b_prices" },
      exception_file: "app/Jobs/SyncArticlePricesJob.php:64"
    }
  },
  {
    id: "evt-job-02",
    type: "job",
    timestamp: Date.now() - 1000 * 60 * 5,
    level: "info",
    title: "App\\Jobs\\WarmCategoryCacheJob - Voltooid",
    message: "Category tree and fallback index warmed in Redis for partsnl.local and ersatzteileshop.local.",
    durationMs: 840,
    metadata: {
      project: "partsnl",
      domain: "partsnl.local",
      job_class: "App\\Jobs\\WarmCategoryCacheJob",
      queue: "catalogue-cache",
      attempts: 1,
      max_tries: 1,
      payload: { categories_warmed: 1255, redis_keys_stored: 48 },
      exception_file: ""
    }
  }
];
