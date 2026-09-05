import React from "react";
import {
  Zap,
  Clock,
  AlertOctagon,
  Database,
  Layers,
  Cpu,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { APMStats } from "../types";

interface MetricCardsProps {
  stats: APMStats | null;
  onSelectTab: (tabId: string) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ stats, onSelectTab }) => {
  const rps = stats?.requests_per_second || "14.2";
  const avgLatency = stats?.avg_latency_ms || 148;
  const p95Latency = stats?.p95_latency_ms || 414;
  const errorRate = stats?.error_rate_pct || "0.45";
  const errorCount = stats?.error_count ?? 2;
  const slowQueries = stats?.slow_queries_count ?? 2;
  const queueBacklog = stats?.queue_backlog ?? 14;
  const cacheHit = stats?.redis_hit_ratio_pct ?? 94.6;

  const isHighLatency = avgLatency > 300;
  const isHighErrors = parseFloat(errorRate) > 1.5;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {/* 1. Requests / Throughput */}
      <div
        onClick={() => onSelectTab("monitoring")}
        className="group p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all cursor-pointer shadow-sm relative overflow-hidden"
      >
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-medium text-slate-300">Throughput</span>
          <Zap className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono tracking-tight text-white">{rps}</span>
          <span className="text-xs font-mono text-slate-400">req/s</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-400 font-mono">
          <span className="flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> +4.2%
          </span>
          <span className="text-slate-400">Peak: 48 rps</span>
        </div>
      </div>

      {/* 2. Response Time (Avg & P95) */}
      <div
        onClick={() => onSelectTab("monitoring")}
        className={`group p-3.5 rounded-xl bg-slate-900/90 border transition-all cursor-pointer shadow-sm relative overflow-hidden ${
          isHighLatency ? "border-amber-500/40 bg-amber-950/10" : "border-slate-800/90 hover:border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-medium text-slate-300">Latency (Avg / P95)</span>
          <Clock className={`w-4 h-4 ${isHighLatency ? "text-amber-400" : "text-sky-400"}`} />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono tracking-tight text-white">{avgLatency}</span>
          <span className="text-xs font-mono text-slate-400">ms</span>
          <span className="text-xs font-mono text-slate-400 ml-auto">P95: {p95Latency}ms</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
          <span className={isHighLatency ? "text-amber-400 font-medium" : "text-emerald-400"}>
            {isHighLatency ? "SLA warning" : "Within 200ms SLA"}
          </span>
          <span className="text-slate-400">PHP + DB</span>
        </div>
      </div>

      {/* 3. Error Rate & Sentry Crashes */}
      <div
        onClick={() => onSelectTab("exceptions")}
        className={`group p-3.5 rounded-xl bg-slate-900/90 border transition-all cursor-pointer shadow-sm relative overflow-hidden ${
          isHighErrors || errorCount > 0 ? "border-rose-500/40 bg-rose-950/10" : "border-slate-800/90 hover:border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-medium text-slate-300">Exceptions</span>
          <AlertOctagon className="w-4 h-4 text-rose-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono tracking-tight text-rose-400">{errorCount}</span>
          <span className="text-xs font-mono text-slate-400">issues</span>
          <span className="text-xs font-mono text-rose-400/90 ml-auto">{errorRate}% rate</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
          <span className="text-rose-400 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Action needed
          </span>
          <span className="text-slate-400">Sentry Mode</span>
        </div>
      </div>

      {/* 4. Slow Queries & N+1 Bottlenecks */}
      <div
        onClick={() => onSelectTab("queries")}
        className="group p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all cursor-pointer shadow-sm relative overflow-hidden"
      >
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-medium text-slate-300">Database & N+1</span>
          <Database className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono tracking-tight text-indigo-400">{slowQueries}</span>
          <span className="text-xs font-mono text-slate-400">slow queries</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
          <span className="text-amber-400 font-medium">N+1 detected</span>
          <span className="text-slate-400">Pulse DB</span>
        </div>
      </div>

      {/* 5. Queue Workers & Backlog */}
      <div
        onClick={() => onSelectTab("jobs")}
        className="group p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all cursor-pointer shadow-sm relative overflow-hidden"
      >
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-medium text-slate-300">Queue Workers</span>
          <Layers className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono tracking-tight text-white">
            {stats?.active_queue_workers || 8}
          </span>
          <span className="text-xs font-mono text-slate-400">daemons</span>
          <span className="text-xs font-mono text-slate-400 ml-auto">{queueBacklog} in queue</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
          <span className="text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Horizon Active
          </span>
          <span className="text-slate-400">0.4s lag</span>
        </div>
      </div>

      {/* 6. Redis Cache & Memory */}
      <div
        onClick={() => onSelectTab("sentinel")}
        className="group p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all cursor-pointer shadow-sm relative overflow-hidden"
      >
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-medium text-slate-300">Redis & System</span>
          <Cpu className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono tracking-tight text-white">{cacheHit}%</span>
          <span className="text-xs font-mono text-slate-400">cache hit</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-300">RAM: {stats?.memory_usage_mb ? `${Math.round(stats.memory_usage_mb)}MB` : "312MB"}</span>
          <span className="text-slate-400">CPU: {stats?.cpu_usage_pct || 28}%</span>
        </div>
      </div>
    </div>
  );
};
