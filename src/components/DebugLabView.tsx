import React, { useState, useEffect, useCallback } from "react";
import {
  Terminal,
  Play,
  Trash2,
  Copy,
  Check,
  Code2,
  FileCode,
  Clock,
  Cpu,
  Layers,
  Zap,
  Info,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Database,
  Search,
  Tag
} from "lucide-react";
import { DumpEntry } from "../types";

interface DebugLabViewProps {
  initialCode?: string;
  initialFilter?: string;
  onOpenAgentGuide?: () => void;
}

// Collapsible VarDumper Node Component
const VarDumperNode: React.FC<{ name?: string; value: any; depth?: number }> = ({
  name,
  value,
  depth = 0
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(depth < 2);

  if (value === null) {
    return (
      <div className="flex items-center gap-1 font-mono text-xs py-0.5" style={{ paddingLeft: `${depth * 14}px` }}>
        {name && <span className="text-blue-400 font-semibold">{name}:</span>}
        <span className="text-slate-400 italic">null</span>
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <div className="flex items-center gap-1 font-mono text-xs py-0.5" style={{ paddingLeft: `${depth * 14}px` }}>
        {name && <span className="text-blue-400 font-semibold">{name}:</span>}
        <span className="text-amber-400 font-bold">{value ? "true" : "false"}</span>
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div className="flex items-center gap-1 font-mono text-xs py-0.5" style={{ paddingLeft: `${depth * 14}px` }}>
        {name && <span className="text-blue-400 font-semibold">{name}:</span>}
        <span className="text-orange-400 font-bold">{value}</span>
      </div>
    );
  }

  if (typeof value === "string") {
    return (
      <div className="flex items-start gap-1 font-mono text-xs py-0.5" style={{ paddingLeft: `${depth * 14}px` }}>
        {name && <span className="text-blue-400 font-semibold">{name}:</span>}
        <span className="text-emerald-300 break-all">"{value}"</span>
      </div>
    );
  }

  if (Array.isArray(value)) {
    const isSpecialClass = value.length > 0 && typeof value[0] === "object" && value[0]?.["#class"];

    return (
      <div className="font-mono text-xs py-0.5" style={{ paddingLeft: `${depth * 14}px` }}>
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-all text-slate-300"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          )}
          {name && <span className="text-blue-400 font-semibold">{name}:</span>}
          <span className="text-slate-400 font-semibold">array:{value.length} [</span>
          {!isExpanded && <span className="text-slate-400">...</span>}
          {!isExpanded && <span className="text-slate-400">]</span>}
        </div>

        {isExpanded && (
          <div className="border-l border-slate-800/80 ml-2 my-1 pl-1 space-y-0.5">
            {value.map((item, idx) => (
              <VarDumperNode key={idx} name={String(idx)} value={item} depth={depth + 1} />
            ))}
            <div className="text-slate-400">]</div>
          </div>
        )}
      </div>
    );
  }

  if (typeof value === "object") {
    const className = value["#class"];
    const entries = Object.entries(value).filter(([k]) => k !== "#class" && k !== "#count");

    return (
      <div className="font-mono text-xs py-0.5" style={{ paddingLeft: `${depth * 14}px` }}>
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-all text-slate-300 flex-wrap"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          )}
          {name && <span className="text-blue-400 font-semibold">{name}:</span>}
          {className ? (
            <span className="text-purple-400 font-bold bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">
              {className}
            </span>
          ) : (
            <span className="text-slate-400 font-semibold">object &#123;</span>
          )}
          {!isExpanded && <span className="text-slate-400">...&#125;</span>}
        </div>

        {isExpanded && (
          <div className="border-l border-slate-800/80 ml-2 my-1 pl-1 space-y-0.5">
            {entries.map(([k, v]) => (
              <VarDumperNode key={k} name={k} value={v} depth={depth + 1} />
            ))}
            <div className="text-slate-400">&#125;</div>
          </div>
        )}
      </div>
    );
  }

  return <div className="font-mono text-xs text-slate-400">{String(value)}</div>;
};

export const DebugLabView: React.FC<DebugLabViewProps> = ({
  initialCode,
  initialFilter,
  onOpenAgentGuide
}) => {
  const [dumps, setDumps] = useState<DumpEntry[]>([]);
  const [isLoadingDumps, setIsLoadingDumps] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [copiedDumpId, setCopiedDumpId] = useState<string | null>(null);

  // Tinker Evaluator state
  const [tinkerCode, setTinkerCode] = useState<string>(
    `// Test eager loading speed & inspect relations:\nOrder::with(['items.product', 'customer'])\n    ->where('status', 'processing')\n    ->take(10)\n    ->get();`
  );
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [tinkerResult, setTinkerResult] = useState<any>(null);
  const [tinkerStats, setTinkerStats] = useState<{ durationMs: number; memoryMb: number; type: string } | null>(null);

  // Active view tab inside Debug Lab
  const [debugMode, setDebugMode] = useState<"stream" | "tinker" | "integration">("stream");

  // Sync external filters or code if passed from Monitoring or Profiler
  useEffect(() => {
    if (initialCode) {
      setTinkerCode(initialCode);
      setDebugMode("tinker");
    }
  }, [initialCode]);

  useEffect(() => {
    if (initialFilter) {
      setSearchFilter(initialFilter);
      setDebugMode("stream");
    }
  }, [initialFilter]);

  // Fetch Dumps
  const fetchDumps = useCallback(async () => {
    setIsLoadingDumps(true);
    try {
      const res = await fetch("/api/telemetry/dumps");
      if (res.ok) {
        const data = await res.json();
        setDumps(data);
      }
    } catch (err) {
      console.error("Failed to fetch dumps:", err);
    } finally {
      setIsLoadingDumps(false);
    }
  }, []);

  useEffect(() => {
    fetchDumps();
    const interval = setInterval(fetchDumps, 4000);
    return () => clearInterval(interval);
  }, [fetchDumps]);

  // Clear Dumps
  const handleClearDumps = async () => {
    try {
      await fetch("/api/telemetry/dumps/clear", { method: "POST" });
      setDumps([]);
    } catch (err) {
      console.error("Failed to clear dumps:", err);
    }
  };

  // Run Tinker evaluation
  const handleRunTinker = async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch("/api/telemetry/tinker/eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: tinkerCode })
      });
      if (res.ok) {
        const data = await res.json();
        setTinkerResult(data.result);
        setTinkerStats({
          durationMs: data.durationMs,
          memoryMb: data.memoryMb,
          type: data.type
        });
        await fetchDumps();
      }
    } catch (err) {
      console.error("Failed to evaluate code:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const copyDumpJson = (dump: DumpEntry) => {
    navigator.clipboard.writeText(JSON.stringify(dump.payload, null, 2));
    setCopiedDumpId(dump.id);
    setTimeout(() => setCopiedDumpId(null), 2000);
  };

  const filteredDumps = dumps.filter((d) => {
    if (typeFilter !== "all" && d.type !== typeFilter) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchLabel = d.label?.toLowerCase().includes(q) || false;
      const matchFile = d.origin.file.toLowerCase().includes(q);
      const matchPayload = JSON.stringify(d.payload).toLowerCase().includes(q);
      if (!matchLabel && !matchFile && !matchPayload) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-950 border border-slate-800/90 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                <Terminal className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Laravel Debug Lab &amp; Dump Server
              </h2>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Listening on dd() &amp; dump() stream
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Vang realtime <code>dd()</code> en <code>dump()</code> calls op vanuit je Laravel controllers, jobs en middleware.
              Inspecteer variabelen en Eloquent models in een interactieve VarDumper boomstructuur of test code direct in de Tinker sandbox.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleClearDumps}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all cursor-pointer text-xs font-mono flex items-center gap-1.5"
              title="Leeg alle dumps"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Dumps wissen</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
          <button
            onClick={() => setDebugMode("stream")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              debugMode === "stream"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Live Dumps Stream ({dumps.length})</span>
          </button>

          <button
            onClick={() => setDebugMode("tinker")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              debugMode === "tinker"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Tinkerpad &amp; Code Sandbox</span>
          </button>

          <button
            onClick={() => setDebugMode("integration")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              debugMode === "integration"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Laravel Integratie Code</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Live Dumps Stream */}
      {debugMode === "stream" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Zoek in dumps, labels of bestandsnamen..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-rose-500/40"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Type:</span>
              {[
                { id: "all", label: "Alle" },
                { id: "dd", label: "dd()" },
                { id: "dump", label: "dump()" },
                { id: "measure", label: "measure()" },
                { id: "query", label: "query log" }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTypeFilter(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    typeFilter === t.id
                      ? "bg-slate-800 text-white font-bold border border-slate-700"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dumps Stream List */}
          <div className="space-y-3.5">
            {filteredDumps.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                <Terminal className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-sm font-semibold text-slate-200">Nog geen dump() of dd() geregistreerd</div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Gebruik de knop "Simuleer dd()" hierboven of roep <code>dd()</code> of <code>dump()</code> aan in je Laravel controllers.
                </p>
              </div>
            ) : (
              filteredDumps.map((dump) => {
                const isDd = dump.type === "dd";
                const isMeasure = dump.type === "measure";
                const isQuery = dump.type === "query";

                return (
                  <div
                    key={dump.id}
                    className={`rounded-2xl border overflow-hidden transition-all shadow-sm ${
                      isDd
                        ? "bg-slate-900/90 border-rose-500/40"
                        : isMeasure
                        ? "bg-slate-900/90 border-purple-500/40"
                        : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* Dump Card Header */}
                    <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Type Badge */}
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                            isDd
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                              : isMeasure
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                              : isQuery
                              ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          }`}
                        >
                          {dump.type}
                        </span>

                        {(dump.client_source === "vue" || dump.label?.includes("[Vue]")) && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border bg-teal-500/20 text-teal-300 border-teal-500/30 flex items-center gap-1">
                            <Code2 className="w-2.5 h-2.5" />
                            Vue 3
                          </span>
                        )}

                        {/* Label or Expression */}
                        <span className="text-xs font-mono font-bold text-white">
                          {dump.label || "VarDump"}
                        </span>
                      </div>

                      {/* File Origin & Meta */}
                      <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                        {dump.related_trace_id && (
                          <span className="text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-mono">
                            trace #{dump.related_trace_id.slice(-6)}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          <FileCode className="w-3.5 h-3.5 text-amber-400" />
                          <span>{dump.origin.file}:{dump.origin.line}</span>
                        </span>

                        {dump.execution_time_ms !== undefined && (
                          <span className="text-amber-300 font-semibold">{dump.execution_time_ms}ms</span>
                        )}

                        <button
                          onClick={() => copyDumpJson(dump)}
                          className="text-slate-400 hover:text-white p-1 transition-all cursor-pointer"
                          title="Kopieer als JSON"
                        >
                          {copiedDumpId === dump.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Dump Content / Interactive VarDumper Tree */}
                    <div className="p-4 bg-[#0a0e17] overflow-x-auto">
                      <VarDumperNode value={dump.payload} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Tinkerpad / Expression Evaluator */}
      {debugMode === "tinker" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Side: Code Editor */}
          <div className="lg:col-span-6 space-y-3">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold font-mono text-white">
                    Laravel Artisan Tinker Code Scratchpad
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">PHP 8.3 / Laravel 11.x</span>
              </div>

              {/* Code Textarea */}
              <div className="relative">
                <textarea
                  rows={10}
                  value={tinkerCode}
                  onChange={(e) => setTinkerCode(e.target.value)}
                  placeholder="// Typ hier Laravel Eloquent code of PHP expressies..."
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500/50 leading-relaxed font-normal"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono text-slate-400">Handige test-recepten:</div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    {
                      label: "Eager Loading (with)",
                      code: `// Test Eloquent eager loading speed:\nOrder::with(['items.product', 'customer'])->take(5)->get();`
                    },
                    {
                      label: "User::count()",
                      code: `// Actieve gebruikers tellen:\nUser::where('status', 'active')->count();`
                    },
                    {
                      label: "DB Sum Query",
                      code: `// Totale omzet aggregeren:\nDB::table('orders')->where('status', 'completed')->sum('amount');`
                    },
                    {
                      label: "Collection Pipeline",
                      code: `// Collection map transformatie:\ncollect([1, 2, 3, 4])->map(fn($n) => ['id' => $n, 'squared' => $n * $n]);`
                    },
                    {
                      label: "Cache::remember",
                      code: `// Redis cache lookup:\nCache::remember('reports:monthly:2026-08', 3600, fn() => ['revenue' => 142800]);`
                    }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setTinkerCode(preset.code)}
                      className="text-[10px] font-mono px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Run Action */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  Resultaten worden direct gelogd naar de Dumps Stream
                </span>

                <button
                  onClick={handleRunTinker}
                  disabled={isEvaluating}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow disabled:opacity-50"
                >
                  {isEvaluating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>{isEvaluating ? "Uitvoeren..." : "Voer uit in Sandbox"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Execution Result Output */}
          <div className="lg:col-span-6 space-y-3">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-sm min-h-[360px] flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-white">Evaluatie Resultaat</span>
                {tinkerStats && (
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-amber-300 font-bold">{tinkerStats.durationMs}ms</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300">{tinkerStats.memoryMb} MB RAM</span>
                  </div>
                )}
              </div>

              {tinkerResult !== null ? (
                <div className="flex-1 p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3 overflow-x-auto font-mono text-xs">
                  {tinkerStats?.type && (
                    <div className="text-[11px] text-purple-400 font-semibold border-b border-slate-800/80 pb-1.5">
                      Type: {tinkerStats.type}
                    </div>
                  )}
                  <VarDumperNode value={tinkerResult} />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-400 space-y-2">
                  <Play className="w-8 h-8 text-slate-400" />
                  <div className="text-xs font-semibold text-slate-300">Nog geen expressie uitgevoerd</div>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Klik op "Voer uit in Sandbox" om je Laravel PHP expressie te evalueren.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mode 3: Laravel Integration Guide */}
      {debugMode === "integration" && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Hoe stuur je dump() &amp; dd() vanuit je echte Laravel applicatie naar dit dashboard?</h3>
            <p className="text-xs text-slate-400">
              Je kunt eenvoudige HTTP webhooks of Laravel Dump Server gebruiken om dumps direct in dit scherm op te vangen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option 1: Native Laravel helper */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold font-mono text-amber-300">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Optie 1: Helper in app/helpers.php</span>
              </div>
              <p className="text-xs text-slate-400">
                Plaats deze helper in je Laravel project om met één regel variabelen direct naar dit scherm te pushen:
              </p>
              <pre className="p-3 rounded-lg bg-slate-900 text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800">
{`if (! function_exists('profiler_dump')) {
    function profiler_dump($var, string $label = null) {
        $trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 1)[0] ?? [];
        
        rescue(fn () => Http::timeout(0.3)->post(rtrim(env('PROFILER_URL', 'http://localhost:3000'), '/') . '/api/telemetry/dump', [
            'type' => 'dump',
            'label' => $label ?? 'profiler_dump() caller',
            'origin' => [
                'file' => str_replace(base_path() . '/', '', $trace['file'] ?? 'unknown'),
                'line' => $trace['line'] ?? 0,
            ],
            'payload' => $var,
        ]));
        
        return $var;
    }
}`}
              </pre>
            </div>

            {/* Option 2: Laravel Artisan Dump Server */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold font-mono text-purple-300">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span>Optie 2: Artisan Dump Server CLI</span>
              </div>
              <p className="text-xs text-slate-400">
                Laravel heeft standaard <code>laravel/dump-server</code> ondersteuning om dumps naar een socket te streamen:
              </p>
              <pre className="p-3 rounded-lg bg-slate-900 text-xs font-mono text-purple-300 overflow-x-auto border border-slate-800">
{`# Start de dump-server CLI in je Laravel terminal:
php artisan dump-server`}
              </pre>
              <div className="text-[11px] text-slate-400 pt-1">
                Alle data gestuurd naar <code>/api/telemetry/dump</code> verschijnt direct realtime in het stream-overzicht.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
