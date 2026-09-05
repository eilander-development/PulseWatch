import React, { useState } from "react";
import {
  Layers,
  CheckCircle2,
  AlertOctagon,
  RotateCw,
  Clock,
  Server,
  Play,
  Check,
  AlertTriangle,
  BookOpen
} from "lucide-react";
import { TelemetryEvent } from "../types";
import { findRecipeForEvent, LaravelFixRecipe } from "../data/laravelRecipes";

interface JobsViewProps {
  events: TelemetryEvent[];
  onOpenRecipe?: (recipe: LaravelFixRecipe) => void;
}

export const JobsView: React.FC<JobsViewProps> = ({ events, onOpenRecipe }) => {
  const [retriedJobs, setRetriedJobs] = useState<Record<string, boolean>>({});

  const jobEvents = events.filter((e) => e.type === "job");

  const handleRetry = (jobId: string) => {
    setRetriedJobs((prev) => ({ ...prev, [jobId]: true }));
    setTimeout(() => {
      // simulate success
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Horizon Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-mono text-slate-400 block mb-1">Queue Workers</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">8 Active</span>
            <span className="text-xs text-emerald-400 font-mono">daemons</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">
            Default, High, Webhooks queues
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-mono text-slate-400 block mb-1">Backlog Depth</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">14 Jobs</span>
            <span className="text-xs text-slate-400 font-mono">pending</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
            Wait time &lt; 1.2s
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-mono text-slate-400 block mb-1">Throughput</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">412</span>
            <span className="text-xs text-slate-400 font-mono">jobs/min</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">
            Avg runtime: 85ms
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-mono text-slate-400 block mb-1">Failed Jobs</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-400">{jobEvents.length}</span>
            <span className="text-xs text-rose-400/80 font-mono">exceptions</span>
          </div>
          <span className="text-[11px] text-rose-400 font-mono mt-1 block">
            Requires retry or fix
          </span>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Horizon &amp; Pulse Background Jobs Telemetry</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              Real-time Queue Monitor
            </span>
          </h3>
        </div>

        {jobEvents.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-medium text-slate-200">All queues running cleanly</p>
            <p className="text-xs mt-1 text-slate-400">No failed background jobs or worker crashes detected.</p>
          </div>
        ) : (
          jobEvents.map((job) => {
            const isRetried = retriedJobs[job.id];

            return (
              <div
                key={job.id}
                className="p-5 rounded-xl border border-slate-800 bg-slate-900/90 shadow-md transition-all hover:border-slate-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                      FAILED JOB
                    </span>

                    <span className="text-xs font-mono text-purple-300 bg-purple-950/40 px-2.5 py-0.5 rounded border border-purple-800/40 font-semibold">
                      Queue: {job.metadata.queue || "default"}
                    </span>

                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Runtime: {job.durationMs ? `${(job.durationMs / 1000).toFixed(1)}s` : "0.8s"}
                    </span>

                    <span className="text-xs font-mono text-slate-400">
                      Attempts: {job.metadata.attempts || 3} / {job.metadata.max_tries || 3}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {(() => {
                      const matchedRecipe = findRecipeForEvent(
                        job.title + " " + (job.message || "")
                      );
                      if (!matchedRecipe || !onOpenRecipe) return null;
                      return (
                        <button
                          onClick={() => onOpenRecipe(matchedRecipe)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all cursor-pointer"
                          title="Bekijk beproefd Laravel Queue recept (gratis / 0 tokens)"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Laravel Recept</span>
                        </button>
                      );
                    })()}

                    <button
                      disabled={isRetried}
                      onClick={() => handleRetry(job.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        isRetried
                          ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                          : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                      }`}
                    >
                      {isRetried ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Pushed to Queue</span>
                        </>
                      ) : (
                        <>
                          <RotateCw className="w-3.5 h-3.5 text-slate-400" />
                          <span>Retry Job</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-white mb-1">
                  {job.title}
                </h4>

                {job.message && (
                  <p className="text-xs text-rose-300/90 font-mono mt-2 p-2.5 rounded bg-rose-950/20 border border-rose-900/30 break-words">
                    {job.message}
                  </p>
                )}

                {/* Job Payload & Exception Location */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  {job.metadata.payload && (
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase mb-1">
                        Serialized Job Payload:
                      </span>
                      <pre className="text-slate-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(job.metadata.payload, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase mb-1">
                        Exception Origin:
                      </span>
                      <p className="text-slate-200 text-xs">
                        {job.metadata.exception_file || "app/Jobs/" + (job.metadata.job_class || "Job.php")}
                      </p>
                    </div>
                    <div className="mt-2 text-[11px] text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      Automatic backoff policy exhausted
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
