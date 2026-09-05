import React, { useState } from "react";
import {
  Flame,
  FileCode,
  Clock,
  Database,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Info,
  Copy,
  Check,
  Terminal,
  ExternalLink
} from "lucide-react";
import { RequestHotspot, ProfilerQuery } from "../types";

interface HotspotsTableProps {
  hotspots?: RequestHotspot[];
  queries?: ProfilerQuery[];
  onSendQueryToTinker?: (sql: string) => void;
}

export const HotspotsTable: React.FC<HotspotsTableProps> = ({
  hotspots,
  queries,
  onSendQueryToTinker
}) => {
  const [expandedHotspotId, setExpandedHotspotId] = useState<string | null>(null);
  const [copiedQueryId, setCopiedQueryId] = useState<string | null>(null);

  // Compute realistic hotspots dynamically from queries or explicit metadata
  const items: RequestHotspot[] = React.useMemo(() => {
    if (hotspots && hotspots.length > 0) return hotspots;
    if (!queries || queries.length === 0) return [];

    // Group queries by origin frame to pinpoint hotspots
    const originMap = new Map<string, ProfilerQuery[]>();
    queries.forEach((q) => {
      const orig = q.origin || "Onbekend frame";
      if (!originMap.has(orig)) originMap.set(orig, []);
      originMap.get(orig)!.push(q);
    });

    const detected: RequestHotspot[] = [];
    let idCounter = 1;

    originMap.forEach((qList, origin) => {
      const totalTime = qList.reduce((acc, q) => acc + (q.durationMs || 0), 0);
      const isSlow = qList.some((q) => q.durationMs >= 25);
      const isN1 = qList.length >= 2 || qList.some((q) => q.is_duplicate);

      if (isN1 || isSlow) {
        const fileParts = origin.split(":");
        const file = fileParts[0] || origin;
        const line = fileParts[1] ? parseInt(fileParts[1], 10) : undefined;

        detected.push({
          id: `hs-dyn-${idCounter++}`,
          frame: `${origin} ${qList.length > 1 ? `×${qList.length}` : ""}`,
          file,
          line,
          query_count: qList.length,
          total_time_ms: Math.round(totalTime * 10) / 10,
          reason: isN1 ? "• Herhaalde queries (mogelijke N+1)" : "• Afwijkend langzame query",
          reason_type: isN1 ? "n1" : "slow_query",
          queries: qList
        });
      }
    });

    return detected.sort((a, b) => b.total_time_ms - a.total_time_ms);
  }, [hotspots, queries]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQueryId(id);
    setTimeout(() => setCopiedQueryId(null), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Hotspots in dit request
            </h4>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold">
              {items.length} hotspots
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Gesorteerd op gekoppelde tijd &amp; impact
          </span>
        </div>

        {/* Hotspots Table */}
        {items.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-4 h-4" />
            </div>
            <div className="text-xs font-mono font-bold text-slate-200">
              Geen hotspots gedetecteerd in dit request
            </div>
            <p className="text-[11px] font-mono text-slate-400 max-w-md mx-auto">
              Alle queries zijn binnen de dynamische drempelwaarde uitgevoerd (&lt; 25 ms) en er zijn geen herhaalde N+1 querypatronen aangetroffen in dit specifieke verzoek.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3.5 font-bold">Applicatieframe</th>
                  <th className="py-2.5 px-3.5 font-bold">Bron</th>
                  <th className="py-2.5 px-3.5 font-bold text-center">Gekoppeld bewijs</th>
                  <th className="py-2.5 px-3.5 font-bold text-right">Gekoppelde tijd</th>
                  <th className="py-2.5 px-3.5 font-bold">Waarom een hotspot?</th>
                  <th className="py-2.5 px-3.5 font-bold text-center">Actie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 bg-slate-900/60">
                {items.map((item) => {
                  const isExpanded = expandedHotspotId === item.id;
                  const hasQueries = item.queries && item.queries.length > 0;

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        className={`hover:bg-slate-800/40 transition cursor-pointer ${
                          isExpanded ? "bg-slate-800/50" : ""
                        }`}
                        onClick={() => setExpandedHotspotId(isExpanded ? null : item.id)}
                      >
                        {/* Applicatieframe */}
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-200 hover:text-amber-300 transition truncate max-w-[280px]">
                            {item.frame}
                          </div>
                        </td>

                        {/* Bron (File + Line) */}
                        <td className="py-3 px-3.5 text-slate-400">
                          <span className="flex items-center gap-1 hover:text-slate-200 transition">
                          <FileCode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[200px]">{item.file}:{item.line}</span>
                        </span>
                      </td>

                      {/* Gekoppeld bewijs */}
                      <td className="py-3 px-3.5 text-center">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold">
                          {item.query_count} {item.query_count === 1 ? "query" : "queries"}
                        </span>
                      </td>

                      {/* Gekoppelde tijd */}
                      <td className="py-3 px-3.5 text-right font-bold text-amber-300">
                        {item.total_time_ms.toFixed(1)} ms
                      </td>

                      {/* Waarom een hotspot? */}
                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            item.reason_type === "n1"
                              ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                              : item.reason_type === "slow_query"
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              : "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                          }`}
                        >
                          {item.reason}
                        </span>
                      </td>

                      {/* Expand Toggle */}
                      <td className="py-3 px-3.5 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedHotspotId(isExpanded ? null : item.id);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer transition"
                        >
                          {isExpanded ? (
                            <>
                              <span>Verberg</span>
                              <ChevronDown className="w-3 h-3" />
                            </>
                          ) : (
                            <>
                              <span>Toon {item.query_count}</span>
                              <ChevronRight className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Queries Drawer */}
                    {isExpanded && (
                      <tr className="bg-slate-950">
                        <td colSpan={6} className="p-4 border-t border-slate-800 space-y-3">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                              <Database className="w-3.5 h-3.5 text-blue-400" />
                              Onderliggende SQL queries voor{" "}
                              <code className="text-amber-300">{item.frame}</code>
                            </span>
                            <span className="text-slate-500 text-[11px]">
                              Gemaskerde bindings (? placeholder)
                            </span>
                          </div>

                          {hasQueries ? (
                            <div className="space-y-2">
                              {item.queries!.map((q, idx) => (
                                <div
                                  key={q.id || idx}
                                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-1.5"
                                >
                                  <div className="flex items-center justify-between text-[11px] font-mono">
                                    <span className="text-slate-400">
                                      #{idx + 1} • {q.origin || `${item.file}:${item.line}`}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-amber-300 font-bold">
                                        {q.durationMs} ms
                                      </span>
                                      <button
                                        onClick={() => handleCopy(q.id, q.sql)}
                                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                                        title="Kopieer SQL"
                                      >
                                        {copiedQueryId === q.id ? (
                                          <Check className="w-3 h-3 text-emerald-400" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                      {onSendQueryToTinker && (
                                        <button
                                          onClick={() => onSendQueryToTinker(q.sql)}
                                          className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] cursor-pointer"
                                          title="Open in Tinker"
                                        >
                                          Tinker
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-xs font-mono text-blue-300 bg-slate-950 p-2 rounded-lg overflow-x-auto border border-slate-900">
                                    {q.sql}
                                  </div>
                                  {q.bindings && q.bindings.length > 0 && (
                                    <div className="text-[11px] font-mono text-slate-400">
                                      Bindings:{" "}
                                      <code className="text-slate-300">
                                        [{q.bindings.join(", ")}]
                                      </code>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3 rounded-lg bg-slate-900/50 text-xs text-slate-400 text-center font-mono">
                              Geen individuele queries bewaard voor deze samenvattende frame.
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footnote from screenshot */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="font-mono leading-relaxed">
            <strong className="text-slate-300">Wat betekent dit?</strong> Route,
            controller, middleware en views zijn Laravel-context. Fasen en
            gekoppelde query-/HTTP-tijd zijn gemeten. Inclusieve en exclusieve
            PHP-methodetijd blijft zonder Xdebug bewust buiten beeld.
          </p>
        </div>
      </div>
    </div>
  );
};
