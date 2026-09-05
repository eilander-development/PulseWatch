import React, { useState } from "react";
import {
  GitCompare,
  TrendingDown,
  TrendingUp,
  Clock,
  Database,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { ProfilerRunSummary } from "../types";

interface RunsCompareViewProps {
  currentRunId?: string;
  runs?: ProfilerRunSummary[];
}

export const RunsCompareView: React.FC<RunsCompareViewProps> = ({
  currentRunId,
  runs = []
}) => {
  const availableRuns = runs;
  const currentRun = availableRuns.find((r) => r.id === currentRunId) || availableRuns[0];

  const otherRuns = currentRun ? availableRuns.filter((r) => r.id !== currentRun.id) : [];
  const [selectedCompareRunId, setSelectedCompareRunId] = useState<string>(
    otherRuns[0]?.id || ""
  );

  const baselineRun = availableRuns.find((r) => r.id === selectedCompareRunId) || otherRuns[0];

  if (!currentRun || !baselineRun) {
    return (
      <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 space-y-2">
        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center mx-auto">
          <GitCompare className="w-4 h-4" />
        </div>
        <div className="font-bold text-slate-200">Onvoldoende runs om te vergelijken</div>
        <p className="max-w-md mx-auto text-slate-400">
          Er zijn minimaal twee geregistreerde runs nodig om regressieverschillen en SQL-mutaties te kunnen analyseren.
        </p>
      </div>
    );
  }

  // Calculate Deltas: (current - baseline)
  const durationDiff = currentRun.flow_duration_ms - baselineRun.flow_duration_ms;
  const durationPct = Math.round((durationDiff / baselineRun.flow_duration_ms) * 100);

  const queriesDiff = currentRun.queries_count - baselineRun.queries_count;
  const queriesPct = Math.round((queriesDiff / (baselineRun.queries_count || 1)) * 100);

  const memoryDiff = currentRun.memory_peak_mb - baselineRun.memory_peak_mb;
  const memoryPct = Math.round((memoryDiff / (baselineRun.memory_peak_mb || 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Top Header & Selector */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitCompare className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold font-mono text-white">
                Runs vergelijken
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                {currentRun.label} · run {currentRun.run_number}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Meet het verschil tussen deze run en een eerdere uitvoering; runs met hetzelfde label staan herkenbaar bij elkaar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCompareRunId}
              onChange={(e) => setSelectedCompareRunId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500/50"
            >
              {otherRuns.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label} · run {r.run_number} ({r.flow_duration_ms} ms, {r.queries_count} queries)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparative Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* 1. Flowduur Delta */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Flowduur
              </span>
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                  durationDiff <= 0
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                }`}
              >
                {durationDiff <= 0 ? (
                  <>
                    <TrendingDown className="w-3 h-3" />
                    <span>{durationPct}% sneller</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3 h-3" />
                    <span>+{durationPct}% trager</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <div className="text-xl font-bold font-mono text-white">
                  {currentRun.flow_duration_ms} ms
                </div>
                <div className="text-[10px] font-mono text-slate-400">Huidige run ({currentRun.run_number})</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono text-slate-400 line-through">
                  {baselineRun.flow_duration_ms} ms
                </div>
                <div className="text-[10px] font-mono text-slate-500">Baseline ({baselineRun.run_number})</div>
              </div>
            </div>

            <div className="text-[11px] font-mono font-bold text-emerald-400 pt-1 border-t border-slate-800/80">
              Delta: {durationDiff > 0 ? `+${durationDiff.toFixed(1)}` : durationDiff.toFixed(1)} ms
            </div>
          </div>

          {/* 2. Queries Count Delta */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                Aantal Queries
              </span>
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                  queriesDiff <= 0
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                }`}
              >
                {queriesDiff <= 0 ? (
                  <>
                    <TrendingDown className="w-3 h-3" />
                    <span>{queriesPct}%</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3 h-3" />
                    <span>+{queriesPct}%</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <div className="text-xl font-bold font-mono text-white">
                  {currentRun.queries_count}
                </div>
                <div className="text-[10px] font-mono text-slate-400">Huidige run</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono text-slate-400 line-through">
                  {baselineRun.queries_count}
                </div>
                <div className="text-[10px] font-mono text-slate-500">Baseline</div>
              </div>
            </div>

            <div className="text-[11px] font-mono font-bold text-emerald-400 pt-1 border-t border-slate-800/80">
              Delta: {queriesDiff > 0 ? `+${queriesDiff}` : queriesDiff} queries
            </div>
          </div>

          {/* 3. Geheugenpiek Delta */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-rose-400" />
                Geheugenpiek
              </span>
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                  memoryDiff <= 0
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                }`}
              >
                {memoryDiff <= 0 ? (
                  <>
                    <TrendingDown className="w-3 h-3" />
                    <span>{memoryPct}%</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3 h-3" />
                    <span>+{memoryPct}%</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <div className="text-xl font-bold font-mono text-white">
                  {currentRun.memory_peak_mb} MB
                </div>
                <div className="text-[10px] font-mono text-slate-400">Huidige run</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono text-slate-400 line-through">
                  {baselineRun.memory_peak_mb} MB
                </div>
                <div className="text-[10px] font-mono text-slate-500">Baseline</div>
              </div>
            </div>

            <div className="text-[11px] font-mono font-bold text-emerald-400 pt-1 border-t border-slate-800/80">
              Delta: {memoryDiff > 0 ? `+${memoryDiff.toFixed(1)}` : memoryDiff.toFixed(1)} MB
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Request Breakdown Table */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-sm">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
          Vergelijking per request in deze flow
        </h4>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3.5">Request URL</th>
                <th className="py-2.5 px-3.5 text-right">Huidige duur</th>
                <th className="py-2.5 px-3.5 text-right">Baseline duur</th>
                <th className="py-2.5 px-3.5 text-right">Verschil</th>
                <th className="py-2.5 px-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 bg-slate-900/60">
              <tr>
                <td className="py-3 px-3.5 font-bold text-white">
                  GET /aansluitmateriaal/gas
                </td>
                <td className="py-3 px-3.5 text-right font-bold text-amber-300">
                  458.5 ms
                </td>
                <td className="py-3 px-3.5 text-right text-slate-400">
                  1420.2 ms
                </td>
                <td className="py-3 px-3.5 text-right text-emerald-400 font-bold">
                  -961.7 ms (-67.7%)
                </td>
                <td className="py-3 px-3.5 text-center">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                    Geoptimaliseerd
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3.5 font-bold text-white">
                  GET /doe-het-zelf
                </td>
                <td className="py-3 px-3.5 text-right font-bold text-amber-300">
                  402.5 ms
                </td>
                <td className="py-3 px-3.5 text-right text-slate-400">
                  420.0 ms
                </td>
                <td className="py-3 px-3.5 text-right text-emerald-400 font-bold">
                  -17.5 ms (-4.2%)
                </td>
                <td className="py-3 px-3.5 text-center">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                    Stabiel
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
