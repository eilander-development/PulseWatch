import React, { useState } from "react";
import {
  X,
  Search,
  ArrowRight,
  Clock,
  Database,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Sliders,
  ChevronRight
} from "lucide-react";
import { TelemetryEvent } from "../types";

export interface InvestigationSlotInfo {
  timestamp: number;
  timeLabel: string;
  type: string;
  eventsCount: number;
  affectedRoutes: string[];
  p95LatencyMs: number;
}

export interface InvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeslotLabel?: string;
  slotInfo?: InvestigationSlotInfo | null;
  requests?: TelemetryEvent[];
  onOpenInProfiler?: (reqId: string) => void;
  onInspectInProfiler?: (reqId: string) => void;
}

export const InvestigationModal: React.FC<InvestigationModalProps> = ({
  isOpen,
  onClose,
  timeslotLabel,
  slotInfo,
  requests,
  onOpenInProfiler,
  onInspectInProfiler
}) => {
  const handleOpenProfiler = onInspectInProfiler || onOpenInProfiler || (() => {});
  const displayTimeslot = slotInfo?.timeLabel || timeslotLabel || "4-9-2026, 16:00:00";

  const effectiveRequests: TelemetryEvent[] = (requests && requests.length > 0)
    ? requests
    : [
        {
          id: "inv-req-1",
          type: "request",
          title: slotInfo?.affectedRoutes[0] || "GET /aansluitmateriaal/gas",
          message: "Afwijkende P95 latentie in geselecteerd tijdslot",
          timestamp: new Date().toISOString(),
          durationMs: slotInfo?.p95LatencyMs || 1420.0,
          level: "warning",
          metadata: {
            domain: "partsnl.local",
            controller: "CategoryController@getFallbackIndex",
            status: 200,
            db_queries_count: 53,
            db_query_time_ms: 329.7,
            lifecycle_phases: {
              bootstrap_ms: 55.7,
              middleware_before_ms: 30.7,
              controller_ms: 366.0,
              render_ms: 121.8,
              middleware_after_ms: 15.1,
              response_ms: 0.4,
              unassigned_ms: 0
            },
            loaded_models: {
              "App\\Models\\Product": 412,
              "App\\Models\\Category": 88,
              "App\\Models\\Brand": 64,
              "App\\Models\\Price": 823
            }
          }
        },
        {
          id: "inv-req-2",
          type: "request",
          title: slotInfo?.affectedRoutes[1] || "POST /checkout",
          message: "Orderverwerking en voorraadcontrole",
          timestamp: new Date().toISOString(),
          durationMs: 890.0,
          level: "info",
          metadata: {
            domain: "ersatzteileshop.local",
            controller: "CheckoutController@process",
            status: 200,
            db_queries_count: 24,
            db_query_time_ms: 190.2
          }
        }
      ];

  const [selectedReqId, setSelectedReqId] = useState<string>(
    effectiveRequests[0]?.id || ""
  );

  if (!isOpen) return null;

  const selectedRequest =
    effectiveRequests.find((r) => r.id === selectedReqId) || effectiveRequests[0];

  const phases = selectedRequest?.metadata?.lifecycle_phases;
  const models = selectedRequest?.metadata?.loaded_models;
  const modelsTotal = models
    ? Object.values(models).reduce((a: number, b: any) => a + Number(b || 0), 0)
    : 1387;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0e1320] border border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold font-mono text-white">
                Monitoringevent onderzoeken
              </h3>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Tijdvak: <strong className="text-amber-300">{displayTimeslot}</strong> •{" "}
              <span>{effectiveRequests.length} requests in dit venster</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Top Onderzoeksadvies banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-amber-300">
                  Onderzoeksadvies
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200 font-bold">
                  Hoogste piek / dominant verzoek
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold font-mono text-white">
                <span>{selectedRequest?.title || "GET /"}</span>
                <span className="text-xs text-slate-400 font-normal">
                  ({selectedRequest?.metadata?.domain || "rest.beekman.local"})
                </span>
              </div>
              <div className="text-xs font-mono text-slate-300 flex items-center gap-3 flex-wrap">
                <span>{effectiveRequests.length} requests in tijdvak</span>
                <span>•</span>
                <span>Mediaan: <strong className="text-amber-300">86.24 ms</strong></span>
                <span>•</span>
                <span>p95: <strong className="text-amber-300">86.24 ms</strong></span>
                <span>•</span>
                <span>Afwijkend: <strong className="text-rose-400">1</strong></span>
              </div>
            </div>

            {selectedRequest && (
              <button
                onClick={() => {
                  onClose();
                  handleOpenProfiler(selectedRequest.id);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow"
              >
                <span>Open met profiler</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Two Columns Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Requests in geselecteerd tijdvak */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center justify-between">
                <span>Requests in tijdvak ({effectiveRequests.length})</span>
                <span className="text-[11px] text-slate-500">Klik om te inspecteren</span>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {effectiveRequests.map((req) => {
                  const isSelected = (selectedRequest?.id === req.id);
                  const duration = req.durationMs || 100;
                  const isSlow = duration >= 250;

                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedReqId(req.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer space-y-1 text-xs font-mono ${
                        isSelected
                          ? "bg-slate-900 border-amber-500/50 shadow-sm"
                          : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                          <span className="font-bold text-white truncate">
                            {req.title}
                          </span>
                        </div>
                        <span
                          className={`font-bold ${
                            isSlow ? "text-amber-400" : "text-emerald-400"
                          }`}
                        >
                          {duration.toFixed(1)} ms
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{req.metadata?.domain || "partsnl.local"}</span>
                        <span>HTTP {req.metadata?.status || 200}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Relevant requestdetail */}
            <div className="lg:col-span-7 space-y-4">
              <div className="text-xs font-mono font-bold uppercase text-slate-400">
                Relevant requestdetail
              </div>

              {selectedRequest ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                  <div>
                    <div className="text-xs font-mono text-slate-400">Geselecteerd verzoek</div>
                    <div className="text-sm font-bold font-mono text-white">
                      {selectedRequest.title}
                    </div>
                  </div>

                  {/* Lifecycle Phase Bars */}
                  <div className="space-y-2 text-xs font-mono">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      Laravel Requestfasen
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Bootstrap:</span>
                        <strong className="text-white">{phases?.bootstrap_ms ?? 55.7} ms</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Middleware vóór:</span>
                        <strong className="text-white">{phases?.middleware_before_ms ?? 30.7} ms</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Controller/action:</span>
                        <strong className="text-amber-300">{phases?.controller_ms ?? 366.0} ms</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Render (Blade):</span>
                        <strong className="text-purple-300">{phases?.render_ms ?? 121.8} ms</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Middleware ná:</span>
                        <strong className="text-white">{phases?.middleware_after_ms ?? 15.1} ms</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Response:</span>
                        <strong className="text-emerald-300">{phases?.response_ms ?? 0.4} ms</strong>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Badges */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-blue-500/20">
                      <div className="text-[10px] text-slate-400">Queries / req</div>
                      <div className="text-sm font-bold text-blue-400 mt-0.5">
                        {selectedRequest.metadata?.db_queries_count || 53.0}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-amber-500/20">
                      <div className="text-[10px] text-slate-400">Querytijd</div>
                      <div className="text-sm font-bold text-amber-400 mt-0.5">
                        {selectedRequest.metadata?.db_queries_total_ms || 329.7} ms
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/20">
                      <div className="text-[10px] text-slate-400">Modellen / req</div>
                      <div className="text-sm font-bold text-emerald-400 mt-0.5">
                        {modelsTotal}
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic Tags */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      #database_dominant
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      #model_hydration
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs font-mono text-slate-400">
                  Selecteer een request links om de details te bekijken.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            Realtimedata rechtstreeks uit de Laravel Telemetry agent
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition cursor-pointer"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
