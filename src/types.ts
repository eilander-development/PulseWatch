export type EventType = "exception" | "query" | "request" | "job" | "log";
export type EventLevel = "info" | "warning" | "error" | "critical";

export interface CodeSnippetLine {
  line: number;
  code: string;
  highlight?: boolean;
}

export interface Breadcrumb {
  category?: "request" | "route" | "query" | "auth" | "cache" | "job" | "system" | "exception" | "measure" | "http" | "warning";
  type?: "request" | "route" | "query" | "auth" | "cache" | "job" | "system" | "exception" | "measure" | "http" | "warning";
  message: string;
  time?: string;
  offset_ms?: number;
}

export interface ExceptionSnippet {
  file: string;
  line: number;
  lines: Record<string, string>;
}

export interface DevStackExceptionData {
  class: string;
  code: number;
  message: string;
  file: string;
  line: number;
  snippet?: ExceptionSnippet;
}

export interface ExplainPlan {
  select_type: string;
  table: string;
  type: string;
  possible_keys?: string | null;
  key?: string | null;
  rows_examined: number;
  cost?: string;
}

export interface TraceSpan {
  id: string;
  name: string;
  category: "boot" | "middleware" | "controller" | "query" | "http" | "view" | "cache";
  startMs: number;
  durationMs: number;
  details?: string;
  sql?: string;
  status?: number;
}

export interface ProfilerQuery {
  id: string;
  sql: string;
  durationMs: number;
  origin?: string;
  is_duplicate?: boolean;
  duplicate_count?: number;
  total_time_ms?: number;
  avg_time_ms?: number;
  bindings?: (string | number)[];
  explain_plan?: ExplainPlan;
}

export interface GroupedQuery {
  fingerprint: string;
  sql: string;
  sampleSql: string;
  count: number;
  totalTimeMs: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  origin?: string;
  isDuplicate: boolean;
  instances: ProfilerQuery[];
}

export interface CacheOp {
  key: string;
  operation: "get" | "set" | "remember" | "forget";
  hit: boolean;
  durationMs: number;
  store?: string;
}

export interface EventDispatched {
  event: string;
  listeners_count: number;
  durationMs: number;
}

export interface GateEvaluated {
  ability: string;
  result: "allowed" | "denied";
  user_id?: number;
}

export interface LaravelContextMarkers {
  provider_ready?: number;
  laravel_booted?: number;
  before_middleware_started?: number;
  route_matched?: number;
  action_started?: number;
  controller_started?: number;
  controller_finished?: number;
  preparing_response?: number;
  render_started?: number;
  response_prepared?: number;
  after_middleware_started?: number;
  sending_started?: number;
  request_handled?: number;
  [key: string]: number | undefined;
}

export interface LifecyclePhases {
  bootstrap_ms: number;
  routing_ms?: number;
  middleware_before_ms?: number;
  controller_ms: number;
  render_ms?: number;
  middleware_after_ms?: number;
  response_ms: number;
  unassigned_ms: number;
  total_ms?: number;
}

export interface MiddlewareChain {
  before: string[];
  after: string[];
}

export interface RequestHotspot {
  id: string;
  frame: string;
  file: string;
  line: number;
  query_count: number;
  total_time_ms: number;
  reason: string;
  reason_type: "n1" | "slow_query" | "time" | "external";
  queries?: ProfilerQuery[];
}

export interface OutgoingHttpCall {
  id: string;
  method: string;
  url: string;
  status: number;
  duration_ms: number;
  origin?: string;
  context?: string;
}

export interface ProfilerRunSummary {
  id: string;
  label: string;
  status: "completed" | "warning" | "error";
  domain: string;
  run_number: number;
  timestamp: number;
  flow_duration_ms: number;
  requests_count: number;
  queries_count: number;
  cache_hits_pct?: number;
  memory_peak_mb: number;
  overhead_pct: number;
  request_ids: string[];
}

export interface BottleneckInfo {
  category: "database" | "external" | "memory" | "n_plus_one" | "php" | "lock";
  label: string;
  details: string;
  impact_pct: number;
}

export interface DumpEntry {
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
  related_trace_id?: string;
  client_source?: "php" | "vue";
}

export interface TelemetryEvent {
  id: string;
  type: EventType;
  timestamp: number;
  level: EventLevel;
  title: string;
  message?: string;
  durationMs?: number;
  resolved?: boolean;
  metadata: {
    exception_class?: string;
    file?: string;
    line?: number;
    code_snippet?: CodeSnippetLine[];
    breadcrumbs?: Breadcrumb[];
    raw_exception?: DevStackExceptionData;
    auth_user?: { id: string | number; guard?: string };
    request?: {
      method: string;
      url: string;
      status: number;
      ip?: string;
      user_agent?: string;
      user_id?: number | string;
      user_email?: string;
    };
    sql?: string;
    execution_count?: number;
    total_time_ms?: number;
    origin?: string;
    explain_plan?: ExplainPlan;
    memory_peak_mb?: number;
    db_queries_count?: number;
    db_time_ms?: number;
    external_http_time_ms?: number;
    php_execution_time_ms?: number;
    controller?: string;
    middleware?: string[];
    middleware_chain?: MiddlewareChain;
    lifecycle_phases?: LifecyclePhases;
    loaded_models?: Record<string, number>;
    models_count?: number;
    hotspots?: RequestHotspot[];
    http_calls?: OutgoingHttpCall[];
    domain?: string;
    run_id?: string;
    route_pattern?: string;
    view_name?: string;
    breakdown?: {
      database_pct: number;
      external_pct: number;
      php_pct: number;
    };
    primary_bottleneck?: BottleneckInfo;
    spans?: TraceSpan[];
    queries?: ProfilerQuery[];
    cache_operations?: CacheOp[];
    events_dispatched?: EventDispatched[];
    gates_evaluated?: GateEvaluated[];
    headers?: Record<string, string>;
    session_data?: Record<string, any>;
    job_class?: string;
    queue?: string;
    attempts?: number;
    max_tries?: number;
    payload?: any;
    occurrences_last_24h?: number;
    affected_users?: number;
    tags?: Record<string, string>;
    vue_component?: string;
    inertia_version?: string;
    inertia_partial_reload?: boolean;
    client_framework?: "vue3" | "inertia" | "blade";
    [key: string]: any;
  };
}

export interface APMStats {
  requests_per_second: string;
  avg_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  error_count: number;
  error_rate_pct: string;
  slow_queries_count: number;
  active_queue_workers: number;
  queue_backlog: number;
  redis_hit_ratio_pct: number;
  cpu_usage_pct: number;
  memory_usage_mb: number;
  total_events: number;
  sentinel_status: "healthy" | "warning" | "critical";
}

export interface SentinelCheck {
  id: string;
  name: string;
  category: "database" | "redis" | "storage" | "workers" | "security" | "webhooks";
  status: "healthy" | "warning" | "failing";
  value: string;
  latency_ms: number;
  last_checked: string;
  details: string;
}

export interface RouteThresholdRule {
  id: string;
  pattern: string;
  method: string;
  threshold_ms: number;
  enabled: boolean;
  notes?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar_color: string;
}

export interface Project {
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
