import React from "react";
import {
  Layers,
  ArrowRight,
  Database,
  Globe,
  HardDrive,
  CheckCircle2,
  Clock,
  Sparkles,
  Info
} from "lucide-react";
import { LifecyclePhases, MiddlewareChain, ProfilerQuery } from "../types";

interface LifecycleTimelineProps {
  phases?: LifecyclePhases;
  middlewareChain?: MiddlewareChain;
  controllerName?: string;
  routePattern?: string;
  viewName?: string;
  totalDurationMs: number;
  queries?: ProfilerQuery[];
  cacheOpsCount?: number;
  httpCallsCount?: number;
}

export const LifecycleTimeline: React.FC<LifecycleTimelineProps> = ({
  phases,
  middlewareChain,
  controllerName,
  routePattern,
  viewName,
  totalDurationMs,
  queries = [],
  cacheOpsCount = 0,
  httpCallsCount = 0
}) => {
  // Default realistic fallbacks if phases aren't explicitly provided
  const bootstrapMs = phases?.bootstrap_ms ?? 7.8;
  const routingMs = phases?.routing_ms ?? 64.8;
  const appMs = phases?.controller_ms ?? Math.max(10, totalDurationMs - bootstrapMs - routingMs - 0.5);
  const responsePrepMs = phases?.response_ms ?? 0.1;
  const unassignedMs = phases?.unassigned_ms ?? 0.4;
  const renderMs = phases?.render_ms ?? 61.2;

  const totalCalculated = bootstrapMs + routingMs + appMs + responsePrepMs + unassignedMs;
  const getPct = (val: number) => Math.max(2, Math.round((val / (totalCalculated || 1)) * 100));

  const beforeMiddleware = middlewareChain?.before ?? ["web", "safesefparts", "extraheaders", "force.noss1"];
  const afterMiddleware = middlewareChain?.after ?? ["force.noss1", "extraheaders", "safesefparts", "web"];

  return (
    <div className="space-y-6">
      {/* 1. Laravel-requestfasen horizontal breakdown bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Laravel-requestfasen
            </h4>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Totale flow/requestduur: <strong className="text-amber-300">{totalDurationMs.toFixed(1)} ms</strong>
          </span>
        </div>

        {/* Visual Segmented Progress Bar */}
        <div className="w-full h-4 rounded-xl bg-slate-950 overflow-hidden flex border border-slate-800 p-0.5 gap-0.5">
          <div
            style={{ width: `${getPct(bootstrapMs)}%` }}
            className="h-full bg-slate-600 rounded-l-lg hover:brightness-125 transition-all cursor-pointer relative group"
            title={`Start tot provider: ${bootstrapMs} ms`}
          />
          <div
            style={{ width: `${getPct(routingMs)}%` }}
            className="h-full bg-cyan-600 hover:brightness-125 transition-all cursor-pointer relative group"
            title={`Routing: ${routingMs} ms`}
          />
          <div
            style={{ width: `${getPct(appMs)}%` }}
            className="h-full bg-amber-500 hover:brightness-125 transition-all cursor-pointer relative group"
            title={`Applicatie: ${appMs} ms`}
          />
          <div
            style={{ width: `${getPct(responsePrepMs)}%` }}
            className="h-full bg-emerald-500 hover:brightness-125 transition-all cursor-pointer relative group"
            title={`Responsevoorbereiding: ${responsePrepMs} ms`}
          />
          <div
            style={{ width: `${getPct(unassignedMs)}%` }}
            className="h-full bg-slate-800 rounded-r-lg hover:brightness-125 transition-all cursor-pointer relative group"
            title={`Niet toegewezen: ${unassignedMs} ms`}
          />
        </div>

        {/* Legend Badges */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-slate-600" />
            <span className="text-slate-300">Start tot provider:</span>
            <strong className="text-slate-100">{bootstrapMs} ms</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-cyan-600" />
            <span className="text-slate-300">Routing:</span>
            <strong className="text-cyan-300">{routingMs} ms</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500" />
            <span className="text-slate-300">Applicatie:</span>
            <strong className="text-amber-300">{appMs.toFixed(1)} ms</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
            <span className="text-slate-300">Responsevoorbereiding:</span>
            <strong className="text-emerald-300">{responsePrepMs} ms</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700" />
            <span className="text-slate-400">Niet toegewezen:</span>
            <strong className="text-slate-400">{unassignedMs} ms</strong>
          </div>
        </div>
      </div>

      {/* 2. Lifecycle-tijdlijn (Vertical Timeline Stages) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Lifecycle-tijdlijn
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            0.0 ms &rarr; {totalDurationMs.toFixed(1)} ms
          </span>
        </div>

        <div className="space-y-3 relative pl-4 border-l-2 border-slate-800">
          {/* Stage 1: Bootstrap */}
          <div className="relative group">
            <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-700 border-2 border-slate-900" />
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                  Bootstrap
                </span>
                <span className="text-slate-400 font-semibold">{bootstrapMs} ms</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Start van het request tot de geregistreerde Laravel-provider.
              </p>
            </div>
          </div>

          {/* Stage 2: Routing */}
          <div className="relative group">
            <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-cyan-600 border-2 border-slate-900" />
            <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/20 hover:border-cyan-500/40 transition">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  Routing
                </span>
                <span className="text-cyan-400 font-semibold">{routingMs} ms</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
                <span className="text-slate-400">Route:</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-200">
                  {routePattern || "GET {fallbackPlaceholder}"}
                </span>
              </div>
            </div>
          </div>

          {/* Stage 3: Route-uitvoering (Middleware voor -> Controller -> Middleware na) */}
          <div className="relative group">
            <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-slate-900 ring-4 ring-amber-500/20" />
            <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  Route-uitvoering
                </span>
                <span className="text-amber-400 font-bold">{appMs.toFixed(1)} ms</span>
              </div>

              {/* Execution Chain */}
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-2 flex-wrap">
                <span className="text-slate-400 font-semibold">Keten:</span>
                <span className="text-slate-300">middleware vóór</span>
                <ArrowRight className="w-3 h-3 text-amber-400" />
                <span className="text-amber-300 font-bold">controller</span>
                <ArrowRight className="w-3 h-3 text-amber-400" />
                <span className="text-slate-300">middleware na</span>
              </div>

              {/* Controller Info */}
              {controllerName && (
                <div className="text-[11px] font-mono text-slate-300">
                  <span className="text-slate-400">Controller action:</span>{" "}
                  <code className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-200 font-bold">
                    {controllerName}
                  </code>
                </div>
              )}

              {/* Middlewareketen detailed tags */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2 text-[11px] font-mono">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-400 whitespace-nowrap">Vóór controller &rarr;</span>
                  {beforeMiddleware.map((m) => (
                    <span
                      key={m}
                      className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700/80"
                    >
                      {m}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-400 whitespace-nowrap">&larr; Na controller</span>
                  {afterMiddleware.map((m) => (
                    <span
                      key={m}
                      className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700/80"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stage 4: Views / Render */}
          <div className="relative group">
            <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-slate-900" />
            <div className="p-3 rounded-xl bg-slate-950/70 border border-purple-500/20 hover:border-purple-500/40 transition">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="font-bold text-purple-300 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                  Views &amp; Template Rendering
                </span>
                <span className="text-purple-400 font-semibold">{renderMs} ms</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Blade template:{" "}
                <span className="text-slate-200 font-semibold">
                  {viewName || "frontend.categories.fallback"}
                </span>{" "}
                (1 render event)
              </div>
            </div>
          </div>

          {/* Stage 5: Response */}
          <div className="relative group">
            <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
            <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-500/20 hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Responsevoorbereiding
                </span>
                <span className="text-emerald-400 font-semibold">{responsePrepMs} ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gekoppelde metingen indicator bar */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-semibold">Gekoppelde metingen:</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-blue-400">
                <Database className="w-3.5 h-3.5" />
                <strong>{queries.length || 73} queries</strong>
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <HardDrive className="w-3.5 h-3.5" />
                <strong>{cacheOpsCount} cache</strong>
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <Globe className="w-3.5 h-3.5" />
                <strong>{httpCallsCount} HTTP</strong>
              </span>
            </div>
          </div>

          {/* Visual Query tick marks spread */}
          <div className="w-full h-2 rounded-full bg-slate-900 relative overflow-hidden flex items-center">
            {queries.slice(0, 30).map((q, idx) => {
              const leftPct = (idx / 30) * 94 + 3;
              return (
                <div
                  key={q.id || idx}
                  style={{ left: `${leftPct}%` }}
                  className="absolute w-1 h-full bg-blue-500/80 rounded-full"
                  title={`Query ${idx + 1}: ${q.durationMs}ms`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
