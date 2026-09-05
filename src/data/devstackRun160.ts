// DevStack Profiler Export Version 2 - Run 160 (parts-regression)
// Source of truth for PartsNL / Beekman production profiling data

export const DEVSTACK_RUN_160_RAW = {
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
    updated_at: "2026-09-04T14:13:23.000000Z"
  }
};

export interface DetailedLifecyclePhase {
  key: string;
  label: string;
  tone: "violet" | "blue" | "indigo" | "amber" | "emerald" | "purple" | "slate";
  start_ms: number;
  duration_ms: number;
  end_ms: number;
  description: string;
  queries_count?: number;
  queries_time_ms?: number;
}

export function computeDetailedPhases(markers: Record<string, number | undefined>, totalDurationMs: number): DetailedLifecyclePhase[] {
  const toMs = (ns?: number) => (ns ? Number((ns / 1_000_000).toFixed(2)) : 0);

  const booted = toMs(markers.laravel_booted) || 60.8;
  const controllerStart = toMs(markers.controller_started) || toMs(markers.action_started) || 88.5;
  const controllerEnd = toMs(markers.controller_finished) || 350.6;
  const renderStart = toMs(markers.render_started) || controllerEnd;
  const responsePrepared = toMs(markers.response_prepared) || toMs(markers.preparing_response) || totalDurationMs - 1;
  const requestHandled = toMs(markers.request_handled) || totalDurationMs;

  const phases: DetailedLifecyclePhase[] = [
    {
      key: "boot",
      label: "Framework & Service Providers Boot",
      tone: "violet",
      start_ms: 0,
      duration_ms: booted,
      end_ms: booted,
      description: "Composer autoloading, service providers, database verbinding & logging init"
    },
    {
      key: "middleware_before",
      label: "Routing & Middleware (Before Pipeline)",
      tone: "blue",
      start_ms: booted,
      duration_ms: Number((controllerStart - booted).toFixed(2)),
      end_ms: controllerStart,
      description: "Route matching, firewall inspectie, sessies decrypten & cookies valideren"
    },
    {
      key: "controller",
      label: "Controller Action Execution",
      tone: "amber",
      start_ms: controllerStart,
      duration_ms: Number((controllerEnd - controllerStart).toFixed(2)),
      end_ms: controllerEnd,
      description: "CategoryController@getFallbackIndex, Eloquent hydratatie en prijscalculaties"
    },
    {
      key: "render",
      label: "Blade / Twig View Rendering",
      tone: "emerald",
      start_ms: renderStart,
      duration_ms: Number((responsePrepared - renderStart).toFixed(2)),
      end_ms: responsePrepared,
      description: "View-composers (menu, banners, reviews, nagbars) en template rendering"
    },
    {
      key: "middleware_after",
      label: "Middleware (After) & Response Dispatch",
      tone: "purple",
      start_ms: responsePrepared,
      duration_ms: Number(Math.max(0.1, totalDurationMs - responsePrepared).toFixed(2)),
      end_ms: totalDurationMs,
      description: "Headers toevoegen, sessie wegschrijven en HTTP 200 payload versturen"
    }
  ];

  return phases;
}
