import React, { useState } from "react";
import {
  ShieldCheck,
  Activity,
  Server,
  Database,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  BellRing,
  Sliders,
  Terminal,
  Clock,
  Radio,
  FileBox,
  Globe
} from "lucide-react";
import { SentinelCheck } from "../types";

export const NightwatchSentinelView: React.FC = () => {
  const [isRunningProbe, setIsRunningProbe] = useState(false);
  const [lastProbeTime, setLastProbeTime] = useState("Zojuist");
  const [probeSuccessToast, setProbeSuccessToast] = useState(false);

  // Alarm Rules & Thresholds state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [latencyThreshold, setLatencyThreshold] = useState(500);
  const [errorRateThreshold, setErrorRateThreshold] = useState(1.5);
  const [maxQueriesThreshold, setMaxQueriesThreshold] = useState(25);
  const [httpTimeoutThreshold, setHttpTimeoutThreshold] = useState(1000);
  const [webhookUrl, setWebhookUrl] = useState("https://hooks.slack.com/services/T000/B000/devstack-alerts");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testNotificationStatus, setTestNotificationStatus] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState(false);

  const [checks, setChecks] = useState<SentinelCheck[]>([
    {
      id: "check-collector",
      name: "DevStack Go Collector (:2409 UDP / :8080 HTTP)",
      category: "redis",
      status: "healthy",
      value: "Actief & Luisterend",
      latency_ms: 0.4,
      last_checked: "Zojuist",
      details: "UDP packet buffer 60 KiB actief. 0 sequence gaps, 0 duplicates gedetecteerd."
    },
    {
      id: "check-queue-worker",
      name: "Queue Worker Context (JobProcessing / JobProcessed)",
      category: "workers",
      status: "healthy",
      value: "Isolated Control Context",
      latency_ms: 1.8,
      last_checked: "15s geleden",
      details: "Workers keren netjes terug naar control-context. Geen geheugenlekken over jobs heen."
    },
    {
      id: "check-scheduler",
      name: "Task Scheduler Lifecycle (Console Schedule)",
      category: "system",
      status: "healthy",
      value: "Actief (Exit 200 / Skip 204)",
      latency_ms: 2.1,
      last_checked: "1m geleden",
      details: "ScheduledTaskStarting en ScheduledTaskFinished hooks registreren correct."
    },
    {
      id: "check-spool",
      name: "Profiler File Spool (inbox/*.json)",
      category: "storage",
      status: "healthy",
      value: "0 / 5000 spool files",
      latency_ms: 0.9,
      last_checked: "Zojuist",
      details: "Spool inbox directory operationeel met atomic rename (.tmp -> .json). Geen packet drops."
    },
    {
      id: "check-http-gateway",
      name: "Externe HTTP Client Calls (Outgoing Guzzle / cURL)",
      category: "webhooks",
      status: "warning",
      value: "P95 latency 840ms",
      latency_ms: 840,
      last_checked: "Zojuist",
      details: "Enkele uitschieter geregistreerd op https://rest.beekman.local/v1/stock/bulk-check."
    },
    {
      id: "check-artisan",
      name: "Artisan CLI Context (CommandStarting / Finished)",
      category: "database",
      status: "healthy",
      value: "Geïsoleerde Executie",
      latency_ms: 3.2,
      last_checked: "2m geleden",
      details: "Artisan commando's worden geregistreerd met exit-codes en geheugenverbruik."
    }
  ]);

  const handleRunProbe = () => {
    setIsRunningProbe(true);
    setProbeSuccessToast(false);

    setTimeout(() => {
      setIsRunningProbe(false);
      setLastProbeTime("Zojuist");
      setProbeSuccessToast(true);

      setChecks((prev) =>
        prev.map((c) => ({
          ...c,
          latency_ms: Number((Math.random() * 2 + 0.3).toFixed(1)),
          last_checked: "Zojuist"
        }))
      );

      setTimeout(() => setProbeSuccessToast(false), 4000);
    }, 800);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedStatus(true);
    setTimeout(() => {
      setSavedStatus(false);
      setIsConfigOpen(false);
    }, 1200);
  };

  const handleSendTestAlert = () => {
    setIsSendingTest(true);
    setTestNotificationStatus(null);
    setTimeout(() => {
      setIsSendingTest(false);
      setTestNotificationStatus("Test alert succesvol verzonden!");
      setTimeout(() => setTestNotificationStatus(null), 3500);
    }, 900);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner: DevStack Daemon & Ingest Status */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0c1222] via-[#0f172a] to-[#09101f] border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                DevStack Runtime Daemons &amp; Collector Watchdog
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                6/6 Services Operationeel
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Realtime verificatie van de lokale Go UDP collector (:2409), Spool inbox buffers en Laravel achtergrond-contexten (Queue workers, Scheduler en Artisan).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium border border-slate-700 transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Drempelwaarden &amp; Alerts</span>
          </button>

          <button
            onClick={handleRunProbe}
            disabled={isRunningProbe}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningProbe ? "animate-spin" : ""}`} />
            <span>{isRunningProbe ? "Verifiëren..." : "Nu Peilen"}</span>
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {probeSuccessToast && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Alle runtime-hooks en collector endpoints reageren binnen 0.4 - 3.2ms.</span>
        </div>
      )}

      {/* Configuration & Thresholds Panel */}
      {isConfigOpen && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white font-mono">
                Observability Alarmregels &amp; Afwijkingsdrempels
              </h3>
            </div>
            <span className="text-xs text-slate-400">Wordt lokaal toegepast op alle inkomende samples</span>
          </div>

          <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                P95 Latency Alarm (ms)
              </label>
              <input
                type="number"
                value={latencyThreshold}
                onChange={(e) => setLatencyThreshold(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Error Rate Drempelwaarde (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={errorRateThreshold}
                onChange={(e) => setErrorRateThreshold(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Max Queries per Request (N+1)
              </label>
              <input
                type="number"
                value={maxQueriesThreshold}
                onChange={(e) => setMaxQueriesThreshold(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Outgoing HTTP Timeout (ms)
              </label>
              <input
                type="number"
                value={httpTimeoutThreshold}
                onChange={(e) => setHttpTimeoutThreshold(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Notificatie Webhook (Slack / Discord / Teams)
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleSendTestAlert}
                disabled={isSendingTest}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition cursor-pointer"
              >
                {isSendingTest ? "Versturen..." : "Test Notificatie"}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold transition cursor-pointer"
              >
                {savedStatus ? "Opgeslagen!" : "Opslaan"}
              </button>
            </div>
          </form>

          {testNotificationStatus && (
            <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/40 text-blue-300 text-xs font-mono">
              {testNotificationStatus}
            </div>
          )}
        </div>
      )}

      {/* Grid of Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {checks.map((check) => {
          const isHealthy = check.status === "healthy";
          return (
            <div
              key={check.id}
              className="p-4 rounded-2xl bg-[#090d16] border border-slate-800/80 hover:border-slate-700 transition shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded-xl ${
                      isHealthy
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {check.category === "workers" ? (
                      <Cpu className="w-4 h-4" />
                    ) : check.category === "storage" ? (
                      <FileBox className="w-4 h-4" />
                    ) : check.category === "webhooks" ? (
                      <Globe className="w-4 h-4" />
                    ) : check.category === "system" ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <Server className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">
                      {check.name}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">
                      Gepeild: {check.last_checked}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                    isHealthy
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {check.status}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">Statuswaarde</span>
                  <span className="text-xs font-mono font-bold text-slate-200">{check.value}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block">Latentie</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">{check.latency_ms}ms</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                {check.details}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
