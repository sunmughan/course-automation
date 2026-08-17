// Complete Laravel 11 Mastery Course (Zero to Hero)

export const laravelBackendCourse = {
  title: "Complete Laravel 11 Backend Mastery",
  description: "Master enterprise web applications and robust REST APIs with Laravel 11. Learn the Request Lifecycle, Routing, Controllers, Blade Components, Eloquent ORM relationships, Database Migrations, Sanctum API authentication, Form Requests, Queues with Redis workers, Events & Listeners, and Pest/PHPUnit testing.",
  slug: "laravel-mastery",
  stream: "backend",
  imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
  order: 4,
  modules: [
    {
      title: "Phase 1: Laravel Fundamentals, Request Lifecycle & Routing",
      description: "Understand the Laravel 11 request lifecycle, bootstrap architecture, routing pipelines, controllers, middleware, and Blade component rendering.",
      slug: "phase-1-laravel-architecture",
      topics: [
        {
          title: "Laravel Request Lifecycle & Routing Pipelines",
          description: "Explore index.php, Application container boot, Service Providers, Route Model Binding, route groups, and controller actions.",
          slug: "laravel-lifecycle-routing",
          difficulty: 2,
          prerequisites: [],
          concepts: [
            {
              title: "The Laravel 11 Request Lifecycle",
              description: "Every request enters `public/index.php`, loads Composer autoloader, boots the Application container via `bootstrap/app.php`, routes through global middleware, resolves matched routes, and executes controller actions."
            },
            {
              title: "Implicit Route Model Binding",
              description: "Laravel automatically injects database model instances directly into route parameters: `Route::get('/users/{user}', function (User $user) { ... })` fetches the matching record or returns an automatic 404 response."
            },
            {
              title: "Route Groups, Prefixes & Middleware",
              description: "Group routes with shared attributes (e.g. prefix 'api/v1', auth middleware 'auth:sanctum', rate limiting 'throttle:60,1') to keep routing clean and secure."
            }
          ],
          examples: [
            {
              title: "Laravel 11 Route Group & Model Binding",
              description: "Demonstrating RESTful routing with route groups and model injection",
              starterCode: `// routes/api.php
use App\\Http\\Controllers\\Api\\ProductController;
use Illuminate\\Support\\Facades\\Route;

Route::prefix('v1')->group(function () {
    // Register public and protected routes
});`,
              solutionCode: `// routes/api.php
use App\\Http\\Controllers\\Api\\ProductController;
use Illuminate\\Support\\Facades\\Route;

Route::prefix('v1')->group(function () {
    // Public routes
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{product}', [ProductController::class, 'show']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);
    });
});`,
              expectedOutput: "Routes registered: GET /v1/products, GET /v1/products/{product}, POST /v1/products"
            }
          ],
          exercises: [
            {
              title: "Define Versioned API Route Group",
              description: "Write a route definition that groups all '/api/v2' endpoints with auth:sanctum middleware and rate limiting",
              instructions: "Create a route group with prefix 'v2', middleware ['auth:sanctum', 'throttle:60,1'], registering resource 'orders'.",
              starterCode: `// Define versioned order route group in Laravel
Route::prefix('v2')->group(function () {
    // add middleware and resource routes
});`,
              solutionCode: `Route::prefix('v2')
    ->middleware(['auth:sanctum', 'throttle:60,1'])
    ->group(function () {
        Route::apiResource('orders', OrderController::class);
    });`,
              testCases: "Route prefix is v2; Middleware includes auth:sanctum and throttle:60,1; Registers apiResource orders",
              hints: "Use Route::prefix('v2')->middleware(...)->group(...)",
              difficulty: 2
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "Laravel 11 Request Lifecycle Pipeline",
              config: JSON.stringify({
                nodes: [
                  { id: "req", label: "HTTP Request\npublic/index.php", x: 80, y: 120 },
                  { id: "boot", label: "Bootstrap Container\nbootstrap/app.php", x: 260, y: 120 },
                  { id: "mid", label: "Middleware Pipeline\nCORS, Auth, Throttle", x: 440, y: 120 },
                  { id: "ctrl", label: "Controller Action\nModel Binding & Response", x: 640, y: 120 }
                ],
                edges: [
                  { from: "req", to: "boot", label: "autoload" },
                  { from: "boot", to: "mid", label: "service providers" },
                  { from: "mid", to: "ctrl", label: "pass pipeline" }
                ],
                steps: [
                  { id: "1", activeNodes: ["req", "boot"], description: "Request enters index.php and initializes the Laravel IoC container" },
                  { id: "2", activeNodes: ["boot", "mid"], description: "Middleware checks CORS, session state, and rate limits" },
                  { id: "3", activeNodes: ["mid", "ctrl"], description: "Router resolves model bindings and executes Controller action" }
                ]
              })
            }
          ],
          lesson: {
            title: "Laravel Request Lifecycle & Routing Pipelines",
            content: `## Laravel 11 Request Lifecycle

Laravel 11 simplifies the application skeleton by streamlining configuration directly into \`bootstrap/app.php\`.

### 1. The Core Flow
1. **Entry**: \`public/index.php\` loads Composer autoloader.
2. **Container Boot**: \`bootstrap/app.php\` creates application instance.
3. **Routing**: Matches URL against \`routes/web.php\` or \`routes/api.php\`.
4. **Middleware**: Executes before filters (Auth, Rate Limiting).
5. **Controller & Response**: Resolves dependencies via Container and returns HTTP Response.`,
            explanation: "Understand the core architecture of Laravel 11 from the HTTP entry point to controller resolution."
          }
        }
      ]
    },
    {
      title: "Phase 2: Eloquent ORM, Relationships & Database Migrations",
      description: "Master database migrations, schema builders, Eloquent models, and advanced relationships (1:1, 1:N, M:N, Polymorphic).",
      slug: "phase-2-eloquent-orm",
      topics: [
        {
          title: "Eloquent Models, Migrations & Complex Relationships",
          description: "Learn schema migrations, mass assignment protection, eager loading to prevent N+1 queries, and polymorphic relationships.",
          slug: "eloquent-models-relationships",
          difficulty: 3,
          prerequisites: [0],
          concepts: [
            {
              title: "Eloquent Active Record Pattern",
              description: "Every database table corresponds to an Eloquent Model. Properties represent table columns, and methods define relationships and query scopes."
            },
            {
              title: "The N+1 Query Problem & Eager Loading",
              description: "Lazy-loading relationships in a loop generates N+1 queries. Eloquent's `with(['user', 'comments'])` executes a single optimized `WHERE IN` query."
            },
            {
              title: "Polymorphic Relationships",
              description: "Polymorphic relations allow a model (e.g. `Comment` or `Image`) to belong to multiple parent models (e.g. `Post`, `Video`, `User`) using `commentable_type` and `commentable_id` columns."
            }
          ],
          examples: [
            {
              title: "Eloquent Relationships & Eager Loading in Laravel",
              description: "Defining One-to-Many and Polymorphic relationships with eager loading",
              starterCode: `// app/Models/Post.php
namespace App\\Models;
use Illuminate\\Database\\Eloquent\\Model;

class Post extends Model {
    protected $fillable = ['title', 'content', 'user_id'];
    // Define author and comments relationships
}`,
              solutionCode: `// app/Models/Post.php
namespace App\\Models;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;
use Illuminate\\Database\\Eloquent\\Relations\\MorphMany;

class Post extends Model {
    protected $fillable = ['title', 'content', 'user_id'];

    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }

    public function comments(): MorphMany {
        return $this->morphMany(Comment::class, 'commentable');
    }
}

// Controller Query with Eager Loading
$posts = Post::with(['user:id,name', 'comments'])->latest()->paginate(15);`,
              expectedOutput: "Post model with belongsTo user and morphMany comments"
            }
          ],
          exercises: [
            {
              title: "Create Migration with Foreign Key Constraints",
              description: "Write a Laravel migration creating an 'orders' table with foreign key to 'users' table and cascade on delete",
              instructions: "Create schema table with user_id foreignId, decimal total_amount, enum status, and timestamps.",
              starterCode: `// Migration definition
Schema::create('orders', function (Blueprint $table) {
    // Add columns
});`,
              solutionCode: `Schema::create('orders', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->decimal('total_amount', 10, 2);
    $table->enum('status', ['pending', 'processing', 'completed', 'cancelled'])->default('pending');
    $table->timestamps();
});`,
              testCases: "Foreign ID user_id references users with cascadeOnDelete; Decimal total_amount with precision 10,2; Enum status with default pending",
              hints: "Use $table->foreignId('user_id')->constrained()->cascadeOnDelete();",
              difficulty: 3
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "Eloquent Eager Loading (Solving N+1 Queries)",
              config: JSON.stringify({
                nodes: [
                  { id: "query", label: "Post::with('user')->get()", x: 80, y: 120 },
                  { id: "q1", label: "Query 1: SELECT * FROM posts LIMIT 10", x: 300, y: 60 },
                  { id: "q2", label: "Query 2: SELECT * FROM users WHERE id IN (1,2,5)", x: 300, y: 180 },
                  { id: "hydrate", label: "Hydrated Model Tree\n0 Duplicate DB Hits", x: 550, y: 120 }
                ],
                edges: [
                  { from: "query", to: "q1", label: "fetch posts" },
                  { from: "q1", to: "q2", label: "collect user IDs" },
                  { from: "q2", to: "hydrate", label: "bind instances" }
                ],
                steps: [
                  { id: "1", activeNodes: ["query", "q1"], description: "Primary query fetches the batch of posts" },
                  { id: "2", activeNodes: ["q1", "q2"], description: "Foreign keys extracted and queried in a single WHERE IN batch" },
                  { id: "3", activeNodes: ["q2", "hydrate"], description: "Models combined in memory with constant O(1) query overhead" }
                ]
              })
            }
          ],
          lesson: {
            title: "Eloquent Models, Migrations & Complex Relationships",
            content: `## Eloquent ORM Deep Dive

### 1. Relationship Types
- **1 to 1**: \`hasOne(Phone::class)\` / \`belongsTo(User::class)\`
- **1 to Many**: \`hasMany(Order::class)\` / \`belongsTo(User::class)\`
- **Many to Many**: \`belongsToMany(Role::class, 'role_user')\`
- **Polymorphic**: \`morphMany(Comment::class, 'commentable')\`

### 2. Preventing N+1 in Production
Always enable strict model checks in \`AppServiceProvider.php\`:
\`\`\`php
Model::preventLazyLoading(! app()->isProduction());
\`\`\``,
            explanation: "Master Eloquent ORM relationships, eager loading strategies, and migration schema design."
          }
        }
      ]
    },
    {
      title: "Phase 3: Sanctum API Authentication & Form Requests",
      description: "Build secure RESTful APIs using Laravel Sanctum token authentication, Form Request validation, and API Resources.",
      slug: "phase-3-sanctum-api-validation",
      topics: [
        {
          title: "Laravel Sanctum Authentication & Form Request Validation",
          description: "Implement token issuance, token revocation, fine-grained abilities, custom Form Requests, and JSON API Resources.",
          slug: "sanctum-auth-form-requests",
          difficulty: 3,
          prerequisites: [0, 1],
          concepts: [
            {
              title: "Laravel Sanctum Token Protocol",
              description: "Sanctum provides lightweight API token issuance using hashed SHA-256 tokens stored in the `personal_access_tokens` table, with support for token expiration and abilities ('posts:create', 'admin')."
            },
            {
              title: "Form Request Authorization & Rules",
              description: "Form Requests isolate validation rules and authorization logic from controllers, automatically returning 422 Unprocessable Entity responses with structured JSON validation error messages."
            },
            {
              title: "API Resources & Transformation",
              description: "API Resources transform models into formatted JSON responses, controlling data serialization, hiding internal database fields, and formatting timestamps."
            }
          ],
          examples: [
            {
              title: "Sanctum Login & Token Issuance in Laravel",
              description: "Authenticating user credentials and creating an API bearer token",
              starterCode: `// AuthController.php
public function login(Request $request) {
    // Validate credentials, verify password, issue Sanctum token
}`,
              solutionCode: `// AuthController.php
namespace App\\Http\\Controllers\\Api;

use App\\Models\\User;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Hash;
use Illuminate\\Validation\\ValidationException;

class AuthController extends Controller {
    public function login(Request $request) {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        // Issue token with abilities
        $token = $user->createToken('auth-token', ['*'], now()->addDays(7))->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }
}`,
              expectedOutput: "Returns JSON with bearer plainTextToken and user info"
            }
          ],
          exercises: [
            {
              title: "Write a Custom Form Request with Validation Rules",
              description: "Create a StoreArticleRequest class that validates title (required, unique:articles), body (required, min 100), and tags (array)",
              instructions: "Define rules() array returning title, body, and tags validation constraints.",
              starterCode: `class StoreArticleRequest extends FormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array {
        // Return validation rules
    }
}`,
              solutionCode: `class StoreArticleRequest extends FormRequest {
    public function authorize(): bool {
        return $this->user() !== null;
    }

    public function rules(): array {
        return [
            'title' => 'required|string|max:255|unique:articles,title',
            'body' => 'required|string|min:100',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ];
    }
}`,
              testCases: "Authorizes authenticated users; Requires unique title; Requires body with min 100 chars; Validates tags array",
              hints: "Use 'unique:articles,title' and 'tags.*' rule syntax.",
              difficulty: 3
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "Sanctum Token Authentication Flow",
              config: JSON.stringify({
                nodes: [
                  { id: "client", label: "Mobile / SPA Client\nPOST /api/login", x: 80, y: 120 },
                  { id: "auth", label: "Sanctum Auth\nVerify Hash::check()", x: 260, y: 120 },
                  { id: "token", label: "Token Generation\ncreateToken('token')", x: 440, y: 120 },
                  { id: "secure", label: "Protected Endpoints\nBearer Token Verified", x: 640, y: 120 }
                ],
                edges: [
                  { from: "client", to: "auth", label: "credentials" },
                  { from: "auth", to: "token", label: "valid user" },
                  { from: "token", to: "client", label: "plainTextToken" },
                  { from: "client", to: "secure", label: "Authorization: Bearer" }
                ],
                steps: [
                  { id: "1", activeNodes: ["client", "auth"], description: "Client sends credentials to Sanctum login endpoint" },
                  { id: "2", activeNodes: ["auth", "token"], description: "Password verified and SHA-256 token persisted to personal_access_tokens" },
                  { id: "3", activeNodes: ["token", "secure"], description: "Plaintext token returned to client for subsequent authenticated requests" }
                ]
              })
            }
          ],
          lesson: {
            title: "Laravel Sanctum Authentication & Form Request Validation",
            content: `## REST API Architecture in Laravel 11

### 1. Laravel Sanctum Authentication
Sanctum handles both SPA session cookie authentication and mobile/third-party API token authentication seamlessly without the heavy overhead of OAuth2 servers like Passport.

### 2. Form Request Architecture
Keep controllers thin by offloading request validation and authorization into dedicated Form Request classes.`,
            explanation: "Master building production-grade REST APIs in Laravel with token authentication and strict validation."
          }
        }
      ]
    },
    {
      title: "Phase 4: Queues, Jobs, Redis Workers & Events",
      description: "Scale Laravel applications with asynchronous background Jobs, Redis queues, Event Listeners, and Scheduled Tasks.",
      slug: "phase-4-queues-redis-events",
      topics: [
        {
          title: "Asynchronous Jobs, Queues & Event-Driven Architecture",
          description: "Learn dispatching jobs, Redis queue drivers, retry strategies, failed job handling, and Event-Listener decoupling.",
          slug: "queues-jobs-redis-events",
          difficulty: 4,
          prerequisites: [0, 1, 2],
          concepts: [
            {
              title: "Asynchronous Job Processing",
              description: "Heavy operations (sending emails, generating PDFs, processing AI completions) are pushed to background queues using `dispatch()`, returning immediate responses to users in milliseconds."
            },
            {
              title: "Queue Drivers & Horizon",
              description: "Laravel supports multiple queue backends: Database, Amazon SQS, and Redis. Laravel Horizon provides a real-time dashboard and auto-scaler for Redis queues."
            },
            {
              title: "Event-Driven Decoupling",
              description: "Events allow triggering multiple independent side-effects (e.g. `OrderPlaced` triggers `SendReceipt`, `UpdateInventory`, and `NotifySlack`) without tight coupling."
            }
          ],
          examples: [
            {
              title: "Laravel Queueable Job with Exponential Backoff",
              description: "A background job that processes video encoding with retries",
              starterCode: `// app/Jobs/ProcessVideo.php
class ProcessVideo implements ShouldQueue {
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    // Define job logic, tries, and backoff
}`,
              solutionCode: `// app/Jobs/ProcessVideo.php
namespace App\\Jobs;

use App\\Models\\Video;
use Illuminate\\Bus\\Queueable;
use Illuminate\\Contracts\\Queue\\ShouldQueue;
use Illuminate\\Foundation\\Bus\\Dispatchable;
use Illuminate\\Queue\\InteractsWithQueue;
use Illuminate\\Queue\\SerializesModels;
use Illuminate\\Support\\Facades\\Log;

class ProcessVideo implements ShouldQueue {
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 120;
    public array $backoff = [10, 30, 60];

    public function __construct(public Video $video) {}

    public function handle(): void {
        Log::info("Encoding video ID: {$this->video->id}");
        // Perform encoding pipeline
        $this->video->update(['status' => 'completed']);
    }

    public function failed(\\Throwable $exception): void {
        Log::error("Failed video encoding: " . $exception->getMessage());
        $this->video->update(['status' => 'failed']);
    }
}`,
              expectedOutput: "Queueable Job with retries, exponential backoff, and failed hook"
            }
          ],
          exercises: [
            {
              title: "Dispatch an Asynchronous Event",
              description: "Create an OrderPlaced event and dispatch it from a checkout method",
              instructions: "Write dispatching code for OrderPlaced::dispatch($order) and define listener.",
              starterCode: `// Dispatch order event
public function checkout(Order $order) {
    // Dispatch event
}`,
              solutionCode: `public function checkout(Order $order) {
    $order->update(['status' => 'paid']);
    OrderPlaced::dispatch($order);
    return response()->json(['message' => 'Order processed']);
}`,
              testCases: "Updates order status; Dispatches OrderPlaced event with order payload; Returns confirmation JSON",
              hints: "Call OrderPlaced::dispatch($order);",
              difficulty: 3
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "Laravel Queue & Redis Worker Architecture",
              config: JSON.stringify({
                nodes: [
                  { id: "web", label: "Web Request\nProcessVideo::dispatch()", x: 80, y: 120 },
                  { id: "redis", label: "Redis Queue\nFIFO Job Payload", x: 280, y: 120 },
                  { id: "worker", label: "Horizon Worker\nphp artisan queue:work", x: 480, y: 120 },
                  { id: "done", label: "Job Completed\nDatabase Updated", x: 670, y: 120 }
                ],
                edges: [
                  { from: "web", to: "redis", label: "push job" },
                  { from: "redis", to: "worker", label: "pull job" },
                  { from: "worker", to: "done", label: "execute handle()" }
                ],
                steps: [
                  { id: "1", activeNodes: ["web", "redis"], description: "Web controller dispatches heavy task to Redis in under 5ms" },
                  { id: "2", activeNodes: ["redis", "worker"], description: "Background queue daemon pulls job payload from Redis" },
                  { id: "3", activeNodes: ["worker", "done"], description: "Worker executes handle() method with automatic retries on failure" }
                ]
              })
            }
          ],
          lesson: {
            title: "Asynchronous Jobs, Queues & Event-Driven Architecture",
            content: `## Asynchronous Architecture in Laravel

### 1. Why Queues Matter
Web requests should complete in **< 200ms**. Any task involving external APIs, emails, PDF generation, or bulk calculations must be offloaded to background workers.

### 2. Failure Handling & Retries
- \`$tries = 3;\`: Attempts job up to 3 times.
- \`$backoff = [10, 30, 60];\`: Waits 10s, 30s, then 60s between retries.
- \`failed(Throwable $e)\`: Executes cleanup hook when all attempts fail.`,
            explanation: "Master background job queues, Redis workers, and event-driven architecture in Laravel 11."
          }
        }
      ]
    },
    {
      title: "Phase 5: Automated Testing with Pest PHP & Production Ops",
      description: "Write comprehensive unit and feature tests with Pest PHP, configure CI/CD pipelines, and deploy with Laravel Octane and Docker.",
      slug: "phase-5-testing-production-ops",
      topics: [
        {
          title: "Pest PHP Testing & High-Performance Octane Deployment",
          description: "Master Pest PHP testing syntax, database transactions in tests, HTTP feature assertions, and Laravel Octane (FrankenPHP/Swoole).",
          slug: "pest-testing-octane-deployment",
          difficulty: 4,
          prerequisites: [0, 1, 2, 3],
          concepts: [
            {
              title: "Pest PHP Testing Framework",
              description: "Pest is a modern testing framework for PHP with an expressive, functional syntax built on top of PHPUnit, featuring expectations (`expect($user->name)->toBe('Alice')`) and built-in architectural testing."
            },
            {
              title: "HTTP Feature Testing",
              description: "Laravel allows making simulated HTTP requests (`$this->actingAs($user)->postJson(...)`) and asserting status codes, JSON structures, and database records."
            },
            {
              title: "Laravel Octane for High Concurrency",
              description: "Octane supercharges Laravel performance by keeping the application loaded in memory using FrankenPHP, RoadRunner, or Swoole, serving thousands of requests per second with sub-10ms response times."
            }
          ],
          examples: [
            {
              title: "Pest PHP Feature Test for Authentication",
              description: "Writing an expressive HTTP API test with Pest PHP",
              starterCode: `// tests/Feature/AuthTest.php
test('user can authenticate and receive token', function () {
    // Create user and post to login endpoint
});`,
              solutionCode: `// tests/Feature/AuthTest.php
use App\\Models\\User;
use Illuminate\\Foundation\\Testing\\RefreshDatabase;

uses(RefreshDatabase::class);

test('user can authenticate and receive bearer token', function () {
    $user = User::factory()->create([
        'email' => 'alex@example.com',
        'password' => bcrypt('secret123'),
    ]);

    $response = $this->postJson('/api/v1/login', [
        'email' => 'alex@example.com',
        'password' => 'secret123',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'token',
            'user' => ['id', 'name', 'email'],
        ]);
});

test('unauthenticated users cannot access protected profile', function () {
    $response = $this->getJson('/api/v1/user');
    $response->assertStatus(401);
});`,
              expectedOutput: "PASS Tests\\Feature\\AuthTest (2 tests, 4 assertions)"
            }
          ],
          exercises: [
            {
              title: "Write an Architectural Test with Pest",
              description: "Write an architectural test ensuring all Controllers extend Controller and no debugging functions (dd, dump) remain in code",
              instructions: "Use arch() expectation to enforce controller inheritance and debugging bans.",
              starterCode: `// tests/ArchTest.php
test('app passes architectural rules', function () {
    // enforce architectural rules
});`,
              solutionCode: `// tests/ArchTest.php
arch('controllers extend base controller')
    ->expect('App\\Http\\Controllers')
    ->toExtend('App\\Http\\Controllers\\Controller');

arch('no debugging functions left in code')
    ->expect(['dd', 'dump', 'ray', 'var_dump'])
    ->not->toBeUsed();`,
              testCases: "Enforces controller inheritance; Bans dump, dd, and var_dump across entire codebase",
              hints: "Use arch()->expect(...)->toExtend(...) and not->toBeUsed().",
              difficulty: 4
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "Pest Automated Testing & CI/CD Pipeline",
              config: JSON.stringify({
                nodes: [
                  { id: "code", label: "Git Commit\nFeature Branch", x: 80, y: 120 },
                  { id: "pest", label: "Pest Test Suite\nUnit, Feature & Arch", x: 280, y: 120 },
                  { id: "octane", label: "Octane / FrankenPHP\nIn-Memory Production Engine", x: 480, y: 120 },
                  { id: "prod", label: "Zero-Downtime Release\nLive Server", x: 670, y: 120 }
                ],
                edges: [
                  { from: "code", to: "pest", label: "push" },
                  { from: "pest", to: "octane", label: "pass (100%)" },
                  { from: "octane", to: "prod", label: "deploy container" }
                ],
                steps: [
                  { id: "1", activeNodes: ["code", "pest"], description: "Pest runs unit, API feature, and architectural tests against test database" },
                  { id: "2", activeNodes: ["pest", "octane"], description: "High-performance Docker container built with FrankenPHP & Octane" },
                  { id: "3", activeNodes: ["octane", "prod"], description: "Zero-downtime deployment serving thousands of concurrent requests" }
                ]
              })
            }
          ],
          lesson: {
            title: "Pest PHP Testing & High-Performance Octane Deployment",
            content: `## Testing & Production Deployment

### 1. Pest PHP Advantages
Pest provides the cleanest, most concise testing syntax in the PHP ecosystem while maintaining 100% interoperability with PHPUnit.

### 2. Laravel Octane
Traditional PHP creates and destroys the entire application state on every HTTP request. Laravel Octane initializes the framework **once in memory**, reducing response times by **4x to 10x**!`,
            explanation: "Master automated testing with Pest PHP and production scaling with Laravel Octane."
          }
        }
      ]
    }
  ]
};
