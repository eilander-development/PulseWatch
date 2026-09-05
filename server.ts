import express from "express";
import path from "path";
import dotenv from "dotenv";
import { LARAVEL_RECIPES, LaravelFixRecipe } from "./src/data/laravelRecipes";

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
      queries: [
        {
          id: "q-part-1",
          sql: "SELECT `id`, `domain_id`, `meta_title`, `canonical_url` FROM `seo_configurations` WHERE `domain_id` = ? AND `path` = ? LIMIT 1",
          durationMs: 29.3,
          origin: "app/Providers/RouteServiceProvider.php:120 · App\\Providers\\RouteServiceProvider::defineWebType · GET /aansluitmateriaal/gas",
          bindings: [1, "/aansluitmateriaal/gas"]
        },
        {
          id: "q-part-2",
          sql: "SELECT `id`, `article_id`, `price`, `type` FROM `article_prices` WHERE `article_id` IN (?, ?, ?, ?, ?, ?, ?, ?)",
          durationMs: 30.1,
          origin: "app/Libraries/ArticleLibrary.php:658 · Beekman\\Shops\\Services\\BeekmanPriceCalculation::initializeArticlePriceCache",
          is_duplicate: true,
          duplicate_count: 8,
          bindings: [10482, 10483, 10484, 10485, 10486, 10487, 10488, 10489]
        },
        {
          id: "q-part-3",
          sql: "SELECT * FROM `configurations` WHERE `shop_id` = ? AND `active` = 1",
          durationMs: 14.8,
          origin: "app/Services/Config.php:43 · App\\Services\\Config::retrieveConfigValues",
          bindings: [4]
        },
        {
          id: "q-part-4",
          sql: "SELECT `id`, `category_id`, `image_path` FROM `category_images` WHERE `category_id` IN (?, ?, ?, ?)",
          durationMs: 23.4,
          origin: "app/Services/Traits/GetIndex.php:3416 · App\\Services\\Category\\Levels::getNextImages",
          is_duplicate: true,
          duplicate_count: 4,
          bindings: [204, 205, 206, 207]
        }
      ],
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
    id: "evt-err-03",
    type: "exception",
    timestamp: Date.now() - 1000 * 60 * 7,
    level: "critical",
    title: "[Vue warn]: Unhandled error during execution of render function in <OrderHistory.vue>",
    message: "TypeError: Cannot read properties of undefined (reading 'items') at Proxy.render (resources/js/Pages/Orders/OrderHistory.vue:48:22)",
    metadata: {
      project: "backoffice",
      domain: "backoffice.test",
      client_framework: "vue",
      vue_component: "OrderHistory.vue",
      related_trace_id: "req-v-77821",
      exception_class: "VueRenderException",
      file: "resources/js/Pages/Orders/OrderHistory.vue",
      line: 48,
      code_snippet: [
        { line: 45, code: "  <template #body>" },
        { line: 46, code: "    <div class=\"space-y-4\">" },
        { line: 47, code: "      <h3 class=\"text-lg font-bold\">Bestelregels</h3>" },
        { line: 48, code: "      <div v-for=\"item in order.items\" :key=\"item.id\">", highlight: true },
        { line: 49, code: "        <span>{{ item.product_name }}</span>" }
      ],
      breadcrumbs: [
        { category: "navigation", message: "Inertia.visit('/orders/48102')", time: "-180ms" },
        { category: "request", message: "GET /orders/48102 (Status 200)", time: "-90ms" },
        { category: "ui", message: "User clicked tab 'Geschiedenis & Regels'", time: "-20ms" },
        { category: "exception", message: "Order data prop missing `items` relation key in Inertia payload", time: "0ms" }
      ],
      request: {
        method: "GET",
        url: "/orders/48102",
        status: 500,
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0",
        ip: "10.0.4.12",
        user_id: 88,
        user_email: "operator@backoffice.test"
      },
      occurrences_last_24h: 19,
      affected_users: 7,
      status: "unresolved",
      tags: { env: "local", framework: "Vue 3.4 + Inertia.js" }
    }
  },
  {
    id: "evt-err-04",
    type: "exception",
    timestamp: Date.now() - 1000 * 60 * 14,
    level: "critical",
    title: "GuzzleHttp\\Exception\\ConnectException: Connection refused to rest.beekman.local:8080",
    message: "cURL error 7: Failed to connect to rest.beekman.local port 8080: Connection refused (see https://curl.haxx.se/libcurl/c/libcurl-errors.html) for http://rest.beekman.local:8080/v1/stock/bulk-check",
    metadata: {
      project: "beekman",
      domain: "partsnl.local",
      exception_class: "GuzzleHttp\\Exception\\ConnectException",
      file: "app/Services/BeekmanRestApiClient.php",
      line: 82,
      code_snippet: [
        { line: 79, code: "        $client = new Client(['base_uri' => config('services.beekman.rest_url')]);" },
        { line: 80, code: "        $response = $client->post('/v1/stock/bulk-check', [" },
        { line: 81, code: "            'json' => ['article_numbers' => $articleNumbers]," },
        { line: 82, code: "            'timeout' => 2.0", highlight: true },
        { line: 83, code: "        ]);" }
      ],
      breadcrumbs: [
        { category: "request", message: "GET /winkelmand (partsnl.local)", time: "-240ms" },
        { category: "db", message: "SELECT * FROM `cart_items` WHERE `session_id` = 'cart_9918' [2.1ms]", time: "-190ms" },
        { category: "http", message: "POST http://rest.beekman.local:8080/v1/stock/bulk-check", time: "-100ms" },
        { category: "exception", message: "ConnectException: Connection refused [Errno 111]", time: "0ms" }
      ],
      request: {
        method: "GET",
        url: "/winkelmand",
        status: 500,
        user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)",
        ip: "82.161.44.19",
        user_id: 3102,
        user_email: "klant@partsnl.nl"
      },
      occurrences_last_24h: 88,
      affected_users: 64,
      status: "unresolved",
      tags: { env: "local", subsystem: "ERP Stock Gateway" }
    }
  },
  {
    id: "evt-qry-01",
    type: "query",
    timestamp: Date.now() - 1000 * 60 * 6,
    level: "warning",
    title: "N+1 Query Bottleneck: App\\Models\\Order -> items.product",
    message: "Executed 68 duplicated queries in single HTTP request: `select * from order_items where order_id = ?` and `select * from products where id = ?`",
    durationMs: 840,
    metadata: {
      project: "beekman",
      domain: "partsnl.local",
      sql: "SELECT * FROM `order_items` WHERE `order_items`.`order_id` = ? AND `order_items`.`order_id` IS NOT NULL LIMIT 1",
      execution_count: 68,
      total_time_ms: 682,
      origin: "App\\Http\\Controllers\\Api\\DashboardController::recentOrders (line 48)",
      code_snippet: [
        { line: 45, code: "    public function recentOrders() {" },
        { line: 46, code: "        $orders = Order::where('created_at', '>=', now()->subDays(7))->get();" },
        { line: 47, code: "        return $orders->map(function ($order) {" },
        { line: 48, code: "            return ['id' => $order->id, 'total' => $order->items->sum('price')]; // N+1 triggered here!", highlight: true },
        { line: 49, code: "        });" }
      ],
      explain_plan: {
        select_type: "SIMPLE",
        table: "order_items",
        type: "ref",
        possible_keys: "order_items_order_id_foreign",
        key: "order_items_order_id_foreign",
        rows_examined: 340,
        cost: "112.5"
      },
      tags: { route: "GET /api/v1/dashboard/recent-orders", framework: "Laravel 11.x" }
    }
  },
  {
    id: "evt-qry-02",
    type: "query",
    timestamp: Date.now() - 1000 * 60 * 12,
    level: "warning",
    title: "N+1 Bottleneck: App\\Models\\User -> department & permissions",
    message: "Executed 48 duplicate queries in loop for route GET /api/v1/users/roster: `select * from departments where id = ?` (48x)",
    durationMs: 384,
    metadata: {
      sql: "SELECT * FROM `departments` WHERE `id` = ? LIMIT 1",
      execution_count: 48,
      total_time_ms: 384,
      avg_time_ms: 8.0,
      origin: "App\\Http\\Controllers\\UserController::roster (line 35)",
      code_snippet: [
        { line: 33, code: "    public function roster() {" },
        { line: 34, code: "        $users = User::where('active', true)->get();" },
        { line: 35, code: "        return $users->map(fn($u) => ['name' => $u->name, 'dept' => $u->department->name]);", highlight: true },
        { line: 36, code: "    }" }
      ],
      explain_plan: {
        select_type: "SIMPLE",
        table: "departments",
        type: "eq_ref",
        possible_keys: "PRIMARY",
        key: "PRIMARY",
        rows_examined: 48,
        cost: "16.8"
      },
      tags: { route: "GET /api/v1/users/roster", framework: "Laravel 11.x" }
    }
  },
  {
    id: "evt-req-01",
    type: "request",
    timestamp: Date.now() - 1000 * 60 * 1,
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
      },
      primary_bottleneck: {
        category: "database",
        label: "Slow Database Aggregate & Missing Index",
        details: "42 queries executed taking 1,820ms (74% of total request time). Full table scan on `order_items` without composite index on (created_at, status).",
        impact_pct: 74
      },
      spans: [
        { id: "sp-1", name: "Laravel Framework Boot & Autoload", category: "boot", startMs: 0, durationMs: 22, details: "Kernel boot, service providers registered" },
        { id: "sp-2", name: "Middleware Pipeline (auth:sanctum, throttle)", category: "middleware", startMs: 22, durationMs: 14, details: "Sanctum token verification, rate limit check" },
        { id: "sp-3", name: "ReportController::monthlyRevenue", category: "controller", startMs: 36, durationMs: 2390, details: "Controller dispatch & data aggregation" },
        { id: "sp-4", name: "SELECT FROM `orders` (Date range lookup)", category: "query", startMs: 50, durationMs: 420, details: "Scanning 24,000 orders in current quarter", sql: "SELECT * FROM `orders` WHERE `created_at` BETWEEN '2026-08-01' AND '2026-08-31' AND `status` = 'completed'" },
        { id: "sp-5", name: "Aggregating Order Items & Tax calculations (N+1 loop)", category: "query", startMs: 480, durationMs: 1380, details: "41 sequential sub-queries in Eloquent loop", sql: "SELECT SUM(price) as total, order_id FROM `order_items` WHERE `order_id` IN (?) GROUP BY `order_id`" },
        { id: "sp-6", name: "HTTP Guzzle: Currency Rates Exchange (ECB API)", category: "http", startMs: 1870, durationMs: 320, details: "GET https://api.exchangerates.io/latest?base=EUR", status: 200 },
        { id: "sp-7", name: "Blade JSON Response & Serialization", category: "view", startMs: 2200, durationMs: 240, details: "Eloquent to JSON resource transformation (74.2 MB peak RAM)" }
      ],
      queries: [
        {
          id: "q-1",
          sql: "SELECT * FROM `orders` WHERE `created_at` BETWEEN '2026-08-01' AND '2026-08-31' AND `status` = 'completed'",
          durationMs: 420,
          origin: "App\\Http\\Controllers\\ReportController::monthlyRevenue:34",
          is_duplicate: false,
          bindings: ["2026-08-01", "2026-08-31", "completed"],
          explain_plan: { select_type: "SIMPLE", table: "orders", type: "ALL", possible_keys: "idx_orders_created", key: null, rows_examined: 48000, cost: "4200.0" }
        },
        {
          id: "q-2",
          sql: "SELECT `id`, `order_id`, `product_id`, `price` FROM `order_items` WHERE `order_id` = ?",
          durationMs: 34,
          origin: "App\\Http\\Controllers\\ReportController::monthlyRevenue:48",
          is_duplicate: true,
          bindings: [48102]
        },
        {
          id: "q-3",
          sql: "SELECT `id`, `order_id`, `product_id`, `price` FROM `order_items` WHERE `order_id` = ?",
          durationMs: 32,
          origin: "App\\Http\\Controllers\\ReportController::monthlyRevenue:48",
          is_duplicate: true,
          bindings: [48103]
        },
        {
          id: "q-4",
          sql: "SELECT `id`, `order_id`, `product_id`, `price` FROM `order_items` WHERE `order_id` = ?",
          durationMs: 35,
          origin: "App\\Http\\Controllers\\ReportController::monthlyRevenue:48",
          is_duplicate: true,
          bindings: [48104]
        },
        {
          id: "q-5",
          sql: "SELECT `id`, `order_id`, `product_id`, `price` FROM `order_items` WHERE `order_id` = ?",
          durationMs: 31,
          origin: "App\\Http\\Controllers\\ReportController::monthlyRevenue:48",
          is_duplicate: true,
          bindings: [48105]
        },
        {
          id: "q-6",
          sql: "SELECT `id`, `order_id`, `product_id`, `price` FROM `order_items` WHERE `order_id` = ?",
          durationMs: 36,
          origin: "App\\Http\\Controllers\\ReportController::monthlyRevenue:48",
          is_duplicate: true,
          bindings: [48106]
        },
        {
          id: "q-7",
          sql: "SELECT `id`, `order_id`, `product_id`, `price` FROM `order_items` WHERE `order_id` = ?",
          durationMs: 30,
          origin: "App\\Http\\Controllers\\ReportController::monthlyRevenue:48",
          is_duplicate: true,
          bindings: [48107]
        },
        {
          id: "q-8",
          sql: "SELECT * FROM `products` WHERE `id` = ? LIMIT 1",
          durationMs: 12,
          origin: "App\\Models\\OrderItem::product:14",
          is_duplicate: true,
          bindings: [901]
        },
        {
          id: "q-9",
          sql: "SELECT * FROM `products` WHERE `id` = ? LIMIT 1",
          durationMs: 14,
          origin: "App\\Models\\OrderItem::product:14",
          is_duplicate: true,
          bindings: [902]
        },
        {
          id: "q-10",
          sql: "SELECT * FROM `products` WHERE `id` = ? LIMIT 1",
          durationMs: 11,
          origin: "App\\Models\\OrderItem::product:14",
          is_duplicate: true,
          bindings: [903]
        },
        {
          id: "q-11",
          sql: "SELECT * FROM `products` WHERE `id` = ? LIMIT 1",
          durationMs: 13,
          origin: "App\\Models\\OrderItem::product:14",
          is_duplicate: true,
          bindings: [904]
        },
        {
          id: "q-12",
          sql: "SELECT `id`, `name`, `tax_rate` FROM `taxes` WHERE `country_code` = 'NL' LIMIT 1",
          durationMs: 8,
          origin: "App\\Services\\TaxService::calculate:19",
          is_duplicate: false,
          bindings: ["NL"]
        }
      ],
      cache_operations: [
        { key: "reports:monthly:2026-08", operation: "get", hit: false, durationMs: 2.1, store: "redis" },
        { key: "exchange_rates:eur", operation: "remember", hit: true, durationMs: 0.8, store: "redis" }
      ],
      events_dispatched: [
        { event: "Illuminate\\Auth\\Events\\Authenticated", listeners_count: 2, durationMs: 4 },
        { event: "App\\Events\\ReportGenerated", listeners_count: 1, durationMs: 6 }
      ],
      gates_evaluated: [
        { ability: "view-analytics", result: "allowed", user_id: 1042 },
        { ability: "export-financial-reports", result: "allowed", user_id: 1042 }
      ],
      headers: {
        "host": "app.laravel.internal",
        "authorization": "Bearer 48|9xKj...***",
        "accept": "application/json",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
      },
      session_data: {
        "user_id": 1042,
        "team_id": 12,
        "role": "financial_admin",
        "locale": "nl_NL"
      }
    }
  },
  {
    id: "evt-req-02",
    type: "request",
    timestamp: Date.now() - 1000 * 60 * 4,
    level: "warning",
    title: "POST /api/v1/checkout/process",
    durationMs: 1840,
    metadata: {
      status: 200,
      memory_peak_mb: 28.5,
      db_queries_count: 12,
      db_time_ms: 190,
      external_http_time_ms: 1450,
      php_execution_time_ms: 200,
      controller: "App\\Http\\Controllers\\CheckoutController@process",
      middleware: ["api", "auth:sanctum", "throttle:checkout"],
      breakdown: {
        database_pct: 10,
        external_pct: 79,
        php_pct: 11
      },
      primary_bottleneck: {
        category: "external",
        label: "Third-Party External HTTP Latency",
        details: "Waiting 1,450ms (79% of request time) synchronously on Stripe PaymentIntent confirmation and PostNL shipping API.",
        impact_pct: 79
      },
      spans: [
        { id: "sp-c1", name: "Laravel Boot & Middleware", category: "boot", startMs: 0, durationMs: 18 },
        { id: "sp-c2", name: "CheckoutController::process", category: "controller", startMs: 18, durationMs: 1820 },
        { id: "sp-c3", name: "Validate Cart & Acquire DB Stock Lock", category: "query", startMs: 25, durationMs: 140, details: "SELECT ... FOR UPDATE on inventory" },
        { id: "sp-c4", name: "HTTP Guzzle: Stripe API PaymentIntent::confirm", category: "http", startMs: 170, durationMs: 1120, details: "POST https://api.stripe.com/v1/payment_intents/pi_3914/confirm", status: 200 },
        { id: "sp-c5", name: "HTTP Guzzle: PostNL Shipping Label Generation", category: "http", startMs: 1290, durationMs: 330, details: "POST https://api.postnl.nl/shipment/v2/label", status: 200 },
        { id: "sp-c6", name: "DB Order Commit & Event Dispatch", category: "query", startMs: 1630, durationMs: 50, details: "INSERT INTO `orders`, UPDATE `inventory`" },
        { id: "sp-c7", name: "Dispatch OrderConfirmationJob to Horizon Queue", category: "controller", startMs: 1680, durationMs: 140 }
      ],
      queries: [
        { id: "qc-1", sql: "SELECT * FROM `carts` WHERE `id` = ? LIMIT 1", durationMs: 12, origin: "CheckoutController:28", is_duplicate: false },
        { id: "qc-2", sql: "SELECT * FROM `inventories` WHERE `product_id` IN (102, 105) FOR UPDATE", durationMs: 128, origin: "StockService:54", is_duplicate: false },
        { id: "qc-3", sql: "INSERT INTO `orders` (`user_id`, `amount`, `status`) VALUES (?, ?, ?)", durationMs: 34, origin: "CheckoutController:82", is_duplicate: false }
      ],
      cache_operations: [
        { key: "lock:checkout:user:882", operation: "set", hit: true, durationMs: 1.4, store: "redis" }
      ],
      events_dispatched: [
        { event: "App\\Events\\OrderPlaced", listeners_count: 3, durationMs: 8 }
      ],
      gates_evaluated: [
        { ability: "checkout-cart", result: "allowed", user_id: 882 }
      ]
    }
  },
  {
    id: "evt-req-03",
    type: "request",
    timestamp: Date.now() - 1000 * 60 * 8,
    level: "warning",
    title: "GET /api/v1/dashboard/recent-orders",
    durationMs: 1140,
    metadata: {
      project: "beekman",
      domain: "partsnl.local",
      status: 200,
      memory_peak_mb: 48.1,
      db_queries_count: 68,
      db_time_ms: 940,
      external_http_time_ms: 0,
      php_execution_time_ms: 200,
      controller: "App\\Http\\Controllers\\Api\\DashboardController@recentOrders",
      middleware: ["web", "auth:sanctum"],
      breakdown: {
        database_pct: 82,
        external_pct: 0,
        php_pct: 18
      },
      primary_bottleneck: {
        category: "n_plus_one",
        label: "N+1 Eloquent Loop (68 Queries)",
        details: "Executed 68 queries in loop when accessing `$order->items` and `$order->customer` inside collection map without eager loading.",
        impact_pct: 82
      },
      spans: [
        { id: "sp-d1", name: "Laravel Boot & Auth", category: "boot", startMs: 0, durationMs: 25 },
        { id: "sp-d2", name: "DashboardController::recentOrders", category: "controller", startMs: 25, durationMs: 1115 },
        { id: "sp-d3", name: "Fetch 50 Orders (Initial Query)", category: "query", startMs: 30, durationMs: 45, sql: "SELECT * FROM `orders` ORDER BY `created_at` DESC LIMIT 50" },
        { id: "sp-d4", name: "N+1 Loop: 67 individual SELECTs for items & customer", category: "query", startMs: 80, durationMs: 895, details: "Executed inside ->map() callback" },
        { id: "sp-d5", name: "JSON Resource Serialization", category: "view", startMs: 980, durationMs: 145 }
      ],
      queries: [
        { id: "qd-1", sql: "SELECT * FROM `orders` ORDER BY `created_at` DESC LIMIT 50", durationMs: 45, origin: "DashboardController:46", is_duplicate: false },
        { id: "qd-2", sql: "SELECT * FROM `order_items` WHERE `order_id` = ?", durationMs: 14, origin: "DashboardController:48", is_duplicate: true },
        { id: "qd-3", sql: "SELECT * FROM `order_items` WHERE `order_id` = ?", durationMs: 12, origin: "DashboardController:48", is_duplicate: true },
        { id: "qd-4", sql: "SELECT * FROM `users` WHERE `id` = ? LIMIT 1", durationMs: 11, origin: "DashboardController:49", is_duplicate: true }
      ],
      cache_operations: []
    }
  },
  {
    id: "evt-req-04",
    type: "request",
    timestamp: Date.now() - 1000 * 60 * 15,
    level: "critical",
    title: "GET /admin/users/export-csv",
    durationMs: 3280,
    metadata: {
      project: "beekman",
      domain: "beekman.local",
      status: 200,
      memory_peak_mb: 134.8,
      db_queries_count: 5,
      db_time_ms: 1120,
      external_http_time_ms: 0,
      php_execution_time_ms: 2160,
      controller: "App\\Http\\Controllers\\Admin\\UserExportController@download",
      middleware: ["web", "auth", "can:export-users"],
      breakdown: {
        database_pct: 34,
        external_pct: 0,
        php_pct: 66
      },
      primary_bottleneck: {
        category: "memory",
        label: "High Memory Consumption & Eloquent Hydration",
        details: "134.8 MB peak memory usage (dangerously close to 256MB limit). User::all() hydrations 12,000 Eloquent model objects in memory.",
        impact_pct: 66
      },
      spans: [
        { id: "sp-e1", name: "Laravel Boot", category: "boot", startMs: 0, durationMs: 20 },
        { id: "sp-e2", name: "DB Load 12,000 Users (PDO Fetch)", category: "query", startMs: 25, durationMs: 1120, sql: "SELECT * FROM `users`" },
        { id: "sp-e3", name: "Eloquent Hydration of 12k Models", category: "controller", startMs: 1145, durationMs: 1420, details: "12,000 User instances created in memory (+105 MB RAM)" },
        { id: "sp-e4", name: "CSV Formatting & Stream Response", category: "view", startMs: 2570, durationMs: 710, details: "fputcsv() file write to output buffer" }
      ],
      queries: [
        { id: "qe-1", sql: "SELECT * FROM `users`", durationMs: 1120, origin: "UserExportController:22", is_duplicate: false }
      ]
    }
  },
  {
    id: "evt-req-05",
    type: "request",
    timestamp: Date.now() - 1000 * 60 * 2,
    level: "info",
    title: "GET /api/v1/products/catalog",
    durationMs: 412,
    metadata: {
      project: "beekman",
      domain: "ersatzteileshop.local",
      status: 200,
      memory_peak_mb: 24.1,
      db_queries_count: 18,
      db_time_ms: 280,
      external_http_time_ms: 0,
      php_execution_time_ms: 132,
      controller: "App\\Http\\Controllers\\ProductController@catalog",
      middleware: ["api"],
      breakdown: {
        database_pct: 68,
        external_pct: 0,
        php_pct: 32
      },
      primary_bottleneck: {
        category: "database",
        label: "Redis Cache Miss on Product Catalog",
        details: "Cache key `catalog:category:tech` was stale or evicted, falling back to 18 MySQL queries.",
        impact_pct: 68
      },
      spans: [
        { id: "sp-p1", name: "Laravel Boot", category: "boot", startMs: 0, durationMs: 16 },
        { id: "sp-p2", name: "Cache::get('catalog:category:tech')", category: "cache", startMs: 18, durationMs: 3.2, details: "Redis cache miss" },
        { id: "sp-p3", name: "Execute Catalog Filter Queries", category: "query", startMs: 22, durationMs: 280, sql: "SELECT * FROM `products` WHERE `category_id` = 4 AND `is_active` = 1" },
        { id: "sp-p4", name: "Cache::put('catalog:category:tech', ..., 3600)", category: "cache", startMs: 310, durationMs: 4.1 },
        { id: "sp-p5", name: "View / JSON Response", category: "view", startMs: 320, durationMs: 88 }
      ],
      queries: [
        { id: "qp-1", sql: "SELECT * FROM `products` WHERE `category_id` = 4 AND `is_active` = 1 LIMIT 24", durationMs: 180, origin: "ProductController:42" }
      ],
      cache_operations: [
        { key: "catalog:category:tech", operation: "get", hit: false, durationMs: 3.2, store: "redis" },
        { key: "catalog:category:tech", operation: "set", hit: true, durationMs: 4.1, store: "redis" }
      ]
    }
  },
  {
    id: "evt-req-06",
    type: "request",
    timestamp: Date.now() - 1000 * 30,
    level: "info",
    title: "POST /api/v1/auth/login",
    durationMs: 135,
    metadata: {
      project: "beekman",
      domain: "onderdelen_nl.local",
      status: 200,
      memory_peak_mb: 18.2,
      db_queries_count: 2,
      db_time_ms: 12,
      external_http_time_ms: 0,
      php_execution_time_ms: 123,
      controller: "App\\Http\\Controllers\\Auth\\LoginController@login",
      middleware: ["api", "guest", "throttle:login"],
      breakdown: {
        database_pct: 9,
        external_pct: 0,
        php_pct: 91
      },
      primary_bottleneck: {
        category: "php",
        label: "Normal Bcrypt Password Hash Verification",
        details: "Bcrypt work factor 12 CPU cost (healthy security posture).",
        impact_pct: 91
      },
      spans: [
        { id: "sp-l1", name: "Framework Boot", category: "boot", startMs: 0, durationMs: 12 },
        { id: "sp-l2", name: "SELECT user by email", category: "query", startMs: 14, durationMs: 8, sql: "SELECT * FROM `users` WHERE `email` = ? LIMIT 1" },
        { id: "sp-l3", name: "Hash::check (Bcrypt compute)", category: "controller", startMs: 24, durationMs: 95 },
        { id: "sp-l4", name: "Sanctum createToken()", category: "query", startMs: 120, durationMs: 4, sql: "INSERT INTO `personal_access_tokens` ..." }
      ],
      queries: [
        { id: "ql-1", sql: "SELECT * FROM `users` WHERE `email` = ? LIMIT 1", durationMs: 8, origin: "LoginController:31" }
      ]
    }
  },
  {
    id: "evt-job-01",
    type: "job",
    timestamp: Date.now() - 1000 * 60 * 12,
    level: "error",
    title: "App\\Jobs\\SyncShopifyCatalogJob - MaxAttemptsExceededException",
    message: "Job failed after 3 attempts. GuzzleHttp\\Exception\\ConnectException: cURL error 28: Operation timed out after 30001 milliseconds with 0 bytes received",
    durationMs: 30120,
    metadata: {
      project: "beekman",
      domain: "rest.beekman.local",
      job_class: "App\\Jobs\\SyncShopifyCatalogJob",
      queue: "integrations",
      attempts: 3,
      max_tries: 3,
      backoff: [30, 120, 300],
      payload: { store_id: "store_nl_ams_991", sync_type: "full_inventory", items_count: 4500 },
      exception_file: "app/Jobs/SyncShopifyCatalogJob.php:88"
    }
  },
  {
    id: "evt-err-02",
    type: "exception",
    timestamp: Date.now() - 1000 * 60 * 18,
    level: "error",
    title: "Illuminate\\Database\\Eloquent\\ModelNotFoundException: No query results for model [App\\Models\\User] 99182",
    message: "ModelNotFoundException in /vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php:612",
    metadata: {
      project: "beekman",
      domain: "beekman.local",
      exception_class: "Illuminate\\Database\\Eloquent\\ModelNotFoundException",
      file: "app/Http/Controllers/UserProfileController.php",
      line: 28,
      code_snippet: [
        { line: 26, code: "    public function show(string $uuid) {" },
        { line: 27, code: "        // Direct findOrFail without graceful 404 or cache" },
        { line: 28, code: "        $user = User::where('uuid', $uuid)->firstOrFail();", highlight: true },
        { line: 29, code: "        return view('user.profile', compact('user'));" }
      ],
      breadcrumbs: [
        { category: "request", message: "GET /users/00000000-0000-0000-0000-000000000000", time: "-40ms" },
        { category: "query", message: "SELECT * FROM `users` WHERE `uuid` = '00000000-...' LIMIT 1 [2.1ms]", time: "-12ms" }
      ],
      request: {
        method: "GET",
        url: "/users/00000000-0000-0000-0000-000000000000",
        status: 404,
        ip: "84.241.19.12"
      },
      occurrences_last_24h: 142,
      affected_users: 110,
      tags: { env: "production", spider: "bingbot/2.0" }
    }
  },
  {
    id: "evt-qry-03",
    type: "query",
    timestamp: Date.now() - 1000 * 60 * 25,
    level: "warning",
    title: "Slow Query Missing Index: Full Table Scan on `audit_logs`",
    message: "Query took 1,420ms scanning 480,200 rows without indexed `created_at` and `action` columns.",
    durationMs: 1420,
    metadata: {
      project: "beekman",
      domain: "beekman.local",
      sql: "SELECT `id`, `user_id`, `action`, `payload`, `created_at` FROM `audit_logs` WHERE `action` = 'auth.failed' AND `created_at` >= '2026-09-01 00:00:00' ORDER BY `created_at` DESC LIMIT 50",
      execution_count: 12,
      total_time_ms: 17040,
      origin: "App\\Http\\Controllers\\SecurityController::recentFailedLogins (line 34)",
      explain_plan: {
        select_type: "SIMPLE",
        table: "audit_logs",
        type: "ALL",
        possible_keys: null,
        key: null,
        rows_examined: 480200,
        cost: "49280.0"
      },
      tags: { route: "GET /admin/security/failed-logins", table: "audit_logs" }
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
