import React, { useState } from "react";
import {
  Globe,
  Clock,
  Database,
  Cpu,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Server
} from "lucide-react";
import { TelemetryEvent } from "../types";

interface RequestsViewProps {
  events: TelemetryEvent[];
}

export const RequestsView: React.FC<RequestsViewProps> = ({ events }) => {
  const requestEvents = events.filter((e) => e.type === "request");
  const [selectedReqId, setSelectedReqId] = useState<string | null>(
    requestEvents[0]?.id || null
  );

  const selectedReq =
    requestEvents.find((r) => r.id === selectedReqId) || requestEvents[0];

  const getStatusColor = (status?: number) => {
    if (!status) return "bg-slate-800 text-slate-300";
    if (status >= 500) return "bg-rose-500/20 text-rose-300 border-rose-500/30";
    if (status >= 400) return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left List: HTTP Requests */}
      <div className="lg:col-span-6 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono text-slate-400">
            Incoming HTTP Traffic &amp; Route Telemetry
          </span>
          <span className="text-xs font-mono text-slate-400">
            {requestEvents.length} recorded
          </span>
        </div>

        <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
          {requestEvents.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400">
              No HTTP requests recorded yet.
            </div>
          ) : (
            requestEvents.map((req) => {
              const isSelected = selectedReq?.id === req.id;
              const status = req.metadata.status || 200;
              const duration = req.durationMs || 120;
              const isSlow = duration > 1000;
              const breakdown = req.metadata.breakdown;

              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedReqId(req.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? "bg-slate-900 border-rose-500/50 shadow-md"
                      : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono px-2 py-0.5 rounded border font-semibold ${getStatusColor(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        {req.title}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-mono font-semibold ${
                        isSlow ? "text-amber-400" : "text-slate-300"
                      }`}
                    >
                      {duration}ms
                    </span>
                  </div>

                  {/* Waterfall Mini Bar */}
                  {breakdown && (
                    <div className="my-2">
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                        <div
                          style={{ width: `${breakdown.database_pct}%` }}
                          className="bg-indigo-500 h-full"
                          title={`Database: ${breakdown.database_pct}%`}
                        />
                        <div
                          style={{ width: `${breakdown.external_pct}%` }}
                          className="bg-amber-500 h-full"
                          title={`External APIs: ${breakdown.external_pct}%`}
                        />
                        <div
                          style={{ width: `${breakdown.php_pct}%` }}
                          className="bg-sky-500 h-full"
                          title={`PHP: ${breakdown.php_pct}%`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> DB ({breakdown.database_pct}%)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> External ({breakdown.external_pct}%)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> PHP ({breakdown.php_pct}%)
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2">
                    <span className="truncate max-w-[240px]">
                      {req.metadata.controller || "Closure / Invokable"}
                    </span>
                    <div className="flex items-center gap-3">
                      <span>{req.metadata.db_queries_count ?? 2} queries</span>
                      <span>{req.metadata.memory_peak_mb ?? 18} MB</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Details: Request Inspector */}
      <div className="lg:col-span-6">
        {selectedReq ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded border font-semibold ${getStatusColor(
                      selectedReq.metadata.status
                    )}`}
                  >
                    {selectedReq.metadata.status || 200}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ID: {selectedReq.id}
                  </span>
                </div>
              </div>

              <h3 className="text-base font-bold text-white">
                {selectedReq.title}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Controller: {selectedReq.metadata.controller || "Anonymous route"}
              </p>
            </div>

            <div className="p-5 space-y-5 max-h-[640px] overflow-y-auto">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Total Latency</span>
                  <span className="text-lg font-bold text-white">
                    {selectedReq.durationMs}ms
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Database Time</span>
                  <span className="text-lg font-bold text-indigo-400">
                    {selectedReq.metadata.db_time_ms ?? 34}ms
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">DB Queries</span>
                  <span className="text-lg font-bold text-sky-400">
                    {selectedReq.metadata.db_queries_count ?? 5}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Memory Peak</span>
                  <span className="text-lg font-bold text-purple-400">
                    {selectedReq.metadata.memory_peak_mb ?? 22} MB
                  </span>
                </div>
              </div>

              {/* Waterfall Detailed Breakdown */}
              {selectedReq.metadata.breakdown && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-400" />
                    Latency Timeline Breakdown
                  </h4>
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-300 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-indigo-400" /> MySQL Queries
                      </span>
                      <span className="text-slate-200 font-semibold">
                        {selectedReq.metadata.db_time_ms}ms ({selectedReq.metadata.breakdown.database_pct}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-amber-300 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-amber-400" /> External HTTP (Stripe/Shopify)
                      </span>
                      <span className="text-slate-200 font-semibold">
                        {selectedReq.metadata.external_http_time_ms ?? 0}ms ({selectedReq.metadata.breakdown.external_pct}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sky-300 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-sky-400" /> PHP Engine &amp; Blade View
                      </span>
                      <span className="text-slate-200 font-semibold">
                        {selectedReq.metadata.php_execution_time_ms ?? 24}ms ({selectedReq.metadata.breakdown.php_pct}%)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Middleware Pipeline */}
              {selectedReq.metadata.middleware && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Executed Middleware Stack
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedReq.metadata.middleware.map((mw, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300"
                      >
                        {mw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400">
            Select a request from the left list to inspect its latency waterfall and middleware execution.
          </div>
        )}
      </div>
    </div>
  );
};
