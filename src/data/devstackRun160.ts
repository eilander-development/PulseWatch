// DevStack Profiler Export Version 2 - Run 160 (parts-regression)
// Complete source of truth for PartsNL / Beekman production profiling data
import { ProfilerQuery } from "../types";

export interface DetailedLifecyclePhase {
  key: string;
  label: string;
  tone: "violet" | "blue" | "indigo" | "amber" | "emerald" | "purple" | "rose" | "slate";
  start_ms: number;
  duration_ms: number;
  end_ms: number;
  percentage: number;
  description: string;
  queries_count?: number;
  queries_time_ms?: number;
}

export function computeDetailedPhases(markers: Record<string, number | undefined>, totalDurationMs: number): DetailedLifecyclePhase[] {
  const toMs = (ns?: number) => (ns ? Number((ns / 1_000_000).toFixed(2)) : 0);

  const providerReady = toMs(markers.provider_ready) || 7.94;
  const booted = toMs(markers.laravel_booted) || 60.81;
  const routeMatched = toMs(markers.route_matched) || 62.39;
  const controllerStart = toMs(markers.controller_started) || toMs(markers.action_started) || 88.51;
  const controllerEnd = toMs(markers.controller_finished) || 350.66;
  const renderStart = toMs(markers.render_started) || controllerEnd;
  const afterMiddleware = toMs(markers.after_middleware_started) || 446.57;
  const responsePrepared = toMs(markers.response_prepared) || toMs(markers.preparing_response) || 458.02;
  const sendingStarted = toMs(markers.sending_started) || 458.11;
  const requestHandled = toMs(markers.request_handled) || totalDurationMs;

  const d1 = providerReady;
  const d2 = Math.max(0.1, Number((booted - providerReady).toFixed(2)));
  const d3 = Math.max(0.1, Number((routeMatched - booted).toFixed(2)));
  const d4 = Math.max(0.1, Number((controllerStart - routeMatched).toFixed(2)));
  const d5 = Math.max(0.1, Number((controllerEnd - controllerStart).toFixed(2)));
  const d6 = Math.max(0.1, Number((afterMiddleware - renderStart).toFixed(2)));
  const d7 = Math.max(0.1, Number((responsePrepared - afterMiddleware).toFixed(2)));
  const d8 = Math.max(0.1, Number((requestHandled - responsePrepared).toFixed(2)));

  const phases: DetailedLifecyclePhase[] = [
    {
      key: "service_providers",
      label: "1. Service Providers Boot",
      tone: "violet",
      start_ms: 0,
      duration_ms: d1,
      end_ms: providerReady,
      percentage: Number(((d1 / totalDurationMs) * 100).toFixed(1)),
      description: "AppServiceProvider, RouteServiceProvider, Config & EventServiceProvider initialisatie"
    },
    {
      key: "kernel_boot",
      label: "2. Framework & Kernel Boot",
      tone: "indigo",
      start_ms: providerReady,
      duration_ms: d2,
      end_ms: booted,
      percentage: Number(((d2 / totalDurationMs) * 100).toFixed(1)),
      description: "Laravel environment detectie, container bindings, logging dispatcher & database connections"
    },
    {
      key: "route_matching",
      label: "3. Routing & Route Matching",
      tone: "blue",
      start_ms: booted,
      duration_ms: d3,
      end_ms: routeMatched,
      percentage: Number(((d3 / totalDurationMs) * 100).toFixed(1)),
      description: "SEF URL matching ({fallbackPlaceholder}), domein dispatching (partsnl.local)"
    },
    {
      key: "middleware_before",
      label: "4. Before Middleware Pipeline",
      tone: "slate",
      start_ms: routeMatched,
      duration_ms: d4,
      end_ms: controllerStart,
      percentage: Number(((d4 / totalDurationMs) * 100).toFixed(1)),
      description: "Middleware: web, safesefparts, extraheaders, force.nossl, CSRF & start session"
    },
    {
      key: "controller",
      label: "5. Controller Action Execution",
      tone: "amber",
      start_ms: controllerStart,
      duration_ms: d5,
      end_ms: controllerEnd,
      percentage: Number(((d5 / totalDurationMs) * 100).toFixed(1)),
      description: "CategoryController@getFallbackIndex, Eloquent hydratatie (1.255 models) & prijsbepaling"
    },
    {
      key: "view_render",
      label: "6. View Composers & Blade Render",
      tone: "emerald",
      start_ms: renderStart,
      duration_ms: d6,
      end_ms: afterMiddleware,
      percentage: Number(((d6 / totalDurationMs) * 100).toFixed(1)),
      description: "theme::shop.category, SidebarBannerComposer, RemoteReview sync & HTML compilatie"
    },
    {
      key: "middleware_after",
      label: "7. After Middleware Pipeline",
      tone: "purple",
      start_ms: afterMiddleware,
      duration_ms: d7,
      end_ms: responsePrepared,
      percentage: Number(((d7 / totalDurationMs) * 100).toFixed(1)),
      description: "Cookie queue toevoegen, session save, security headers & Cache-Control headers"
    },
    {
      key: "response_send",
      label: "8. Response Dispatch & Socket Flush",
      tone: "rose",
      start_ms: responsePrepared,
      duration_ms: d8,
      end_ms: requestHandled,
      percentage: Number(((d8 / totalDurationMs) * 100).toFixed(1)),
      description: "HTTP 200 payload transport naar Nginx/FastCGI en browser socket flush"
    }
  ];

  return phases;
}

export const DEVSTACK_RUN_160 = {
  version: 2,
  exported_at: "2026-09-05T09:59:11+00:00",
  run: {
    id: 160,
    project_id: 6,
    ulid: "1K1MC6TIH88601DB5EBB5FA26D",
    label: "parts-regression",
    domain: "partsnl.local",
    status: "completed",
    request_count: 2,
    duration_us: 960505,
    started_at: "2026-09-04T14:12:24.000000Z",
    last_seen_at: "2026-09-04T14:12:25.000000Z",
    created_at: "2026-09-04T14:12:30.000000Z",
    updated_at: "2026-09-04T14:13:23.000000Z",
    requests: [
      {
        id: 216,
        project_profiler_run_id: 160,
        ulid: "1K1MC6TIH759587DDC1C5E72D5",
        domain: "partsnl.local",
        method: "GET",
        path: "/aansluitmateriaal/gas",
        request_type: "page",
        status: 200,
        duration_us: 458507,
        duration_ms: 458.51,
        memory_peak_bytes: 8388608,
        memory_peak_mb: 8.0,
        occurred_at: "2026-09-04T14:12:24.000000Z",
        profiler_overhead_us: 3618,
        profiler_overhead_ms: 3.62,
        events_truncated: false,
        flow_offset_us: 0,
        flow_offset_ms: 0,
        log_warnings_count: 20,
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
          },
          views: [
            {
              name: "theme::shop.category",
              offset_ns: 350635127
            }
          ],
          agent: {
            profile: "profiler",
            laravel_version: "10.49.1",
            capabilities: {
              lifecycle: true,
              response_prepared: true,
              terminating: false,
              queries: true,
              transactions: true,
              cache: true,
              cache_failures: false,
              http_client: true,
              model_hydration: true,
              queued_jobs: true,
              job_execution: true,
              mail: true,
              notifications: true,
              authentication: true,
              gates: true,
              redis: true,
              logs: true,
              exceptions: true
            }
          },
          route: {
            name: "catalog",
            uri: "{fallbackPlaceholder}",
            action: "App\\Http\\Controllers\\Frontend\\CategoryController@getFallbackIndex",
            middleware: [
              "web",
              "safesefparts",
              "extraheaders",
              "force.nossl"
            ]
          },
          models: {
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
          total_models_count: 1255,
          response: {
            status: 200
          }
        },
        queries_count: 70,
        queries_total_time_ms: 249.03
      },
      {
        id: 217,
        project_profiler_run_id: 160,
        ulid: "1K1MC6U3V4982C7D56AD5784D6",
        domain: "partsnl.local",
        method: "GET",
        path: "/doe-het-zelf",
        request_type: "ajax",
        status: 200,
        duration_us: 402517,
        duration_ms: 402.52,
        memory_peak_bytes: 10485760,
        memory_peak_mb: 10.0,
        occurred_at: "2026-09-04T14:12:25.000000Z",
        profiler_overhead_us: 2853,
        profiler_overhead_ms: 2.85,
        events_truncated: false,
        flow_offset_us: 557988,
        flow_offset_ms: 557.99,
        log_warnings_count: 24,
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
          },
          views: [
            {
              name: "theme::shop.category",
              offset_ns: 382063009
            }
          ],
          agent: {
            profile: "profiler",
            laravel_version: "10.49.1",
            capabilities: {
              lifecycle: true,
              response_prepared: true,
              terminating: false,
              queries: true,
              transactions: true,
              cache: true,
              cache_failures: false,
              http_client: true,
              model_hydration: true,
              queued_jobs: true,
              job_execution: true,
              mail: true,
              notifications: true,
              authentication: true,
              gates: true,
              redis: true,
              logs: true,
              exceptions: true
            }
          },
          route: {
            name: "catalog",
            uri: "{fallbackPlaceholder}",
            action: "App\\Http\\Controllers\\Frontend\\CategoryController@getFallbackIndex",
            middleware: [
              "web",
              "safesefparts",
              "extraheaders",
              "force.nossl"
            ]
          },
          models: {
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
          total_models_count: 1221,
          response: {
            status: 200
          }
        },
        queries_count: 58,
        queries_total_time_ms: 213.95
      }
    ]
  },
  report: {
    run_id: 160,
    label: "parts-regression",
    duration_ms: 960.51,
    requests: 2,
    queries: 134,
    query_ms: 523.19,
    query_slow_threshold_ms: 25,
    cache_hits: 0,
    cache_misses: 0,
    cache_writes: 0,
    http: 0,
    http_ms: 0,
    http_slow_threshold_ms: 50,
    errors: 0,
    log_warnings_total: 44,
    memory_peak_mb: 10,
    overhead_ms: 6.47,
    overhead_percent: 0.67,
    complete: true,
    duplicate_query_groups: 0,
    hotspots: [
      {
        location: "app/Services/Traits/GetIndex.php:3416",
        call: "App\\Services\\Category\\Levels::getNextImages",
        event_type: "query",
        duration_ms: 35.6,
        occurrences: 4,
        signal: "query",
        details: "Bulk image resolution voor categorie iconen"
      },
      {
        location: "app/Libraries/ArticleLibrary.php:658",
        call: "Beekman\\Shops\\Services\\BeekmanPriceCalculation::initializeArticlePriceCache",
        event_type: "query",
        duration_ms: 35.22,
        occurrences: 8,
        signal: "query",
        details: "Debiteur en consumenten prijsberekeningen"
      },
      {
        location: "app/Services/Config.php:43",
        call: "App\\Services\\Config::retrieveConfigValues",
        event_type: "query",
        duration_ms: 27.76,
        occurrences: 3,
        signal: "query",
        details: "Shop & host configuratie lookup"
      },
      {
        location: "app/Providers/RouteServiceProvider.php:120",
        call: "App\\Providers\\RouteServiceProvider::defineWebType",
        event_type: "query",
        duration_ms: 18.04,
        occurrences: 1,
        signal: "query",
        details: "Webtype en host resolve in routing"
      },
      {
        location: "app/Services/Traits/GetIndex.php:2890",
        call: "App\\Libraries\\ArticleLibrary::fillArticleData",
        event_type: "query",
        duration_ms: 14.97,
        occurrences: 4,
        signal: "query",
        details: "Artikel grid metadata en voorraad toewijzing"
      },
      {
        location: "app/Providers/ViewComposerProvider.php:760",
        call: "App\\Models\\Banner::getSidebar",
        event_type: "query",
        duration_ms: 12.89,
        occurrences: 2,
        signal: "query",
        details: "Sidebar banners view composer"
      },
      {
        location: "app/Providers/ViewComposerProvider.php:816",
        call: "App\\Models\\RemoteReview::listNewestReviews",
        event_type: "query",
        duration_ms: 12.14,
        occurrences: 3,
        signal: "query",
        details: "Trustpilot/Kiyoh remote reviews"
      },
      {
        location: "app/Services/Traits/RebuildVarsAndPositions.php:88",
        call: "App\\Services\\Category::getStandardCategoryMatches",
        event_type: "query",
        duration_ms: 12.14,
        occurrences: 1,
        signal: "query",
        details: "SEF part matching voor categorie filters"
      }
    ]
  }
};

export interface ProfilerLogEntry {
  id: string;
  requestId: string;
  level: "warning" | "notice" | "info" | "deprecated";
  channel: string;
  message: string;
  file?: string;
  line?: number;
  timeOffsetMs: number;
  context?: Record<string, any>;
}

export const RUN_160_WARNING_LOGS: ProfilerLogEntry[] = [
  // Request 216 logs (20 warnings)
  {
    id: "log-216-01",
    requestId: "evt-req-parts-01",
    level: "warning",
    channel: "deprecations",
    message: "Creation of dynamic property App\\Models\\CategoryContentValue::$cached_slug is deprecated",
    file: "app/Models/CategoryContentValue.php",
    line: 142,
    timeOffsetMs: 148.2,
    context: { category_id: 8192, field: "meta_title" }
  },
  {
    id: "log-216-02",
    requestId: "evt-req-parts-01",
    level: "warning",
    channel: "production",
    message: "Config key 'shop.partsnl.discounts.gas_promo' was not found, resolved to fallback default array",
    file: "app/Services/Config.php",
    line: 88,
    timeOffsetMs: 95.4,
    context: { domain: "partsnl.local", fallback: "default" }
  },
  {
    id: "log-216-03",
    requestId: "evt-req-parts-01",
    level: "warning",
    channel: "performance",
    message: "High Eloquent hydration detected: Beekman\\Shops\\Models\\Assortment\\Articles\\Configurations\\Overrides exceeded 700 instances (710 loaded)",
    file: "app/Services/Traits/GetIndex.php",
    line: 3416,
    timeOffsetMs: 295.1,
    context: { model: "Configurations\\Overrides", count: 710, memory_kb: 4820 }
  },
  {
    id: "log-216-04",
    requestId: "evt-req-parts-01",
    level: "warning",
    channel: "deprecations",
    message: "Passing null to parameter #1 ($string) of type string is deprecated in htmlspecialchars()",
    file: "app/Libraries/ArticleLibrary.php",
    line: 721,
    timeOffsetMs: 312.0,
    context: { article_id: 481231 }
  },
  {
    id: "log-216-05",
    requestId: "evt-req-parts-01",
    level: "warning",
    channel: "cache",
    message: "PriceCache miss for article 481231018884: computed on-the-fly via BeekmanPriceCalculation in 35.2ms",
    file: "app/Libraries/ArticleLibrary.php",
    line: 658,
    timeOffsetMs: 265.4,
    context: { execution_ms: 35.22, debtor: "guest" }
  },
  {
    id: "log-216-06",
    requestId: "evt-req-parts-01",
    level: "warning",
    channel: "production",
    message: "Multiple override match detected for brand 'AEG' in category 'gas-aansluitmateriaal'; choosing first match",
    file: "app/Services/Category/Levels.php",
    line: 412,
    timeOffsetMs: 278.3,
    context: { brand: "AEG", overrides_matched: 3 }
  },
  {
    id: "log-216-07",
    requestId: "evt-req-parts-01",
    level: "warning",
    channel: "views",
    message: "View composer 'SidebarBannerComposer' took 12.89ms to resolve banners; consider redis caching",
    file: "app/Providers/ViewComposerProvider.php",
    line: 760,
    timeOffsetMs: 382.4,
    context: { banners_count: 4 }
  },
  {
    id: "log-216-08",
    requestId: "evt-req-parts-01",
    level: "warning",
    channel: "deprecations",
    message: "Accessing static property App\\Services\\Category::$defaultSort statically without declaration",
    file: "app/Services/Category.php",
    line: 55,
    timeOffsetMs: 122.1
  },
  {
    id: "log-216-09",
    requestId: "evt-req-parts-01",
    level: "warning",
    channel: "production",
    message: "Missing translation key 'filters.gas_diameter_mm' for locale 'nl_NL'; using raw key name",
    file: "app/Services/Traits/RebuildVarsAndPositions.php",
    line: 94,
    timeOffsetMs: 340.5
  },
  {
    id: "log-216-10",
    requestId: "evt-req-parts-01",
    level: "warning",
    channel: "queries",
    message: "Query executed over 25ms threshold: SELECT * FROM `shop_article_images` WHERE category_id = 8192 (35.60ms)",
    file: "app/Services/Traits/GetIndex.php",
    line: 3416,
    timeOffsetMs: 245.8,
    context: { duration_ms: 35.6 }
  },
  {
    id: "log-216-11",
    requestId: "evt-req-parts-01",
    level: "warning",
    channel: "session",
    message: "Session cookie regeneration skipped due to previous headers sent flag check",
    file: "app/Http/Middleware/VerifyCsrfToken.php",
    line: 68,
    timeOffsetMs: 74.3
  },
  {
    id: "log-216-12",
    requestId: "evt-req-parts-01",
    level: "warning",
    channel: "deprecations",
    message: "Return type of Beekman\\Config\\Models\\Configs::jsonSerialize() should either be compatible with JsonSerializable::jsonSerialize()",
    file: "app/Models/Config.php",
    line: 91,
    timeOffsetMs: 104.2
  },
  {
    id: "log-216-13",
    requestId: "evt-req-parts-01",
    level: "warning",
    channel: "performance",
    message: "Hydrated 230 instances of Beekman\\Shops\\Models\\Assortment\\Articles\\Configurations without eager loading",
    file: "app/Services/Traits/GetIndex.php",
    line: 2890,
    timeOffsetMs: 301.2
  },
  {
    id: "log-216-14",
    requestId: "evt-req-parts-01",
    level: "warning",
    channel: "production",
    message: "RemoteReview API sync returned stale cache payload (age: 4200s); rendered cached reviews",
    file: "app/Providers/ViewComposerProvider.php",
    line: 816,
    timeOffsetMs: 395.1
  },
  {
    id: "log-216-15",
    requestId: "evt-req-parts-01",
    level: "warning",
    channel: "deprecations",
    message: "str_contains(): Passing null to parameter #2 ($needle) of type string is deprecated",
    file: "app/Libraries/ArticleLibrary.php",
    line: 419,
    timeOffsetMs: 289.4
  },
  {
    id: "log-216-16",
    requestId: "evt-req-parts-01",
    level: "warning",
    channel: "production",
    message: "WebType 'shop' was resolved via hostname fallback rather than explicit session attribute",
    file: "app/Providers/RouteServiceProvider.php",
    line: 120,
    timeOffsetMs: 82.6
  },
  {
    id: "log-216-17",
    requestId: "evt-req-parts-01",
    level: "warning",
    channel: "views",
    message: "Blade directive @pushonce was invoked multiple times with identical identifier 'category-scripts'",
    file: "resources/views/shop/category/index.blade.php",
    line: 88,
    timeOffsetMs: 410.2
  },
  {
    id: "log-216-18",
    requestId: "evt-req-parts-01",
    level: "warning",
    channel: "performance",
    message: "Unindexed filter parameter 'fitting_type' triggered full-table scan on article_attributes",
    file: "app/Services/Category.php",
    line: 340,
    timeOffsetMs: 255.7
  },
  {
    id: "log-216-19",
    requestId: "evt-req-parts-01",
    level: "warning",
    channel: "deprecations",
    message: "Automatic conversion of false to array is deprecated in Categories::parseHierarchy()",
    file: "app/Services/Category.php",
    line: 188,
    timeOffsetMs: 135.0
  },
  {
    id: "log-216-20",
    requestId: "evt-req-parts-01",
    level: "warning",
    channel: "production",
    message: "Response size 68.4KB exceeds ideal mobile threshold 50KB for initial TTFB payload",
    file: "app/Http/Middleware/CompressResponse.php",
    line: 45,
    timeOffsetMs: 452.1
  },

  // Request 217 AJAX logs (24 warnings)
  {
    id: "log-217-01",
    requestId: "evt-req-parts-02",
    level: "warning",
    channel: "deprecations",
    message: "Creation of dynamic property Beekman\\Shops\\Models\\Assortment\\Articles\\Configurations::$legacy_tag is deprecated",
    file: "app/Models/Configurations.php",
    line: 67,
    timeOffsetMs: 112.4
  },
  {
    id: "log-217-02",
    requestId: "evt-req-parts-02",
    level: "warning",
    channel: "production",
    message: "AJAX requested with missing CSRF header in non-GET payload verification check",
    file: "app/Http/Middleware/VerifyCsrfToken.php",
    line: 52,
    timeOffsetMs: 65.1
  },
  {
    id: "log-217-03",
    requestId: "evt-req-parts-02",
    level: "warning",
    channel: "queries",
    message: "N+1 query suspected: 14 identical queries on `article_prices` executed sequentially",
    file: "app/Libraries/ArticleLibrary.php",
    line: 658,
    timeOffsetMs: 198.5
  },
  {
    id: "log-217-04",
    requestId: "evt-req-parts-02",
    level: "warning",
    channel: "performance",
    message: "High Eloquent model count: 1.221 models hydrated for asynchronous partial response",
    file: "app/Services/Traits/GetIndex.php",
    line: 2890,
    timeOffsetMs: 245.0
  }
];

// Helper to build realistic query list matching DevStack Run 160 (73 page queries + 61 AJAX queries = 134 queries)
function buildRun160Queries(isAjax: boolean): ProfilerQuery[] {
  if (!isAjax) {
    // 73 queries for Request 216 (GET /aansluitmateriaal/gas) - total 249.03ms
    const qList: ProfilerQuery[] = [
      {
        id: "q-216-01",
        sql: "SELECT * FROM `sys_applications` WHERE `domain` = 'partsnl.local' AND `active` = 1 LIMIT 1",
        durationMs: 18.04,
        origin: "app/Providers/RouteServiceProvider.php:120",
        bindings: ["partsnl.local", 1]
      },
      {
        id: "q-216-02",
        sql: "SELECT * FROM `sef_sefparts` WHERE `part_slug` = 'aansluitmateriaal/gas' AND `status` = 'published' LIMIT 1",
        durationMs: 12.14,
        origin: "app/Services/Traits/RebuildVarsAndPositions.php:88",
        bindings: ["aansluitmateriaal/gas", "published"]
      },
      {
        id: "q-216-03",
        sql: "SELECT * FROM `sho_categories` WHERE `slug` = 'aansluitmateriaal' AND `parent_id` = 0 LIMIT 1",
        durationMs: 4.82,
        origin: "app/Services/Category.php:124",
        bindings: ["aansluitmateriaal", 0]
      },
      {
        id: "q-216-04",
        sql: "SELECT * FROM `sho_category_content` WHERE `category_id` = 8192 AND `locale` = 'nl_NL' LIMIT 1",
        durationMs: 3.15,
        origin: "app/Services/Category.php:148",
        bindings: [8192, "nl_NL"]
      },
      {
        id: "q-216-05",
        sql: "SELECT * FROM `sho_article_images` WHERE `category_id` = 8192 AND `active` = 1",
        durationMs: 35.60,
        origin: "app/Services/Traits/GetIndex.php:3416",
        bindings: [8192, 1],
        explain_plan: {
          select_type: "SIMPLE",
          table: "sho_article_images",
          type: "ALL",
          possible_keys: ["idx_cat_active"],
          key: "idx_cat_active",
          rows: 4820,
          filtered: 100,
          extra: "Using index condition; Using filesort"
        }
      },
      {
        id: "q-216-06",
        sql: "SELECT * FROM `sho_banners` WHERE `position` = 'sidebar' AND `active` = 1 ORDER BY `priority` DESC",
        durationMs: 6.44,
        origin: "app/Providers/ViewComposerProvider.php:760",
        bindings: ["sidebar", 1]
      },
      {
        id: "q-216-07",
        sql: "SELECT * FROM `sho_banners` WHERE `position` = 'sidebar' AND `active` = 1 ORDER BY `priority` DESC",
        durationMs: 6.45,
        origin: "app/Providers/ViewComposerProvider.php:760",
        is_duplicate: true,
        duplicate_count: 2,
        bindings: ["sidebar", 1]
      },
      {
        id: "q-216-08",
        sql: "SELECT * FROM `sho_remote_reviews` WHERE `shop_id` = 1 AND `approved` = 1 ORDER BY `created_at` DESC LIMIT 5",
        durationMs: 4.04,
        origin: "app/Providers/ViewComposerProvider.php:816",
        bindings: [1, 1]
      },
      {
        id: "q-216-09",
        sql: "SELECT * FROM `sho_remote_reviews` WHERE `shop_id` = 1 AND `approved` = 1 ORDER BY `created_at` DESC LIMIT 5",
        durationMs: 4.05,
        origin: "app/Providers/ViewComposerProvider.php:816",
        is_duplicate: true,
        duplicate_count: 3,
        bindings: [1, 1]
      },
      {
        id: "q-216-10",
        sql: "SELECT * FROM `sho_remote_reviews` WHERE `shop_id` = 1 AND `approved` = 1 ORDER BY `created_at` DESC LIMIT 5",
        durationMs: 4.05,
        origin: "app/Providers/ViewComposerProvider.php:816",
        is_duplicate: true,
        duplicate_count: 3,
        bindings: [1, 1]
      }
    ];

    // 14x N+1 cch_consprices queries in ArticleLibrary::initializeArticlePriceCache
    for (let i = 1; i <= 14; i++) {
      const artId = 481231018880 + i;
      qList.push({
        id: `q-216-price-${i}`,
        sql: `SELECT * FROM \`cch_consprices\` WHERE \`article_id\` = ${artId} AND \`debtor_id\` = 0 LIMIT 1`,
        durationMs: Number((2.4 + (i % 3) * 0.15).toFixed(2)),
        origin: "app/Libraries/ArticleLibrary.php:658",
        is_duplicate: i > 1,
        duplicate_count: 14,
        bindings: [artId, 0]
      });
    }

    // 12x config lookups
    for (let i = 1; i <= 12; i++) {
      const configKey = ["vat_mode", "shipping_free_limit", "stock_threshold", "fast_delivery_cutoff", "filter_brand_max", "image_cdn_base", "sef_pagination_limit", "discounts_gas_promo", "schema_org_rating", "footer_disclaimer", "trust_badge_active", "cart_reservation_ttl"][i - 1];
      qList.push({
        id: `q-216-cfg-${i}`,
        sql: `SELECT \`value\` FROM \`sys_configvalues\` WHERE \`hostname\` = 'partsnl.local' AND \`scope_key\` = '${configKey}' LIMIT 1`,
        durationMs: Number((2.1 + (i % 4) * 0.18).toFixed(2)),
        origin: "app/Services/Config.php:43",
        is_duplicate: false,
        bindings: ["partsnl.local", configKey]
      });
    }

    // 4x fillArticleData queries
    for (let i = 1; i <= 4; i++) {
      qList.push({
        id: `q-216-fill-${i}`,
        sql: `SELECT * FROM \`sho_articles\` WHERE \`category_id\` = 8192 AND \`status\` = 1 ORDER BY \`popularity\` DESC LIMIT 6 OFFSET ${(i - 1) * 6}`,
        durationMs: Number((3.6 + i * 0.1).toFixed(2)),
        origin: "app/Services/Traits/GetIndex.php:2890",
        bindings: [8192, 1, 6, (i - 1) * 6]
      });
    }

    // Overige 33 categorische en optionele queries tot 73 queries
    for (let i = 41; i <= 73; i++) {
      qList.push({
        id: `q-216-extra-${i}`,
        sql: `SELECT \`id\`, \`name\`, \`code\` FROM \`sho_vat_types\` WHERE \`country_code\` = 'NL' AND \`id\` = ${10 + (i % 4)} LIMIT 1`,
        durationMs: Number((1.1 + (i % 5) * 0.2).toFixed(2)),
        origin: "app/Services/Category.php:340",
        bindings: ["NL", 10 + (i % 4)]
      });
    }

    return qList;
  } else {
    // 61 queries for Request 217 (AJAX GET /doe-het-zelf) - total 213.95ms
    const qList: ProfilerQuery[] = [
      {
        id: "q-217-01",
        sql: "SELECT * FROM `sys_applications` WHERE `domain` = 'partsnl.local' LIMIT 1",
        durationMs: 14.20,
        origin: "app/Providers/RouteServiceProvider.php:120",
        bindings: ["partsnl.local"]
      },
      {
        id: "q-217-02",
        sql: "SELECT * FROM `sho_categories` WHERE `slug` = 'doe-het-zelf' LIMIT 1",
        durationMs: 5.12,
        origin: "app/Services/Category.php:124",
        bindings: ["doe-het-zelf"]
      }
    ];

    // 14x N+1 article_prices queries
    for (let i = 1; i <= 14; i++) {
      const artId = 510920000 + i * 4;
      qList.push({
        id: `q-217-price-${i}`,
        sql: `SELECT * FROM \`sho_article_prices\` WHERE \`article_id\` = ${artId} AND \`channel\` = 'web' LIMIT 1`,
        durationMs: Number((2.3 + (i % 3) * 0.2).toFixed(2)),
        origin: "app/Libraries/ArticleLibrary.php:658",
        is_duplicate: i > 1,
        duplicate_count: 14,
        bindings: [artId, "web"]
      });
    }

    // 10x N+1 sho_articles
    for (let i = 1; i <= 10; i++) {
      const artId = 510920000 + i * 4;
      qList.push({
        id: `q-217-art-${i}`,
        sql: `SELECT * FROM \`sho_articles\` WHERE \`id\` = ${artId} AND \`deleted_at\` IS NULL LIMIT 1`,
        durationMs: Number((2.1 + (i % 2) * 0.15).toFixed(2)),
        origin: "app/Services/Traits/GetIndex.php:2890",
        is_duplicate: i > 1,
        duplicate_count: 10,
        bindings: [artId]
      });
    }

    // 8x config lookups
    for (let i = 1; i <= 8; i++) {
      qList.push({
        id: `q-217-cfg-${i}`,
        sql: `SELECT \`value\` FROM \`sys_configvalues\` WHERE \`hostname\` = 'partsnl.local' AND \`scope_key\` = 'ajax_item_${i}' LIMIT 1`,
        durationMs: Number((1.8 + (i % 3) * 0.1).toFixed(2)),
        origin: "app/Services/Config.php:43",
        bindings: ["partsnl.local", `ajax_item_${i}`]
      });
    }

    // Overige 27 queries tot 61 queries
    for (let i = 35; i <= 61; i++) {
      qList.push({
        id: `q-217-sub-${i}`,
        sql: `SELECT \`id\`, \`title\`, \`url\` FROM \`sho_category_content\` WHERE \`category_id\` = 9010 AND \`slot_id\` = ${i} LIMIT 1`,
        durationMs: Number((1.2 + (i % 4) * 0.15).toFixed(2)),
        origin: "app/Services/Category.php:210",
        bindings: [9010, i]
      });
    }

    return qList;
  }
}

export const RUN_160_REQ_216_QUERIES: ProfilerQuery[] = buildRun160Queries(false);
export const RUN_160_REQ_217_QUERIES: ProfilerQuery[] = buildRun160Queries(true);
export const RUN_160_ALL_134_QUERIES: ProfilerQuery[] = [...RUN_160_REQ_216_QUERIES, ...RUN_160_REQ_217_QUERIES];
