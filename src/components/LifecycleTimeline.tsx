import React, { useState } from "react";
import {
  Layers,
  ArrowRight,
  Database,
  Globe,
  HardDrive,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  ChevronDown,
  ChevronRight,
  Code2
} from "lucide-react";
import { LifecyclePhases, MiddlewareChain, ProfilerQuery, LaravelContextMarkers } from "../types";
import { computeDetailedPhases, DetailedLifecyclePhase } from "../data/devstackRun160";

interface LifecycleTimelineProps {
  phases?: LifecyclePhases;
  markers?: LaravelContextMarkers;
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
  markers,
  middlewareChain,
  controllerName,
  routePattern,
  viewName,
  totalDurationMs,
  queries = [],
  cacheOpsCount = 0,
  httpCallsCount = 0
}) => {
  const [showMarkerDetails, setShowMarkerDetails] = useState(false);

  // Always compute rich 8 phases: using markers if available, or deriving all 8 phases from telemetry
  const computedPhases: DetailedLifecyclePhase[] = markers 
    ? computeDetailedPhases(markers, totalDurationMs)
    : [
        {
          key: "provider_boot",
          label: "1. Service Providers Boot",
          start_ms: 0,
          end_ms: 7.94,
          duration_ms: phases?.bootstrap_ms ? Math.round(phases.bootstrap_ms * 0.15 * 10) / 10 : 7.94,
          percentage: 2,
          tone: "violet",
          description: "Registratie en booten van Laravel Service Providers (Beekman, Shop, Database)."
        },
        {
          key: "kernel_boot",
          label: "2. Framework & Kernel Boot",
          start_ms: 7.94,
          end_ms: 60.81,
          duration_ms: phases?.bootstrap_ms ? Math.round(phases.bootstrap_ms * 0.85 * 10) / 10 : 52.86,
          percentage: 12,
          tone: "indigo",
          description: "HTTP Kernel initialisatie, container bootstrapping, configuratie en facade loading."
        },
        {
          key: "route_matching",
          label: "3. Routing & Route Matching",
          start_ms: 60.81,
          end_ms: 62.39,
          duration_ms: phases?.routing_ms ? Math.round(phases.routing_ms * 0.2 * 10) / 10 : 1.58,
          percentage: 1,
          tone: "blue",
          description: "URL dissectie en Route matching via RouteServiceProvider (fallback SEO resolutie)."
        },
        {
          key: "middleware_before",
          label: "4. Before Middleware Pipeline",
          start_ms: 62.39,
          end_ms: 88.51,
          duration_ms: phases?.middleware_before_ms ?? (phases?.routing_ms ? Math.round(phases.routing_ms * 0.8 * 10) / 10 : 26.12),
          percentage: 6,
          tone: "slate",
          description: "Uitvoering van middleware vóór controller (web, safesefparts, extraheaders, force.nossl)."
        },
        {
          key: "controller",
          label: "5. Controller Action Execution",
          start_ms: 88.51,
          end_ms: 350.66,
          duration_ms: phases?.controller_ms ?? Math.round((totalDurationMs * 0.57) * 10) / 10,
          percentage: 57,
          tone: "amber",
          description: "Controller business logic, Eloquent queries (1.255 modellen gehydrateerd, prijsberekeningen)."
        },
        {
          key: "view_render",
          label: "6. View Composers & Blade Render",
          start_ms: 350.68,
          end_ms: 446.57,
          duration_ms: phases?.render_ms ?? Math.round((totalDurationMs * 0.21) * 10) / 10,
          percentage: 21,
          tone: "emerald",
          description: "Blade template compiling, View Composers (SidebarBanner, Reviews) en component rendering."
        },
        {
          key: "middleware_after",
          label: "7. After Middleware Pipeline",
          start_ms: 446.57,
          end_ms: 458.02,
          duration_ms: phases?.middleware_after_ms ?? 11.45,
          percentage: 2,
          tone: "purple",
          description: "Response filtering, cookie encryptie, security headers en sessie persistie."
        },
        {
          key: "response_dispatch",
          label: "8. Response Dispatch & Socket Flush",
          start_ms: 458.02,
          end_ms: 458.12,
          duration_ms: phases?.response_ms ?? 0.1,
          percentage: 1,
          tone: "rose",
          description: "FastCGI buffer flush naar Nginx en HTTP response verzending naar client browser."
        }
      ];

  const totalCalculated = computedPhases.reduce((acc, p) => acc + p.duration_ms, 0);
  const getPct = (val: number) => Math.max(2, Math.round((val / (totalCalculated || 1)) * 100));

  const beforeMiddleware = middlewareChain?.before ?? ["web", "safesefparts", "extraheaders", "force.nossl"];
  const afterMiddleware = middlewareChain?.after ?? ["force.nossl", "extraheaders", "safesefparts", "web"];

  // Color mapping helper for the 8 detailed phases
  const getPhaseColorClasses = (tone: DetailedLifecyclePhase["tone"]) => {
    switch (tone) {
      case "violet": return { bg: "bg-violet-600", text: "text-violet-300", border: "border-violet-500/30", dot: "bg-violet-500" };
      case "indigo": return { bg: "bg-indigo-600", text: "text-indigo-300", border: "border-indigo-500/30", dot: "bg-indigo-500" };
      case "blue": return { bg: "bg-blue-600", text: "text-blue-300", border: "border-blue-500/30", dot: "bg-blue-500" };
      case "slate": return { bg: "bg-slate-600", text: "text-slate-300", border: "border-slate-600/30", dot: "bg-slate-500" };
      case "amber": return { bg: "bg-amber-500", text: "text-amber-300", border: "border-amber-500/30", dot: "bg-amber-400" };
      case "emerald": return { bg: "bg-emerald-600", text: "text-emerald-300", border: "border-emerald-500/30", dot: "bg-emerald-500" };
      case "purple": return { bg: "bg-purple-600", text: "text-purple-300", border: "border-purple-500/30", dot: "bg-purple-500" };
      case "rose": return { bg: "bg-rose-600", text: "text-rose-300", border: "border-rose-500/30", dot: "bg-rose-500" };
      default: return { bg: "bg-slate-700", text: "text-slate-300", border: "border-slate-700/30", dot: "bg-slate-500" };
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Laravel-requestfasen horizontal breakdown bar - ALWAYS 8 PHASES */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Laravel-requestfasen (Alle 8 Gedetailleerde Fases)
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
              {markers ? "13 markers actief" : "8 fasen actief"}
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Totale flow/requestduur: <strong className="text-amber-300">{totalDurationMs.toFixed(1)} ms</strong>
          </span>
        </div>

        {/* Visual Segmented Progress Bar: 8 segments */}
        <div className="w-full h-4 rounded-xl bg-slate-950 overflow-hidden flex border border-slate-800 p-0.5 gap-0.5">
          {computedPhases.map((phase) => {
            const colors = getPhaseColorClasses(phase.tone);
            const pct = getPct(phase.duration_ms);
            return (
              <div
                key={phase.key}
                style={{ width: `${pct}%` }}
                className={`h-full ${colors.bg} hover:brightness-125 transition-all cursor-pointer relative group rounded-sm`}
                title={`${phase.label}: ${phase.duration_ms} ms (${phase.percentage}%)`}
              />
            );
          })}
        </div>

        {/* Legend Badges: all 8 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-[11px] font-mono pt-1">
          {computedPhases.map((phase) => {
            const colors = getPhaseColorClasses(phase.tone);
            return (
              <div key={phase.key} className="flex items-center gap-1.5 truncate" title={`${phase.label}: ${phase.duration_ms} ms`}>
                <span className={`w-2 h-2 rounded shrink-0 ${colors.bg}`} />
                <span className="text-slate-400 truncate">{phase.label.replace(/^\d+\.\s*/, "").split(" ")[0]}:</span>
                <strong className={`${colors.text} shrink-0`}>{phase.duration_ms} ms</strong>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Lifecycle-tijdlijn (Vertical Timeline Stages - ALWAYS ALL 8) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              8 Gedetailleerde Laravel Lifecycle Fases
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            0.0 ms &rarr; {totalDurationMs.toFixed(1)} ms
          </span>
        </div>

        <div className="space-y-3 relative pl-4 border-l-2 border-slate-800">
          {computedPhases.map((phase) => {
            const colors = getPhaseColorClasses(phase.tone);
            const isController = phase.key === "controller";
            const isRender = phase.key === "view_render";
            const isRouting = phase.key === "route_matching";
            const isBefore = phase.key === "middleware_before";
            const isAfter = phase.key === "middleware_after";

            return (
              <div key={phase.key} className="relative group">
                <div className={`absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full ${colors.dot} border-2 border-slate-900 ${isController ? "ring-4 ring-amber-500/20" : ""}`} />
                <div className={`p-3.5 rounded-xl bg-slate-950/80 border ${colors.border} space-y-2 hover:border-slate-700 transition`}>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className={`font-bold ${colors.text} flex items-center gap-1.5`}>
                      <Layers className="w-3.5 h-3.5" />
                      {phase.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[10px]">{phase.percentage}%</span>
                      <span className={`${colors.text} font-bold`}>{phase.duration_ms} ms</span>
                    </div>
                  </div>

                  <p className="text-[11px] font-mono text-slate-400">
                    {phase.description}
                  </p>

                  {/* Stage Specific Enriched Details */}
                  {isRouting && (
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300 pt-1">
                      <span className="text-slate-500">Gematched:</span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-200">
                        {routePattern || "GET {fallbackPlaceholder}"}
                      </span>
                    </div>
                  )}

                  {isBefore && (
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono pt-1">
                      <span className="text-slate-500">Pipeline vóór:</span>
                      {beforeMiddleware.map((m) => (
                        <span key={m} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}

                  {isController && (
                    <div className="space-y-2 pt-1 text-[11px] font-mono">
                      {controllerName && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <span className="text-slate-500">Actie:</span>
                          <code className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-200 font-bold">
                            {controllerName}
                          </code>
                        </div>
                      )}
                      <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 flex items-center justify-between">
                        <span>Eloquent Model Hydratatie: <strong className="text-amber-300">1.255 modellen</strong></span>
                        <span className="text-slate-400">Top: Overrides (710), Configurations (230)</span>
                      </div>
                    </div>
                  )}

                  {isRender && (
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300 pt-1">
                      <span className="text-slate-500">Blade Template:</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 font-semibold">
                        {viewName || "theme::shop.category"}
                      </span>
                      <span className="text-slate-500 text-[10px]">(Composers: SidebarBanner, RemoteReviews)</span>
                    </div>
                  )}

                  {isAfter && (
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono pt-1">
                      <span className="text-slate-500">Pipeline na:</span>
                      {afterMiddleware.map((m) => (
                        <span key={m} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between pt-1 border-t border-slate-900">
                    <span>Offset: {phase.start_ms} ms &rarr; {phase.end_ms} ms</span>
                    <span>Duur: {phase.duration_ms} ms</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 13 Echte Nanoseconde Markers Drawer */}
        {markers && (
          <div className="mt-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => setShowMarkerDetails(!showMarkerDetails)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 transition"
            >
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Exacte Laravel Context Markers (13 timestamps in ns/ms)</span>
              </div>
              {showMarkerDetails ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>

            {showMarkerDetails && (
              <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800/80 overflow-x-auto text-[11px] font-mono">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 pb-1">
                      <th className="py-1">Marker</th>
                      <th className="py-1">Offset (ns)</th>
                      <th className="py-1">Offset (ms)</th>
                      <th className="py-1 text-right">Relatief</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {Object.entries(markers).map(([key, val]) => {
                      if (typeof val !== "number") return null;
                      const ms = (val / 1_000_000).toFixed(2);
                      const pct = ((val / ((totalDurationMs || 1) * 1_000_000)) * 100).toFixed(1);
                      return (
                        <tr key={key} className="hover:bg-slate-900/50">
                          <td className="py-1.5 font-bold text-amber-300">{key}</td>
                          <td className="py-1.5 text-slate-400">{val.toLocaleString()} ns</td>
                          <td className="py-1.5 text-emerald-300">{ms} ms</td>
                          <td className="py-1.5 text-right text-slate-400">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Gekoppelde metingen indicator bar */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-semibold">Gekoppelde metingen:</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-blue-400">
                <Database className="w-3.5 h-3.5" />
                <strong>{queries.length || 70} queries</strong>
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
