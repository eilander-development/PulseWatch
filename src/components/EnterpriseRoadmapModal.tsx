import React, { useState } from "react";
import {
  Shield,
  ShieldCheck,
  Lock,
  Database,
  Server,
  HardDrive,
  Zap,
  CheckCircle2,
  Clock,
  Sliders,
  Copy,
  Check,
  Layers,
  Network,
  Activity,
  ArrowRight,
  X,
  Sparkles,
  Cpu,
  Filter,
  Bell,
  Gauge,
  FileCheck
} from "lucide-react";

interface EnterpriseRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RoadmapTab =
  | "architecture"
  | "security"
  | "retention"
  | "sampling"
  | "alerting"
  | "checklist";

export const EnterpriseRoadmapModal: React.FC<EnterpriseRoadmapModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<RoadmapTab>("architecture");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Interactive checklist state
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    sec_token: true,
    sec_masking: true,
    sec_tls: false,
    sec_vpc: false,
    sampling_slow: true,
    sampling_error: true,
    sampling_adaptive: false,
    ret_hot: true,
    ret_pruning: false,
    ret_s3_archive: false,
    alert_slack: false,
    cb_circuit: true,
  });

  const toggleCheck = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalChecks = Object.keys(checklist).length;
  const completedChecks = Object.values(checklist).filter(Boolean).length;
  const readinessPercent = Math.round((completedChecks / totalChecks) * 100);

  const copySnippet = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!isOpen) return null;

  const sanitizeSnippet = `// app/Telemetry/Sanitizers/DataSanitizer.php
namespace App\\Telemetry\\Sanitizers;

class DataSanitizer
{
    protected static array $sensitiveKeys = [
        'password', 'password_confirmation', 'secret', 'token', 
        'api_key', 'authorization', 'bearer', 'cookie',
        'credit_card', 'cc_num', 'cvv', 'card_number', 'iban', 'bsn'
    ];

    public static function scrubArray(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = self::scrubArray($value);
            } elseif (self::isSensitiveKey((string)$key)) {
                $data[$key] = '[REDACTED_PII]';
            }
        }
        return $data;
    }

    public static function scrubSql(string $sql, array $bindings): array
    {
        // Vervang gevoelige parameters in INSERT/UPDATE statements
        $safeBindings = array_map(function ($binding, $idx) use ($sql) {
            if (is_string($binding) && strlen($binding) > 60 && !str_contains($sql, 'WHERE id')) {
                return '[MASKED_STRING]';
            }
            return is_scalar($binding) ? $binding : (string)$binding;
        }, $bindings, array_keys($bindings));

        return ['sql' => $sql, 'bindings' => $safeBindings];
    }

    protected static function isSensitiveKey(string $key): boolean
    {
        $normalized = strtolower(str_replace(['-', '_'], '', $key));
        foreach (self::$sensitiveKeys as $target) {
            if (str_contains($normalized, str_replace(['-', '_'], '', $target))) {
                return true;
            }
        }
        return false;
    }
}`;

  const tailSamplingSnippet = `// config/telemetry.php & app/Telemetry/SamplingEngine.php
namespace App\\Telemetry;

use Illuminate\\Http\\Request;
use Symfony\\Component\\HttpFoundation\\Response;

class SamplingEngine
{
    /**
     * Tail Sampling: Besluit pas ná afloop van het request of we de trace bewaren.
     * Dit zorgt ervoor dat 100% van alle fouten en trage verzoeken direct binnenkomen,
     * terwijl we voor reguliere 200 OK calls slechts 2% steekproef nemen.
     */
    public static function shouldSample(Request $request, Response $response, float $durationMs, int $queryCount): bool
    {
        // 1. Bewaar altijd 100% van de Exceptions en HTTP 5xx errors
        if ($response->getStatusCode() >= 500) {
            return true;
        }

        // 2. Bewaar altijd verzoeken die een N+1 query burst of trage SQL hebben
        if ($queryCount >= 25 || $durationMs >= (float)config('telemetry.slow_threshold_ms', 350)) {
            return true;
        }

        // 3. Forceer sampling via debug header voor developers (bijv. via browser extensie)
        if ($request->header('X-Telemetry-Force-Trace') === config('telemetry.developer_secret')) {
            return true;
        }

        // 4. Uniforme sampling voor normale snelle calls (bijv. 2% in productie)
        $sampleRate = (float)config('telemetry.normal_sample_rate', 0.02);
        return (mt_rand(1, 10000) / 10000) <= $sampleRate;
    }
}`;

  const retentionSqlSnippet = `-- retention-lifecycle-policy.sql
-- TimescaleDB / PostgreSQL geautomatiseerde retentie & rollups

-- 1. Maak 5-minuten geaggregeerde rollups aan voor lange-termijn trends
CREATE MATERIALIZED VIEW IF NOT EXISTS telemetry_5min_rollups
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('5 minutes', timestamp) AS bucket,
    domain,
    method,
    path,
    count(*) AS total_requests,
    percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms) AS p50_ms,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_ms,
    percentile_cont(0.99) WITHIN GROUP (ORDER BY duration_ms) AS p99_ms,
    count(CASE WHEN status_code >= 500 THEN 1 END) AS error_count,
    sum(query_count) AS total_queries
FROM telemetry_traces
GROUP BY bucket, domain, method, path;

-- 2. Automatische Data Retention Policies
-- Bewaar ruwe traces (groot) slechts 14 dagen in de hot storage
SELECT add_retention_policy('telemetry_traces', INTERVAL '14 days');

-- Bewaar geaggregeerde rollups (heel klein) 365 dagen voor SLA & jaarrapportages
SELECT add_retention_policy('telemetry_5min_rollups', INTERVAL '365 days');

-- 3. Nachtelijke vacuum / cleanup cron voor overige tabellen
DELETE FROM telemetry_dumps WHERE created_at < NOW() - INTERVAL '7 days';
DELETE FROM telemetry_query_hotspots WHERE last_seen < NOW() - INTERVAL '30 days';`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-[#1e293b] bg-[#0c111e] text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#182338] bg-[#080d18] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-600/20 border border-indigo-500/40 text-indigo-400 shadow-lg shadow-indigo-950/30">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Pro &amp; Enterprise Roadmap</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono font-medium">
                    Production Migration Guide
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Architectuur, security compliance, retentiestrategieën en sampling voor schaalvergroting naar live systemen
              </p>
            </div>
          </div>

          {/* Readiness gauge & Close button */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111827] border border-[#1f293d] text-xs font-mono">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Prod Readiness:</span>
              <span
                className={`font-bold ${
                  readinessPercent >= 75
                    ? "text-emerald-400"
                    : readinessPercent >= 50
                    ? "text-amber-400"
                    : "text-rose-400"
                }`}
              >
                {readinessPercent}%
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-[#182338] bg-[#0a0f1c] overflow-x-auto text-xs font-medium scrollbar-thin">
          {[
            { id: "architecture", label: "1. Architectuur & Schaalbaarheid", icon: Network },
            { id: "security", label: "2. Security & GDPR Maskering", icon: Lock },
            { id: "retention", label: "3. Retentie & Opslag (Hot/Cold)", icon: HardDrive },
            { id: "sampling", label: "4. Tail & Adaptive Sampling", icon: Filter },
            { id: "alerting", label: "5. Alerting & SLA/SLO", icon: Bell },
            { id: "checklist", label: "6. Interactieve Checklist", icon: FileCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as RoadmapTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-indigo-600/25 border border-indigo-500/40 text-indigo-200 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#090d18]">
          {/* TAB 1: Architecture */}
          {activeTab === "architecture" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0f1626] border border-[#1b253b]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1.5">
                  <Network className="w-4 h-4 text-indigo-400" />
                  <span>Van Lokale Docker naar Enterprise Telemetrie Stack</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  In lokale ontwikkeling draait de APM container op dezelfde machine via poort 3000. In een enterprise productieomgeving ontkoppel je de dataverzameling van de opslag via een **Message Broker** en dedicated **Time-Series Database**.
                </p>
              </div>

              {/* Visual Pipeline Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {/* Local Dev Pipeline */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-blue-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Lokale Dev Pipeline
                    </span>
                    <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-800">Huidige Setup</span>
                  </div>
                  <div className="space-y-2 text-slate-300">
                    <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800 flex items-center justify-between">
                      <span>Laravel App (PHP 8.3)</span>
                      <span className="text-[10px] text-emerald-400">100% traces</span>
                    </div>
                    <div className="flex justify-center text-slate-600">↓ app()-&gt;terminating()</div>
                    <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800 flex items-center justify-between">
                      <span>Single Docker Container (Port 3000)</span>
                      <span className="text-[10px] text-blue-400">Node/SSE</span>
                    </div>
                    <div className="flex justify-center text-slate-600">↓ In-Memory Array (Max 500)</div>
                    <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800">
                      <span>Web Dashboard (Realtime SSE)</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Ideaal voor zero-config development: geen database configuratie nodig, direct live inspectie.
                  </p>
                </div>

                {/* Production Enterprise Pipeline */}
                <div className="p-4 rounded-xl bg-[#0f172a]/90 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                    <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      Production Enterprise Pipeline
                    </span>
                    <span className="text-[10px] text-indigo-300 px-2 py-0.5 rounded bg-indigo-500/20 font-bold">Schaalbaar</span>
                  </div>
                  <div className="space-y-2 text-slate-300">
                    <div className="p-2.5 rounded-lg bg-[#080d1a] border border-indigo-500/20 flex items-center justify-between">
                      <span>Web Cluster (5-50 PHP Nodes)</span>
                      <span className="text-[10px] text-teal-400">Tail Sampling</span>
                    </div>
                    <div className="flex justify-center text-indigo-500">↓ Redis Stream / Kafka (Buffer)</div>
                    <div className="p-2.5 rounded-lg bg-[#080d1a] border border-indigo-500/20 flex items-center justify-between">
                      <span>Telemetry Ingest Daemon (Go / Rust / Node)</span>
                      <span className="text-[10px] text-indigo-400">Batch Writer</span>
                    </div>
                    <div className="flex justify-center text-indigo-500">↓ Parquet / TimescaleDB / ClickHouse</div>
                    <div className="p-2.5 rounded-lg bg-[#080d1a] border border-indigo-500/20">
                      <span>APM Cluster + S3 Cold Storage Archive</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Kan miljoenen requests/uur aan zonder merkbare belasting op de PHP workers en bezoekerstijden.
                  </p>
                </div>
              </div>

              {/* Core Tenets */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#0e1424] border border-[#1b253b] space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-blue-400" />
                    <span>Zero Overhead Garantie</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    PHP zendt telemetrie pas nadat <code>fastcgi_finish_request()</code> is aangeroepen. De bezoeker merkt 0,0ms vertraging.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0e1424] border border-[#1b253b] space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>Circuit Breaker</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Als de collector down is of time-outs vertoont, schakelt de Laravel probe zichzelf direct 60 seconden uit om resources te sparen.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0e1424] border border-[#1b253b] space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Multi-Domein Isolatie</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Traces van verschillende domeinen (bijv. <code>partsnl.nl</code> vs. <code>backoffice.intranet</code>) blijven strikt gescheiden met eigen quota.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Security & GDPR */}
          {activeTab === "security" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span>Security, PII Maskering &amp; GDPR Compliance</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Voorkom dat wachtwoorden, tokens, creditcardnummers of persoonsgegevens ongemerkt in telemetrie traces belanden.
                  </p>
                </div>

                <button
                  onClick={() => copySnippet("sanitizer", sanitizeSnippet)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedKey === "sanitizer" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "sanitizer" ? "Gekopieerd!" : "Kopieer DataSanitizer.php"}</span>
                </button>
              </div>

              {/* 4 Security Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#0e1424] border border-[#1b253b] space-y-1.5">
                  <div className="font-bold text-rose-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-rose-400" />
                    <span>1. In-Memory Binding Scrubbing</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    SQL bindings voor kolommen zoals <code>password</code>, <code>api_token</code> of <code>credit_card</code> worden in PHP direct vervangen door <code>[REDACTED]</code> vóórdat de JSON payload geconstrueerd wordt.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0e1424] border border-[#1b253b] space-y-1.5">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <span>2. Agent Token Authenticatie (Bearer / mTLS)</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Stel een sterke <code>PROFILER_INGEST_SECRET</code> in. De collector weigert elk request zonder geldige cryptografische SHA256 handtekening of Bearer token.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0e1424] border border-[#1b253b] space-y-1.5">
                  <div className="font-bold text-blue-300 flex items-center gap-1.5">
                    <Network className="w-4 h-4 text-blue-400" />
                    <span>3. Netwerk Isolatie (Geen Publieke Poort)</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    De collector draait binnen een intern VPC of Kubernetes overlay netwerk. Poort 3000 is nooit publiek bereikbaar vanaf het internet; alleen interne webservers kunnen telemetrie posten.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0e1424] border border-[#1b253b] space-y-1.5">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>4. RBAC &amp; Audit Trail</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Beperk toegang tot het dashboard via SSO (SAML/OAuth). Wie kijkt naar productie dumps en query traces wordt geregistreerd in een onwijzigbare audit log.
                  </p>
                </div>
              </div>

              {/* Code Snippet */}
              <div className="p-4 rounded-xl border border-[#182338] bg-[#070b14]">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2 pb-1 border-b border-slate-800">
                  <span>PHP Data Sanitizer voor Eloquent &amp; HTTP Payloads</span>
                  <span className="text-[10px] text-emerald-400">GDPR Compliant</span>
                </div>
                <pre className="text-xs font-mono text-slate-300 overflow-x-auto max-h-[280px] leading-relaxed">
                  {sanitizeSnippet}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: Data Retention */}
          {activeTab === "retention" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-teal-400" />
                    <span>Gelaagde Data Retentiestrategie (Hot, Warm, Cold)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Houd opslagkosten laag en querytijden snel door ruwe telemetrie automatisch te verkleinen en archiveren.
                  </p>
                </div>

                <button
                  onClick={() => copySnippet("retention", retentionSqlSnippet)}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedKey === "retention" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "retention" ? "Gekopieerd!" : "Kopieer Retention SQL"}</span>
                </button>
              </div>

              {/* 3 Tier Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Hot Storage */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 font-mono">Hot Tier (0-7 Dagen)</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">SSD / RAM</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    100% detailniveau. Bevat alle losse SQL queries met herkomstregels, gehydrateerde modellen, stacktraces en dumps.
                  </p>
                  <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                    <div>• Instant waterval inspectie</div>
                    <div>• Exacte query hashes</div>
                    <div>• Maximaal 7 tot 14 dagen</div>
                  </div>
                </div>

                {/* Warm Storage */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-blue-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-400 font-mono">Warm Tier (8-90 Dagen)</span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px]">Rollups</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Geaggregeerde 1- en 5-minuten statistieken: p50/p95/p99 responstijden, aantal verzoeken, foutpercentages per route.
                  </p>
                  <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                    <div>• Responstijd trends over tijd</div>
                    <div>• Snelheidsvergelijkingen releases</div>
                    <div>• 95% reductie in opslaggrootte</div>
                  </div>
                </div>

                {/* Cold Storage */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-purple-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-400 font-mono">Cold Tier (91-365+ Dagen)</span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px]">S3 / GCS</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Gecomprimeerde Parquet of DuckDB bestanden op goedkope cloud object storage voor audits en jaarlijkse SLA compliance.
                  </p>
                  <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                    <div>• Zeer lage kosten (&lt; €0,02/GB)</div>
                    <div>• Opvraagbaar via Athena / BigQuery</div>
                    <div>• Voldoet aan ISO 27001 normen</div>
                  </div>
                </div>
              </div>

              {/* Database Lifecycle Script */}
              <div className="p-4 rounded-xl border border-[#182338] bg-[#070b14]">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2 pb-1 border-b border-slate-800">
                  <span>SQL Retentie &amp; Continuous Rollup Policies (PostgreSQL / TimescaleDB)</span>
                  <span className="text-[10px] text-teal-400">Automatische Cleanup</span>
                </div>
                <pre className="text-xs font-mono text-slate-300 overflow-x-auto max-h-[260px] leading-relaxed">
                  {retentionSqlSnippet}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: Tail Sampling */}
          {activeTab === "sampling" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                    <Filter className="w-4 h-4 text-amber-400" />
                    <span>Tail Sampling &amp; Adaptive Rate Limiting</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Vang 100% van alle afwijkingen (traagheid, crashes, N+1 queries) zonder je collector te overspoelen met triviale snelle requests.
                  </p>
                </div>

                <button
                  onClick={() => copySnippet("sampling", tailSamplingSnippet)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedKey === "sampling" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "sampling" ? "Gekopieerd!" : "Kopieer SamplingEngine.php"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                  <h4 className="font-bold text-amber-300 font-mono flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Het verschil tussen Head en Tail Sampling</span>
                  </h4>
                  <p className="text-slate-300 leading-relaxed text-[12px]">
                    <strong>Head Sampling (Ouderwets):</strong> Besluit bij binnenkomst van het verzoek al of het gelogd wordt. Nadeel: als een zeldzame crash of N+1 query optreedt bij een niet-gesampled verzoek, ben je de data kwijt!
                  </p>
                  <p className="text-slate-300 leading-relaxed text-[12px]">
                    <strong>Tail Sampling (Modern):</strong> Laravel meet het request lokaal in het geheugen. Zodra het request klaar is, controleert de <code>SamplingEngine</code>:
                  </p>
                  <ul className="list-disc list-inside text-slate-400 space-y-1 font-mono text-[11px]">
                    <li>Was er een 500 error of Exception? ➔ <strong className="text-emerald-400">Altijd loggen</strong></li>
                    <li>Duurde het &gt; 350ms of &gt; 25 SQL queries? ➔ <strong className="text-emerald-400">Altijd loggen</strong></li>
                    <li>Was het een supersnelle 12ms pagina? ➔ <span className="text-slate-400">Steekproef 2%</span></li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                  <h4 className="font-bold text-blue-300 font-mono flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    <span>Aanbevolen Productie Configuraties</span>
                  </h4>
                  <div className="space-y-2 text-[11px] font-mono">
                    <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">Fout &amp; Crash Capture Rate</span>
                      <span className="text-emerald-400 font-bold">100% (Vast)</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">Slow Request Drempel</span>
                      <span className="text-amber-400 font-bold">&gt; 350ms</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">N+1 Query Drempel</span>
                      <span className="text-rose-400 font-bold">&gt; 20 queries / request</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">Reguliere 200 OK Steekproef</span>
                      <span className="text-blue-400 font-bold">1% tot 5%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Code Snippet */}
              <div className="p-4 rounded-xl border border-[#182338] bg-[#070b14]">
                <pre className="text-xs font-mono text-slate-300 overflow-x-auto max-h-[260px] leading-relaxed">
                  {tailSamplingSnippet}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 5: Alerting & SLA/SLO */}
          {activeTab === "alerting" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0f1626] border border-[#1b253b]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                  <Bell className="w-4 h-4 text-blue-400" />
                  <span>SLA, Service Level Objectives (SLO) &amp; Alert Routing</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Voorkom alert fatigue door alleen te notificeren bij structurele degradatie of burn-rates van je uptime-budget.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                    <Activity className="w-4 h-4" />
                    P95 Responstijd Budget
                  </span>
                  <p className="text-slate-400 text-[11px]">
                    Doel: 95% van alle e-commerce requests op bijv. <code>partsnl.nl</code> worden binnen 300ms afgehandeld.
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono pt-1">
                    Alert trigger: P95 &gt; 450ms over een venster van 10 minuten.
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="font-bold text-rose-400 font-mono flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    Error Budget (99.9% Uptime)
                  </span>
                  <p className="text-slate-400 text-[11px]">
                    Toegestaan: maximaal 1 op de 1.000 requests mag een 500 error geven.
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono pt-1">
                    Alert trigger: &gt; 15 exceptions per minuut of burn-rate 14.4x.
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="font-bold text-amber-400 font-mono flex items-center gap-1.5">
                    <Database className="w-4 h-4" />
                    Database N+1 Hotspot Alert
                  </span>
                  <p className="text-slate-400 text-[11px]">
                    Detecteert direct nieuwe pull requests of migraties die onbedoeld duplicate queries introduceren.
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono pt-1">
                    Alert trigger: Query count &gt; 50 op een voorheen snelle route.
                  </div>
                </div>
              </div>

              {/* Alert Destinations */}
              <div className="p-4 rounded-xl bg-[#0e1424] border border-[#1b253d] space-y-3">
                <span className="font-bold text-white text-xs font-mono">Ondersteunde Notificatie Kanalen</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Slack Webhook</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>PagerDuty</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span>MS Teams</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Custom Webhook</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Interactive Checklist */}
          {activeTab === "checklist" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#0f172a] border border-indigo-500/30">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>Productie Gereedheidscontrole</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Vink de stappen aan die binnen jouw infrastructuur zijn ingericht om je readiness-score te berekenen.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-mono text-emerald-400">{readinessPercent}%</span>
                  <span className="block text-[10px] font-mono text-slate-400">{completedChecks} van {totalChecks} voltooid</span>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  {
                    category: "Security & GDPR",
                    items: [
                      { id: "sec_token", label: "Agent Ingest Secret ingesteld (geen anonieme data)" },
                      { id: "sec_masking", label: "Wachtwoorden, tokens en creditcards gemaskeerd via DataSanitizer" },
                      { id: "sec_tls", label: "TLS / HTTPS encryptie tussen PHP servers en de APM collector" },
                      { id: "sec_vpc", label: "APM poort afgesloten van het publieke internet (VPC/Private Network)" },
                    ],
                  },
                  {
                    category: "Sampling & Snelheid",
                    items: [
                      { id: "sampling_slow", label: "Slow request drempel ingesteld (bijv. > 350ms)" },
                      { id: "sampling_error", label: "100% van alle 5xx errors & exceptions worden bewaard" },
                      { id: "sampling_adaptive", label: "Tail sampling ingeschakeld voor snelle 200 OK calls (1-5%)" },
                      { id: "cb_circuit", label: "Circuit breaker actief: PHP faalt nooit als APM offline is" },
                    ],
                  },
                  {
                    category: "Retentie & Lifecycle",
                    items: [
                      { id: "ret_hot", label: "Hot storage geconfigureerd voor 7 tot 14 dagen detail traces" },
                      { id: "ret_pruning", label: "Automatische cleanup cron / SQL retention policy actief" },
                      { id: "ret_s3_archive", label: "Gearchiveerde rollups geëxporteerd naar cloud object storage (S3/GCS)" },
                      { id: "alert_slack", label: "Slack / PagerDuty webhook gekoppeld voor P95 & error alerts" },
                    ],
                  },
                ].map((group) => (
                  <div key={group.category} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <span className="text-xs font-mono font-bold text-indigo-300 block">{group.category}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {group.items.map((item) => {
                        const isChecked = !!checklist[item.id];
                        return (
                          <button
                            key={item.id}
                            onClick={() => toggleCheck(item.id)}
                            className={`flex items-start gap-2 p-2 rounded-lg border text-left transition cursor-pointer ${
                              isChecked
                                ? "bg-emerald-950/20 border-emerald-500/40 text-slate-200"
                                : "bg-[#070b14] border-slate-800 text-slate-400 hover:text-slate-300"
                            }`}
                          >
                            <span
                              className={`mt-0.5 flex items-center justify-center w-4 h-4 rounded border shrink-0 transition ${
                                isChecked
                                  ? "bg-emerald-500 border-emerald-400 text-slate-950"
                                  : "border-slate-700 bg-slate-950"
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span className="text-[11px] leading-tight">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#182338] bg-[#080d18] flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Klaar voor productie-migratie</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer font-sans text-xs font-semibold"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
