import React, { useState } from "react";
import {
  BookOpen,
  X,
  Check,
  Copy,
  Terminal,
  Code2,
  Globe,
  CheckCircle2
} from "lucide-react";

interface IntegrationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntegrationGuideModal: React.FC<IntegrationGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copySnippet = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const composerCommand = `composer require laravel/pulse laravel/telescope sentry/sentry-laravel`;

  const middlewareSnippet = `// app/Http/Middleware/PulseWatchTelemetryMiddleware.php
namespace App\\Http\\Middleware;

use Closure;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Http;

class PulseWatchTelemetryMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $startTime = microtime(true);
        $response = $next($request);
        $durationMs = round((microtime(true) - $startTime) * 1000);

        // Send async telemetry to PulseWatch:
        rescue(fn () => Http::timeout(0.5)->post(env('PULSEWATCH_URL') . '/api/telemetry/ingest', [
            'type' => 'request',
            'title' => $request->method() . ' ' . $request->path(),
            'durationMs' => $durationMs,
            'level' => $response->status() >= 500 ? 'error' : 'info',
            'metadata' => [
                'status' => $response->status(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'db_queries_count' => count(\\DB::getQueryLog()),
                'memory_peak_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 1),
            ]
        ]));

        return $response;
    }
}`;

  const exceptionSnippet = `// bootstrap/app.php (Laravel 11) or app/Exceptions/Handler.php:
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->report(function (Throwable $e) {
        Http::timeout(0.5)->post(env('PULSEWATCH_URL') . '/api/telemetry/ingest', [
            'type' => 'exception',
            'level' => 'critical',
            'title' => get_class($e) . ': ' . $e->getMessage(),
            'message' => $e->getMessage(),
            'metadata' => [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'exception_class' => get_class($e),
                'code_snippet' => [
                    ['line' => $e->getLine() - 1, 'code' => '...'],
                    ['line' => $e->getLine(), 'code' => '/* exception triggered here */', 'highlight' => true],
                    ['line' => $e->getLine() + 1, 'code' => '...'],
                ]
            ]
        ]);
    });
})`;

  const curlTest = `curl -X POST "${window.location.origin}/api/telemetry/ingest" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "exception",
    "level": "error",
    "title": "CustomException: User balance sync failed",
    "message": "Gateway timeout connecting to billing microservice",
    "metadata": {
      "file": "app/Services/BillingService.php",
      "line": 88
    }
  }'`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Laravel Integration Guide &amp; API Endpoint
              </h3>
              <p className="text-xs text-slate-400">
                Connect your real Laravel application or trigger telemetry directly via cURL.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs font-mono">
          {/* Step 1: Composer packages */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-rose-400" />
                1. Standard Laravel Packages (Optional)
              </span>
              <button
                onClick={() => copySnippet("composer", composerCommand)}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                {copiedKey === "composer" ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>Copy</span>
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
              {composerCommand}
            </div>
          </div>

          {/* Step 2: Ingestion endpoint */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-sky-400" />
                2. Live Ingestion Endpoint (cURL Test)
              </span>
              <button
                onClick={() => copySnippet("curl", curlTest)}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                {copiedKey === "curl" ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>Copy</span>
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto whitespace-pre">
              {curlTest}
            </div>
          </div>

          {/* Step 3: Laravel Middleware */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-emerald-400" />
                3. Laravel Middleware Telemetry Dispatcher
              </span>
              <button
                onClick={() => copySnippet("middleware", middlewareSnippet)}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                {copiedKey === "middleware" ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>Copy</span>
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300/90 overflow-x-auto whitespace-pre">
              {middlewareSnippet}
            </div>
          </div>

          {/* Step 4: Exception Reporting */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-amber-400" />
                4. Laravel Exception Reporting Hook
              </span>
              <button
                onClick={() => copySnippet("exception", exceptionSnippet)}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                {copiedKey === "exception" ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>Copy</span>
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-amber-300/90 overflow-x-auto whitespace-pre">
              {exceptionSnippet}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Endpoint ready to receive events
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
