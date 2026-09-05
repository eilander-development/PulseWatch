import express from "express";
import path from "path";
import dotenv from "dotenv";
import { LARAVEL_RECIPES, LaravelFixRecipe } from "./src/data/laravelRecipes";
import { RUN_160_REQ_216_QUERIES, RUN_160_REQ_217_QUERIES } from "./src/data/devstackRun160";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// In-Memory Recipes Datastore initialized from curated collection
let recipesStore: LaravelFixRecipe[] = [...LARAVEL_RECIPES];

// In-Memory Telemetry Datastore
interface TelemetryEvent {
  id: string;
  type: "exception" | "query" | "request" | "job" | "log";
  timestamp: number;
  level: "info" | "warning" | "error" | "critical";
  title: string;
  message?: string;
  durationMs?: number;
  metadata: Record<string, any>;
  resolved?: boolean;
}

// Pre-seeded realistic Laravel telemetry events inspired by Telescope, Pulse, Sentry & Nightwatch
let telemetryEvents: TelemetryEvent[] = [
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
      middleware_chain: {
        before: ["web", "safesefparts", "extraheaders", "force.noss1"],
        after: ["force.noss1", "extraheaders", "safesefparts", "web"]
      },
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
      loaded_models: {
        "Beekman\\Shops\\Models\\Configurations\\Overrides": 710,
        "Beekman\\Shops\\Models\\Configurations": 230,
        "Beekman\\Shops\\Models\\Articles\\ArticlePrices": 108,
        "App\\Models\\Brand": 48,
        "Beekman\\Shops\\Models\\PriceCache\\ConsumerPriceCache": 48,
        "Beekman\\Shops\\Models\\Assortment\\Articles\\Articles": 24,
        "App\\Models\\Article": 24,
        "Beekman\\Config\\Models\\Configs": 13
      },
      hotspots: [
        {
          id: "hs-1",
          frame: "Beekman\\Shops\\Services\\BeekmanPriceCalculation::initializeArticlePriceCache ×8",
          file: "app/Libraries/ArticleLibrary.php",
          line: 658,
          query_count: 8,
          total_time_ms: 30.1,
          reason: "• Herhaalde queries (mogelijke N+1)",
          reason_type: "n1",
          queries: [
            { id: "q-hs-1", sql: "SELECT `id`, `article_id`, `price`, `type` FROM `article_prices` WHERE `article_id` = ?", durationMs: 4.1, origin: "ArticleLibrary.php:658", is_duplicate: true, bindings: [10482] },
            { id: "q-hs-2", sql: "SELECT `id`, `article_id`, `price`, `type` FROM `article_prices` WHERE `article_id` = ?", durationMs: 3.8, origin: "ArticleLibrary.php:658", is_duplicate: true, bindings: [10483] },
            { id: "q-hs-3", sql: "SELECT `id`, `article_id`, `price`, `type` FROM `article_prices` WHERE `article_id` = ?", durationMs: 4.2, origin: "ArticleLibrary.php:658", is_duplicate: true, bindings: [10484] },
            { id: "q-hs-4", sql: "SELECT `id`, `article_id`, `price`, `type` FROM `article_prices` WHERE `article_id` = ?", durationMs: 3.9, origin: "ArticleLibrary.php:658", is_duplicate: true, bindings: [10485] },
            { id: "q-hs-5", sql: "SELECT `id`, `article_id`, `price`, `type` FROM `article_prices` WHERE `article_id` = ?", durationMs: 4.0, origin: "ArticleLibrary.php:658", is_duplicate: true, bindings: [10486] }
          ]
        },
        {
          id: "hs-2",
          frame: "App\\Providers\\RouteServiceProvider::defineWebType",
          file: "app/Providers/RouteServiceProvider.php",
          line: 120,
          query_count: 1,
          total_time_ms: 26.5,
          reason: "• Afwijkend langzame query",
          reason_type: "slow_query",
          queries: [
            { id: "q-hs-6", sql: "SELECT * FROM `domains` WHERE `host` = 'partsnl.local' AND `active` = 1 LIMIT 1", durationMs: 26.5, origin: "RouteServiceProvider.php:120", is_duplicate: false }
          ]
        },
        {
          id: "hs-3",
          frame: "App\\Services\\Category\\Levels::getNextImages ×4",
          file: "app/Services/Traits/GetIndex.php",
          line: 3416,
          query_count: 4,
          total_time_ms: 23.4,
          reason: "• Herhaalde queries (mogelijke N+1)",
          reason_type: "n1",
          queries: [
            { id: "q-hs-7", sql: "SELECT `id`, `category_id`, `image_path` FROM `category_images` WHERE `category_id` = ?", durationMs: 5.9, origin: "GetIndex.php:3416", is_duplicate: true, bindings: [204] },
            { id: "q-hs-8", sql: "SELECT `id`, `category_id`, `image_path` FROM `category_images` WHERE `category_id` = ?", durationMs: 5.8, origin: "GetIndex.php:3416", is_duplicate: true, bindings: [205] }
          ]
        },
        {
          id: "hs-4",
          frame: "App\\Libraries\\ArticleLibrary::fillArticleData ×4",
          file: "app/Services/Traits/GetIndex.php",
          line: 2890,
          query_count: 4,
          total_time_ms: 23.0,
          reason: "• Herhaalde queries (mogelijke N+1)"
        },
        {
          id: "hs-5",
          frame: "App\\Services\\Config::retrieveConfigValues ×3",
          file: "app/Services/Config.php",
          line: 43,
          query_count: 3,
          total_time_ms: 22.6,
          reason: "• Herhaalde queries (mogelijke N+1)"
        }
      ],
      http_calls: [
        {
          id: "http-1",
          method: "GET",
          url: "https://api.example.test/v2/availability",
          status: 200,
          duration_ms: 204,
          origin: "StockGateway.php:61",
          context: "vanuit GET /api/availability"
        }
      ],
      queries: RUN_160_REQ_216_QUERIES,
      breakdown: {
        database_pct: 61,
        external_pct: 0,
        php_pct: 39
      },
      primary_bottleneck: {
        category: "database",
        label: "Afwijkend langzame query & N+1 Herhaling",
        details: "Minimaal één query ligt op of boven de dynamische grens van 25 ms. Herhaalde queries in BeekmanPriceCalculation::initializeArticlePriceCache (8x).",
        impact_pct: 61
      },
      spans: [
        { id: "sp-part-1", name: "Laravel Bootstrap & Providers", category: "boot", startMs: 0, durationMs: 7.8, details: "Kernel boot, service providers" },
        { id: "sp-part-2", name: "Routing & Route Resolution", category: "boot", startMs: 7.8, durationMs: 64.8, details: "Route matching, URL rewrite inspection" },
        { id: "sp-part-3", name: "Middleware vóór controller", category: "middleware", startMs: 72.6, durationMs: 30.7, details: "web, safesefparts, extraheaders, force.noss1" },
        { id: "sp-part-4", name: "CategoryController@getFallbackIndex", category: "controller", startMs: 103.3, durationMs: 366.0, details: "Catalog fallback category controller" },
        { id: "sp-part-5", name: "View Rendering & Blade Template", category: "view", startMs: 469.3, durationMs: 61.2, details: "Render view frontend.categories.fallback" },
        { id: "sp-part-6", name: "Middleware ná controller", category: "middleware", startMs: 530.5, durationMs: 15.1, details: "force.noss1, extraheaders, safesefparts, web" },
        { id: "sp-part-7", name: "Response Preparation", category: "boot", startMs: 545.6, durationMs: 0.1, details: "HTTP headers sent to client" }
      ]
    }
  },
  {
    id: "evt-req-parts-02",
    type: "request",
    timestamp: Date.now() - 1000 * 60 * 2.5,
    level: "info",
    title: "GET /doe-het-zelf",
    durationMs: 402.5,
    metadata: {
      status: 200,
      memory_peak_mb: 8.4,
      db_queries_count: 61,
      db_time_ms: 244.8,
      external_http_time_ms: 0,
      php_execution_time_ms: 157.7,
      queries: RUN_160_REQ_217_QUERIES,
      controller: "App\\Http\\Controllers\\Frontend\\DiyController@index",
      route_pattern: "GET /doe-het-zelf",
      domain: "partsnl.local",
      run_id: "run-160",
      models_count: 840,
      middleware: ["web", "safesefparts"],
      middleware_chain: {
        before: ["web", "safesefparts"],
        after: ["safesefparts", "web"]
      },
      laravel_context: {
        markers: {
          provider_ready: 8192000,
          laravel_booted: 50290000,
          before_middleware_started: 50310000,
          route_matched: 68700000,
          action_started: 78900000,
          controller_started: 79000000,
          controller_finished: 359000000,
          preparing_response: 402200000,
          render_started: 359100000,
          response_prepared: 402300000,
          after_middleware_started: 393200000,
          sending_started: 402450000,
          request_handled: 402500000
        }
      },
      lifecycle_phases: {
        bootstrap_ms: 8.2,
        routing_ms: 42.1,
        middleware_before_ms: 18.4,
        controller_ms: 280.0,
        render_ms: 44.5,
        middleware_after_ms: 9.1,
        response_ms: 0.2,
        unassigned_ms: 0.0,
        total_ms: 402.5
      },
      loaded_models: {
        "Beekman\\Shops\\Models\\Configurations\\Overrides": 420,
        "App\\Models\\DiyArticle": 120,
        "App\\Models\\Brand": 32
      },
      breakdown: {
        database_pct: 60,
        external_pct: 0,
        php_pct: 40
      }
    }
  },
  {
    id: "evt-req-run-159",
    type: "request",
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    level: "warning",
    title: "GET /aansluitmateriaal/gas (Baseline vóór optimalisatie)",
    durationMs: 1420.2,
    metadata: {
      status: 200,
      memory_peak_mb: 16.4,
      db_queries_count: 198,
      db_time_ms: 890.1,
      external_http_time_ms: 0,
      php_execution_time_ms: 530.1,
      controller: "App\\Http\\Controllers\\Frontend\\CategoryController@getFallbackIndex",
      route_pattern: "GET {fallbackPlaceholder}",
      domain: "partsnl.local",
      run_id: "run-159",
      models_count: 2480,
      middleware: ["web", "safesefparts", "extraheaders", "force.noss1"],
      lifecycle_phases: {
        bootstrap_ms: 12.4,
        routing_ms: 84.1,
        middleware_before_ms: 42.6,
        controller_ms: 1120.0,
        render_ms: 142.5,
        middleware_after_ms: 18.4,
        response_ms: 0.2,
        unassigned_ms: 0.0,
        total_ms: 1420.2
      },
      breakdown: {
        database_pct: 63,
        external_pct: 0,
        php_pct: 37
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
      project: "beekman",
      domain: "rest.beekman.local",
      status: 200,
      memory_peak_mb: 14.5,
      db_queries_count: 14,
      db_time_ms: 48.2,
      external_http_time_ms: 0,
      php_execution_time_ms: 137.0,
      controller: "App\\Http\\Controllers\\Api\\ArticleSearchController@search",
      models_count: 48,
      breakdown: {
        database_pct: 26,
        external_pct: 0,
        php_pct: 74
      },
      spans: [
        { id: "sp-r1", name: "Laravel Boot & Auth", category: "boot", startMs: 0, durationMs: 16 },
        { id: "sp-r2", name: "Redis Cache::get('articles:search:gasslang')", category: "cache", startMs: 16, durationMs: 1.2, details: "devstack-global-redis:6379 (HIT)" },
        { id: "sp-r3", name: "ArticleSearchController@search", category: "controller", startMs: 18, durationMs: 152 },
        { id: "sp-r4", name: "Hydrate 48 Article Models", category: "view", startMs: 170, durationMs: 15.2 }
      ],
      queries: [
        { id: "qr-1", sql: "SELECT `id`, `code`, `name` FROM `articles` WHERE `code` LIKE 'GAS%' LIMIT 48", durationMs: 24.2, origin: "ArticleSearchController:42" },
        { id: "qr-2", sql: "SELECT `article_id`, `price_cents` FROM `article_prices` WHERE `article_id` IN (412, 413, 414) AND `debtor_id` = 1", durationMs: 18.4, origin: "ArticlePriceRepository:52" }
      ]
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
      project: "beekman",
      domain: "ersatzteileshop.local",
      status: 200,
      memory_peak_mb: 8.5,
      db_queries_count: 68,
      db_time_ms: 228.4,
      external_http_time_ms: 0,
      php_execution_time_ms: 213.6,
      controller: "App\\Http\\Controllers\\Frontend\\CategoryController@getFallbackIndex",
      models_count: 1180,
      breakdown: {
        database_pct: 52,
        external_pct: 0,
        php_pct: 48
      }
    }
  },
  {
    id: "evt-req-b2b-01",
    type: "request",
    timestamp: Date.now() - 1000 * 60 * 15,
    level: "info",
    title: "GET /assortiment/aansluitmateriaal",
    durationMs: 310.0,
    metadata: {
      project: "beekman",
      domain: "beekman.local",
      status: 200,
      memory_peak_mb: 12.8,
      db_queries_count: 38,
      db_time_ms: 145.2,
      external_http_time_ms: 0,
      php_execution_time_ms: 164.8,
      controller: "App\\Http\\Controllers\\B2B\\CatalogController@index",
      models_count: 420,
      breakdown: {
        database_pct: 47,
        external_pct: 0,
        php_pct: 53
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
    id: "evt-err-03",
    type: "exception",
    timestamp: Date.now() - 1000 * 60 * 22,
    level: "critical",
    title: "GuzzleHttp\\Exception\\ConnectException: Failed to connect to rest.beekman.local port 443: Connection refused",
    message: "cURL error 7: Failed to connect to rest.beekman.local port 443: Connection refused (see https://curl.haxx.se/libcurl/c/libcurl-errors.html) for https://rest.beekman.local/v1/stock/bulk-check",
    metadata: {
      project: "beekman",
      domain: "partsnl.local",
      exception_class: "GuzzleHttp\\Exception\\ConnectException",
      file: "app/Services/BeekmanRestApiClient.php",
      line: 42,
      code_snippet: [
        { line: 39, code: "        $client = new Client(['base_uri' => config('services.beekman.rest_url')]);" },
        { line: 40, code: "        $response = $client->post('/v1/stock/bulk-check', [" },
        { line: 41, code: "            'json' => ['article_numbers' => $articleNumbers]," },
        { line: 42, code: "            'timeout' => 2.0", highlight: true },
        { line: 43, code: "        ]);" }
      ],
      breadcrumbs: [
        { category: "request", message: "GET /aansluitmateriaal/gas (partsnl.local)", time: "-240ms" },
        { category: "db", message: "SELECT * FROM `article_prices` WHERE `article_id` = 412 [1.8ms]", time: "-190ms" },
        { category: "http", message: "POST https://rest.beekman.local/v1/stock/bulk-check", time: "-100ms" },
        { category: "exception", message: "ConnectException: Connection refused [Errno 111]", time: "0ms" }
      ],
      request: {
        method: "GET",
        url: "/aansluitmateriaal/gas",
        status: 500,
        ip: "82.161.44.19"
      },
      occurrences_last_24h: 14,
      affected_users: 11,
      status: "unresolved",
      tags: { env: "local", subsystem: "Stock Bulk-Check Gateway" }
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
    id: "evt-qry-03",
    type: "query",
    timestamp: Date.now() - 1000 * 60 * 20,
    level: "warning",
    title: "N+1 Overrides Memory Bottleneck: Beekman\\Shops\\Models\\Configurations\\Overrides",
    message: "Hydrated 710 Overrides model instances into PHP memory for route GET /aansluitmateriaal/gas (14.2 MB memory).",
    durationMs: 384,
    metadata: {
      project: "partsnl",
      domain: "partsnl.local",
      sql: "SELECT * FROM `overrides` WHERE `configuration_id` = ? LIMIT 1",
      execution_count: 230,
      total_time_ms: 384,
      origin: "Beekman\\Shops\\Services\\ConfigurationResolver::resolveOverrides (line 78)",
      tags: { models_hydrated: 710, memory_impact: "14.2MB" }
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

// System Pulse & Sentinel metrics
function calculateStats() {
  const now = Date.now();
  const lastHourEvents = telemetryEvents.filter(e => e.timestamp >= now - 1000 * 60 * 60);
  const errorEvents = lastHourEvents.filter(e => e.level === "error" || e.level === "critical");
  const slowQueries = lastHourEvents.filter(e => e.type === "query" && (e.durationMs || 0) > 300);
  const requestEvents = lastHourEvents.filter(e => e.type === "request");

  const totalRequests = requestEvents.length || 1840;
  const avgLatency = Math.round(
    requestEvents.reduce((acc, curr) => acc + (curr.durationMs || 120), 0) / (requestEvents.length || 1)
  );

  return {
    requests_per_second: (totalRequests / 3600 * 18).toFixed(1), // scaled to live active RPS
    avg_latency_ms: avgLatency || 148,
    p95_latency_ms: Math.round(avgLatency * 2.8),
    p99_latency_ms: Math.round(avgLatency * 4.4),
    error_count: errorEvents.length,
    error_rate_pct: ((errorEvents.length / (totalRequests || 1)) * 100).toFixed(2),
    slow_queries_count: slowQueries.length,
    active_queue_workers: 8,
    queue_backlog: 14,
    redis_hit_ratio_pct: 94.6,
    cpu_usage_pct: 28.4,
    memory_usage_mb: 312.4,
    total_events: telemetryEvents.length,
    sentinel_status: errorEvents.length > 5 ? "warning" : "healthy"
  };
}

// REST Endpoints
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "PulseWatch", timestamp: Date.now() });
});

app.get("/api/telemetry/stats", (_req, res) => {
  res.json(calculateStats());
});

app.get("/api/telemetry/events", (req, res) => {
  const { type, level, limit = "100" } = req.query;
  let filtered = [...telemetryEvents];
  if (type && type !== "all") {
    filtered = filtered.filter(e => e.type === type);
  }
  if (level && level !== "all") {
    filtered = filtered.filter(e => e.level === level);
  }
  filtered.sort((a, b) => b.timestamp - a.timestamp);
  res.json(filtered.slice(0, parseInt(limit as string, 10)));
});

// Profiler Runs
let profilerRuns = [
  {
    id: "run-160",
    label: "parts-regression",
    status: "completed",
    domain: "partsnl.local",
    run_number: 160,
    timestamp: Date.now() - 1000 * 60 * 12,
    flow_duration_ms: 960.5,
    requests_count: 2,
    queries_count: 134,
    cache_hits_pct: null,
    memory_peak_mb: 10.2,
    overhead_pct: 0.67,
    request_ids: ["evt-req-parts-01", "evt-req-parts-02"]
  },
  {
    id: "run-159",
    label: "parts-regression",
    status: "warning",
    domain: "partsnl.local",
    run_number: 159,
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    flow_duration_ms: 1420.2,
    requests_count: 2,
    queries_count: 198,
    cache_hits_pct: null,
    memory_peak_mb: 16.4,
    overhead_pct: 0.82,
    request_ids: ["evt-req-run-159"]
  }
];

// Projects Store
export interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  environment: "production" | "staging" | "local" | "multi";
  domains: string[];
  total_requests: number;
  total_runs: number;
  last_seen: string;
  color: string;
  framework?: "laravel-vue" | "laravel-blade" | "laravel-api";
  vue_version?: string;
}

let projects: ProjectItem[] = [
  {
    id: "proj-beekman",
    name: "Beekman Multi-Domein",
    slug: "beekman",
    environment: "local",
    domains: ["beekman.local", "partsnl.local", "ersatzteileshop.local", "onderdelen_nl.local", "rest.beekman.local"],
    total_requests: 512,
    total_runs: 64,
    last_seen: "Zojuist (actief)",
    color: "rose",
    framework: "laravel-vue",
    vue_version: "3.4"
  },
  {
    id: "proj-backoffice",
    name: "Backoffice (Vue + Vite)",
    slug: "backoffice",
    environment: "local",
    domains: ["backoffice.test", "vite.backoffice.test"],
    total_requests: 284,
    total_runs: 32,
    last_seen: "1 minuut geleden",
    color: "teal",
    framework: "laravel-vue",
    vue_version: "3.4"
  },
  {
    id: "proj-1",
    name: "Partsnl E-Commerce Engine",
    slug: "partsnl-engine",
    environment: "production",
    domains: ["partsnl.local", "ersatzteileshop.local", "onderdelen_nl.local"],
    total_requests: 384,
    total_runs: 48,
    last_seen: "3 minuten geleden",
    color: "blue",
    framework: "laravel-vue"
  },
  {
    id: "proj-2",
    name: "B2B Orders & Invoicing API",
    slug: "b2b-orders-api",
    environment: "production",
    domains: ["api.beekman.local"],
    total_requests: 120,
    total_runs: 16,
    last_seen: "5 minuten geleden",
    color: "emerald",
    framework: "laravel-api"
  }
];

// SSE Clients for Real-time streaming
const sseClients = new Set<express.Response>();

function broadcastSSE(type: string, payload: any) {
  const message = `data: ${JSON.stringify({ type, payload, timestamp: Date.now() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

// SSE Endpoint
app.get("/api/telemetry/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no"
  });

  res.write(`data: ${JSON.stringify({ type: "connected", clientsCount: sseClients.size + 1, timestamp: Date.now() })}\n\n`);

  sseClients.add(res);

  // Keep-alive ping every 20s
  const pingTimer = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      clearInterval(pingTimer);
      sseClients.delete(res);
    }
  }, 20000);

  req.on("close", () => {
    clearInterval(pingTimer);
    sseClients.delete(res);
  });
});

// Projects Endpoints
app.get("/api/projects", (_req, res) => {
  res.json(projects);
});

app.post("/api/projects", (req, res) => {
  const { name, slug, domains = [], environment = "production", color = "blue" } = req.body;
  if (!name || !slug) {
    return res.status(400).json({ error: "Name and slug are required" });
  }

  const existing = projects.find(p => p.slug === slug);
  if (existing) {
    existing.name = name;
    existing.domains = Array.from(new Set([...existing.domains, ...domains]));
    existing.environment = environment;
    return res.json({ success: true, project: existing });
  }

  const newProject: ProjectItem = {
    id: "proj-" + Math.random().toString(36).substr(2, 9),
    name,
    slug,
    environment,
    domains,
    total_requests: 0,
    total_runs: 0,
    last_seen: "Nieuw aangemaakt",
    color
  };

  projects.push(newProject);
  broadcastSSE("projects_updated", projects);
  res.status(201).json({ success: true, project: newProject });
});

app.get("/api/telemetry/runs", (_req, res) => {
  res.json(profilerRuns);
});

// Telemetry Ingestion (Laravel Native Probe / Agent endpoint)
app.post("/api/telemetry/ingest", (req, res) => {
  const body = req.body || {};
  const projectHeader = (req.headers["x-profiler-project"] as string) || body.project || "partsnl-engine";
  const domainHeader = (req.headers["x-profiler-domain"] as string) || (req.headers.host as string) || body.metadata?.domain || "partsnl.local";
  const envHeader = (req.headers["x-profiler-env"] as string) || body.metadata?.environment || "production";

  // Update or register project
  let project = projects.find(p => p.slug === projectHeader);
  if (!project) {
    project = {
      id: "proj-" + Math.random().toString(36).substr(2, 9),
      name: body.project_name || projectHeader,
      slug: projectHeader,
      environment: envHeader,
      domains: [domainHeader],
      total_requests: 0,
      total_runs: 0,
      last_seen: "Zojuist (actief)",
      color: "blue"
    };
    projects.push(project);
    broadcastSSE("projects_updated", projects);
  } else {
    project.total_requests += 1;
    project.last_seen = "Zojuist (actief)";
    if (domainHeader && !project.domains.includes(domainHeader)) {
      project.domains.push(domainHeader);
    }
  }

  const newEvent: TelemetryEvent = {
    id: body.id || "evt-" + Math.random().toString(36).substr(2, 9),
    type: body.type || "request",
    timestamp: body.timestamp || new Date().toISOString(),
    level: body.level || (body.durationMs > 500 ? "warning" : "info"),
    title: body.title || `${body.method || "GET"} ${body.path || "/api"}`,
    message: body.message || `Request verwerkt via ${domainHeader}`,
    durationMs: body.durationMs || (body.metadata?.duration_ms || 120),
    metadata: {
      ...body.metadata,
      project: projectHeader,
      domain: domainHeader,
      environment: envHeader,
      method: body.method || body.metadata?.method || "GET",
      status: body.status || body.metadata?.status || 200,
    },
  };

  telemetryEvents.unshift(newEvent);
  if (telemetryEvents.length > 500) {
    telemetryEvents = telemetryEvents.slice(0, 500);
  }

  // If this payload also contains full run details, update profilerRuns
  if (body.run) {
    const runPayload = body.run;
    profilerRuns.unshift(runPayload);
    if (profilerRuns.length > 100) profilerRuns = profilerRuns.slice(0, 100);
    project.total_runs += 1;
    broadcastSSE("new_run", runPayload);
  }

  // Broadcast event immediately via SSE
  broadcastSSE("new_event", newEvent);

  res.status(201).json({ success: true, event_id: newEvent.id, project: project.slug });
});

// Mark resolved
app.post("/api/telemetry/resolve/:id", (req, res) => {
  const { id } = req.params;
  const ev = telemetryEvents.find(e => e.id === id);
  if (ev) {
    ev.resolved = true;
    return res.json({ success: true, event: ev });
  }
  res.status(404).json({ error: "Event not found" });
});

// Clear events
app.post("/api/telemetry/clear", (_req, res) => {
  telemetryEvents = [];
  res.json({ success: true, message: "Telemetry flushed" });
});

// In-Memory Dump Server Datastore (Laravel Dump Server / Ray / dd() / dump())
interface DumpEntry {
  id: string;
  timestamp: number;
  type: "dump" | "dd" | "measure" | "query" | "log";
  label?: string;
  origin: {
    file: string;
    line: number;
    class?: string;
    method?: string;
  };
  payload: any;
  execution_time_ms?: number;
  memory_usage_mb?: number;
}

let dumpEntries: DumpEntry[] = [
  {
    id: "dmp-1",
    timestamp: Date.now() - 1000 * 45,
    type: "dd",
    label: "dd($order->items->load('product'))",
    origin: {
      file: "app/Http/Controllers/CheckoutController.php",
      line: 89,
      class: "App\\Http\\Controllers\\CheckoutController",
      method: "process"
    },
    payload: {
      "#class": "Illuminate\\Database\\Eloquent\\Collection",
      "#count": 2,
      "items": [
        {
          "#class": "App\\Models\\OrderItem",
          "id": 401,
          "order_id": 48102,
          "product_id": 194,
          "quantity": 2,
          "unit_price": 49.95,
          "total_price": 99.90,
          "relations": {
            "product": {
              "#class": "App\\Models\\Product",
              "id": 194,
              "sku": "TECH-KEYB-RGB",
              "name": "Mechanical Keyboard Pro NL",
              "in_stock": 14,
              "price": 49.95,
              "vat_rate": 0.21
            }
          }
        },
        {
          "#class": "App\\Models\\OrderItem",
          "id": 402,
          "order_id": 48102,
          "product_id": 204,
          "quantity": 1,
          "unit_price": 19.50,
          "total_price": 19.50,
          "relations": {
            "product": {
              "#class": "App\\Models\\Product",
              "id": 204,
              "sku": "ACC-CABLE-USBC",
              "name": "Braided USB-C Cable 2m",
              "in_stock": 42,
              "price": 19.50,
              "vat_rate": 0.21
            }
          }
        }
      ]
    },
    execution_time_ms: 2.4,
    memory_usage_mb: 28.4
  },
  {
    id: "dmp-2",
    timestamp: Date.now() - 1000 * 120,
    type: "dump",
    label: "dump(ReportGeneratorService::getMetrics())",
    origin: {
      file: "app/Services/ReportGeneratorService.php",
      line: 142,
      class: "App\\Services\\ReportGeneratorService",
      method: "aggregateMonthly"
    },
    payload: {
      "checkpoint": "Completed 42 sub-queries & tax calculations",
      "total_duration": "1,820 ms",
      "memory_delta": "+52.1 MB",
      "advice": "Consider caching or replacing N+1 loop with DB::table('orders')->join()"
    },
    execution_time_ms: 1820.0,
    memory_usage_mb: 74.2
  },
  {
    id: "dmp-3",
    timestamp: Date.now() - 1000 * 240,
    type: "dump",
    label: "dump(auth()->user())",
    origin: {
      file: "app/Http/Middleware/EnsureUserHasRole.php",
      line: 34,
      class: "App\\Http\\Middleware\\EnsureUserHasRole",
      method: "handle"
    },
    payload: {
      "#class": "App\\Models\\User",
      "id": 1042,
      "name": "Mark Eilander",
      "email": "mark.eilander@enterprise.nl",
      "email_verified_at": "2026-01-14T09:30:00.000000Z",
      "role": "admin",
      "permissions": ["view-analytics", "manage-users", "export-financial-reports"],
      "created_at": "2025-11-02T14:22:10.000000Z"
    },
    execution_time_ms: 0.8,
    memory_usage_mb: 18.2
  },
  {
    id: "dmp-4",
    timestamp: Date.now() - 1000 * 360,
    type: "query",
    label: "dump(DB::getQueryLog())",
    origin: {
      file: "app/Http/Controllers/Api/DashboardController.php",
      line: 52,
      class: "App\\Http\\Controllers\\Api\\DashboardController",
      method: "recentOrders"
    },
    payload: [
      {
        "query": "select * from `orders` order by `created_at` desc limit 50",
        "bindings": [],
        "time": "45.12ms"
      },
      {
        "query": "select * from `order_items` where `order_id` = ? limit 1",
        "bindings": [48102],
        "time": "14.05ms"
      },
      {
        "query": "select * from `order_items` where `order_id` = ? limit 1",
        "bindings": [48103],
        "time": "12.80ms"
      }
    ],
    execution_time_ms: 71.97,
    memory_usage_mb: 32.1
  }
];

// GET dumps
app.get("/api/telemetry/dumps", (_req, res) => {
  res.json(dumpEntries);
});

// POST dump / dd()
app.post("/api/telemetry/dump", (req, res) => {
  const { type = "dump", label, origin, payload, execution_time_ms, memory_usage_mb } = req.body;
  const newDump: DumpEntry = {
    id: "dmp-" + Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    type: type || "dump",
    label: label || `${type}() caller`,
    origin: origin || { file: "app/Http/Controllers/TestController.php", line: 42 },
    payload: payload || {},
    execution_time_ms: execution_time_ms || Math.round(Math.random() * 10 * 10) / 10,
    memory_usage_mb: memory_usage_mb || Math.round((16 + Math.random() * 20) * 10) / 10
  };

  dumpEntries.unshift(newDump);
  if (dumpEntries.length > 200) {
    dumpEntries = dumpEntries.slice(0, 200);
  }
  broadcastSSE("new_dump", newDump);
  res.status(201).json({ success: true, dump: newDump });
});

// Clear dumps
app.post("/api/telemetry/dumps/clear", (_req, res) => {
  dumpEntries = [];
  res.json({ success: true, message: "Dumps cleared" });
});

// Tinker Expression Evaluator / Scratchpad
app.post("/api/telemetry/tinker/eval", (req, res) => {
  const { code } = req.body;
  const trimmed = (code || "").trim();

  const start = performance.now();
  let result: any = null;
  let type = "unknown";

  // Simulate Laravel Tinker evaluator responses for common expressions
  if (trimmed.includes("User::count()") || trimmed.includes("User::all()->count()")) {
    result = 12480;
    type = "int";
  } else if (trimmed.includes("User::find") || trimmed.includes("User::where")) {
    result = {
      "#class": "App\\Models\\User",
      "id": 1042,
      "name": "Mark Eilander",
      "email": "mark.eilander@enterprise.nl",
      "status": "active",
      "created_at": "2025-11-02 14:22:10"
    };
    type = "App\\Models\\User";
  } else if (trimmed.includes("DB::table('orders')->sum('amount')") || trimmed.includes("sum(")) {
    result = 489240.50;
    type = "float (EUR)";
  } else if (trimmed.includes("Order::with('items')") || trimmed.includes("with(")) {
    result = {
      "#message": "Eager loaded relations in 2 queries (eliminated N+1!)",
      "queries_count": 2,
      "total_time": "14.2ms",
      "sample": [
        { "order_id": 48102, "customer": "Mark Eilander", "items_count": 3 },
        { "order_id": 48103, "customer": "Sara Visser", "items_count": 1 }
      ]
    };
    type = "Illuminate\\Database\\Eloquent\\Collection";
  } else if (trimmed.includes("collect(") || trimmed.includes("->map(")) {
    result = [
      { "id": 1, "status": "approved", "processed_at": "2026-09-04 15:20:00" },
      { "id": 2, "status": "approved", "processed_at": "2026-09-04 15:20:01" }
    ];
    type = "Illuminate\\Support\\Collection";
  } else if (trimmed.includes("Cache::get") || trimmed.includes("Cache::")) {
    result = { "hit": true, "key": "reports:monthly:2026-08", "value": { "revenue": 142800, "currency": "EUR" } };
    type = "array (Redis cached)";
  } else {
    result = {
      "evaluated": trimmed,
      "output": `=> Executed successfully in Laravel 11.x sandbox`,
      "status": "success"
    };
    type = "mixed";
  }

  const duration = Math.round((performance.now() - start + 2.5) * 10) / 10;

  // Also push to dump server automatically as an interactive dd/eval entry!
  const newDump: DumpEntry = {
    id: "dmp-" + Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    type: "dump",
    label: `Tinker: ${trimmed.slice(0, 60)}${trimmed.length > 60 ? "..." : ""}`,
    origin: {
      file: "artisan tinker (Interactive Session)",
      line: 1
    },
    payload: result,
    execution_time_ms: duration,
    memory_usage_mb: 19.4
  };
  dumpEntries.unshift(newDump);

  res.json({
    success: true,
    result,
    type,
    durationMs: duration,
    memoryMb: 19.4
  });
});

// ==========================================
// Laravel Recipes Catalog Endpoints
// ==========================================

// Get all recipes
app.get("/api/recipes", (_req, res) => {
  res.json({
    success: true,
    total: recipesStore.length,
    recipes: recipesStore
  });
});

// Add a new recipe or update
app.post("/api/recipes", (req, res) => {
  const recipeData: Partial<LaravelFixRecipe> = req.body;
  if (!recipeData.title || !recipeData.solutionTitle) {
    return res.status(400).json({ error: "title en solutionTitle zijn verplicht." });
  }

  const recipeId = recipeData.id || `recipe-${Date.now()}`;
  const existingIdx = recipesStore.findIndex(r => r.id === recipeId);

  const fullRecipe: LaravelFixRecipe = {
    id: recipeId,
    title: recipeData.title || "Custom Laravel Fix",
    category: recipeData.category || "performance",
    badge: recipeData.badge || "Custom / Developer Recipe",
    tags: Array.isArray(recipeData.tags) ? recipeData.tags : ["custom", "fix"],
    patterns: Array.isArray(recipeData.patterns) ? recipeData.patterns : [],
    symptom: recipeData.symptom || "Aangepast probleem of knelpunt.",
    rootCause: recipeData.rootCause || "Analyse van de oorzaak.",
    solutionTitle: recipeData.solutionTitle || "Aanbevolen oplossing",
    laravelVersions: recipeData.laravelVersions || "Laravel 10, 11+",
    speedup: recipeData.speedup || "Verbeterde doorlooptijd",
    codeSnippet: recipeData.codeSnippet || "// Voer hier de fix code in",
    diffSnippet: recipeData.diffSnippet,
    bestPractices: Array.isArray(recipeData.bestPractices) ? recipeData.bestPractices : [
      "Test altijd in lokale Docker omgeving alvorens live te zetten",
      "Documenteer veranderingen in je pull request"
    ],
    documentationUrl: recipeData.documentationUrl || "https://laravel.com/docs"
  };

  if (existingIdx >= 0) {
    recipesStore[existingIdx] = fullRecipe;
  } else {
    recipesStore.unshift(fullRecipe);
  }

  broadcastSSE("recipe_updated", fullRecipe);
  res.status(201).json({ success: true, recipe: fullRecipe, isNew: existingIdx === -1 });
});

// Update specific recipe
app.put("/api/recipes/:id", (req, res) => {
  const { id } = req.params;
  const idx = recipesStore.findIndex(r => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Recept niet gevonden" });
  }

  recipesStore[idx] = {
    ...recipesStore[idx],
    ...req.body,
    id
  };

  broadcastSSE("recipe_updated", recipesStore[idx]);
  res.json({ success: true, recipe: recipesStore[idx] });
});

// Delete a recipe
app.delete("/api/recipes/:id", (req, res) => {
  const { id } = req.params;
  recipesStore = recipesStore.filter(r => r.id !== id);
  broadcastSSE("recipe_deleted", { id });
  res.json({ success: true, message: `Recept ${id} verwijderd` });
});

// Import bulk recipes (from external JSON or API)
app.post("/api/recipes/import", (req, res) => {
  const { recipes } = req.body;
  if (!Array.isArray(recipes)) {
    return res.status(400).json({ error: "Verwachtte een array van recepten in { recipes: [...] }" });
  }

  let importedCount = 0;
  for (const r of recipes) {
    if (r.title && r.solutionTitle) {
      const id = r.id || `imported-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const existing = recipesStore.findIndex(item => item.id === id);
      const formatted: LaravelFixRecipe = {
        id,
        title: r.title,
        category: r.category || "performance",
        badge: r.badge || "Geïmporteerd Recept",
        tags: Array.isArray(r.tags) ? r.tags : ["imported"],
        patterns: Array.isArray(r.patterns) ? r.patterns : [],
        symptom: r.symptom || "",
        rootCause: r.rootCause || "",
        solutionTitle: r.solutionTitle || "",
        laravelVersions: r.laravelVersions || "Laravel 11+",
        speedup: r.speedup || "Geoptimaliseerd",
        codeSnippet: r.codeSnippet || "",
        bestPractices: Array.isArray(r.bestPractices) ? r.bestPractices : [],
        documentationUrl: r.documentationUrl
      };

      if (existing >= 0) {
        recipesStore[existing] = formatted;
      } else {
        recipesStore.unshift(formatted);
      }
      importedCount++;
    }
  }

  broadcastSSE("recipes_reloaded", { total: recipesStore.length });
  res.json({ success: true, imported: importedCount, total: recipesStore.length });
});

// Reset to factory default recipes
app.post("/api/recipes/reset", (_req, res) => {
  recipesStore = [...LARAVEL_RECIPES];
  broadcastSSE("recipes_reloaded", { total: recipesStore.length });
  res.json({ success: true, total: recipesStore.length, message: "Standaard recepten hersteld" });
});

// Safeguard: Ensure any unhandled /api routes return clean JSON 404 rather than Vite HTML
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: "API endpoint not found", path: req.path });
});

// Vite Middleware Integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PulseWatch Laravel APM Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical error starting server:", err);
  process.exit(1);
});
