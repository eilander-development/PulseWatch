import React, { useState, useMemo } from "react";
import {
  Clock,
  Database,
  Globe,
  Cpu,
  Layers,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Zap,
  TrendingDown,
  Info,
  Server,
  Activity,
  Terminal,
  Gauge,
  Sliders,
  Calendar,
  Layers2,
  Radio,
  ChevronDown,
  ChevronUp,
  BookOpen
} from "lucide-react";
import { TelemetryEvent, BottleneckInfo, RouteThresholdRule } from "../types";
import { ThresholdsModal } from "./ThresholdsModal";
import { findRecipeForEvent, LaravelFixRecipe } from "../data/laravelRecipes";
import { InvestigationModal, InvestigationSlotInfo } from "./InvestigationModal";

interface SlowRequestsMonitorViewProps {
  events: TelemetryEvent[];
  onInspectInProfiler: (requestId: string) => void;
  onOpenDebugLab?: (filter: string) => void;
  onOpenAgentGuide?: () => void;
  onOpenRecipe?: (recipe: LaravelFixRecipe) => void;
}

export const SlowRequestsMonitorView: React.FC<SlowRequestsMonitorViewProps> = ({
  events,
  onInspectInProfiler,
  onOpenDebugLab,
  onOpenAgentGuide,
  onOpenRecipe
}) => {
  const requestEvents = events.filter((e) => e.type === "request");

  // Domain and Investigation Modal states (Screenshot 2 & 3)
  const [selectedDomain, setSelectedDomain] = useState<string>("Alle domeinen (5)");
  const [investigationSlot, setInvestigationSlot] = useState<InvestigationSlotInfo | null>(null);
  const [routeAnalysisTab, setRouteAnalysisTab] = useState<"slowest" | "most_called" | "recent">("slowest");
  const [selectedRouteKey, setSelectedRouteKey] = useState<string | null>(null);

  // Collapsible macro-trends drawer state
  const [showTrendsDrawer, setShowTrendsDrawer] = useState<boolean>(false);

  // Time Range selector
  const [timeRange, setTimeRange] = useState<"15m" | "1h" | "24h" | "7d">("1h");
  const [excludeColdStarts, setExcludeColdStarts] = useState<boolean>(true);

  // Threshold Rules State
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState<boolean>(false);
  const [rules, setRules] = useState<RouteThresholdRule[]>([
    { id: "default-all", pattern: "All routes", method: "ALL", threshold_ms: 2000, enabled: true, notes: "Standaard bovengrens voor alle applicatie-verzoeken" },
    { id: "default-unmatched", pattern: "Unmatched routes", method: "ALL", threshold_ms: 2000, enabled: true },
    { id: "rule-1", pattern: "/articles", method: "GET|HEAD", threshold_ms: 500, enabled: true },
    { id: "rule-2", pattern: "/articles/{article}", method: "DELETE", threshold_ms: 500, enabled: true },
    { id: "rule-3", pattern: "/checkout", method: "POST", threshold_ms: 1200, enabled: true, notes: "Betalingsprovider round-trip tolerantie" },
    { id: "rule-4", pattern: "/reports/*", method: "GET", threshold_ms: 1500, enabled: true }
  ]);

  // Filters
  const [threshold, setThreshold] = useState<number>(300); // ms
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Categorize requests (filter cold starts if enabled)
  const activeRequests = useMemo(() => {
    return requestEvents.filter((r) => {
      if (excludeColdStarts && r.metadata.cold_start) return false;
      return true;
    });
  }, [requestEvents, excludeColdStarts]);

  const slowRequests = useMemo(() => {
    return activeRequests.filter((r) => (r.durationMs || 0) >= threshold);
  }, [activeRequests, threshold]);

  const filteredRequests = useMemo(() => {
    return slowRequests.filter((r) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchController = r.metadata.controller?.toLowerCase().includes(q) || false;
        const matchDetails = r.metadata.primary_bottleneck?.details.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchController && !matchDetails) return false;
      }

      if (categoryFilter !== "all") {
        const cat = r.metadata.primary_bottleneck?.category;
        if (cat !== categoryFilter) return false;
      }

      if (methodFilter !== "all") {
        if (!r.title.startsWith(methodFilter)) return false;
      }

      return true;
    });
  }, [slowRequests, searchQuery, categoryFilter, methodFilter]);

  // Percentiles & Nightwatch Metrics
  const sortedDurations = useMemo(() => {
    return [...activeRequests].map((r) => r.durationMs || 0).sort((a, b) => a - b);
  }, [activeRequests]);

  const p50 = sortedDurations[Math.floor(sortedDurations.length * 0.5)] || 34;
  const p95 = sortedDurations[Math.floor(sortedDurations.length * 0.95)] || 78;
  const p99 = sortedDurations[Math.floor(sortedDurations.length * 0.99)] || 2400;

  const totalRequestsCount = activeRequests.length || 1;
  const errorRequests = activeRequests.filter(
    (r) => (r.metadata.status || 200) >= 400 || (r.level === "error" || r.level === "critical")
  );
  const errorRatePct = ((errorRequests.length / totalRequestsCount) * 100).toFixed(1);

  const slaCompliancePct = Math.round(
    ((activeRequests.filter((r) => (r.durationMs || 0) < threshold).length) / totalRequestsCount) * 100
  );

  // Category counts for filter pills (Version A & B)
  const categoryCounts = useMemo(() => {
    const counts = {
      all: slowRequests.length,
      database: 0,
      external: 0,
      memory: 0,
      php: 0
    };
    slowRequests.forEach((r) => {
      const cat = r.metadata.primary_bottleneck?.category;
      if (cat === "database" || cat === "n_plus_one") counts.database++;
      else if (cat === "external") counts.external++;
      else if (cat === "memory") counts.memory++;
      else counts.php++;
    });
    return counts;
  }, [slowRequests]);

  // Grouped Routes Summary
  const groupedRoutes = useMemo(() => {
    const map = new Map<string, {
      method: string;
      path: string;
      durations: number[];
      hasDbQueries: boolean;
      errors: number;
      sampleRequestId: string;
      controller?: string;
    }>();

    activeRequests.forEach((req) => {
      const parts = req.title.split(" ");
      const method = parts[0] || "GET";
      const path = parts.slice(1).join(" ") || "/";
      const key = `${method} ${path}`;

      if (!map.has(key)) {
        map.set(key, {
          method,
          path,
          durations: [],
          hasDbQueries: (req.metadata.db_queries_count || 0) > 0,
          errors: (req.metadata.status || 200) >= 400 ? 1 : 0,
          sampleRequestId: req.id,
          controller: req.metadata.controller
        });
      }

      const item = map.get(key)!;
      item.durations.push(req.durationMs || 0);
      if ((req.metadata.db_queries_count || 0) > 0) item.hasDbQueries = true;
      if ((req.metadata.status || 200) >= 400) item.errors += 1;
    });

    return Array.from(map.entries()).map(([key, data]) => {
      const sorted = [...data.durations].sort((a, b) => a - b);
      const routeP50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
      const routeP95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
      const maxDuration = Math.max(...data.durations);

      return {
        key,
        method: data.method,
        path: data.path,
        count: data.durations.length,
        p50: routeP50,
        p95: routeP95,
        maxDuration,
        hasDbQueries: data.hasDbQueries,
        errors: data.errors,
        sampleRequestId: data.sampleRequestId,
        controller: data.controller
      };
    }).sort((a, b) => b.p95 - a.p95);
  }, [activeRequests]);

  // Response Time Distribution Buckets (Screenshot 1 & 8 Reactietijd)
  const distributionBuckets = useMemo(() => {
    const buckets = [
      { label: "<25ms", min: 0, max: 25, color: "bg-[#10b981]", textColor: "text-[#10b981]", count: 0 },
      { label: "<50ms", min: 25, max: 50, color: "bg-[#10b981]", textColor: "text-[#10b981]", count: 0 },
      { label: "<100ms", min: 50, max: 100, color: "bg-[#10b981]", textColor: "text-[#10b981]", count: 0 },
      { label: "<250ms", min: 100, max: 250, color: "bg-amber-400", textColor: "text-amber-400", count: 0 },
      { label: "<500ms", min: 250, max: 500, color: "bg-amber-500", textColor: "text-amber-500", count: 0 },
      { label: "<1s", min: 500, max: 1000, color: "bg-rose-500", textColor: "text-rose-500", count: 0 },
      { label: ">1s", min: 1000, max: Infinity, color: "bg-rose-600", textColor: "text-rose-600", count: 0 }
    ];

    activeRequests.forEach((r) => {
      const dur = r.durationMs || 0;
      const bucket = buckets.find((b) => dur >= b.min && dur < b.max);
      if (bucket) bucket.count++;
      else if (dur >= 1000) buckets[buckets.length - 1].count++;
    });

    const maxCount = Math.max(...buckets.map((b) => b.count), 1);

    return buckets.map((b) => ({
      ...b,
      percentage: Math.round((b.count / (activeRequests.length || 1)) * 100),
      heightPct: Math.max(12, Math.round((b.count / maxCount) * 100))
    }));
  }, [activeRequests]);

  // Bottleneck Category Counts
  const dbBottlenecks = activeRequests.filter(
    (r) => r.metadata.primary_bottleneck?.category === "database" || r.metadata.primary_bottleneck?.category === "n_plus_one"
  ).length;
  const externalBottlenecks = activeRequests.filter(
    (r) => r.metadata.primary_bottleneck?.category === "external"
  ).length;
  const memoryBottlenecks = activeRequests.filter(
    (r) => r.metadata.primary_bottleneck?.category === "memory"
  ).length;

  const getCategoryBadge = (bottleneck?: BottleneckInfo) => {
    if (!bottleneck) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
          <Info className="w-3 h-3" /> Algemeen
        </span>
      );
    }

    switch (bottleneck.category) {
      case "database":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <Database className="w-3.5 h-3.5 text-blue-400" /> Database Bottleneck
          </span>
        );
      case "n_plus_one":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <TrendingDown className="w-3.5 h-3.5 text-amber-400" /> N+1 Eloquent Loop
          </span>
        );
      case "external":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Globe className="w-3.5 h-3.5 text-purple-400" /> Externe API / Guzzle
          </span>
        );
      case "memory":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <Cpu className="w-3.5 h-3.5 text-rose-400" /> Geheugen / OOM Risico
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" /> PHP Verwerking
          </span>
        );
    }
  };

  const getStatusColor = (status?: number) => {
    if (!status) return "bg-slate-800 text-slate-300 border-slate-700";
    if (status >= 500) return "bg-rose-500/20 text-rose-300 border-rose-500/40";
    if (status >= 400) return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  };

  // Helper 1: Category Filter Bar (used in Version A, B, and C recent tab)
  const renderCategoryFilterBar = () => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80 flex-wrap">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === "all"
                ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shadow-sm"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Alle trage verzoeken</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
              {categoryCounts.all}
            </span>
          </button>

          <button
            onClick={() => setCategoryFilter("database")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === "database"
                ? "bg-blue-500/20 text-blue-300 font-bold border border-blue-500/40 shadow-sm"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="w-3 h-3 text-blue-400" />
            <span>Database &amp; N+1</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
              {categoryCounts.database}
            </span>
          </button>

          <button
            onClick={() => setCategoryFilter("external")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === "external"
                ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40 shadow-sm"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="w-3 h-3 text-purple-400" />
            <span>Externe API</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
              {categoryCounts.external}
            </span>
          </button>

          <button
            onClick={() => setCategoryFilter("memory")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === "memory"
                ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shadow-sm"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Cpu className="w-3 h-3 text-rose-400" />
            <span>Geheugen</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
              {categoryCounts.memory}
            </span>
          </button>

          <button
            onClick={() => setCategoryFilter("php")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === "php"
                ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Cpu className="w-3 h-3 text-emerald-400" />
            <span>PHP Verwerking</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
              {categoryCounts.php}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Zoek route of controller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700 w-48 sm:w-56 font-mono"
            />
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none"
          >
            <option value="all">Alle Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
      </div>
    );
  };

  // Helper 2: Detailed Request Cards Feed (The beloved core triage list)
  const renderRequestCards = () => {
    if (filteredRequests.length === 0) {
      return (
        <div className="p-12 text-center rounded-2xl bg-[#0e1320] border border-slate-800 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <div className="text-sm font-semibold text-slate-200">
            Geen trage requests gevonden met huidige filter
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto font-mono">
            Alle geregistreerde HTTP requests voldoen aan de drempelwaarde van &lt;{threshold}ms.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3.5">
        {filteredRequests.map((req) => {
          const status = req.metadata.status || 200;
          const duration = req.durationMs || 100;
          const isCritical = duration >= 2000;
          const isWarning = duration >= 500 && duration < 2000;
          const bottleneck = req.metadata.primary_bottleneck;
          const breakdown = req.metadata.breakdown;

          return (
            <div
              key={req.id}
              className="p-4 sm:p-5 rounded-2xl bg-[#0e1320] border border-slate-800 hover:border-slate-700/90 transition-all shadow-sm space-y-4"
            >
              {/* Header Row: Route + Duration + Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded border font-semibold ${getStatusColor(
                      status
                    )}`}
                  >
                    {status}
                  </span>

                  <span className="text-sm font-bold font-mono text-white tracking-tight">
                    {req.title}
                  </span>

                  {getCategoryBadge(bottleneck)}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-mono font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5 ${
                      isCritical
                        ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                        : isWarning
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                        : "bg-slate-800 border-slate-700 text-slate-300"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {duration} ms
                  </span>
                </div>
              </div>

              {/* WHY IS IT SLOW? (Waarom is deze request traag) */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 font-mono">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Waarom is deze request traag?</span>
                    {bottleneck?.impact_pct && (
                      <span className="text-[10px] px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        {bottleneck.impact_pct}% impact
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-slate-400">
                    Controller: <span className="text-slate-300">{req.metadata.controller || "Closure"}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {bottleneck?.details ||
                    `Deze request duurde ${duration}ms, wat boven de norm ligt. Inspecteer de queries en externe calls.`}
                </p>

                {/* Latency breakdown progress bar */}
                {breakdown && (
                  <div className="pt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Tijdsverdeling:</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-blue-400">
                          <span className="w-2 h-2 rounded-full bg-blue-500" /> DB: {breakdown.database_pct}% ({req.metadata.db_time_ms || 0}ms)
                        </span>
                        <span className="flex items-center gap-1 text-purple-400">
                          <span className="w-2 h-2 rounded-full bg-purple-500" /> Externe: {breakdown.external_pct}% ({req.metadata.external_http_time_ms || 0}ms)
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> PHP: {breakdown.php_pct}% ({req.metadata.php_execution_time_ms || 0}ms)
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden flex border border-slate-800/80">
                      <div
                        style={{ width: `${breakdown.database_pct}%` }}
                        className="bg-blue-500 h-full transition-all"
                      />
                      <div
                        style={{ width: `${breakdown.external_pct}%` }}
                        className="bg-purple-500 h-full transition-all"
                      />
                      <div
                        style={{ width: `${breakdown.php_pct}%` }}
                        className="bg-emerald-500 h-full transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Row: Metadata Metrics & Primary Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3 flex-wrap text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-blue-400" />
                    <strong className="text-slate-200">{req.metadata.db_queries_count ?? 0}</strong> queries
                  </span>

                  {(() => {
                    const dupQueries = (req.metadata.queries || []).filter((q: any) => q.is_duplicate);
                    const dupCount = dupQueries.length;
                    if (dupCount <= 1) return null;
                    const dupTotal = dupQueries.reduce((acc: number, q: any) => acc + (q.durationMs || 0), 0);
                    const dupAvg = Math.round((dupTotal / dupCount) * 10) / 10;
                    return (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          {dupCount}x Dubbele Query ({dupTotal}ms tot, {dupAvg}ms gem)
                        </span>
                      </>
                    );
                  })()}

                  <span className="text-slate-600">•</span>

                  <span className="flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-rose-400" />
                    <strong className="text-slate-200">{req.metadata.memory_peak_mb ?? 18} MB</strong> RAM
                  </span>

                  {req.metadata.spans && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <strong className="text-slate-200">{req.metadata.spans.length}</strong> spans
                      </span>
                    </>
                  )}
                </div>

                {/* Actions: Inspect in Profiler OR Debug Lab */}
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const matchedRecipe = findRecipeForEvent(
                      req.title + " " + (req.message || "")
                    );
                    if (!matchedRecipe || !onOpenRecipe) return null;
                    return (
                      <button
                        onClick={() => onOpenRecipe(matchedRecipe)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-500/40"
                        title="Bekijk beproefd Laravel recept (gratis / 0 tokens)"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Laravel Recept</span>
                      </button>
                    );
                  })()}

                  {onOpenDebugLab && (
                    <button
                      onClick={() => onOpenDebugLab(req.metadata.controller || req.title)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700/80 hover:border-emerald-500/40"
                    >
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Debug in Lab</span>
                    </button>
                  )}

                  <button
                    onClick={() => onInspectInProfiler(req.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow"
                  >
                    <span>Inspecteer in Profiler</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper 3: Performance Charts (Histogram + Throughput curve)
  const renderPerformanceCharts = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* REACTIETIJD (Distribution Histogram) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#0e1320] border border-slate-800/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              REACTIETIJD
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Verdeling over buckets
            </div>
          </div>

          <div className="h-40 flex items-end justify-between gap-2 pt-4 px-1">
            {distributionBuckets.map((b) => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-2 group relative">
                {/* Tooltip on hover */}
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap z-10 pointer-events-none">
                  {b.count} verzoeken ({b.percentage}%)
                </div>

                <div className="w-full bg-slate-900/60 rounded-t-lg overflow-hidden flex items-end h-28 p-0.5">
                  <div
                    style={{ height: `${b.heightPct}%` }}
                    className={`w-full rounded-t-md transition-all duration-500 ${b.color} opacity-90 group-hover:opacity-100`}
                  />
                </div>
                <div className="text-[10px] font-mono text-slate-400 whitespace-nowrap text-center">
                  {b.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DOORVOER (Throughput Curve) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#0e1320] border border-slate-800/90 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              DOORVOER
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              verz./min
            </div>
          </div>

          {/* SVG Area Sparkline with Glowing Crimson Curve */}
          <div className="h-32 w-full relative flex items-end">
            <svg className="w-full h-28 overflow-visible" viewBox="0 0 300 80" preserveAspectRatio="none">
              <defs>
                <linearGradient id="glowRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 55 Q 35 30, 70 20 T 140 50 T 210 25 T 280 40 L 300 55 L 300 80 L 0 80 Z"
                fill="url(#glowRed)"
              />
              <path
                d="M 0 55 Q 35 30, 70 20 T 140 50 T 210 25 T 280 40 L 300 55"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
            <span>0 06:55:00</span>
            <span>07:18:00</span>
          </div>
        </div>
      </div>
    );
  };

  // Helper 4: Traagste Routes Ranking Progress Bars
  const renderSlowestRoutes = () => {
    return (
      <div className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800/90 shadow-sm space-y-3">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
          TRAAGSTE ROUTES
        </div>

        <div className="space-y-2.5">
          {groupedRoutes.slice(0, 4).map((route) => {
            const max = Math.max(...groupedRoutes.map((r) => r.p95), 100);
            const widthPct = Math.min(100, Math.max(15, Math.round((route.p95 / max) * 100)));
            const isSlow = route.p95 >= 300;
            const isMedium = route.p95 >= 100 && route.p95 < 300;

            return (
              <div key={route.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {route.method}
                    </span>
                    <span className="text-slate-200 font-medium">{route.path}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${isSlow ? "text-rose-400" : isMedium ? "text-amber-400" : "text-emerald-400"}`}>
                      {route.p95} ms
                    </span>
                    {route.hasDbQueries && (
                      <Database className="w-3.5 h-3.5 text-slate-400" title="Voert database queries uit" />
                    )}
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    style={{ width: `${widthPct}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      isSlow ? "bg-rose-500" : isMedium ? "bg-amber-400" : "bg-[#10b981]"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  return (
    <div className="space-y-6">
      {/* Top Header Bar: Title, Sampled Badge, Time Range & Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
            <span>VERZOEKTIJD</span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 text-[10px] font-bold">
              Sampled data
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Requests &amp; Performance Monitor</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {activeRequests.length} verzoeken
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Time Window Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {(["15m", "1h", "24h", "7d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                  timeRange === r
                    ? "bg-slate-800 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Configurable Thresholds Button */}
          <button
            onClick={() => setIsThresholdModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono font-medium flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            title="Configureerbare drempelwaarden en SLA regels"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Drempelwaarden ({rules.filter((r) => r.enabled).length})</span>
          </button>

          {onOpenAgentGuide && (
            <button
              onClick={onOpenAgentGuide}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              title="Bekijk de zero-overhead Laravel agent integratie"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Agent (0.00ms)</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Run 160 Showcase Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-slate-900/60 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-white text-sm">
                Actieve Telemetry Run #160 (parts-regression)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                13 nanoseconde markers geladen
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                1.255 Eloquent models
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Flowduur: 970ms · 134 queries (73 page + 61 AJAX) · 8 PHP code hotspots · 44 warnings
            </p>
          </div>
        </div>

        <button
          onClick={() => onInspectInProfiler("evt-req-parts-01")}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/20 shrink-0"
        >
          <span>Open in Request Profiler</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Health Ribbon: 4 sleek metrics in 1 compact row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0e1320] border border-slate-800/90 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Typisch (P50)
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold font-mono text-white tracking-tight">
                {p50}
              </span>
              <span className="text-xs font-mono text-slate-400">ms</span>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            Normaal
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e1320] border border-slate-800/90 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              P95 Latentie
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold font-mono text-amber-300 tracking-tight">
                {p95}
              </span>
              <span className="text-xs font-mono text-slate-400">ms</span>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
            Staart
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e1320] border border-slate-800/90 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              SLA Naleving
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-extrabold font-mono text-emerald-400 tracking-tight">
                {slaCompliancePct}%
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            &lt;{threshold}ms
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e1320] border border-slate-800/90 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Foutpercentage
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-2xl font-extrabold font-mono tracking-tight ${
                parseFloat(errorRatePct) > 1 ? "text-amber-400" : "text-emerald-400"
              }`}>
                {errorRatePct}%
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {errorRequests.length} fouten
          </span>
        </div>
      </div>

      {/* Sub-bar: Cold start filter status & quick info */}
      <div className="flex items-center justify-between gap-3 text-xs font-mono text-slate-400 px-1 flex-wrap">
        <button
          onClick={() => setExcludeColdStarts(!excludeColdStarts)}
          className={`flex items-center gap-1.5 hover:text-slate-200 transition cursor-pointer text-[11px] ${
            excludeColdStarts ? "text-slate-300" : "text-slate-500 line-through"
          }`}
          title="Klik om koude starts mee te tellen of uit te sluiten"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Koude starts (warm-up) uitsluiten: <strong className="text-slate-200">{excludeColdStarts ? "Aan" : "Uit"}</strong></span>
        </button>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-slate-400">
            {slowRequests.length} van {totalRequestsCount} verzoeken overschrijden {threshold}ms
          </span>
        </div>
      </div>

      {/* 24-Hour Monitoring Timeline & Spikes Grid */}
      <div className="rounded-2xl border border-slate-800/90 bg-[#0e1320] p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Domain Dropdown */}
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              aria-label="Filter domein"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 text-xs font-mono font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Alle domeinen (5)">Alle domeinen (5)</option>
              <option value="partsnl.local">partsnl.local</option>
              <option value="ersatzteileshop.local">ersatzteileshop.local</option>
              <option value="onderdelen_nl.local">onderdelen_nl.local</option>
              <option value="rest.beekman.local">rest.beekman.local</option>
            </select>

            {/* Live Agent Data Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Echte agentdata · 24 uur</span>
            </div>

            <span className="text-[11px] font-mono text-slate-500 hidden md:inline">
              Continu monitoringvenster (laatste 24 uur) · bijgewerkt zojuist
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setInvestigationSlot({
                  timestamp: Date.now() - 15 * 60 * 1000,
                  timeLabel: "16:15 - 16:30",
                  type: "P95 uitschieter / query cluster",
                  eventsCount: 18,
                  affectedRoutes: ["GET /aansluitmateriaal/gas", "POST /checkout", "GET /api/v1/orders"],
                  p95LatencyMs: 1420
                });
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Onderzoek uitschieter (16:15)</span>
            </button>
          </div>
        </div>

        {/* 24-Hour Timeline Rows: Uitschieters, Errors/exceptions, Laravel-events */}
        <div className="space-y-3 pt-1">
          {/* Row 1: Uitschieters (24 hours) */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="w-36 text-slate-400 font-medium shrink-0">
              Uitschieters (24u)
            </div>
            <div className="flex-1 grid grid-cols-12 sm:grid-cols-24 gap-1 h-7">
              {[
                { time: "00:00", spike: null },
                { time: "01:00", spike: null },
                { time: "02:00", spike: { val: 420, color: "bg-amber-500/20 text-amber-300 border-amber-500/40" } },
                { time: "03:00", spike: { val: 1250, color: "bg-rose-500/30 text-rose-300 border-rose-500/50 font-bold" } },
                { time: "04:00", spike: null },
                { time: "05:00", spike: null },
                { time: "06:00", spike: null },
                { time: "07:00", spike: null },
                { time: "08:00", spike: { val: 340, color: "bg-amber-500/20 text-amber-300 border-amber-500/40" } },
                { time: "09:00", spike: null },
                { time: "10:00", spike: { val: 680, color: "bg-amber-500/30 text-amber-300 border-amber-500/50" } },
                { time: "11:00", spike: { val: 1420, color: "bg-rose-500/30 text-rose-300 border-rose-500/50 font-bold" } },
                { time: "12:00", spike: null },
                { time: "13:00", spike: { val: 510, color: "bg-amber-500/20 text-amber-300 border-amber-500/40" } },
                { time: "14:00", spike: { val: 890, color: "bg-amber-500/30 text-amber-300 border-amber-500/50" } },
                { time: "15:00", spike: null },
                { time: "16:00", spike: { val: 2400, color: "bg-rose-500/30 text-rose-300 border-rose-500/50 font-bold" } },
                { time: "17:00", spike: { val: 780, color: "bg-amber-500/30 text-amber-300 border-amber-500/50" } },
                { time: "18:00", spike: null },
                { time: "19:00", spike: null },
                { time: "20:00", spike: { val: 920, color: "bg-amber-500/30 text-amber-300 border-amber-500/50" } },
                { time: "21:00", spike: null },
                { time: "22:00", spike: null },
                { time: "23:00", spike: null }
              ].map((slot, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInvestigationSlot({
                      timestamp: Date.now() - (24 - i) * 3600000,
                      timeLabel: slot.time,
                      type: slot.spike ? "Latentie uitschieter" : "Normaal tijdslot",
                      eventsCount: slot.spike ? 24 : 8,
                      affectedRoutes: slot.spike ? ["GET /aansluitmateriaal/gas", "POST /checkout"] : ["GET /health"],
                      p95LatencyMs: slot.spike ? slot.spike.val : 85
                    });
                  }}
                  className={`h-full rounded border flex items-center justify-center transition cursor-pointer hover:border-blue-400 ${
                    slot.spike
                      ? `${slot.spike.color} shadow-sm`
                      : "bg-slate-900/60 border-slate-800 text-slate-500 hover:bg-slate-800/60"
                  }`}
                  title={`Klik om tijdslot ${slot.time} te onderzoeken`}
                >
                  {slot.spike ? (
                    <span className="text-[9px] font-mono leading-none truncate px-0.5">{slot.spike.val}m</span>
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Errors / exceptions (24 hours) */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="w-36 text-slate-400 font-medium shrink-0">
              Errors / exceptions
            </div>
            <div className="flex-1 grid grid-cols-12 sm:grid-cols-24 gap-1 h-7">
              {[
                { time: "00:00", count: 0 },
                { time: "01:00", count: 0 },
                { time: "02:00", count: 0 },
                { time: "03:00", count: 3 }, // nightly batch job exception
                { time: "04:00", count: 0 },
                { time: "05:00", count: 0 },
                { time: "06:00", count: 0 },
                { time: "07:00", count: 0 },
                { time: "08:00", count: 0 },
                { time: "09:00", count: 0 },
                { time: "10:00", count: 0 },
                { time: "11:00", count: 1 },
                { time: "12:00", count: 1 },
                { time: "13:00", count: 0 },
                { time: "14:00", count: 0 },
                { time: "15:00", count: 0 },
                { time: "16:00", count: 2 },
                { time: "17:00", count: 0 },
                { time: "18:00", count: 0 },
                { time: "19:00", count: 0 },
                { time: "20:00", count: 1 },
                { time: "21:00", count: 0 },
                { time: "22:00", count: 0 },
                { time: "23:00", count: 0 }
              ].map((slot, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInvestigationSlot({
                      timestamp: Date.now() - (24 - i) * 3600000,
                      timeLabel: slot.time,
                      type: slot.count > 0 ? "Laravel Exception / HTTP 500" : "Geen errors",
                      eventsCount: slot.count > 0 ? 12 : 5,
                      affectedRoutes: slot.count > 0 ? ["POST /checkout", "GET /api/v1/sync"] : [],
                      p95LatencyMs: slot.count > 0 ? 920 : 64
                    });
                  }}
                  className={`h-full rounded border flex items-center justify-center transition cursor-pointer hover:border-rose-400 ${
                    slot.count > 0
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold"
                      : "bg-slate-900/60 border-slate-800 text-slate-600 hover:bg-slate-800/60"
                  }`}
                  title={`Klik om tijdslot ${slot.time} te onderzoeken`}
                >
                  {slot.count > 0 ? (
                    <span className="text-[9px] text-rose-400 font-bold leading-none">{slot.count}e</span>
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-slate-800" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Laravel-events (24 hours) */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="w-36 text-slate-400 font-medium shrink-0">
              Laravel-events
            </div>
            <div className="flex-1 grid grid-cols-12 sm:grid-cols-24 gap-1 h-7">
              {[
                { time: "00:00", count: 8 },
                { time: "01:00", count: 5 },
                { time: "02:00", count: 12 },
                { time: "03:00", count: 89 }, // Nightly sync job dispatch
                { time: "04:00", count: 14 },
                { time: "05:00", count: 10 },
                { time: "06:00", count: 18 },
                { time: "07:00", count: 32 },
                { time: "08:00", count: 64 },
                { time: "09:00", count: 85 },
                { time: "10:00", count: 120 },
                { time: "11:00", count: 145 },
                { time: "12:00", count: 98 },
                { time: "13:00", count: 110 },
                { time: "14:00", count: 135 },
                { time: "15:00", count: 122 },
                { time: "16:00", count: 180 },
                { time: "17:00", count: 140 },
                { time: "18:00", count: 95 },
                { time: "19:00", count: 78 },
                { time: "20:00", count: 105 },
                { time: "21:00", count: 62 },
                { time: "22:00", count: 35 },
                { time: "23:00", count: 16 }
              ].map((slot, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInvestigationSlot({
                      timestamp: Date.now() - (24 - i) * 3600000,
                      timeLabel: slot.time,
                      type: "Laravel Event Dispatch Piek",
                      eventsCount: slot.count,
                      affectedRoutes: ["App\\Events\\OrderCreated", "App\\Events\\StockUpdated"],
                      p95LatencyMs: 180
                    });
                  }}
                  className="h-full rounded border bg-purple-500/10 border-purple-500/20 text-purple-300 flex items-center justify-center transition cursor-pointer hover:border-purple-400 text-[9px] font-mono leading-none truncate px-0.5"
                  title={`Klik om tijdslot ${slot.time} (${slot.count} events) te onderzoeken`}
                >
                  {slot.count}
                </button>
              ))}
            </div>
          </div>

          {/* Time axis ticks (24 hours formatted) */}
          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 pt-1">
            <div className="w-36 shrink-0" />
            <div className="flex-1 grid grid-cols-6 sm:grid-cols-12 gap-1 text-center">
              <span>00:00</span>
              <span className="hidden sm:inline">02:00</span>
              <span>04:00</span>
              <span className="hidden sm:inline">06:00</span>
              <span>08:00</span>
              <span className="hidden sm:inline">10:00</span>
              <span>12:00</span>
              <span className="hidden sm:inline">14:00</span>
              <span>16:00</span>
              <span className="hidden sm:inline">18:00</span>
              <span>20:00</span>
              <span className="hidden sm:inline">22:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Routeanalyse Module (Screenshot 2) */}
      <div className="rounded-2xl border border-slate-800/90 bg-[#0e1320] p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Layers2 className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              Routeanalyse
            </h2>
          </div>

          {/* Subtabs: Top 10 traagste, Top 10 meest aangeroepen, Recente aanroepen */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {[
              { id: "slowest", label: "Top 10 traagste (10)" },
              { id: "most_called", label: "Top 10 meest aangeroepen (10)" },
              { id: "recent", label: "Recente aanroepen (10)" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRouteAnalysisTab(tab.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                  routeAnalysisTab === tab.id
                    ? "bg-slate-800 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Layout: Left Table + Right "Gemiddeld requestdetail" Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Routes Table */}
          <div className="lg:col-span-7 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="pb-2 font-medium">Route / action</th>
                  <th className="pb-2 font-medium">Method</th>
                  <th className="pb-2 font-medium text-right">Gem. duur</th>
                  <th className="pb-2 font-medium text-right">P95</th>
                  <th className="pb-2 font-medium text-right">Aanroepen</th>
                  <th className="pb-2 font-medium text-center">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {groupedRoutes.slice(0, 10).map((r) => {
                  const isSelected = selectedRouteKey === r.key || (!selectedRouteKey && r === groupedRoutes[0]);
                  return (
                    <tr
                      key={r.key}
                      onClick={() => setSelectedRouteKey(r.key)}
                      className={`hover:bg-slate-900/60 transition cursor-pointer ${
                        isSelected ? "bg-blue-500/10 text-white font-semibold" : "text-slate-300"
                      }`}
                    >
                      <td className="py-2.5 pr-2 max-w-[200px] truncate" title={r.path}>
                        <span className="font-semibold text-slate-200">{r.path}</span>
                        {r.controller && (
                          <span className="block text-[10px] text-slate-500 truncate">{r.controller}</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-2">
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {r.method}
                        </span>
                      </td>
                      <td className="py-2.5 pr-2 text-right text-slate-300 font-mono">
                        {r.p50} ms
                      </td>
                      <td className="py-2.5 pr-2 text-right font-mono font-bold text-amber-400">
                        {r.p95} ms
                      </td>
                      <td className="py-2.5 pr-2 text-right text-slate-400 font-mono">
                        {r.count}
                      </td>
                      <td className="py-2.5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectInProfiler(r.sampleRequestId);
                          }}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] transition cursor-pointer border border-slate-700"
                          title="Open in Profiler"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Right: Gemiddeld Requestdetail Card (Screenshot 2) */}
          <div className="lg:col-span-5 p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-4 flex flex-col justify-between">
            {(() => {
              const activeRoute = groupedRoutes.find((r) => r.key === selectedRouteKey) || groupedRoutes[0];
              if (!activeRoute) return null;

              return (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                          Gemiddeld requestdetail
                        </div>
                        <div className="text-xs font-mono font-bold text-white mt-0.5 break-all">
                          {activeRoute.path}
                        </div>
                        {activeRoute.controller && (
                          <div className="text-[10px] font-mono text-slate-500">
                            {activeRoute.controller}
                          </div>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold">
                        {activeRoute.p95}ms P95
                      </span>
                    </div>

                    {/* Request Lifecycle Phase Breakdown Bars */}
                    <div className="space-y-2 text-xs font-mono">
                      {[
                        { label: "Bootstrap", ms: 55.7, color: "bg-blue-500" },
                        { label: "Middleware vóór", ms: 30.7, color: "bg-cyan-500" },
                        { label: "Controller / action", ms: 366.0, color: "bg-amber-500" },
                        { label: "Render", ms: 121.8, color: "bg-purple-500" },
                        { label: "Middleware ná", ms: 15.1, color: "bg-indigo-500" },
                        { label: "Response", ms: 0.4, color: "bg-emerald-500" }
                      ].map((stage) => {
                        const total = 589.7;
                        const pct = Math.round((stage.ms / total) * 100);
                        return (
                          <div key={stage.label} className="space-y-0.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-300">{stage.label}</span>
                              <span className="text-slate-400 font-semibold">{stage.ms} ms</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className={`h-full rounded-full ${stage.color}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Key Metrics Chips */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center font-mono">
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Queries / req</div>
                        <div className="text-xs font-bold text-white mt-0.5">53.0</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Querytijd</div>
                        <div className="text-xs font-bold text-blue-400 mt-0.5">329.7 ms</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Modellen / req</div>
                        <div className="text-xs font-bold text-emerald-400 mt-0.5">1387.0</div>
                      </div>
                    </div>
                  </div>

                  {/* Open in Profiler Action */}
                  <button
                    onClick={() => onInspectInProfiler(activeRoute.sampleRequestId)}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <span>Open met profiler</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Collapsible Trends Drawer */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden bg-[#0e1320] shadow-sm">
        <button
          onClick={() => setShowTrendsDrawer(!showTrendsDrawer)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-900/50 transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold">
              {showTrendsDrawer ? "Verberg macro-trends & responstijd histogram" : "Toon macro-trends & responstijd histogram"}
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              (Optioneel inzicht in responstijd-verdeling &amp; doorvoersnelheid)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-[11px] font-medium">{showTrendsDrawer ? "Inklappen" : "Uitklappen"}</span>
            {showTrendsDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showTrendsDrawer && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-4">
            {renderPerformanceCharts()}
            {renderSlowestRoutes()}
          </div>
        )}
      </div>

      {/* Direct Category Filters & Search */}
      {renderCategoryFilterBar()}

      {/* Full Request Cards List */}
      {renderRequestCards()}

      {/* Investigation Modal (Screenshot 3) */}
      <InvestigationModal
        isOpen={!!investigationSlot}
        onClose={() => setInvestigationSlot(null)}
        slotInfo={investigationSlot}
        onInspectInProfiler={onInspectInProfiler}
      />

      {/* Thresholds Modal */}
      <ThresholdsModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        rules={rules}
        onSaveRules={(updated) => setRules(updated)}
      />
    </div>
  );
};
