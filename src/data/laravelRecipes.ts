export interface LaravelFixRecipe {
  id: string;
  title: string;
  category: "database" | "performance" | "memory" | "queue" | "auth" | "cache";
  badge: string;
  tags: string[];
  patterns: string[];
  symptom: string;
  rootCause: string;
  solutionTitle: string;
  laravelVersions: string;
  speedup: string;
  codeSnippet: string;
  diffSnippet?: string;
  bestPractices: string[];
  documentationUrl?: string;
}

export const LARAVEL_RECIPES: LaravelFixRecipe[] = [
  {
    id: "n-plus-one-eager-loading",
    title: "N+1 Query Bottleneck (Eager Loading)",
    category: "performance",
    badge: "Database / Eloquent",
    tags: ["n+1", "eager-loading", "duplicate-queries", "eloquent", "with"],
    patterns: [
      "n+1",
      "duplicate query",
      "duplicated queries",
      "attempted to read property",
      "order_items",
      "select * from `order_items`",
      "select * from `users` where `id` ="
    ],
    symptom: "Tientallen of honderden identieke queries worden per request uitgevoerd omdat relaties binnen een loop 'lazy' worden opgehaald.",
    rootCause: "Standaard laadt Eloquent relaties pas zodra de property wordt aangeroepen ($order->items). In een loop over 50 rijen leidt dit tot 1 initiële query + 50 afzonderlijke relatiequeries.",
    solutionTitle: "Activeer Eager Loading via with() en blokkeer lazy loading in dev",
    laravelVersions: "Laravel 8, 9, 10, 11+",
    speedup: "Tot 95% snellere responstijd (van 100+ DB queries naar 2 geoptimaliseerde queries)",
    codeSnippet: `// 1. In je Controller of Service:
// Eager load de benodigde relaties in 1 of 2 WHERE IN queries:
$orders = Order::with(['items.product', 'customer'])
    ->where('created_at', '>=', now()->subDays(7))
    ->select(['id', 'customer_id', 'status', 'created_at'])
    ->get();

// 2. Of als je reeds een instantie hebt:
$order->loadMissing(['items.product']);

// 3. Tip: Voorkom N+1 automatisch in lokale/staging omgeving:
// In app/Providers/AppServiceProvider.php:
public function boot(): void
{
    Model::preventLazyLoading(! app()->isProduction());
}`,
    diffSnippet: `- $orders = Order::where('created_at', '>=', now()->subDays(7))->get();
+ $orders = Order::with(['items.product', 'customer'])
+     ->where('created_at', '>=', now()->subDays(7))
+     ->get();`,
    bestPractices: [
      "Zet `Model::preventLazyLoading(! app()->isProduction())` aan in AppServiceProvider.",
      "Gebruik `withCount('items')` als je alleen het aantal gerelateerde items nodig hebt in plaats van alle rijen in te laden.",
      "Selecteer uitsluitend de nodige kolommen om PHP geheugen te minimaliseren."
    ],
    documentationUrl: "https://laravel.com/docs/eloquent-relationships#eager-loading"
  },
  {
    id: "mysql-deadlock-1213",
    title: "MySQL Deadlock 1213 / Lock Wait Timeout",
    category: "database",
    badge: "MySQL / Transacties",
    tags: ["deadlock", "1213", "40001", "lockForUpdate", "transaction", "retry"],
    patterns: [
      "deadlock",
      "1213",
      "sqlstate[40001]",
      "lock wait timeout exceeded",
      "deadlock found when trying to get lock"
    ],
    symptom: "Concurrent requests crashen met 'SQLSTATE[40001]: Serialization failure: 1213 Deadlock found when trying to get lock'.",
    rootCause: "Twee gelijktijdige database transacties vergrendelen dezelfde database rijen in tegengestelde volgorde. Zonder automatische retry faalt de request direct met een HTTP 500 foutmelding.",
    solutionTitle: "Gebruik DB::transaction() met 3 retries en strikte lock volgorde",
    laravelVersions: "Laravel 7, 8, 9, 10, 11+",
    speedup: "100% foutreductie bij hoge concurrency (automatische retry in ms)",
    codeSnippet: `use Illuminate\\Support\\Facades\\DB;
use App\\Models\\Order;
use App\\Models\\Inventory;

// Tweede of derde parameter in DB::transaction definieert het aantal automatische retries bij deadlocks!
return DB::transaction(function () use ($orderId) {
    // 1. Sorteer of vergrendel altijd in een vaste volgorde (bijv. op ID of vaste hiërarchie)
    $order = Order::where('id', $orderId)
        ->lockForUpdate()
        ->firstOrFail();

    $inventory = Inventory::where('product_id', $order->product_id)
        ->lockForUpdate()
        ->firstOrFail();

    // 2. Pas wijzigingen atomair toe
    $order->update(['status' => 'processing']);
    $inventory->decrement('available_stock', $order->quantity);

    return $order;
}, 3); // <-- 3 pogingen bij deadlock voordat fout wordt gegooid!`,
    diffSnippet: `- DB::beginTransaction();
- $order = Order::lockForUpdate()->find($orderId);
- $inventory = Inventory::lockForUpdate()->find($order->product_id);
- $order->update([...]);
- DB::commit();
+ return DB::transaction(function () use ($orderId) {
+     $order = Order::where('id', $orderId)->lockForUpdate()->firstOrFail();
+     $inventory = Inventory::where('product_id', $order->product_id)->lockForUpdate()->firstOrFail();
+     $order->update([...]);
+ }, 3);`,
    bestPractices: [
      "Gebruik altijd de retry parameter in `DB::transaction($callback, 3)` voor tabellen met veel schrijfacties.",
      "Houd transacties zo kort mogelijk: verstuur GEEN externe HTTP requests of emails binnen een DB transactie.",
      "Vergrendel rijen in een voorspelbare volgorde (bijvoorbeeld op `ORDER BY id ASC`)."
    ],
    documentationUrl: "https://laravel.com/docs/database#database-transactions"
  },
  {
    id: "memory-exhaustion-cursor",
    title: "PHP Allowed Memory Size (OOM) bij grote datasets",
    category: "memory",
    badge: "PHP / Memory",
    tags: ["memory", "allowed memory size", "cursor", "chunkById", "oom", "lazycollection"],
    patterns: [
      "allowed memory size",
      "bytes exhausted",
      "out of memory",
      "memory_limit",
      "cursor",
      "chunkbyid"
    ],
    symptom: "PHP fatal error: 'Allowed memory size of 134217728 bytes exhausted (tried to allocate ...)' tijdens exports of rapportages.",
    rootCause: "Eloquent instantiëert elk database record als een compleet PHP model object in het werkgeheugen (circa 2-4 KB per object). Bij meer dan 5.000 rijen loopt het PHP geheugen vol.",
    solutionTitle: "Vervang ::all() of ->get() door LazyCollection::cursor() of chunkById()",
    laravelVersions: "Laravel 8, 9, 10, 11+",
    speedup: "Geheugenverbruik daalt van 250MB+ naar een constante <15MB, ongeacht data-omvang",
    codeSnippet: `use App\\Models\\Invoice;
use Illuminate\\Support\\LazyCollection;

// Optie A: Voor data streaming of exports (slechts 1 record tegelijk in RAM via PDO generator):
public function streamInvoices(): LazyCollection
{
    return Invoice::with('customer')
        ->select(['id', 'customer_id', 'amount', 'created_at'])
        ->cursor(); // <-- Generator; verbruikt vrijwel geen geheugen!
}

// Optie B: Voor batch updates in queues of console commands:
Invoice::where('status', 'pending')
    ->chunkById(500, function ($invoices) {
        foreach ($invoices as $invoice) {
            $this->processInvoice($invoice);
        }
    }); // chunkById gebruikt WHERE id > last_id i.p.v. trage SQL OFFSET`,
    diffSnippet: `- return Invoice::with('lines', 'customer')->all();
+ return Invoice::with('customer')
+     ->select(['id', 'customer_id', 'amount', 'created_at'])
+     ->cursor();`,
    bestPractices: [
      "Gebruik nooit `Model::all()` op tabellen die organisch kunnen groeien.",
      "Kies altijd `chunkById()` boven `chunk()`: gewone `chunk()` vertraagt exponentieel door `OFFSET` scanning.",
      "Roep bij zeer grote achtergrondprocessen periodiek `gc_collect_cycles()` aan."
    ],
    documentationUrl: "https://laravel.com/docs/eloquent#chunking-results"
  },
  {
    id: "missing-composite-index",
    title: "Trage Query / Missing Index (Full Table Scan)",
    category: "database",
    badge: "Indexering / MySQL",
    tags: ["index", "full table scan", "type: ALL", "slow query", "explain"],
    patterns: [
      "table scan",
      "type all",
      "slow query",
      "rows_examined",
      "audit_logs",
      "orders where",
      "where status and created_at"
    ],
    symptom: "Query duurt 500ms tot enkele seconden. EXPLAIN plan toont `type: ALL` en doorzoekt honderdduizenden rijen.",
    rootCause: "Er is geen geschikte index aanwezig die de filterkolommen (WHERE) en sorteerkolommen (ORDER BY) afdekt.",
    solutionTitle: "Maak een samengestelde (composite) index aan in een migratie",
    laravelVersions: "Alle Laravel versies",
    speedup: "Query latency daalt met 98% (van >1.200ms naar <8ms)",
    codeSnippet: `// In een nieuwe database migratie (php artisan make:migration add_index_to_table):
use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            // Samengestelde index: volgorde van kolommen is cruciaal!
            // 1. Gelijkheidskolommen (action)
            // 2. Bereik/sorteerkolommen (created_at)
            $table->index(['action', 'created_at'], 'idx_audit_logs_action_created');
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex('idx_audit_logs_action_created');
        });
    }
};`,
    diffSnippet: `+ Schema::table('audit_logs', function (Blueprint $table) {
+     $table->index(['action', 'created_at'], 'idx_audit_logs_action_created');
+ });`,
    bestPractices: [
      "Plaats kolommen die met '=' worden gefilterd vooraan in de samengestelde index.",
      "Plaats bereik-filters (`>`, `<`, `BETWEEN`) of `ORDER BY` kolommen achteraan.",
      "Controleer na de migratie met `EXPLAIN` of `key` daadwerkelijk de nieuwe index gebruikt."
    ],
    documentationUrl: "https://laravel.com/docs/migrations#creating-indexes"
  },
  {
    id: "queue-job-timeout-retry",
    title: "Queue Job MaxAttemptsExceeded / TimeoutException",
    category: "queue",
    badge: "Queue / Horizon",
    tags: ["maxattempts", "timeoutexception", "job failed", "horizon", "queue", "tries"],
    patterns: [
      "maxattemptsexceededexception",
      "timeoutexception",
      "has been attempted too many times",
      "job has timed out",
      "processstripewebhookjob",
      "generatefinancialreport"
    ],
    symptom: "Jobs falen na 60 of 120 seconden en belanden in de `failed_jobs` tabel door tijdelijke netwerkhaperingen of zware berekeningen.",
    rootCause: "De job heeft geen specifieke timeout, geen exponential backoff strategie, of verwerkt te veel werk in een enkele synchronous job pass.",
    solutionTitle: "Configureer tries, timeout, exponential backoff en shouldBeUnique",
    laravelVersions: "Laravel 8, 9, 10, 11+",
    speedup: "100% veerkrachtig tegen netwerk-timeouts; voorkomt dubbele queue runs",
    codeSnippet: `namespace App\\Jobs;

use Illuminate\\Bus\\Queueable;
use Illuminate\\Contracts\\Queue\\ShouldQueue;
use Illuminate\\Contracts\\Queue\\ShouldBeUnique;
use Illuminate\\Foundation\\Bus\\Dispatchable;
use Illuminate\\Queue\\InteractsWithQueue;
use Illuminate\\Queue\\SerializesModels;

class ProcessPaymentWebhook implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Het aantal keren dat de job opnieuw geprobeerd mag worden.
     */
    public int $tries = 3;

    /**
     * Het maximaal aantal seconden dat de job mag draaien.
     */
    public int $timeout = 120;

    /**
     * Exponential backoff: wacht 10s, dan 60s, dan 300s voor retry.
     */
    public array $backoff = [10, 60, 300];

    /**
     * Voorkom dubbele verwerking met ShouldBeUnique lock (1 uur).
     */
    public int $uniqueFor = 3600;

    public function handle(): void
    {
        // ... je veilige idempotente taak ...
    }
}`,
    diffSnippet: `+ public int $tries = 3;
+ public int $timeout = 120;
+ public array $backoff = [10, 60, 300];`,
    bestPractices: [
      "Stel altijd een expliciete `$backoff` in (bijv. `[10, 60]`) bij externe API-calls (zoals Stripe, Mollie, Sendgrid).",
      "Zorg dat de worker timeout (`--timeout=X`) in supervisord / Horizon altijd HOGER is dan de job `$timeout`.",
      "Implementeer `ShouldBeUnique` als dubbel dispatching data kan corrumperen."
    ],
    documentationUrl: "https://laravel.com/docs/queues#job-expiration-and-timeouts"
  },
  {
    id: "redis-cache-stampede",
    title: "Cache Stampede / Cache::remember Lock",
    category: "cache",
    badge: "Cache / Redis",
    tags: ["cache", "remember", "lock", "atomic lock", "stampede", "dog-piling"],
    patterns: [
      "cache::remember",
      "redis",
      "stampede",
      "dog-piling",
      "high cpu cache miss",
      "heavy query on cache expire"
    ],
    symptom: "Wanneer een populaire cache key verloopt, vuren 50 gelijktijdige gebruikers exact dezelfde zware database query af, resulterend in een CPU-piek.",
    rootCause: "Klassiek 'Cache Stampede' (of dog-piling) effect: zonder atomair lock proberen alle gelijktijdige threads de cache opnieuw te berekenen.",
    solutionTitle: "Gebruik Cache::lock() of de ingebouwde rememberWithLock patronen",
    laravelVersions: "Laravel 8, 9, 10, 11+",
    speedup: "Voorkomt database overbelasting bij het verlopen van intensieve cache-items",
    codeSnippet: `use Illuminate\\Support\\Facades\\Cache;
use App\\Models\\Product;

// Oplossing: Atomic Lock rond zware herberekeningen
public function getTopProducts(): array
{
    $cacheKey = 'products:top_sales_v1';

    return Cache::remember($cacheKey, now()->addHours(2), function () {
        // Alleen de allereerste worker krijgt het lock om de query uit te voeren:
        return Cache::lock('lock:products:rebuild', 15)->block(10, function () {
            return Product::with(['category', 'media'])
                ->where('is_active', true)
                ->orderByDesc('sales_count')
                ->limit(20)
                ->get()
                ->toArray();
        });
    });
}`,
    diffSnippet: `- return Cache::remember('products:top', 3600, fn() => Product::all());
+ return Cache::remember('products:top', 3600, function () {
+     return Cache::lock('lock:products:top', 10)->block(5, fn() => ...);
+ });`,
    bestPractices: [
      "Gebruik tags (`Cache::tags(['products'])`) als je Redis of Memcached gebruikt voor gerichte invalidatie.",
      "Houd de TTL van het lock kort (bijv. 5-15 seconden) en zet een veilige `block` timeout.",
      "Ververs zware caches via een periodieke scheduled job (`php artisan schedule:run`) vóórdat ze daadwerkelijk verlopen."
    ],
    documentationUrl: "https://laravel.com/docs/cache#atomic-locks"
  },
  {
    id: "route-model-binding-404",
    title: "ModelNotFoundException (404) & Soft Deletes",
    category: "database",
    badge: "Eloquent / Routing",
    tags: ["modelnotfoundexception", "404", "findorfail", "firstorfail", "softdeletes"],
    patterns: [
      "modelnotfoundexception",
      "no query results for model",
      "firstorfail",
      "soft deletes",
      "trashed"
    ],
    symptom: "Gebruikers ontvangen onverwacht HTTP 404 meldingen wanneer records gearchiveerd of gemigreerd zijn.",
    rootCause: "Implicit Route Model Binding zoekt standaard niet naar records die met `SoftDeletes` als verwijderd zijn gemarkeerd (`deleted_at IS NOT NULL`).",
    solutionTitle: "Configureer withTrashed() in route binding of gebruik firstOr() fallback",
    laravelVersions: "Laravel 8, 9, 10, 11+",
    speedup: "Voorkomt ongepaste 404 fouten en levert duidelijke foutmeldingen op",
    codeSnippet: `// 1. In routes/web.php of api.php:
// Sta het ophalen van soft-deleted models toe voor administrators:
Route::get('/orders/{order}', [OrderController::class, 'show'])
    ->withTrashed();

// 2. Of pas de binding aan in app/Providers/RouteServiceProvider.php:
Route::bind('active_user', function (string $value) {
    return User::where('id', $value)
        ->where('is_active', true)
        ->first() ?? abort(404, 'Deze account is gedeactiveerd.');
});`,
    diffSnippet: `- Route::get('/orders/{order}', [OrderController::class, 'show']);
+ Route::get('/orders/{order}', [OrderController::class, 'show'])->withTrashed();`,
    bestPractices: [
      "Gebruik `->withTrashed()` in admin routes om historische audittrails te kunnen bekijken.",
      "Vang gerichte uitzonderingen op in `bootstrap/app.php` (Laravel 11+) of `app/Exceptions/Handler.php` (Laravel 10).",
      "Gebruik `firstOr(function () { ... })` als je een custom fallback wilt in plaats van een harde 404."
    ],
    documentationUrl: "https://laravel.com/docs/routing#implicit-binding-and-soft-deleted-models"
  }
];

/**
 * Vindt het beste recept voor een gegeven exception, query of log entry.
 * 100% offline, geen tokens, nul latency.
 */
export function findRecipeForEvent(text: string, sql?: string): LaravelFixRecipe | null {
  const combined = `${text} ${sql || ""}`.toLowerCase();

  for (const recipe of LARAVEL_RECIPES) {
    const hasMatch = recipe.patterns.some(pattern => combined.includes(pattern.toLowerCase()));
    if (hasMatch) {
      return recipe;
    }
  }

  // Fallback op categorieën
  if (combined.includes("query") || combined.includes("select") || combined.includes("explain")) {
    return LARAVEL_RECIPES.find(r => r.id === "missing-composite-index") || null;
  }
  if (combined.includes("job") || combined.includes("queue")) {
    return LARAVEL_RECIPES.find(r => r.id === "queue-job-timeout-retry") || null;
  }
  if (combined.includes("memory") || combined.includes("limit")) {
    return LARAVEL_RECIPES.find(r => r.id === "memory-exhaustion-cursor") || null;
  }

  return null;
}
