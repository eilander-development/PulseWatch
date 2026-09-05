import React, { useState, useEffect } from "react";
import {
  Globe,
  Clock,
  Database,
  Cpu,
  Layers,
  Search,
  Filter,
  Code2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Copy,
  Check,
  HardDrive,
  FileCode,
  Tag,
  KeyRound,
  BarChart2,
  Terminal,
  Play,
  Zap,
  BookOpen,
  GitCompare,
  History,
  Download,
  Trash2,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Sliders
} from "lucide-react";
import { TelemetryEvent, TraceSpan, ProfilerQuery, GroupedQuery, ProfilerRunSummary } from "../types";
import { LARAVEL_RECIPES, LaravelFixRecipe } from "../data/laravelRecipes";
import { DEVSTACK_RUN_160, RUN_160_WARNING_LOGS, ProfilerLogEntry } from "../data/devstackRun160";
import { LifecycleTimeline } from "./LifecycleTimeline";
import { EloquentModelsStrip } from "./EloquentModelsStrip";
import { HotspotsTable } from "./HotspotsTable";
import { RunsCompareView } from "./RunsCompareView";
import { OutgoingHttpCallsList } from "./OutgoingHttpCallsList";

interface RequestProfilerViewProps {
  events: TelemetryEvent[];
  initialRequestId?: string | null;
  onSendQueryToTinker?: (code: string) => void;
  onOpenDebugLab?: (filter: string) => void;
  onOpenRecipe?: (recipe: LaravelFixRecipe) => void;
}

export const RequestProfilerView: React.FC<RequestProfilerViewProps> = ({
  events,
  initialRequestId,
  onSendQueryToTinker,
  onOpenDebugLab,
  onOpenRecipe
}) => {
  const requestEvents = events.filter((e) => e.type === "request");

  const defaultRuns: ProfilerRunSummary[] = [
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
      memory_peak_mb: 16.4,
      overhead_pct: 0.82,
      request_ids: ["evt-req-run-159"]
    },
    {
      id: "run-42",
      label: "checkout-flow",
      status: "completed",
      domain: "partsnl.local",
      run_number: 42,
      timestamp: Date.now() - 1000 * 60 * 60 * 5,
      flow_duration_ms: 312.4,
      requests_count: 1,
      queries_count: 12,
      memory_peak_mb: 8.4,
      overhead_pct: 0.45,
      request_ids: ["evt-req-parts-02"]
    }
  ];

  const [runs, setRuns] = useState<ProfilerRunSummary[]>(defaultRuns);
  const [selectedRunId, setSelectedRunId] = useState<string>("run-160");
  const [sidebarTab, setSidebarTab] = useState<"runs" | "requests">("runs");
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/telemetry/runs")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRuns(data);
        }
      })
      .catch(() => {});
  }, []);

  const currentRun = runs.find((r) => r.id === selectedRunId) || runs[0];

  const [selectedReqId, setSelectedReqId] = useState<string>(
    initialRequestId || (currentRun?.request_ids?.[0]) || "evt-req-parts-01"
  );

  useEffect(() => {
    if (initialRequestId) {
      setSelectedReqId(initialRequestId);
    } else if (currentRun?.request_ids && currentRun.request_ids.length > 0) {
      if (!currentRun.request_ids.includes(selectedReqId)) {
        setSelectedReqId(currentRun.request_ids[0]);
      }
    }
  }, [initialRequestId, selectedRunId, currentRun]);

  const [activeSubtab, setActiveSubtab] = useState<
    "overzicht" | "application_path" | "hotspots" | "logs" | "queries" | "requests" | "cache" | "http" | "exceptions" | "compare" | "waterfall"
  >("application_path");
  const [logLevelFilter, setLogLevelFilter] = useState<string>("all");
  const [copiedQueryId, setCopiedQueryId] = useState<string | null>(null);
  const [activeExplainId, setActiveExplainId] = useState<string | null>(null);
  const [selectedSpan, setSelectedSpan] = useState<TraceSpan | null>(null);

  const currentRunRequests = requestEvents.filter(
    (e) => (currentRun?.request_ids || []).includes(e.id) || e.metadata?.run_id === selectedRunId
  );
  const activeRequestList = currentRunRequests.length > 0 ? currentRunRequests : requestEvents;

  // Duplicate Query state & grouping
  const [queryViewMode, setQueryViewMode] = useState<"grouped" | "flat">("grouped");
  const [expandedGroupFp, setExpandedGroupFp] = useState<string | null>(null);
  const [onlyDuplicatesFilter, setOnlyDuplicatesFilter] = useState<boolean>(false);

  // Search & filter requests
  const [reqFilter, setReqFilter] = useState<string>("");
  const [onlySlow, setOnlySlow] = useState<boolean>(false);

  const filteredRequests = requestEvents.filter((r) => {
    if (onlySlow && (r.durationMs || 0) < 300) return false;
    if (reqFilter) {
      const q = reqFilter.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        (r.metadata.controller && r.metadata.controller.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const currentRequest =
    requestEvents.find((r) => r.id === selectedReqId) ||
    currentRunRequests[0] ||
    filteredRequests[0] ||
    requestEvents[0];

  const totalDuration = currentRequest?.durationMs || 100;
  const spans = currentRequest?.metadata?.spans || [];
  const queries = currentRequest?.metadata?.queries || [];

  // Helper to normalize SQL queries for grouping duplicates (identifying N+1 patterns)
  const normalizeSql = (sql: string): string => {
    return sql
      .replace(/'[^']*'/g, "'?'")
      .replace(/\b\d+\b/g, "?")
      .replace(/\s+/g, " ")
      .trim();
  };

  const groupedQueries: GroupedQuery[] = React.useMemo(() => {
    const map = new Map<string, GroupedQuery>();
    queries.forEach((q: ProfilerQuery) => {
      const fp = normalizeSql(q.sql);
      const existing = map.get(fp);
      if (existing) {
        existing.count += 1;
        existing.totalTimeMs += q.durationMs;
        existing.avgTimeMs = Math.round((existing.totalTimeMs / existing.count) * 10) / 10;
        existing.minTimeMs = Math.min(existing.minTimeMs, q.durationMs);
        existing.maxTimeMs = Math.max(existing.maxTimeMs, q.durationMs);
        existing.isDuplicate = true;
        existing.instances.push(q);
      } else {
        map.set(fp, {
          fingerprint: fp,
          sql: fp,
          sampleSql: q.sql,
          count: 1,
          totalTimeMs: q.durationMs,
          avgTimeMs: q.durationMs,
          minTimeMs: q.durationMs,
          maxTimeMs: q.durationMs,
          origin: q.origin,
          isDuplicate: !!q.is_duplicate,
          instances: [q]
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.isDuplicate !== b.isDuplicate) {
        return a.isDuplicate ? -1 : 1;
      }
      return b.totalTimeMs - a.totalTimeMs;
    });
  }, [queries]);

  const duplicateGroups = groupedQueries.filter((g) => g.count > 1 || g.isDuplicate);
  const totalDuplicateExecutions = duplicateGroups.reduce((acc, g) => acc + g.count, 0);
  const totalDuplicateTime = duplicateGroups.reduce((acc, g) => acc + g.totalTimeMs, 0);
  const totalDbTime = queries.reduce((acc: number, q: ProfilerQuery) => acc + q.durationMs, 0);
  const avgDuplicateTime = totalDuplicateExecutions > 0 ? Math.round((totalDuplicateTime / totalDuplicateExecutions) * 10) / 10 : 0;
  const cacheOps = currentRequest?.metadata?.cache_operations || [];
  const dispatchedEvents = currentRequest?.metadata?.events_dispatched || [];
  const gates = currentRequest?.metadata?.gates_evaluated || [];
  const headers = currentRequest?.metadata?.headers || {};
  const sessionData = currentRequest?.metadata?.session_data || {};

  // Dynamically compute flow metrics from actual requests in this run
  const flowRequests = currentRunRequests.length > 0 ? currentRunRequests : (currentRequest ? [currentRequest] : []);
  const flowDuration = currentRun?.flow_duration_ms || flowRequests.reduce((acc, r) => acc + (r.durationMs || 0), 0) || 1;
  const flowQueries = flowRequests.flatMap((r) => r.metadata?.queries || []);
  const flowDbDuration = flowQueries.reduce((acc, q) => acc + (q.durationMs || 0), 0);
  const uniqueSqlCount = new Set(flowQueries.map((q) => q.sql.trim().toLowerCase())).size;
  const flowHttpCalls = flowRequests.flatMap((r) => r.metadata?.http_calls || []);
  const flowHttpDuration = flowHttpCalls.reduce((acc, h) => acc + (h.duration_ms || 0), 0);
  const flowUnassigned = Math.max(0, Math.round((flowDuration - flowDbDuration - flowHttpDuration) * 10) / 10);
  const dbPct = Math.min(100, Math.round((flowDbDuration / flowDuration) * 100));
  const httpPct = Math.min(100, Math.round((flowHttpDuration / flowDuration) * 100));
  const slowQueriesInFlow = flowQueries.filter((q) => q.durationMs >= 25);
  const duplicateQueriesInFlow = flowQueries.filter((q) => q.is_duplicate);

  const getStatusColor = (status?: number) => {
    if (!status) return "bg-slate-800 text-slate-300 border-slate-700";
    if (status >= 500) return "bg-rose-500/20 text-rose-300 border-rose-500/40";
    if (status >= 400) return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  };

  const getSpanColor = (category: TraceSpan["category"]) => {
    switch (category) {
      case "boot":
        return "bg-slate-600 border-slate-500 text-slate-200";
      case "middleware":
        return "bg-cyan-600 border-cyan-500 text-cyan-100";
      case "controller":
        return "bg-amber-600 border-amber-500 text-amber-100";
      case "query":
        return "bg-blue-600 border-blue-500 text-blue-100";
      case "http":
        return "bg-purple-600 border-purple-500 text-purple-100";
      case "view":
        return "bg-emerald-600 border-emerald-500 text-emerald-100";
      case "cache":
        return "bg-violet-600 border-violet-500 text-violet-100";
      default:
        return "bg-slate-500 border-slate-400 text-slate-100";
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQueryId(id);
    setTimeout(() => setCopiedQueryId(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* DevStack Project Header Ribbon (Exact match with target DevStack screenshot 1 & 4) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mb-0.5">
              <span>DevStack</span>
              <span>/</span>
              <span>Projecten</span>
              <span>/</span>
              <span className="text-cyan-400 font-semibold">{currentRequest?.metadata?.domain || currentRun.domain || "partsnl.local"}</span>
              <span>/</span>
              <span className="text-amber-400 font-bold">Request Profiler</span>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight">
                Laravel Request Profiler &amp; Waterval
              </h2>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Tracing Actief
              </span>
              <span className="text-xs font-mono text-slate-400 hidden lg:inline">
                PHP 8.3.10 · Laravel 11.20 · Inertia / Vue 3
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            Geselecteerd: <strong className="text-amber-400">{currentRun.label}</strong> ({currentRunRequests.length} requests)
          </span>
        </div>
      </div>

      {/* Main Grid: Run/Request Selector (Left) + Profiler Workbench (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Runs & Request List (Compact & DevStack-aligned) */}
        <div className="lg:col-span-3 xl:col-span-3 space-y-3">
          {/* View Mode Toggle: Runs vs Alle Requests */}
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => setSidebarTab("runs")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
                sidebarTab === "runs"
                  ? "bg-slate-800 text-amber-300 font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Recente runs ({runs.length})</span>
            </button>
            <button
              onClick={() => setSidebarTab("requests")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
                sidebarTab === "requests"
                  ? "bg-slate-800 text-amber-300 font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Requests ({requestEvents.length})</span>
            </button>
          </div>

          {/* RUNS LIST (Screenshot 4) */}
          {sidebarTab === "runs" && (
            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {runs.map((run) => {
                const isSelected = run.id === selectedRunId;
                const isCompleted = run.status === "completed";

                return (
                  <div
                    key={run.id}
                    onClick={() => {
                      setSelectedRunId(run.id);
                      const matchingReq = requestEvents.find((r) => (run.request_ids || []).includes(r.id));
                      if (matchingReq) setSelectedReqId(matchingReq.id);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? "bg-slate-900 border-amber-500/70 shadow-md ring-1 ring-amber-500/20"
                        : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90"
                    }`}
                  >
                    {/* Header: Label + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xs font-bold font-mono text-white truncate">
                          {run.label}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-bold ${
                            isCompleted
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          }`}
                        >
                          {isCompleted ? "Afgesloten" : "Waarschuwing"}
                        </span>
                      </div>

                      <span className="text-xs font-mono font-bold text-amber-300">
                        {run.flow_duration_ms} ms
                      </span>
                    </div>

                    {/* Domain & Run ID */}
                    <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                      <span>{run.domain} · run {run.run_number}</span>
                      <span className="text-slate-500">
                        {new Date(run.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Stats Pill Row */}
                    <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center pt-1 border-t border-slate-800/80">
                      <div className="p-1 rounded bg-slate-950/70">
                        <div className="text-slate-500">Reqs</div>
                        <div className="font-bold text-slate-200">{run.requests_count}</div>
                      </div>
                      <div className="p-1 rounded bg-slate-950/70">
                        <div className="text-slate-500">Queries</div>
                        <div className="font-bold text-blue-300">{run.queries_count}</div>
                      </div>
                      <div className="p-1 rounded bg-slate-950/70">
                        <div className="text-slate-500">RAM</div>
                        <div className="font-bold text-rose-300">{run.memory_peak_mb}M</div>
                      </div>
                      <div className="p-1 rounded bg-slate-950/70">
                        <div className="text-slate-500">Overhead</div>
                        <div className="font-bold text-emerald-300">{run.overhead_pct}%</div>
                      </div>
                    </div>

                    {/* Requests preview in this run (DevStack style request picker) */}
                    {isSelected && (
                      <div className="pt-2.5 border-t border-slate-800/80 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                          <span>Flow requests ({currentRunRequests.length}):</span>
                          <span className="text-amber-400 font-bold">{currentRun.flow_duration_ms} ms</span>
                        </div>
                        {currentRunRequests.map((r, idx) => {
                          const isReqActive = currentRequest?.id === r.id;
                          const qCount = r.metadata?.queries?.length || r.metadata?.db_queries_count || 0;
                          return (
                            <div
                              key={r.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReqId(r.id);
                              }}
                              className={`p-2 rounded-xl border flex flex-col gap-1 text-xs font-mono transition-all cursor-pointer ${
                                isReqActive
                                  ? "bg-amber-500/15 text-amber-200 border-amber-500/50 shadow-sm"
                                  : "bg-slate-950/80 text-slate-300 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className={`text-[10px] px-1 py-0.2 rounded font-bold ${isReqActive ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"}`}>
                                    #{idx === 0 ? "216" : "217"}
                                  </span>
                                  <span className="truncate font-medium text-slate-200">{r.title}</span>
                                </div>
                                <span className={`font-bold ${isReqActive ? "text-amber-300" : "text-amber-400"}`}>
                                  {r.durationMs}ms
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span className="text-blue-400 font-medium">{qCount} queries</span>
                                {r.metadata?.flow_offset_ms ? (
                                  <span className="text-cyan-400 font-medium">+{r.metadata.flow_offset_ms}ms AJAX</span>
                                ) : (
                                  <span className="text-emerald-400 font-medium">Initiële request</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* REQUESTS LIST MODE */}
          {sidebarTab === "requests" && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Filter Requests</span>
                  <span>{filteredRequests.length} van {requestEvents.length}</span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Zoek endpoint..."
                    value={reqFilter}
                    onChange={(e) => setReqFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500/40 font-mono"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-mono text-slate-400 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={onlySlow}
                    onChange={(e) => setOnlySlow(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                  />
                  <span>Alleen trage requests (&gt;300ms)</span>
                </label>
              </div>

              <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
                {filteredRequests.map((req) => {
                  const isSelected = req.id === (currentRequest?.id || "");
                  const status = req.metadata.status || 200;
                  const duration = req.durationMs || 100;
                  const isSlow = duration >= 300;
                  const bottleneck = req.metadata.primary_bottleneck;

                  return (
                    <div
                      key={req.id}
                      onClick={() => {
                        setSelectedReqId(req.id);
                        if (activeSubtab === "overzicht") setActiveSubtab("application_path");
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? "bg-slate-900 border-amber-500/70 shadow-md ring-1 ring-amber-500/20"
                          : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-bold ${getStatusColor(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                          <span className="text-xs font-mono font-bold text-white truncate">
                            {req.title}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-mono font-bold whitespace-nowrap ${
                            isSlow ? "text-amber-400" : "text-slate-300"
                          }`}
                        >
                          {duration}ms
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span className="truncate max-w-[190px]">
                          {req.metadata.controller?.split("@")[0]?.split("\\").pop() || "Route Closure"}
                        </span>
                        <span>{req.metadata.db_queries_count ?? 0} queries</span>
                      </div>

                      {bottleneck && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-800/70 text-[10px] font-mono text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{bottleneck.label}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Profiler Workbench (Wide & Readable) */}
        <div className="lg:col-span-9 xl:col-span-9 space-y-4">
          {currentRequest ? (
            <>
              {/* Header Box: Current Run & Request Vital Info (Screenshot 4) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                      {currentRun.label} · run {currentRun.run_number}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${getStatusColor(
                        currentRequest.metadata.status
                      )}`}
                    >
                      {currentRequest.metadata.status || 200}
                    </span>
                    <h3 className="text-sm font-bold font-mono text-white">
                      {currentRequest.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {onOpenDebugLab && (
                      <button
                        onClick={() => onOpenDebugLab(currentRequest.metadata.controller || currentRequest.title)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 text-xs font-mono font-medium flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                        title="Bekijk dumps en variables in Debug Lab"
                      >
                        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Debug Lab</span>
                      </button>
                    )}

                    <span className="text-sm font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {currentRun.flow_duration_ms} ms flowduur
                    </span>
                  </div>
                </div>

                {/* Controller & Domain Tag row */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400 pt-1">
                  <span className="flex items-center gap-1 text-slate-300 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800">
                    <FileCode className="w-3.5 h-3.5 text-amber-400" />
                    {currentRequest.metadata.controller || "CategoryController@getFallbackIndex"}
                  </span>

                  <span className="flex items-center gap-1 text-slate-300 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    {currentRequest.metadata.domain || currentRun.domain || "partsnl.local"}
                  </span>

                  <span className="flex items-center gap-1 text-slate-300 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800">
                    <Database className="w-3.5 h-3.5 text-blue-400" />
                    {queries.length || currentRequest.metadata.db_queries_count || 0} queries ({currentRequest.metadata.db_time_ms || 523.2}ms)
                  </span>

                  <span className="flex items-center gap-1 text-slate-300 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800">
                    <Cpu className="w-3.5 h-3.5 text-rose-400" />
                    {currentRequest.metadata.memory_peak_mb ?? currentRun.memory_peak_mb} MB RAM
                  </span>

                  {(currentRequest.metadata?.vue_component || currentRequest.metadata?.client_framework === "inertia") && (
                    <span className="flex items-center gap-1 text-teal-300 bg-teal-950/60 px-2 py-1 rounded-lg border border-teal-500/40 font-semibold">
                      <Code2 className="w-3.5 h-3.5 text-teal-400" />
                      <span>Vue: {currentRequest.metadata.vue_component || "Inertia Page"}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Profiler Sub-Navigation Tabs: DevStack-style Cyan Highlight, Clean & Uncluttered */}
              <div className="flex items-center gap-1 border-b border-slate-800/80 overflow-x-auto pb-px">
                {[
                  { 
                    id: "application_path", 
                    label: "Lifecycle & Modellen", 
                    badge: "8 fasen · 1.255 models",
                    isHighlight: true
                  },
                  { 
                    id: "waterfall", 
                    label: "Waterval", 
                    count: spans.length 
                  },
                  { 
                    id: "queries", 
                    label: "Queries", 
                    count: queries.length || currentRequest.metadata?.db_queries_count || 0,
                    hasDuplicates: duplicateGroups.length > 0,
                    duplicateCount: totalDuplicateExecutions
                  },
                  { 
                    id: "hotspots", 
                    label: "Code Hotspots", 
                    count: DEVSTACK_RUN_160.report.hotspots.length 
                  },
                  { 
                    id: "logs", 
                    label: "Logs & Warnings", 
                    count: RUN_160_WARNING_LOGS.length,
                    isWarning: true
                  },
                  { 
                    id: "http", 
                    label: "Cache & HTTP", 
                    count: cacheOps.length + (currentRequest?.metadata?.http_calls?.length || 0) 
                  },
                  { 
                    id: "compare", 
                    label: "Vergelijken",
                    badge: "Gefixeerd op /gas"
                  }
                ].map((tab) => {
                  const isActive = activeSubtab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSubtab(tab.id as any)}
                      className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border-t-2 ${
                        isActive
                          ? "bg-slate-900 border-amber-500 text-white shadow-sm"
                          : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                            isActive ? "bg-amber-500 text-slate-950" : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                      {tab.count !== undefined && !tab.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                            isActive 
                              ? "bg-amber-500 text-slate-950" 
                              : (tab.isWarning ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" : "bg-slate-800 text-slate-400")
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                      {tab.hasDuplicates && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                          {tab.duplicateCount}x N+1
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* SUBTAB: OVERZICHT (Screenshot 4) */}
              {activeSubtab === "overzicht" && (
                <div className="space-y-5">
                  {/* Flow KPI Cards Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Flowduur</div>
                      <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
                        {currentRun.flow_duration_ms} ms
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Requests</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">
                        {currentRun.requests_count}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Queries</div>
                      <div className="text-base font-bold font-mono text-blue-400 mt-0.5">
                        {currentRun.queries_count}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Cachehits</div>
                      <div className="text-base font-bold font-mono text-slate-400 mt-0.5">—</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Geheugenpiek</div>
                      <div className="text-base font-bold font-mono text-rose-400 mt-0.5">
                        {currentRun.memory_peak_mb} MB
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Overhead</div>
                      <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                        {currentRun.overhead_pct}%
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveSubtab("compare")}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                        <span>Vergelijken</span>
                      </button>

                      <button
                        onClick={() => {
                          const exportData = JSON.stringify(currentRun, null, 2);
                          navigator.clipboard.writeText(exportData);
                          setExportNotice("Run samenvatting gekopieerd naar klembord!");
                          setTimeout(() => setExportNotice(null), 3000);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        <span>Exporteren</span>
                      </button>

                      <button
                        onClick={() => {
                          if (runs.length > 1) {
                            setRuns(runs.filter((r) => r.id !== selectedRunId));
                            setSelectedRunId(runs[0].id);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-xs font-mono font-medium flex items-center gap-1.5 transition border border-slate-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Verwijderen</span>
                      </button>
                    </div>

                    {exportNotice && (
                      <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> {exportNotice}
                      </span>
                    )}

                    <span className="text-xs font-mono text-slate-500">
                      Run #{currentRun.run_number} · {currentRun.domain}
                    </span>
                  </div>

                  {/* Requests in de flow parallel timeline */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-slate-200 uppercase tracking-wider">
                        Requests in de flow ({flowRequests.length})
                      </span>
                      <span className="text-slate-400">
                        Totale flowduur: {flowDuration} ms
                      </span>
                    </div>

                    <div className="space-y-2">
                      {flowRequests.map((req, idx) => {
                        const isAjax =
                          req.metadata?.headers?.["x-requested-with"] === "XMLHttpRequest" ||
                          req.title.toLowerCase().includes("ajax") ||
                          req.title.toLowerCase().includes("api");
                        const widthPct = Math.min(100, Math.max(8, Math.round((req.durationMs / flowDuration) * 100)));
                        const isSelected = selectedReqId === req.id;

                        return (
                          <div
                            key={req.id}
                            onClick={() => {
                              setSelectedReqId(req.id);
                              setActiveSubtab("application_path");
                            }}
                            className={`p-3 rounded-xl bg-slate-950 border transition cursor-pointer space-y-1.5 group ${
                              isSelected
                                ? "border-amber-500/70 shadow"
                                : "border-slate-800 hover:border-amber-500/50"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="font-bold text-slate-200 group-hover:text-amber-300 transition flex items-center gap-2">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                                    isAjax
                                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  }`}
                                >
                                  {isAjax ? "ajax" : "page"}
                                </span>
                                <span className="truncate max-w-sm">{req.title}</span>
                              </span>
                              <span className="text-amber-400 font-bold shrink-0">{req.durationMs} ms</span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden">
                              <div
                                style={{ width: `${widthPct}%` }}
                                className={`h-full rounded-full transition-all ${
                                  idx % 2 === 0 ? "bg-amber-500" : "bg-cyan-500"
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Belangrijkste bevindingen */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-200">
                        Belangrijkste bevindingen
                      </h4>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      {slowQueriesInFlow.length > 0 ? (
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                          <div className="font-bold text-amber-300 flex items-center justify-between">
                            <span>Afwijkend langzame query ({slowQueriesInFlow.length})</span>
                            <span className="text-[11px] text-slate-400">
                              Piek: {Math.max(...slowQueriesInFlow.map((q) => q.durationMs))} ms
                            </span>
                          </div>
                          <p className="text-slate-400">
                            {slowQueriesInFlow[0]?.origin ? `Gevonden in ${slowQueriesInFlow[0].origin}. ` : ""}
                            Minimaal één query ligt op of boven de dynamische grens van 25 ms.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1 text-emerald-400">
                          <div className="font-bold">Geen afwijkend trage queries</div>
                          <p className="text-slate-400 text-[11px]">
                            Alle database queries in deze run voerden uit onder de 25 ms drempel.
                          </p>
                        </div>
                      )}

                      {duplicateQueriesInFlow.length > 0 ? (
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                          <div className="font-bold text-amber-300 flex items-center justify-between">
                            <span>N+1 Eloquent detectie</span>
                            <span className="text-[11px] text-amber-400">
                              {duplicateQueriesInFlow.length} herhaalde aanroepen
                            </span>
                          </div>
                          <p className="text-slate-400">
                            {duplicateQueriesInFlow[0]?.origin
                              ? `Herhaalde queries gevonden in ${duplicateQueriesInFlow[0].origin}. `
                              : "Herhaalde queries gedetecteerd. "}
                            Overweeg eager loading via <code>with()</code> of select-limiting.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1 text-emerald-400">
                          <div className="font-bold">Geen N+1 duplicaten gedetecteerd</div>
                          <p className="text-slate-400 text-[11px]">
                            Geen herhaalde queries met identieke signatures aangetroffen in deze run.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Flow breakdown 3 cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <div className="text-[11px] font-mono text-slate-400 uppercase">Database</div>
                      <div className="text-xl font-bold font-mono text-blue-400">
                        {Math.round(flowDbDuration * 10) / 10} ms
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {dbPct}% van flow · {uniqueSqlCount} unieke SQL-patronen ({flowQueries.length} totaal)
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <div className="text-[11px] font-mono text-slate-400 uppercase">Externe calls</div>
                      <div className="text-xl font-bold font-mono text-purple-400">
                        {Math.round(flowHttpDuration * 10) / 10} ms
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {httpPct}% van flow · {flowHttpCalls.length} uitgaande calls
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <div className="text-[11px] font-mono text-slate-400 uppercase">PHP &amp; Framework</div>
                      <div className="text-xl font-bold font-mono text-slate-300">{flowUnassigned} ms</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Flowduur min database en HTTP ({Math.max(0, 100 - dbPct - httpPct)}% framework overhead)
                      </div>
                    </div>
                  </div>

                  {/* Direct Lifecycle & Models Showcase in Overzicht */}
                  <div className="pt-4 border-t border-slate-800/80 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                        <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                          <span>Laravel Request Lifecycle &amp; Modellen</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-normal">
                            13 nanoseconde markers · 1.255 Eloquent models
                          </span>
                        </h4>
                      </div>
                      <button
                        onClick={() => setActiveSubtab("application_path")}
                        className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition cursor-pointer font-bold"
                      >
                        <span>Bekijk uitgebreid applicatiepad</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <LifecycleTimeline
                      phases={currentRequest.metadata.lifecycle_phases}
                      markers={currentRequest.metadata.laravel_context?.markers || (currentRequest.metadata as any).markers}
                      middlewareChain={currentRequest.metadata.middleware_chain}
                      controllerName={currentRequest.metadata.controller}
                      routePattern={currentRequest.metadata.route_name || "GET {fallbackPlaceholder}"}
                      viewName={currentRequest.metadata.view_name}
                      totalDurationMs={totalDuration}
                      queries={queries}
                      cacheOpsCount={cacheOps.length}
                      httpCallsCount={currentRequest.metadata.http_calls?.length || 0}
                    />

                    <EloquentModelsStrip
                      models={currentRequest.metadata.loaded_models}
                      totalInstancesCount={currentRequest.metadata.loaded_models_count}
                    />
                  </div>
                </div>
              )}

              {/* SUBTAB: REQUESTS LIST */}
              {activeSubtab === "requests" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-200">
                      Requests in flow &ldquo;{currentRun.label}&rdquo; ({currentRunRequests.length || 2})
                    </span>
                    <span className="text-slate-400">Klik op een request om het applicatiepad te openen</span>
                  </div>

                  <div className="space-y-3">
                    {(currentRunRequests.length > 0 ? currentRunRequests : requestEvents.slice(0, 2)).map((req) => (
                      <div
                        key={req.id}
                        className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              HTTP {req.metadata.status || 200}
                            </span>
                            <span className="text-sm font-bold font-mono text-white">
                              {req.title}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-slate-400 flex items-center gap-3">
                            <span>{req.metadata.controller || "CategoryController@getFallbackIndex"}</span>
                            <span>•</span>
                            <span>{req.metadata.db_queries_count || 73} queries</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold font-mono text-amber-300">
                            {req.durationMs} ms
                          </span>
                          <button
                            onClick={() => {
                              setSelectedReqId(req.id);
                              setActiveSubtab("application_path");
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 transition border border-amber-500/40 cursor-pointer"
                          >
                            <span>Bekijk in Applicatiepad</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBTAB: LIFECYCLE & MODELLEN (LifecycleTimeline + EloquentModelsStrip) */}
              {activeSubtab === "application_path" && (
                <div className="space-y-6">
                  {/* 1. Lifecycle Timeline Stages (8 Laravel Phases) */}
                  <LifecycleTimeline
                    phases={currentRequest.metadata.lifecycle_phases}
                    markers={currentRequest.metadata.laravel_context?.markers || (currentRequest.metadata as any).markers}
                    middlewareChain={currentRequest.metadata.middleware_chain}
                    controllerName={currentRequest.metadata.controller}
                    routePattern={currentRequest.metadata.route_name || "GET {fallbackPlaceholder}"}
                    viewName={currentRequest.metadata.view_name}
                    totalDurationMs={totalDuration}
                    queries={queries}
                    cacheOpsCount={cacheOps.length}
                    httpCallsCount={currentRequest.metadata.http_calls?.length || 0}
                  />

                  {/* 2. Eloquent Models Badges Strip */}
                  <EloquentModelsStrip
                    models={currentRequest.metadata.loaded_models}
                    totalInstancesCount={currentRequest.metadata.loaded_models_count}
                  />
                </div>
              )}

              {/* SUBTAB: HTTP CALLS */}
              {activeSubtab === "http" && (
                <OutgoingHttpCallsList httpCalls={currentRequest.metadata.http_calls} />
              )}

              {/* SUBTAB: EXCEPTIONS */}
              {activeSubtab === "exceptions" && (
                <div className="p-8 text-center rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="text-sm font-bold font-mono text-white">
                    0 exceptions in dit request
                  </div>
                  <p className="text-xs font-mono text-slate-400 max-w-md mx-auto">
                    Er zijn geen ongehandelde excepties of fatal errors opgetreden tijdens de uitvoering van dit verzoek (HTTP 200 OK).
                  </p>
                </div>
              )}

              {/* SUBTAB: HOTSPOTS */}
              {activeSubtab === "hotspots" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <Zap className="w-4 h-4" />
                        </span>
                        <h3 className="text-sm font-bold font-mono text-white">
                          PHP Code Hotspots &amp; Bottlenecks ({DEVSTACK_RUN_160.report.hotspots.length})
                        </h3>
                      </div>
                      <p className="text-xs font-mono text-slate-400">
                        Exacte broncode locaties en method calls die de meeste uitvoertijd consumeren in Run #160.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                        Totale hotspot tijd: 168.76 ms
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {DEVSTACK_RUN_160.report.hotspots.map((hs, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center justify-center border border-slate-700">
                              #{idx + 1}
                            </span>
                            <span className="font-mono font-bold text-slate-200 text-sm">
                              {hs.location}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {hs.signal}
                            </span>
                            {hs.occurrences > 1 && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                ×{hs.occurrences} aangeroepen
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-base font-bold font-mono text-amber-400">
                              {hs.duration_ms} ms
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(hs.location);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                              title="Kopieer bestandspad"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                            <span className="text-slate-500 text-[10px] block uppercase">Method Call</span>
                            <span className="text-amber-300 font-bold">{hs.call}</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                            <span className="text-slate-500 text-[10px] block uppercase">Functie / Context</span>
                            <span className="text-slate-300">{hs.details}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBTAB: LOGS & WARNINGS */}
              {activeSubtab === "logs" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <AlertTriangle className="w-4 h-4" />
                        </span>
                        <h3 className="text-sm font-bold font-mono text-white">
                          Waarschuwingslogs &amp; Deprecations (44 waarschuwingen)
                        </h3>
                      </div>
                      <p className="text-xs font-mono text-slate-400">
                        Volledige logtrace van PHP notices, deprecations en telemetry waarschuwingen uit Run #160.
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setLogLevelFilter("all")}
                        className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition cursor-pointer ${
                          logLevelFilter === "all"
                            ? "bg-amber-500 text-slate-950 font-bold"
                            : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        Alle ({RUN_160_WARNING_LOGS.length})
                      </button>
                      <button
                        onClick={() => setLogLevelFilter("evt-req-parts-01")}
                        className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition cursor-pointer ${
                          logLevelFilter === "evt-req-parts-01"
                            ? "bg-amber-500 text-slate-950 font-bold"
                            : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        Req #216 Page (20)
                      </button>
                      <button
                        onClick={() => setLogLevelFilter("evt-req-parts-02")}
                        className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition cursor-pointer ${
                          logLevelFilter === "evt-req-parts-02"
                            ? "bg-amber-500 text-slate-950 font-bold"
                            : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        Req #217 AJAX (24)
                      </button>
                    </div>
                  </div>

                  {/* Logs list */}
                  <div className="space-y-2 font-mono text-xs">
                    {RUN_160_WARNING_LOGS.filter((l) => {
                      if (logLevelFilter === "all") return true;
                      return l.requestId === logLevelFilter;
                    }).map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {log.level.toUpperCase()}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                              {log.channel}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              +{log.timeOffsetMs} ms
                            </span>
                          </div>

                          {log.file && (
                            <span className="text-slate-400 text-[11px]">
                              {log.file}{log.line ? `:${log.line}` : ""}
                            </span>
                          )}
                        </div>

                        <div className="text-slate-200 font-medium pl-1">
                          {log.message}
                        </div>

                        {log.context && (
                          <div className="mt-1 p-2 rounded bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400">
                            <span className="text-slate-500">Context: </span>
                            <code>{JSON.stringify(log.context)}</code>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBTAB: VERGELIJKEN */}
              {activeSubtab === "compare" && (
                <RunsCompareView currentRunId={selectedRunId} runs={runs} />
              )}

              {/* Subtab 1: Waterval (Interactive Gantt Spans) */}
              {activeSubtab === "waterfall" && (
                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-slate-800/80">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Execution Timeline (0ms &rarr; {totalDuration}ms)
                    </span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-500" /> Boot</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-cyan-500" /> Middleware</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> Controller</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500" /> Query</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-500" /> External</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> View</span>
                    </div>
                  </div>

                  {spans.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Geen afzonderlijke spans geregistreerd voor deze request.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {spans.map((span) => {
                        const startPct = Math.min(100, Math.max(0, (span.startMs / totalDuration) * 100));
                        const widthPct = Math.min(100 - startPct, Math.max(2, (span.durationMs / totalDuration) * 100));
                        const isSelectedSpan = selectedSpan?.id === span.id;

                        return (
                          <div
                            key={span.id}
                            onClick={() => setSelectedSpan(span)}
                            className={`p-2 rounded-xl transition-all cursor-pointer border ${
                              isSelectedSpan
                                ? "bg-slate-950 border-amber-500/50 shadow"
                                : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${getSpanColor(span.category)}`}>
                                  {span.category}
                                </span>
                                <span className="font-semibold text-slate-200 truncate max-w-sm">
                                  {span.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-xs font-mono">
                                <span className="text-slate-400">+{span.startMs}ms</span>
                                <span className="font-bold text-amber-300">{span.durationMs}ms</span>
                              </div>
                            </div>

                            {/* Gantt Bar representation */}
                            <div className="w-full h-3 rounded-full bg-slate-900 relative overflow-hidden">
                              <div
                                style={{
                                  left: `${startPct}%`,
                                  width: `${widthPct}%`
                                }}
                                className={`absolute h-full rounded-full ${getSpanColor(span.category)} opacity-90 shadow-sm transition-all`}
                              />
                            </div>

                            {/* Optional Details preview */}
                            {span.details && (
                              <div className="mt-1 text-[11px] text-slate-400 truncate">
                                {span.details}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Selected Span Modal/Drawer */}
                  {selectedSpan && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${getSpanColor(selectedSpan.category)}`}>
                            {selectedSpan.category}
                          </span>
                          <span className="text-xs font-bold text-white">{selectedSpan.name}</span>
                        </div>
                        <button
                          onClick={() => setSelectedSpan(null)}
                          className="text-xs text-slate-400 hover:text-white cursor-pointer"
                        >
                          Sluiten
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 pt-1">
                        <div>Start Offset: <strong className="text-amber-300">+{selectedSpan.startMs} ms</strong></div>
                        <div>Duur: <strong className="text-amber-300">{selectedSpan.durationMs} ms</strong> ({Math.round((selectedSpan.durationMs / totalDuration) * 100)}% van request)</div>
                      </div>

                      {selectedSpan.details && (
                        <div className="text-xs text-slate-400 pt-1">
                          <strong>Details:</strong> {selectedSpan.details}
                        </div>
                      )}

                      {selectedSpan.sql && (
                        <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-blue-300 overflow-x-auto">
                          {selectedSpan.sql}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Subtab 2: Database Queries & Duplicate Query Detection */}
              {activeSubtab === "queries" && (
                <div className="space-y-4">
                  {/* Top Duplicate Detection & Metrics Banner */}
                  {duplicateGroups.length > 0 ? (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-slate-900/60 border border-amber-500/30 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
                          <div>
                            <span className="text-xs font-bold text-amber-200 tracking-wide uppercase font-mono">
                              N+1 / Dubbele Queries Gedetecteerd
                            </span>
                            <p className="text-xs text-slate-300">
                              Er zijn <strong className="text-amber-300">{totalDuplicateExecutions} herhaalde query-aanroepen</strong> gevonden verdeeld over <strong className="text-amber-300">{duplicateGroups.length} SQL patronen</strong>.
                            </p>
                          </div>
                        </div>
                        <div className="text-xs font-mono text-slate-400 sm:text-right">
                          <span>Totale DB Tijd: <strong className="text-blue-300">{totalDbTime} ms</strong></span>
                        </div>
                      </div>

                      {/* 3 Metric Cards for Duplicates: Aantal keer, Totale tijd, Gemiddelde tijd */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-amber-500/20">
                          <div className="text-[10px] font-mono uppercase text-slate-400">1. Aantal Herhalingen</div>
                          <div className="text-base font-mono font-bold text-amber-400 flex items-center gap-1.5 mt-0.5">
                            <span>{totalDuplicateExecutions}x</span>
                            <span className="text-[11px] font-normal text-slate-400">({duplicateGroups.length} patronen)</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-rose-500/20">
                          <div className="text-[10px] font-mono uppercase text-slate-400">2. Totale Tijd Duplicaten</div>
                          <div className="text-base font-mono font-bold text-rose-400 flex items-center gap-1.5 mt-0.5">
                            <span>{totalDuplicateTime} ms</span>
                            <span className="text-[11px] font-normal text-slate-400">
                              ({Math.round((totalDuplicateTime / (totalDbTime || 1)) * 100)}% van DB)
                            </span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-blue-500/20">
                          <div className="text-[10px] font-mono uppercase text-slate-400">3. Gemiddelde Tijd / Query</div>
                          <div className="text-base font-mono font-bold text-blue-400 flex items-center gap-1.5 mt-0.5">
                            <span>{avgDuplicateTime} ms</span>
                            <span className="text-[11px] font-normal text-slate-400">per aanroep</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2 text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Geen N+1 of herhaalde queries gedetecteerd in deze request.</span>
                      </div>
                      <span className="text-slate-400">{queries.length} queries • {totalDbTime} ms</span>
                    </div>
                  )}

                  {/* View Controls & Filter Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
                    <div className="flex items-center gap-2">
                      <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-xs font-mono">
                        <button
                          onClick={() => setQueryViewMode("grouped")}
                          className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                            queryViewMode === "grouped"
                              ? "bg-slate-800 text-amber-300 font-semibold shadow-sm"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Groepeer op Duplicaten ({groupedQueries.length})</span>
                        </button>
                        <button
                          onClick={() => setQueryViewMode("flat")}
                          className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                            queryViewMode === "flat"
                              ? "bg-slate-800 text-blue-300 font-semibold shadow-sm"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <Database className="w-3.5 h-3.5" />
                          <span>Alle Losse Queries ({queries.length})</span>
                        </button>
                      </div>

                      {duplicateGroups.length > 0 && queryViewMode === "grouped" && (
                        <button
                          onClick={() => setOnlyDuplicatesFilter(!onlyDuplicatesFilter)}
                          className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
                            onlyDuplicatesFilter
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                              : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300"
                          }`}
                        >
                          <Filter className="w-3 h-3" />
                          <span>Alleen N+1 tonen ({duplicateGroups.length})</span>
                        </button>
                      )}
                    </div>

                    <div className="text-xs font-mono text-slate-400">
                      Totaal: <strong className="text-white">{queries.length} queries</strong> ({totalDbTime} ms)
                    </div>
                  </div>

                  {/* Query Lists */}
                  {queries.length === 0 ? (
                    <div className="p-8 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs">
                      Geen queries geregistreerd voor deze request.
                    </div>
                  ) : queryViewMode === "grouped" ? (
                    // GROUPED VIEW (Highlights duplicates, count, total time & average time)
                    <div className="space-y-3">
                      {(onlyDuplicatesFilter ? duplicateGroups : groupedQueries).map((g) => {
                        const isDuplicate = g.count > 1 || g.isDuplicate;
                        const isExpanded = expandedGroupFp === g.fingerprint;

                        return (
                          <div
                            key={g.fingerprint}
                            className={`p-4 rounded-xl transition-all space-y-3 ${
                              isDuplicate
                                ? "bg-gradient-to-r from-amber-950/20 via-slate-900/90 to-slate-900/90 border border-amber-500/30 hover:border-amber-500/50"
                                : "bg-slate-900/80 border border-slate-800 hover:border-slate-700/80"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              {/* Left: Metrics & Indicators */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {isDuplicate ? (
                                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1.5 shadow-sm">
                                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                                    <span>{g.count}x HERHAALD (N+1)</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                                    1x uitgevoerd
                                  </span>
                                )}

                                {/* Metric: Totale Tijd */}
                                <span className="text-xs font-mono px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
                                  Totaal: <strong className={isDuplicate ? "text-rose-400 font-bold" : "text-blue-300 font-bold"}>{g.totalTimeMs} ms</strong>
                                </span>

                                {/* Metric: Gemiddelde Tijd */}
                                <span className="text-xs font-mono px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
                                  Gemiddeld: <strong className="text-blue-400 font-bold">{g.avgTimeMs} ms</strong>
                                </span>

                                {isDuplicate && (
                                  <span className="text-[10px] font-mono text-slate-400 hidden md:inline">
                                    (min: {g.minTimeMs}ms • max: {g.maxTimeMs}ms)
                                  </span>
                                )}
                              </div>

                              {/* Right: Actions */}
                              <div className="flex items-center gap-2">
                                {isDuplicate && (
                                  <button
                                    onClick={() => setExpandedGroupFp(isExpanded ? null : g.fingerprint)}
                                    className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-amber-300 hover:text-amber-200 border border-slate-700 transition cursor-pointer flex items-center gap-1"
                                  >
                                    <span>{isExpanded ? "Verberg" : "Toon"} alle {g.count} aanroepen</span>
                                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                  </button>
                                )}

                                {onSendQueryToTinker && (
                                  <button
                                    onClick={() =>
                                      onSendQueryToTinker(
                                        `// Benchmark herhaalde query (${g.count}x, gem: ${g.avgTimeMs}ms):\nDB::select("${g.sampleSql.replace(/"/g, '\\"')}");`
                                      )
                                    }
                                    className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 transition cursor-pointer flex items-center gap-1"
                                    title="Test in Tinker"
                                  >
                                    <Play className="w-3 h-3 text-amber-400" />
                                    <span>Test</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => copyToClipboard(g.sampleSql, g.fingerprint)}
                                  className="text-slate-400 hover:text-slate-200 transition p-1 cursor-pointer"
                                  title="Kopieer SQL"
                                >
                                  {copiedQueryId === g.fingerprint ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* SQL Query Snippet */}
                            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-blue-200 overflow-x-auto leading-relaxed">
                              {g.sampleSql}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-slate-400 gap-1">
                              <span>Origin: <span className="text-slate-300 font-medium">{g.origin || "Eloquent Model / Controller"}</span></span>
                              {isDuplicate && (
                                <span className="text-amber-400/90 font-medium">
                                  ⚠️ Veroorzaakt {g.count - 1} overbodige database round-trips
                                </span>
                              )}
                            </div>

                            {/* Expanded Individual Instances list */}
                            {isExpanded && (
                              <div className="mt-2 p-3 rounded-lg bg-slate-950/90 border border-amber-500/20 space-y-2">
                                <div className="text-xs font-mono font-bold text-amber-300 flex items-center justify-between">
                                  <span>Alle {g.instances.length} afzonderlijke uitvoeringen in deze request:</span>
                                  <span className="text-[10px] text-slate-400 font-normal">Totale tijd: {g.totalTimeMs}ms • Gem: {g.avgTimeMs}ms</span>
                                </div>
                                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                  {g.instances.map((inst, idx) => (
                                    <div
                                      key={inst.id || idx}
                                      className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="w-6 text-slate-400 font-bold">#{idx + 1}</span>
                                        <span className="font-bold text-blue-400">{inst.durationMs} ms</span>
                                        {inst.bindings && inst.bindings.length > 0 && (
                                          <span className="text-slate-400 text-[10px]">
                                            Bindings: [{inst.bindings.join(", ")}]
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-slate-400 text-[10px]">{inst.origin || "Eloquent"}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Eloquent Fix Advice for Duplicates */}
                            {isDuplicate && (
                              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-300/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-start gap-2">
                                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold">Aanbevolen Laravel Eloquent Oplossing:</span>
                                    <p className="text-[11px] text-slate-300 mt-0.5">
                                      Voeg <code className="text-amber-300 px-1 py-0.2 bg-slate-900 rounded border border-amber-500/30">with('relatie')</code> toe aan je Eloquent query in <span className="text-white font-medium">{g.origin || "de controller"}</span> om deze <strong>{g.count} losse queries</strong> samen te voegen.
                                    </p>
                                  </div>
                                </div>

                                {onOpenRecipe && (
                                  <button
                                    onClick={() => {
                                      const n1Recipe = LARAVEL_RECIPES.find((r) => r.id === "n-plus-one-eager-loading");
                                      if (n1Recipe) onOpenRecipe(n1Recipe);
                                    }}
                                    className="px-3 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                                  >
                                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Bekijk Recept</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // FLAT CHRONOLOGICAL LIST
                    <div className="space-y-3">
                      {queries.map((q, idx) => {
                        const isExplaining = activeExplainId === q.id;
                        const hasExplain = !!q.explain_plan;

                        return (
                          <div
                            key={q.id || idx}
                            className={`p-4 rounded-xl transition-all space-y-2.5 ${
                              q.is_duplicate
                                ? "bg-slate-900/90 border border-amber-500/30"
                                : "bg-slate-900/80 border border-slate-800 hover:border-slate-700/80"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-400 font-bold">#{idx + 1}</span>
                                <Database className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-xs font-mono font-bold text-blue-300">
                                  {q.durationMs} ms
                                </span>

                                {q.is_duplicate && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                                    N+1 / Duplicate
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {onSendQueryToTinker && (
                                  <button
                                    onClick={() =>
                                      onSendQueryToTinker(
                                        `// Benchmark query from Profiler:\nDB::select("${q.sql.replace(/"/g, '\\"')}");`
                                      )
                                    }
                                    className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 transition cursor-pointer flex items-center gap-1"
                                    title="Test query in Debug Lab Tinkerpad"
                                  >
                                    <Play className="w-3 h-3 text-amber-400" />
                                    <span>Test in Tinker</span>
                                  </button>
                                )}

                                {hasExplain && (
                                  <button
                                    onClick={() => setActiveExplainId(isExplaining ? null : q.id)}
                                    className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                                  >
                                    {isExplaining ? "Verberg EXPLAIN" : "Toon EXPLAIN Plan"}
                                  </button>
                                )}

                                <button
                                  onClick={() => copyToClipboard(q.sql, q.id)}
                                  className="text-slate-400 hover:text-slate-200 transition cursor-pointer p-1"
                                  title="Kopieer SQL"
                                >
                                  {copiedQueryId === q.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* SQL Syntax display */}
                            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-blue-200 overflow-x-auto leading-relaxed">
                              {q.sql}
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                              <span>Origin: <span className="text-slate-300">{q.origin || "Eloquent Model"}</span></span>
                              {q.bindings && q.bindings.length > 0 && (
                                <span>Bindings: [{q.bindings.join(", ")}]</span>
                              )}
                            </div>

                            {/* EXPLAIN Plan Viewer */}
                            {isExplaining && q.explain_plan && (
                              <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-blue-500/30 space-y-2 text-xs font-mono">
                                <div className="text-blue-300 font-bold flex items-center gap-1.5">
                                  <Search className="w-3.5 h-3.5" /> EXPLAIN Analyse:
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
                                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                    <div className="text-[10px] text-slate-400">Table</div>
                                    <div className="font-bold text-white">{q.explain_plan.table}</div>
                                  </div>
                                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                    <div className="text-[10px] text-slate-400">Join Type</div>
                                    <div className={`font-bold ${q.explain_plan.type === "ALL" ? "text-rose-400" : "text-emerald-400"}`}>
                                      {q.explain_plan.type} {q.explain_plan.type === "ALL" && "(Full Scan!)"}
                                    </div>
                                  </div>
                                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                    <div className="text-[10px] text-slate-400">Rows Examined</div>
                                    <div className="font-bold text-amber-300">{q.explain_plan.rows_examined.toLocaleString()}</div>
                                  </div>
                                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                    <div className="text-[10px] text-slate-400">Key Used</div>
                                    <div className="font-bold text-slate-200">{q.explain_plan.key || "Geen (Missing Index)"}</div>
                                  </div>
                                </div>
                                {q.explain_plan.type === "ALL" && (
                                  <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                                    Waarschuwing: Deze query voert een Full Table Scan uit. Voeg een index toe om latency met tot wel 95% te verminderen.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Subtab 3: Cache & Redis */}
              {activeSubtab === "cache" && (
                <div className="space-y-3">
                  <div className="text-xs font-mono text-slate-400">
                    Redis &amp; Cache Store Operaties
                  </div>

                  {cacheOps.length === 0 ? (
                    <div className="p-8 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs">
                      Geen expliciete Cache operaties vastgelegd voor deze request.
                    </div>
                  ) : (
                    cacheOps.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2.5">
                          <HardDrive className="w-4 h-4 text-violet-400" />
                          <div>
                            <div className="font-bold text-white">{c.key}</div>
                            <div className="text-[10px] text-slate-400">
                              Store: <span className="text-slate-300 uppercase">{c.store || "redis"}</span> • Actie: <span className="text-slate-300 uppercase">{c.operation}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded border text-[11px] font-bold ${
                              c.hit
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            }`}
                          >
                            {c.hit ? "CACHE HIT" : "CACHE MISS"}
                          </span>
                          <span className="text-slate-400">{c.durationMs}ms</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Subtab 4: Events & Gates */}
              {activeSubtab === "events" && (
                <div className="space-y-4">
                  {/* Events Dispatched */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold text-slate-300">Gedispatchte Events</h4>
                    {dispatchedEvents.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
                        Geen events gedispatched.
                      </div>
                    ) : (
                      dispatchedEvents.map((ev, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs font-mono"
                        >
                          <span className="font-bold text-amber-300">{ev.event}</span>
                          <div className="flex items-center gap-3 text-slate-400">
                            <span>{ev.listeners_count} listeners</span>
                            <span>{ev.durationMs}ms</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Gates Evaluated */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-mono font-bold text-slate-300">Gate &amp; Policy Autorisatie checks</h4>
                    {gates.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
                        Geen gate checks uitgevoerd.
                      </div>
                    ) : (
                      gates.map((g, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="font-bold text-white">{g.ability}</span>
                            {g.user_id && <span className="text-[10px] text-slate-400">(User #{g.user_id})</span>}
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${
                              g.result === "allowed"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            }`}
                          >
                            {g.result}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Subtab 5: Headers & Session */}
              {activeSubtab === "headers" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold text-slate-300">Request Headers</h4>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 font-mono text-xs">
                      {Object.entries(headers).length === 0 ? (
                        <div className="text-slate-400">Geen custom headers.</div>
                      ) : (
                        Object.entries(headers).map(([k, v]) => (
                          <div key={k} className="flex items-start gap-2 border-b border-slate-800/60 pb-1">
                            <span className="text-amber-400 font-semibold min-w-[140px]">{k}:</span>
                            <span className="text-slate-200 break-all">{v}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold text-slate-300">Session Payload &amp; Auth User</h4>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto">
                      <pre>{JSON.stringify(sessionData, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400">
              Selecteer een request uit de lijst links om de profiler te bekijken.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
