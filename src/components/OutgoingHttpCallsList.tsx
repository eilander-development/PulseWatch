import React, { useState } from "react";
import { Globe, Clock, FileCode, CheckCircle2, AlertTriangle, ShieldCheck, ArrowUpRight } from "lucide-react";
import { OutgoingHttpCall } from "../types";

interface OutgoingHttpCallsListProps {
  httpCalls?: OutgoingHttpCall[];
}

export const OutgoingHttpCallsList: React.FC<OutgoingHttpCallsListProps> = ({
  httpCalls
}) => {
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  const items = httpCalls || [];

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-purple-400" />
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Uitgaande HTTP-calls
          </h4>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
            {items.length} calls
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Alleen veilige URL, status en totale clientduur zijn momenteel meetbaar</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center text-xs font-mono text-slate-400">
          Geen uitgaande HTTP-calls geregistreerd in dit request.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((call) => {
            const isOk = call.status >= 200 && call.status < 300;
            const isExpanded = expandedCallId === call.id;

            return (
              <div
                key={call.id}
                onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition cursor-pointer space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {call.method}
                    </span>
                    <span className="text-xs font-mono font-bold text-white truncate max-w-md">
                      {call.url}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isOk
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      HTTP {call.status}
                    </span>
                    <span className="text-amber-300 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {call.duration_ms.toFixed(1)} ms
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-slate-500" />
                    <span>{call.origin_file}:{call.origin_line}</span>
                    {call.parent_context && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-300">{call.parent_context}</span>
                      </>
                    )}
                  </div>
                  <span className="text-slate-500">Klik voor details</span>
                </div>

                {isExpanded && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-xs font-mono text-slate-300 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold">Clientduur detail:</span>
                      <span className="text-amber-300 font-bold">{call.duration_ms} ms totale clientduur</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Guzzle / cURL adapter timing. Payload en headers gemaskeerd conform security-standaarden.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
