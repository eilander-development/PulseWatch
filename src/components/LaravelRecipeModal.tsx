import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Check,
  Copy,
  Zap,
  ExternalLink,
  ShieldCheck,
  Tag,
  Flame,
  Search,
  CheckCircle2,
  HelpCircle,
  FileCode2,
  PlusCircle,
  Download,
  RotateCcw,
  Edit3,
  Trash2,
  RefreshCw,
  Globe,
  Sliders
} from "lucide-react";
import { LaravelFixRecipe, LARAVEL_RECIPES } from "../data/laravelRecipes";

interface LaravelRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRecipe: LaravelFixRecipe | null;
  onSelectRecipe?: (recipe: LaravelFixRecipe) => void;
}

export const LaravelRecipeModal: React.FC<LaravelRecipeModalProps> = ({
  isOpen,
  onClose,
  selectedRecipe: initialRecipe,
  onSelectRecipe
}) => {
  const [recipes, setRecipes] = useState<LaravelFixRecipe[]>(LARAVEL_RECIPES);
  const [activeRecipe, setActiveRecipe] = useState<LaravelFixRecipe>(
    initialRecipe || LARAVEL_RECIPES[0]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "diff" | "practices">("code");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form Mode: "none" | "new" | "edit" | "import"
  const [modalMode, setModalMode] = useState<"view" | "form" | "import">("view");

  // Form state
  const [formData, setFormData] = useState<Partial<LaravelFixRecipe>>({
    title: "",
    category: "performance",
    badge: "Custom Fix",
    tags: ["laravel", "custom"],
    patterns: [],
    symptom: "",
    rootCause: "",
    solutionTitle: "",
    laravelVersions: "Laravel 10, 11+",
    speedup: "Tot 60% sneller",
    codeSnippet: "",
    diffSnippet: "",
    bestPractices: [],
    documentationUrl: ""
  });

  // Import panel state
  const [apiUrl, setApiUrl] = useState("https://api.github.com/repos/laravel/framework");
  const [jsonInput, setJsonInput] = useState("");

  // Fetch recipes from backend API
  const fetchRecipes = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/recipes");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.recipes) && data.recipes.length > 0) {
          setRecipes(data.recipes);
          // Keep active recipe reference
          if (!activeRecipe || !data.recipes.some((r: LaravelFixRecipe) => r.id === activeRecipe.id)) {
            setActiveRecipe(data.recipes[0]);
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch /api/recipes, falling back to local dataset:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecipes();
    }
  }, [isOpen]);

  // Keep activeRecipe synchronized if prop updates
  useEffect(() => {
    if (initialRecipe) {
      setActiveRecipe(initialRecipe);
    }
  }, [initialRecipe]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Open Form for creating new recipe
  const handleOpenNewForm = () => {
    setFormData({
      id: `recipe-custom-${Date.now()}`,
      title: "",
      category: "performance",
      badge: "Custom Fix / Optimalisatie",
      tags: ["performance", "custom"],
      patterns: [],
      symptom: "",
      rootCause: "",
      solutionTitle: "",
      laravelVersions: "Laravel 10, 11+",
      speedup: "Tot 75% snellere respons",
      codeSnippet: `// 1. Voeg hier je PHP, Eloquent of Vue fix toe:\n`,
      diffSnippet: ``,
      bestPractices: [
        "Test de fix grondig in je lokale Docker / Valet omgeving",
        "Documenteer eventuele query plan index veranderingen"
      ],
      documentationUrl: "https://laravel.com/docs"
    });
    setModalMode("form");
  };

  // Open Form for editing current recipe
  const handleOpenEditForm = () => {
    setFormData({ ...activeRecipe });
    setModalMode("form");
  };

  // Save Recipe (Create or Update)
  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.solutionTitle) {
      alert("Titel en Oplossing titel zijn verplicht.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        const saved: LaravelFixRecipe = data.recipe;
        setRecipes((prev) => {
          const idx = prev.findIndex((r) => r.id === saved.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [saved, ...prev];
        });
        setActiveRecipe(saved);
        setModalMode("view");
        showToast(`Recept "${saved.title}" succesvol opgeslagen!`);
      } else {
        alert("Fout bij opslaan van recept.");
      }
    } catch (err) {
      console.error("Save recipe error:", err);
      alert("Fout bij opslaan via API.");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete recipe
  const handleDeleteRecipe = async (id: string) => {
    if (!window.confirm("Weet je zeker dat je dit recept wilt verwijderen?")) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (res.ok) {
        const updated = recipes.filter((r) => r.id !== id);
        setRecipes(updated);
        setActiveRecipe(updated[0] || LARAVEL_RECIPES[0]);
        showToast("Recept verwijderd.");
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to default factory recipes
  const handleResetDefaults = async () => {
    if (!window.confirm("Standaard recepten herstellen? Aangepaste recepten worden overschreven.")) return;
    try {
      setIsLoading(true);
      const res = await fetch("/api/recipes/reset", { method: "POST" });
      if (res.ok) {
        await fetchRecipes();
        showToast("Standaard recepten hersteld.");
      }
    } catch (err) {
      console.error("Reset error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Import preset: Laravel 11 Performance pack
  const handleImportPreset = async (presetType: "laravel11" | "vueInertia") => {
    setIsLoading(true);
    let pack: Partial<LaravelFixRecipe>[] = [];

    if (presetType === "laravel11") {
      pack = [
        {
          id: "route-model-binding-caching",
          title: "Route Model Binding Explicit Caching",
          category: "performance",
          badge: "Eloquent / Routing",
          tags: ["route-model-binding", "cache", "eloquent", "laravel11"],
          patterns: ["select * from `users` where `id` =", "RouteServiceProvider"],
          symptom: "Elke pagina-aanroep voert een SELECT query uit voor de route-parameter ({user}, {order}), zelfs bij statische views of herhaalde navigaties.",
          rootCause: "Laravel resolved Route Model Binding standaard altijd rechtstreeks via een database query.",
          solutionTitle: "Activeer scoped cache binding in RouteServiceProvider of AppServiceProvider",
          laravelVersions: "Laravel 10, 11+",
          speedup: "Bespaart 1 DB query per request (tot 25% lagere SQL-druk)",
          codeSnippet: `// In app/Providers/AppServiceProvider.php:\nuse App\\Models\\Product;\nuse Illuminate\\Support\\Facades\\Route;\nuse Illuminate\\Support\\Facades\\Cache;\n\npublic function boot(): void\n{\n    Route::bind('product', function (string $value) {\n        return Cache::tags(['products'])->remember(\n            "product:bind:{$value}",\n            now()->addMinutes(30),\n            fn () => Product::where('slug', $value)->orWhere('id', $value)->firstOrFail()\n        );\n    });\n}`,
          bestPractices: [
            "Gebruik Cache::tags() zodat je gerichte invalidatie kunt doen bij model updates",
            "Zet een redelijke TTL (bijv. 15 tot 60 minuten)"
          ],
          documentationUrl: "https://laravel.com/docs/routing#explicit-binding"
        },
        {
          id: "lazy-collection-chunking",
          title: "LazyCollection Stream Chunking voor zware Exports & Syncs",
          category: "memory",
          badge: "Database / Memory",
          tags: ["lazycollection", "memory_limit", "generators", "cursor"],
          patterns: ["Allowed memory size of", "cursor()", "chunkById"],
          symptom: "Product exports of factuur batches crashen met 'Allowed memory size exhausted' bij catalogi > 10.000 items.",
          rootCause: "Eloquent Model::all() hydrateert alle rijen gelijktijdig in PHP arrays in het geheugen.",
          solutionTitle: "Vervang get() door LazyCollection::cursor() en yield generators",
          laravelVersions: "Laravel 9, 10, 11+",
          speedup: "Geheugengebruik blijft stabiel op < 18MB ongeacht data omvang (tot 90% geheugenreductie)",
          codeSnippet: `// In je ExportService of Console Command:\nuse App\\Models\\Product;\n\n// Slechts 1 model tegelijk in geheugen via PDO cursor stream:\nProduct::query()\n    ->where('stock_qty', '>', 0)\n    ->lazyById(500) // Behoudt stabiel geheugengebruik\n    ->each(function (Product $product) use ($csvHandle) {\n        fputcsv($csvHandle, [$product->sku, $product->name, $product->price]);\n    });`,
          bestPractices: [
            "Gebruik lazyById() in plaats van cursor() als er tussentijdse updates plaatsvinden",
            "Monitor geheugenpiek in Telescope of Pulse"
          ],
          documentationUrl: "https://laravel.com/docs/eloquent-resources#optimizing-resource-responses"
        }
      ];
    } else {
      pack = [
        {
          id: "inertia-partial-reloads",
          title: "Inertia Partial Reloads (only: [...]) voor Snelle Data Tables",
          category: "performance",
          badge: "Vue 3 / Inertia.js",
          tags: ["inertia", "vue3", "partial-reload", "lag", "preserve-state"],
          patterns: ["Inertia.visit", "router.reload", "full page prop re-hydration"],
          symptom: "Bij pagineren of filteren in een Vue data-table laadt Inertia onnodig alle statische layout data en permissies opnieuw.",
          rootCause: "Standaard stuurt de Laravel controller alle props terug tenzij de client expliciet selecteert welke gewenst zijn.",
          solutionTitle: "Gebruik router.reload({ only: ['orders'], preserveState: true }) in Vue 3",
          laravelVersions: "Vue 3 + Inertia v1.x/v2.x + Laravel 10/11",
          speedup: "Payload van 120KB teruggebracht naar 8KB (responstijd van 280ms naar 45ms)",
          codeSnippet: `<script setup>\nimport { router } from '@inertiajs/vue3';\n\nfunction applyFilter(search) {\n  router.reload({\n    data: { search },\n    only: ['orders', 'pagination'], // Laadt alleen de tabel props opnieuw!\n    preserveState: true,\n    preserveScroll: true,\n  });\n}\n</script>`,
          bestPractices: [
            "Combineer met Inertia::lazy() in Laravel zodat dure queries alleen draaien bij partial requests",
            "Gebruik preserveState: true om formulier- en selectie-status in Vue te bewaren"
          ],
          documentationUrl: "https://inertiajs.com/partial-reloads"
        },
        {
          id: "vue3-shallow-ref-large-tables",
          title: "Vue 3 shallowRef voor Grote Telemetrie & Data Tabellen",
          category: "memory",
          badge: "Vue 3 / Reactivity",
          tags: ["vue3", "shallowRef", "deep-reactivity", "memory-leak", "ui-freeze"],
          patterns: ["UI freeze bij 1000+ items", "Proxy overhead in Vue DevTools"],
          symptom: "De browser tab bevriest kort (1-2 seconden) wanneer er lijsten met duizenden datapunten worden gerenderd.",
          rootCause: "Vue's ref() maakt elk genest object en array recursief reactief via JavaScript Proxies.",
          solutionTitle: "Gebruik shallowRef() voor arrays die puur ter weergave dienen",
          laravelVersions: "Vue 3.3+",
          speedup: "10x snellere DOM initialisatie en 60% minder browser heap allocatie",
          codeSnippet: `<script setup>\nimport { shallowRef, triggerRef } from 'vue';\n\n// Geen diepe proxying voor 5.000 log rijen:\nconst auditLogs = shallowRef([]);\n\nfunction updateLogs(newLogs) {\n  auditLogs.value = newLogs;\n}\n</script>`,
          bestPractices: [
            "Gebruik shallowRef() voor grote read-only API payloads",
            "Gebruik triggerRef() als je individuele indices muteert"
          ],
          documentationUrl: "https://vuejs.org/api/reactivity-advanced.html#shallowref"
        }
      ];
    }

    try {
      const res = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipes: pack })
      });
      if (res.ok) {
        await fetchRecipes();
        showToast(`${pack.length} recepten succesvol geïmporteerd!`);
        setModalMode("view");
      }
    } catch (err) {
      console.error("Import preset error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Import JSON
  const handleImportJson = async () => {
    if (!jsonInput.trim()) {
      alert("Plak eerst JSON data in het invoerveld.");
      return;
    }
    try {
      let parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        parsed = [parsed];
      }
      setIsLoading(true);
      const res = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipes: parsed })
      });
      if (res.ok) {
        await fetchRecipes();
        setJsonInput("");
        setModalMode("view");
        showToast(`${parsed.length} aangepaste recepten geïmporteerd!`);
      } else {
        alert("Server weigerde de import. Controleer de velden.");
      }
    } catch (err) {
      alert("Ongeldige JSON syntax: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecipes = recipes.filter((r) => {
    if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.symptom.toLowerCase().includes(q) ||
      r.badge.toLowerCase().includes(q) ||
      r.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Laravel &amp; Vue Recepten &amp; Fixes
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Dynamisch &amp; Bewerkbaar ({recipes.length} recepten)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Beheer, importeer en configureer beproefde performance- en uitzonderingsfixes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {statusMessage && (
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-lg animate-fade-in">
                {statusMessage}
              </span>
            )}

            {modalMode === "view" ? (
              <>
                <button
                  onClick={handleOpenNewForm}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  title="Voeg een nieuw recept toe"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Nieuw Recept</span>
                </button>

                <button
                  onClick={() => setModalMode("import")}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                  title="Importeer via API of JSON"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>API / Import</span>
                </button>

                <button
                  onClick={fetchRecipes}
                  disabled={isLoading}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Herlaad recepten"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setModalMode("view")}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              >
                <span>Terug naar Catalogus</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Pill Filters (when in view mode) */}
        {modalMode === "view" && (
          <div className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto text-xs font-mono">
            <span className="text-slate-500 text-[11px] mr-2">Filter Categorie:</span>
            {[
              { id: "all", label: "Alle" },
              { id: "performance", label: "Performance" },
              { id: "database", label: "Database" },
              { id: "queue", label: "Queue / Horizon" },
              { id: "memory", label: "Memory" },
              { id: "cache", label: "Cache / Redis" }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  categoryFilter === cat.id
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold"
                    : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {cat.label}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleResetDefaults}
                className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 transition cursor-pointer"
                title="Herstel naar fabriekswaarden"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Fabrieksinstellingen</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body Switcher */}
        {modalMode === "form" ? (
          /* Create / Edit Form */
          <form onSubmit={handleSaveRecipe} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <span>{formData.id && recipes.some(r => r.id === formData.id) ? "Recept Bewerken" : "Nieuw Laravel / Vue Recept Toevoegen"}</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Wordt direct opgeslagen in de lokale APM backend (/api/recipes)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="md:col-span-2">
                <label className="text-slate-400 block mb-1 font-semibold">Titel van het Knelpunt / Recept *</label>
                <input
                  type="text"
                  required
                  placeholder="bijv. Elasticsearch Bulk Indexing Deadlocks Oplossen"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Categorie</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="performance">Performance</option>
                  <option value="database">Database</option>
                  <option value="queue">Queue</option>
                  <option value="memory">Memory</option>
                  <option value="cache">Cache</option>
                  <option value="auth">Auth</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Badge / Module Label</label>
                <input
                  type="text"
                  placeholder="bijv. Redis / Horizon, Vue 3, Eloquent"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Versies</label>
                <input
                  type="text"
                  placeholder="Laravel 10, 11+ / Vue 3"
                  value={formData.laravelVersions}
                  onChange={(e) => setFormData({ ...formData, laravelVersions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Verwachte Versnelling</label>
                <input
                  type="text"
                  placeholder="bijv. Tot 85% lagere responstijd"
                  value={formData.speedup}
                  onChange={(e) => setFormData({ ...formData, speedup: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-rose-400 font-mono block mb-1 font-semibold">Symptoom &amp; Foutmelding</label>
                <textarea
                  rows={3}
                  placeholder="Wat ziet de ontwikkelaar in Sentry of Telescope? (bijv. Query deadlock op order_lines tabel)"
                  value={formData.symptom}
                  onChange={(e) => setFormData({ ...formData, symptom: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-amber-400 font-mono block mb-1 font-semibold">Onderliggende Oorzaak</label>
                <textarea
                  rows={3}
                  placeholder="Waarom gebeurt dit op database- of framework-niveau?"
                  value={formData.rootCause}
                  onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="text-emerald-400 font-mono block mb-1 font-semibold">Oplossing Samenvatting (Actietitel) *</label>
              <input
                type="text"
                required
                placeholder="bijv. Implementeer chunkById met Redis mutex lock"
                value={formData.solutionTitle}
                onChange={(e) => setFormData({ ...formData, solutionTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="text-xs">
              <label className="text-slate-300 font-mono block mb-1 font-semibold">PHP / Vue Code Snippet *</label>
              <textarea
                rows={8}
                required
                placeholder="// Plak hier de concrete productie-klare PHP of Vue code..."
                value={formData.codeSnippet}
                onChange={(e) => setFormData({ ...formData, codeSnippet: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="text-xs">
              <label className="text-slate-400 font-mono block mb-1">Tags (komma-gescheiden)</label>
              <input
                type="text"
                placeholder="bijv. redis, lock, chunk, deadlocks"
                value={Array.isArray(formData.tags) ? formData.tags.join(", ") : ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean)
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalMode("view")}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? "Opslaan..." : "Recept Opslaan &amp; Toevoegen"}
              </button>
            </div>
          </form>
        ) : modalMode === "import" ? (
          /* API & Import View */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                <span>Recepten &amp; Fix Packs Importeren via API of JSON</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Breid je lokale kennisbank uit met kant-en-klare optimalisaties voor Laravel 11, Pulse, Horizon en Vue 3/Inertia.
              </p>
            </div>

            {/* 1-Click Curated Packs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                    Officiële Laravel 11 Add-ons
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">Laravel 11 Performance &amp; Memory Pack</h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Bevat fixes voor Route Model Binding caching en LazyCollection stream chunking voor grote exports.
                  </p>
                </div>
                <button
                  onClick={() => handleImportPreset("laravel11")}
                  disabled={isLoading}
                  className="mt-4 w-full py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Installeer Laravel 11 Pack (2 Recepten)</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider font-semibold">
                    Frontend &amp; Inertia Stack
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">Vue 3 + Inertia.js Optimalisatie Pack</h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Bevat Inertia Partial Reloads (only: [...]) en shallowRef() proxy-bypass voor soepele 60fps data-tabellen.
                  </p>
                </div>
                <button
                  onClick={() => handleImportPreset("vueInertia")}
                  disabled={isLoading}
                  className="mt-4 w-full py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Installeer Vue 3 &amp; Inertia Pack (2 Recepten)</span>
                </button>
              </div>
            </div>

            {/* Custom JSON Paste Import */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
                  Aangepaste JSON Recepten Plakken &amp; Importeren
                </span>
                <span className="text-[11px] font-mono text-slate-400">Ondersteunt array van recepten</span>
              </div>
              <textarea
                rows={5}
                placeholder={`[\n  {\n    "title": "Mijn Custom Fix",\n    "solutionTitle": "Optimaliseer via Redis",\n    "codeSnippet": "$redis->set(...);",\n    "symptom": "Hoge belasting"\n  }\n]`}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleImportJson}
                  disabled={isLoading || !jsonInput.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Importeer JSON Recepten
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Standard View (Catalogus + Detail) */
          <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden min-h-[500px]">
            
            {/* Left Navigation Sidebar */}
            <div className="md:col-span-4 border-r border-slate-800 bg-slate-950/40 flex flex-col overflow-hidden">
              {/* Search Input */}
              <div className="p-3 border-b border-slate-800/80">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Zoek recept (bijv. N+1, deadlock, memory)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
              </div>

              {/* List of Recipes */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {filteredRecipes.map((recipe) => {
                  const isSelected = activeRecipe.id === recipe.id;
                  return (
                    <button
                      key={recipe.id}
                      onClick={() => {
                        setActiveRecipe(recipe);
                        if (onSelectRecipe) onSelectRecipe(recipe);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-slate-800/90 border-emerald-500/50 shadow-sm"
                          : "bg-slate-900/40 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          {recipe.badge}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          {recipe.laravelVersions.split(",")[0]}
                        </span>
                      </div>
                      <h4 className={`text-xs font-semibold line-clamp-1 ${
                        isSelected ? "text-white" : "text-slate-200"
                      }`}>
                        {recipe.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                        {recipe.symptom}
                      </p>
                    </button>
                  );
                })}

                {filteredRecipes.length === 0 && (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    Geen recepten gevonden voor "{searchQuery}".
                  </div>
                )}
              </div>

              {/* Sidebar Footer Info */}
              <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{recipes.length} recepten beschikbaar</span>
                </div>
                <button
                  onClick={handleOpenNewForm}
                  className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>+ Toevoegen</span>
                </button>
              </div>
            </div>

            {/* Right Detail Pane */}
            <div className="md:col-span-8 flex flex-col overflow-y-auto bg-slate-900/60 p-6">
              {/* Header info */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono font-semibold">
                      {activeRecipe.badge}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
                      {activeRecipe.laravelVersions}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {activeRecipe.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenEditForm}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                    title="Bewerk dit recept"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteRecipe(activeRecipe.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 transition cursor-pointer"
                    title="Verwijder dit recept"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleCopy(activeRecipe.codeSnippet)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Gekopieerd!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopieer Recept</span>
                      </>
                    )}
                  </button>

                  {activeRecipe.documentationUrl && (
                    <a
                      href={activeRecipe.documentationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                      title="Open officiële Laravel Docs"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Diagnostics Cards: Symptom & Root Cause */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
                <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 mb-1">
                    <Flame className="w-3.5 h-3.5" />
                    Symptoom &amp; Foutmelding
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeRecipe.symptom}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Onderliggende Oorzaak
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeRecipe.rootCause}
                  </p>
                </div>
              </div>

              {/* Speedup & Solution Heading */}
              <div className="mb-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-200">
                    {activeRecipe.solutionTitle}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                  {activeRecipe.speedup}
                </span>
              </div>

              {/* Code Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
                <button
                  onClick={() => setActiveTab("code")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "code"
                      ? "bg-slate-800 text-emerald-400 border border-slate-700"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  PHP / Eloquent / Vue Oplossing
                </button>
                {activeRecipe.diffSnippet && (
                  <button
                    onClick={() => setActiveTab("diff")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "diff"
                        ? "bg-slate-800 text-emerald-400 border border-slate-700"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Code Diff (Voor &amp; Na)
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("practices")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "practices"
                      ? "bg-slate-800 text-emerald-400 border border-slate-700"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Best Practices &amp; Preventie
                </button>
              </div>

              {/* Tab: Code Snippet */}
              {activeTab === "code" && (
                <div className="relative flex-1">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 rounded-t-xl border border-slate-800 border-b-0 text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
                      Productie-klare syntax
                    </span>
                    <button
                      onClick={() => handleCopy(activeRecipe.codeSnippet)}
                      className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Kopieer
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 text-emerald-300/90 font-mono text-xs rounded-b-xl border border-slate-800 overflow-x-auto leading-relaxed">
                    <code>{activeRecipe.codeSnippet}</code>
                  </pre>
                </div>
              )}

              {/* Tab: Diff */}
              {activeTab === "diff" && activeRecipe.diffSnippet && (
                <div className="relative flex-1">
                  <div className="px-3 py-1.5 bg-slate-950/80 rounded-t-xl border border-slate-800 border-b-0 text-[11px] font-mono text-slate-400">
                    Unified Diff overzicht
                  </div>
                  <pre className="p-4 bg-slate-950 font-mono text-xs rounded-b-xl border border-slate-800 overflow-x-auto leading-relaxed">
                    {activeRecipe.diffSnippet.split("\n").map((line, idx) => {
                      const isRemoved = line.startsWith("-");
                      const isAdded = line.startsWith("+");
                      return (
                        <div
                          key={idx}
                          className={
                            isRemoved
                              ? "text-rose-400 bg-rose-500/10 px-1 rounded"
                              : isAdded
                              ? "text-emerald-400 bg-emerald-500/10 px-1 rounded font-semibold"
                              : "text-slate-400"
                          }
                        >
                          {line}
                        </div>
                      );
                    })}
                  </pre>
                </div>
              )}

              {/* Tab: Best Practices */}
              {activeTab === "practices" && (
                <div className="space-y-2.5 flex-1">
                  {activeRecipe.bestPractices && activeRecipe.bestPractices.length > 0 ? (
                    activeRecipe.bestPractices.map((rule, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-2.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-200 leading-relaxed">
                          {rule}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-500 text-xs">
                      Geen specifieke best practices geregistreerd voor dit recept.
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-1.5 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                {activeRecipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
