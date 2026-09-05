import React, { useState } from "react";
import {
  FolderGit2,
  X,
  Check,
  Copy,
  Terminal,
  Code2,
  Cpu,
  Zap,
  Plus,
  Server,
  FileCode,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  Database
} from "lucide-react";
import { Project } from "../types";

interface ProjectsAndAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onAddProject?: (project: { name: string; slug: string; domains: string[]; environment: "production" | "staging" | "local" }) => void;
  onOpenEnterpriseRoadmap?: () => void;
}

export const ProjectsAndAgentModal: React.FC<ProjectsAndAgentModalProps> = ({
  isOpen,
  onClose,
  projects,
  onAddProject
}) => {
  const [activeTab, setActiveTab] = useState<
    "projects" | "service-spec" | "codex-prompt" | "contract"
  >("codex-prompt");

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form state for adding project
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjSlug, setNewProjSlug] = useState("");
  const [newProjDomains, setNewProjDomains] = useState("");
  const [newProjEnv, setNewProjEnv] = useState<"production" | "staging" | "local">("production");

  if (!isOpen) return null;

  const copySnippet = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName || !newProjSlug) return;

    const domainList = newProjDomains
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);

    if (onAddProject) {
      onAddProject({
        name: newProjName,
        slug: newProjSlug.toLowerCase().replace(/\s+/g, "-"),
        domains: domainList.length > 0 ? domainList : [`${newProjSlug}.local`],
        environment: newProjEnv
      });
    }

    setNewProjName("");
    setNewProjSlug("");
    setNewProjDomains("");
    setIsAddingProject(false);
  };

  // Snelle in-process service voorbeeld (GEEN HTTP:: POST!)
  const serviceUsageSnippet = `<?php

namespace App\\Services;

use DevStack\\Profiler\\Facades\\Profiler;
use DevStack\\Profiler\\AgentContext;

/**
 * VOORBEELD: Echte, snelle in-memory functies binnen je Laravel applicatie.
 * Géén HTTP:: requests, geen netwerk I/O tijdens je business logic.
 * Alles wordt in-memory geaccumuleerd en pas bij shutdown via non-blocking UDP verzonden.
 */
class CheckoutService
{
    public function processOrder(int $orderId): OrderResult
    {
        // 1. Voeg een snelle breadcrumb toe aan de incident-ringbuffer (max 15 items in RAM)
        Profiler::breadcrumb('order', "Start orderverwerking voor order #{$orderId}");

        // 2. Koppel een veilige gebruikersidentifier
        if ($user = auth()->user()) {
            Profiler::auth($user->getAuthIdentifier(), 'web');
        }

        // 3. Meet zware interne algoritmes (in-memory microtime + geheugendelta)
        $discount = Profiler::measure('staffelkorting_berekening', function () use ($orderId) {
            return $this->calculateVolumeDiscounts($orderId);
        });

        // 4. Optioneel handmatig markeren van een specifieke pipeline-fase
        AgentContext::mark('payment_gateway_ready');

        return new OrderResult($discount);
    }
}`;

  const profilerFacadeSnippet = `<?php

declare(strict_types=1);

namespace DevStack\\Profiler\\Facades;

/**
 * Lichtgewicht in-memory façade voor directe applicatie-aanroepen.
 * Zero-blocking, fail-open.
 */
final class Profiler
{
    /**
     * Meet executietijd en RAM-delta van een callable zonder I/O.
     */
    public static function measure(string $label, callable $callback): mixed
    {
        $start = hrtime(true);
        $memStart = memory_get_usage();

        try {
            return $callback();
        } finally {
            $durationMs = round((hrtime(true) - $start) / 1_000_000, 2);
            $memDelta = memory_get_usage() - $memStart;

            self::breadcrumb('measure', "{$label} [{$durationMs}ms]", [
                'duration_ms' => $durationMs,
                'memory_delta_bytes' => $memDelta,
            ]);
        }
    }

    /**
     * Voegt een chronologische breadcrumb toe aan de in-memory ringbuffer (max 15).
     */
    public static function breadcrumb(string $category, string $message, array $context = []): void
    {
        if (!isset($GLOBALS['__devstack_profiler_context']['breadcrumbs'])) {
            $GLOBALS['__devstack_profiler_context']['breadcrumbs'] = [];
        }

        $now = hrtime(true);
        $started = (int) ($GLOBALS['__devstack_profiler_context']['started_ns'] ?? $now);
        $offsetMs = max(0, round(($now - $started) / 1_000_000, 1));

        $buffer = &$GLOBALS['__devstack_profiler_context']['breadcrumbs'];
        if (count($buffer) >= 15) {
            array_shift($buffer); // FIFO ringbuffer
        }

        $buffer[] = [
            'category' => $category,
            'message' => mb_substr($message, 0, 200),
            'offset_ms' => $offsetMs,
        ];
    }

    /**
     * Registreert veilige authenticatie-context (nooit wachtwoorden of PII).
     */
    public static function auth(int|string $userId, string $guard = 'web'): void
    {
        if (isset($GLOBALS['__devstack_profiler_context'])) {
            $GLOBALS['__devstack_profiler_context']['laravel']['auth'] = [
                'id' => $userId,
                'guard' => $guard,
            ];
        }
    }
}`;

  // De complete prompt voor Codex
  const codexPromptText = `# Codex Opdracht: Bouw de DevStack Laravel Agent uit met In-Process Services & Incident Context

We willen de DevStack profiler/probe agent (\`devstack/profiler\`) uitbreiden met snelle interne functies voor ontwikkelaars en rijke context bij exceptions en traces, ZONDER trage \`Http::\`-requests.

## Architecturale randvoorwaarden
1. **GEEN HTTP:: requests**: Gebruik NOOIT \`Http::post()\` of synchrone cURL-calls in PHP. Alle dataverzameling moet 100% in-memory gebeuren.
2. **Transport**:
   - Continue achtergrond probe: Eén enkel non-blocking UDP datagram (max 60 KiB) naar poort 2409 bij \`app()->terminating()\`.
   - Expliciete profiler run (\`?__devstack_profile=1\`): Atomic write naar \`spool/inbox/.tmp\` -> rename naar \`.json\`.
3. **Fail-open & Zero-dependency**: Als de collector offline is, mag de Laravel webapp, job of command exact 0 ms vertraging oplopen.

---

## Gewenste functionaliteiten om te bouwen

### 1. In-Process Service & Facade: \`DevStack\\Profiler\\Facades\\Profiler\`
Bouw een snelle PHP service/façade met de volgende methodes:
- \`Profiler::measure(string $label, callable $callback): mixed\`
  - Meet met \`hrtime(true)\` en \`memory_get_usage()\` de exacte duur en RAM-delta.
  - Slaat het resultaat in-memory op in de ringbuffer als \`category = 'measure'\`.
- \`Profiler::breadcrumb(string $category, string $message): void\`
  - Slaat maximaal 15 items op in een FIFO-ringbuffer in \`$GLOBALS['__devstack_profiler_context']['breadcrumbs']\`.
  - Berekent per breadcrumb de verstreken tijd sinds request start: \`offset_ms = round((hrtime(true) - started_ns) / 1_000_000, 1)\`.
  - Categorieën: \`'request'\`, \`'auth'\`, \`'query'\`, \`'cache'\`, \`'http'\`, \`'measure'\`, \`'exception'\`.
- \`Profiler::auth(int|string $userId, string $guard = 'web'): void\`
  - Slaat alleen het ID en de guard op (nooit e-mails, tokens of persoonsgegevens).

### 2. Code Snippet Preview bij Exceptions
In \`ProfilerServiceProvider.php\` bij het opvangen van een uncaught exception:
- Als de exception optreedt in een bestand binnen \`base_path()\` (en niet in \`/vendor/\`):
  - Lees via \`file()\` en \`array_slice()\` maximaal 5 regels vóór en 5 regels na de foutregel.
  - Voeg dit toe aan het exception payload:
    \`\`\`json
    "snippet": {
      "file": "app/Services/OrderProcessingService.php",
      "line": 142,
      "lines": {
        "140": "    $order = Order::lockForUpdate()->find($orderId);",
        "141": "    $inventory = Inventory::where('product_id', $order->product_id)->lockForUpdate()->first();",
        "142": "    $order->update(['status' => 'processing', 'reserved_stock' => DB::raw('reserved_stock + 1')]);",
        "143": "    DB::commit();"
      }
    }
    \`\`\`
- Zorg dat dit 0% overhead heeft op normale, succesvolle requests.

### 3. Request Chronologie & Laatste Query
- Houd de laatste uitgevoerde SQL query automatisch bij als laatste \`query\` breadcrumb (met duur in ms).
- Bij een exception wordt de exception automatisch als allerlaatste breadcrumb toegevoegd (\`offset_ms: ...\`), zodat exact zichtbaar is welke events eraan voorafgingen.

### 4. Automatische Auth Event Listener
Luister in \`ProfilerServiceProvider\` naar \`Illuminate\\Auth\\Events\\Authenticated\`:
\`\`\`php
$events->listen('Illuminate\\Auth\\Events\\Authenticated', function ($event) {
    if (isset($event->user)) {
        Profiler::auth($event->user->getAuthIdentifier(), $event->guard ?? 'web');
        Profiler::breadcrumb('auth', "Authenticated user ID #{$event->user->getAuthIdentifier()} ({$event->guard})");
    }
});
\`\`\`

### 5. Datacontract & Collector Synchronisatie
Werk de Go struct types in \`main.go\` en het JSON contract bij:
- \`breadcrumbs\`: array van \`{category: string, message: string, offset_ms: float64}\`
- \`snippet\`: \`{file: string, line: int, lines: map[string]string}\`
- \`laravel.auth\`: \`{id: any, guard: string}\`

Schrijf ook unit tests in \`tests/Unit/\` voor:
1. De \`measure()\` timing en memory delta.
2. De FIFO-ringbuffer (maximaal 15 items, oudste valt af).
3. Exception snippet extractie met line highlighting.
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#090d16] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  DevStack Agent Architectuur &amp; Codex Builder
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  In-Memory Service &bull; Zero HTTP Overhead
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Snelle in-process methodes voor je applicatie &amp; kant-en-klare prompt voor Codex.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 py-2 border-b border-slate-800/80 bg-slate-900/50 overflow-x-auto">
          {[
            { id: "codex-prompt", label: "Codex Bouw-Prompt (Direct Kopiëren)", icon: Sparkles, badge: "Aanbevolen" },
            { id: "service-spec", label: "Snelle In-Process Service (Voorbeelden)", icon: Code2 },
            { id: "projects", label: "Projecten & Domeinen", icon: FolderGit2, badge: `${projects.length}` },
            { id: "contract", label: "Datacontract & UDP Ingest", icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm font-sans">
          
          {/* TAB: Codex Bouw-Prompt */}
          {activeTab === "codex-prompt" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/30 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-bold mb-1">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>KANT-EN-KLARE PROMPT VOOR CODEX</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    Laat Codex de PHP Service Provider, Façade en Code Snippets genereren
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Geen trage HTTP-requests. Volledig gebaseerd op in-memory buffers en non-blocking UDP.
                  </p>
                </div>

                <button
                  onClick={() => copySnippet("codex-prompt", codexPromptText)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer shrink-0 shadow-md shadow-blue-900/30"
                >
                  {copiedKey === "codex-prompt" ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Prompt Gekopieerd!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Kopieer Complete Codex Prompt</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[480px]">
                <pre className="whitespace-pre-wrap leading-relaxed">{codexPromptText}</pre>
              </div>
            </div>
          )}

          {/* TAB: Snelle In-Process Service (Voorbeelden) */}
          {activeTab === "service-spec" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Geen HTTP:: requests, maar ultrasnelle functies binnen je Service</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Tijdens de verwerking van je web request of queue job roep je direct de in-process methodes aan. 
                  Er vindt geen netwerk I/O plaats tot het moment dat Laravel afsluit.
                </p>
              </div>

              {/* Voorbeeld 1: Gebruik in Business Logic */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-blue-400" />
                    <span>Voorbeeld 1: Gebruik in een Controller of Service</span>
                  </span>
                  <button
                    onClick={() => copySnippet("service-usage", serviceUsageSnippet)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedKey === "service-usage" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Kopieer</span>
                  </button>
                </div>
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto">
                  <pre className="whitespace-pre-wrap leading-relaxed">{serviceUsageSnippet}</pre>
                </div>
              </div>

              {/* Voorbeeld 2: De In-Memory Facade */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>Voorbeeld 2: De In-Memory Façade Implementatie (DevStack\Profiler\Facades\Profiler)</span>
                  </span>
                  <button
                    onClick={() => copySnippet("facade-snippet", profilerFacadeSnippet)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedKey === "facade-snippet" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Kopieer</span>
                  </button>
                </div>
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto">
                  <pre className="whitespace-pre-wrap leading-relaxed">{profilerFacadeSnippet}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Projects & Domains */}
          {activeTab === "projects" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                    <span>Geregistreerde Laravel Projecten</span>
                    <span className="text-xs font-normal text-slate-400">
                      (Automatisch herkend via header of environment)
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Elk project kan meerdere webshop-domeinen of microservices bevatten.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingProject(!isAddingProject)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nieuw Project Toevoegen</span>
                </button>
              </div>

              {/* Add Project Inline Form */}
              {isAddingProject && (
                <form onSubmit={handleCreateProject} className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 space-y-3">
                  <h4 className="text-xs font-mono font-bold text-blue-300 uppercase">
                    Nieuw Laravel Project Koppelen
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-mono text-slate-400 block mb-1">Projectnaam</label>
                      <input
                        type="text"
                        placeholder="bijv. Beekman B2B Portal"
                        value={newProjName}
                        onChange={(e) => {
                          setNewProjName(e.target.value);
                          if (!newProjSlug) {
                            setNewProjSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-slate-400 block mb-1">Project Slug (DEVSTACK_PROJECT_ID)</label>
                      <input
                        type="text"
                        placeholder="beekman-b2b"
                        value={newProjSlug}
                        onChange={(e) => setNewProjSlug(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-slate-400 block mb-1">Omgeving</label>
                      <select
                        value={newProjEnv}
                        onChange={(e) => setNewProjEnv(e.target.value as any)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="production">Production</option>
                        <option value="staging">Staging</option>
                        <option value="local">Local</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">
                      Domeinen (komma-gescheiden, bijv. b2b.local, shop.local)
                    </label>
                    <input
                      type="text"
                      placeholder="b2b.beekman.local, portal.beekman.nl"
                      value={newProjDomains}
                      onChange={(e) => setNewProjDomains(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingProject(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-700 cursor-pointer"
                    >
                      Annuleren
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer"
                    >
                      Opslaan &amp; Configureren
                    </button>
                  </div>
                </form>
              )}

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{proj.name}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                              proj.environment === "production"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : proj.environment === "staging"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {proj.environment}
                          </span>
                        </h4>
                        <div className="text-xs font-mono text-blue-400 mt-0.5">
                          ID: {proj.slug}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-mono text-slate-400 mb-1.5">
                        Gekoppelde domeinen ({proj.domains.length}):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {proj.domains.map((dom) => (
                          <span
                            key={dom}
                            className="px-2 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300"
                          >
                            {dom}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Datacontract */}
          {activeTab === "contract" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-sky-400" />
                  <span>Het Officiële Observability Datacontract (JSON Schema)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Dit is het exacte formaat dat de Go collector verwacht via UDP (poort 2409) of Spool file.
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto">
                <pre>{`{
  "version": 1,
  "project_id": "beekman-b2b",
  "request_id": "01K00000000000000000000000",
  "domain": "b2b.beekman.local",
  "method": "POST",
  "path": "/api/v1/orders/48102/process",
  "status": 500,
  "duration_us": 428300,
  "memory_peak_bytes": 12582912,
  "collector_overhead_us": 1480,
  "occurred_at": "2026-09-05T08:30:00Z",
  "stage_durations_us": {
    "bootstrap": 52100,
    "action": 245900,
    "render": 0
  },
  "summary": {
    "query_count": 72,
    "query_read_count": 70,
    "query_write_count": 2,
    "query_ms": 286.4,
    "exception_count": 1
  },
  "breadcrumbs": [
    {"category": "request", "message": "POST /api/v1/orders/48102/process", "offset_ms": 0},
    {"category": "auth", "message": "Authenticated user ID #1042 (web)", "offset_ms": 25.1},
    {"category": "query", "message": "SELECT * FROM orders WHERE id = ? FOR UPDATE [4.2ms]", "offset_ms": 42.0},
    {"category": "exception", "message": "Deadlock detected during concurrent lock acquisition", "offset_ms": 120.4}
  ],
  "snippet": {
    "file": "app/Services/OrderProcessingService.php",
    "line": 142,
    "lines": {
      "140": "    $order = Order::lockForUpdate()->find($orderId);",
      "141": "    $inventory = Inventory::where('product_id', $order->product_id)->lockForUpdate()->first();",
      "142": "    $order->update(['status' => 'processing', 'reserved_stock' => DB::raw('reserved_stock + 1')]);",
      "143": "    DB::commit();"
    }
  },
  "laravel": {
    "auth": {"id": 1042, "guard": "web"},
    "route": {
      "name": "orders.process",
      "uri": "api/v1/orders/{order}/process",
      "action": "App\\\\Http\\\\Controllers\\\\OrderController@process"
    }
  }
}`}</pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Transport: Non-blocking UDP :2409 &bull; Spool: inbox/*.json</span>
          </div>
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
