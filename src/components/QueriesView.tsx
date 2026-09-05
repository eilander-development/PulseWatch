import React, { useState } from "react";
import {
  Database,
  AlertTriangle,
  Clock,
  Zap,
  Code,
  Check,
  Copy,
  Table,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  BookOpen
} from "lucide-react";
import { TelemetryEvent } from "../types";
import { findRecipeForEvent, LaravelFixRecipe } from "../data/laravelRecipes";

interface QueriesViewProps {
  events: TelemetryEvent[];
  onOpenRecipe?: (recipe: LaravelFixRecipe) => void;
}

export const QueriesView: React.FC<QueriesViewProps> = ({ events, onOpenRecipe }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "n_plus_one" | "slow">("all");

  const queryEvents = events.filter((e) => e.type === "query");

  const filteredQueries = queryEvents.filter((q) => {
    if (filterType === "n_plus_one") {
      return (q.metadata.execution_count || 0) > 1 || q.title.toLowerCase().includes("n+1");
    }
    if (filterType === "slow") {
      return (q.durationMs || 0) > 300;
    }
    return true;
  });

  const copySql = (id: string, sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview & Pulse Bottleneck Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/40 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mt-0.5">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Laravel Pulse & Telescope Database Profiler</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                MySQL 8.0 InnoDb
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Automatic detection of N+1 lazy loading loops, unindexed table scans, and high latency SQL queries. Generate Eloquent eager loading and schema migrations with one click.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs font-mono">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterType === "all"
                ? "bg-indigo-600 text-white font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Alle Queries ({queryEvents.length})
          </button>
          <button
            onClick={() => setFilterType("n_plus_one")}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
              filterType === "n_plus_one"
                ? "bg-amber-500/20 text-amber-300 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Dubbele Queries (N+1)
          </button>
          <button
            onClick={() => setFilterType("slow")}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterType === "slow"
                ? "bg-rose-500/20 text-rose-300 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Trage Queries (&gt;300ms)
          </button>
        </div>
      </div>

      {/* Query List */}
      <div className="space-y-4">
        {filteredQueries.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400">
            Geen queries gevonden voor het geselecteerde filter.
          </div>
        ) : (
          filteredQueries.map((query, idx) => {
            const isNPlusOne =
              (query.metadata.execution_count || 0) > 1 ||
              query.title.toLowerCase().includes("n+1");
            const sql = query.metadata.sql || "";
            const explain = query.metadata.explain_plan;
            const count = query.metadata.execution_count || (isNPlusOne ? 48 : 1);
            const totalTime = query.metadata.total_time_ms || query.durationMs || 0;
            const avgTime = query.metadata.avg_time_ms || (count > 0 ? Math.round((totalTime / count) * 10) / 10 : totalTime);

            return (
              <div
                key={`${query.id}-${idx}`}
                className={`p-5 rounded-xl border transition-all ${
                  isNPlusOne
                    ? "border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900/90 to-slate-900/90 hover:border-amber-500/50"
                    : "border-slate-800 bg-slate-900/90 hover:border-slate-700/80 shadow-md"
                }`}
              >
                {/* Header Row with Explicit Metrics: Aantal keer, Totale tijd, Gemiddelde tijd */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center flex-wrap gap-2">
                    {isNPlusOne ? (
                      <span className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold shadow-sm">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        N+1 DUBBEL: {count}x uitgevoerd
                      </span>
                    ) : (
                      <span className="text-xs font-mono px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                        TRAGE QUERY
                      </span>
                    )}

                    {/* Metric 1: Totale Tijd */}
                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Totale Tijd: <strong className={isNPlusOne ? "text-rose-400" : "text-blue-300"}>{totalTime} ms</strong>
                    </span>

                    {/* Metric 2: Gemiddelde Tijd (bij duplicaten) */}
                    {isNPlusOne && (
                      <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Gemiddeld: <strong className="text-blue-400">{avgTime} ms</strong> / query
                      </span>
                    )}

                    {query.metadata.origin && (
                      <span className="text-xs font-mono text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800/40">
                        {query.metadata.origin}
                      </span>
                    )}

                    {/* Laravel Fix Recipe button (free / offline) */}
                    {(() => {
                      const matchedRecipe = findRecipeForEvent(
                        query.title + " " + (query.message || ""),
                        query.metadata.sql
                      );
                      if (!matchedRecipe || !onOpenRecipe) return null;
                      return (
                        <button
                          onClick={() => onOpenRecipe(matchedRecipe)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all cursor-pointer"
                          title="Bekijk beproefd Laravel Eloquent recept (gratis / 0 tokens)"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Laravel Recept</span>
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* Title & Message */}
                <h4 className="text-sm font-bold text-white mb-1">
                  {query.title}
                </h4>
                {query.message && (
                  <p className="text-xs text-slate-400 font-mono mb-3">
                    {query.message}
                  </p>
                )}

                {/* SQL Code Block */}
                {sql && (
                  <div className="relative mt-2 rounded-lg bg-slate-950 border border-slate-800 p-3 font-mono text-xs text-indigo-200 overflow-x-auto">
                    <button
                      onClick={() => copySql(query.id, sql)}
                      className="absolute top-2.5 right-2.5 p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 px-2 transition-colors"
                      title="Copy SQL statement"
                    >
                      {copiedId === query.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Copy SQL</span>
                        </>
                      )}
                    </button>
                    <div className="pr-20 whitespace-pre-wrap break-all leading-relaxed">
                      {sql}
                    </div>
                  </div>
                )}

                {/* Code Snippet context if available */}
                {query.metadata.code_snippet && (
                  <div className="mt-3">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      PHP / Controller Trigger:
                    </span>
                    <div className="rounded-lg bg-slate-950 border border-slate-800 p-2.5 font-mono text-xs">
                      {query.metadata.code_snippet.map((line) => (
                        <div
                          key={line.line}
                          className={`flex items-center gap-3 py-0.5 px-2 rounded ${
                            line.highlight
                              ? "bg-amber-500/20 text-amber-200 border-l-2 border-amber-500 font-semibold"
                              : "text-slate-400"
                          }`}
                        >
                          <span className="w-6 text-right select-none text-slate-400">
                            {line.line}
                          </span>
                          <span className="whitespace-pre">{line.code}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visual EXPLAIN Plan */}
                {explain && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                      <Table className="w-3.5 h-3.5 text-sky-400" />
                      MySQL EXPLAIN Query Plan
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Table</span>
                        <span className="text-slate-200 font-semibold">{explain.table}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Access Type</span>
                        <span
                          className={`font-semibold ${
                            explain.type === "ALL" ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          {explain.type} {explain.type === "ALL" && "(Full Scan!)"}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Index Used</span>
                        <span className="text-slate-200 truncate block">
                          {explain.key || "None (Missing Index!)"}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Rows Examined</span>
                        <span className="text-slate-200 font-semibold">
                          {explain.rows_examined.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Query Cost</span>
                        <span className="text-slate-200">{explain.cost || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
