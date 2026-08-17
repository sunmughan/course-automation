import { prisma } from "@/lib/db";

export interface ProjectFileData {
  id?: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isFolder?: boolean;
}

export interface CreateProjectInput {
  userId: string;
  name: string;
  description?: string;
  isPublic?: boolean;
  files?: ProjectFileData[];
}

export interface SaveSessionInput {
  projectId: string;
  userId: string;
  activeFileId?: string;
  cursorPos?: { line: number; column: number };
  openTabs?: string[];
}

export interface RecordExecutionInput {
  projectId: string;
  userId: string;
  entryFile?: string;
  language: string;
  code: string;
  output: string;
  error?: string;
  status: "success" | "error" | "timeout";
  exitCode?: number;
  executionTime?: number;
  memoryUsed?: number;
}

export const DEFAULT_PLAYGROUND_FILES: ProjectFileData[] = [
  {
    name: "src",
    path: "src",
    content: "",
    language: "folder",
    isFolder: true,
  },
  {
    name: "main.js",
    path: "src/main.js",
    content: `// ============================================================================
// SkillForge Playground: Multi-Language Cloud Execution Engine
// ============================================================================

function calculateDatasetMetrics(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return { count: 0, sum: 0, average: 0, min: 0, max: 0, median: 0 };
  }

  const sorted = [...numbers].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const average = Number((sum / sorted.length).toFixed(2));
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  return { count: sorted.length, sum, average, min, max, median };
}

console.log("=== SkillForge Backend Runtime Active ===");
const sampleData = [45, 12, 85, 32, 89, 39, 69, 44, 42, 1, 99];
const metrics = calculateDatasetMetrics(sampleData);

console.log("Input Dataset:", JSON.stringify(sampleData));
console.log("Computed Statistical Metrics:");
console.log(JSON.stringify(metrics, null, 2));
console.log("✓ Execution completed with status: SUCCESS");
`,
    language: "javascript",
    isFolder: false,
  },
  {
    name: "server.js",
    path: "src/server.js",
    content: `// ============================================================================
// Express.js REST API & Middleware Architecture Simulator
// ============================================================================

class ExpressAppSimulator {
  constructor() {
    this.routes = new Map();
    this.middlewares = [];
  }

  use(fn) {
    this.middlewares.push(fn);
  }

  get(path, handler) {
    this.routes.set(\`GET:\${path}\`, handler);
  }

  post(path, handler) {
    this.routes.set(\`POST:\${path}\`, handler);
  }

  dispatch(method, path, body = {}) {
    console.log(\`--> Incoming HTTP \${method} \${path}\`);
    const req = { method, path, body, headers: { 'user-agent': 'SkillForge-Client/1.0' } };
    const res = {
      statusCode: 200,
      json: (data) => console.log(\`<-- Response (\${res.statusCode}):\`, JSON.stringify(data)),
      status: (code) => { res.statusCode = code; return res; }
    };

    // Run Middleware Chain
    for (const mw of this.middlewares) {
      let nextCalled = false;
      mw(req, res, () => { nextCalled = true; });
      if (!nextCalled) return;
    }

    const handler = this.routes.get(\`\${method}:\${path}\`);
    if (handler) {
      handler(req, res);
    } else {
      res.status(404).json({ error: 'Route Not Found', path });
    }
  }
}

// Instantiate and Test
const app = new ExpressAppSimulator();

// Logger Middleware
app.use((req, res, next) => {
  console.log(\`[Audit Log] \${new Date().toISOString()} | \${req.method} \${req.path}\`);
  next();
});

// Register Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', uptime: '99.99%', engine: 'Node.js V8' });
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  res.status(201).json({ id: 'usr_' + Date.now(), name, email, role: 'developer' });
});

// Execute simulated requests
console.log("=== Testing Simulated Express Server ===");
app.dispatch('GET', '/api/health');
app.dispatch('POST', '/api/users', { name: 'Aarav Patel', email: 'aarav@skillforge.com' });
app.dispatch('GET', '/api/unknown');
`,
    language: "javascript",
    isFolder: false,
  },
  {
    name: "backend.php",
    path: "src/backend.php",
    content: `<?php
declare(strict_types=1);

enum UserRole: string {
    case Admin = 'admin';
    case Instructor = 'instructor';
    case Student = 'student';
}

final readonly class User {
    public function __construct(
        public string $id,
        public string $name,
        public string $email,
        public UserRole $role = UserRole::Student
    ) {}

    public function getPermissions(): array {
        return match ($this->role) {
            UserRole::Admin => ['create_course', 'grade_assessment', 'manage_users', 'view_analytics'],
            UserRole::Instructor => ['create_course', 'grade_assessment'],
            UserRole::Student => ['view_course', 'submit_code', 'run_tests'],
        };
    }
}

$admin = new User('usr_1', 'System Admin', 'admin@skillforge.com', UserRole::Admin);
$student = new User('usr_2', 'Alex Student', 'student@skillforge.com', UserRole::Student);

echo "=== Modern PHP 8+ RBAC Verification ===\\n";
echo "Admin User: " . $admin->name . " (Permissions: " . implode(', ', $admin->getPermissions()) . ")\\n";
echo "Student User: " . $student->name . " (Permissions: " . implode(', ', $student->getPermissions()) . ")\\n";
`,
    language: "php",
    isFolder: false,
  },
  {
    name: "README.md",
    path: "README.md",
    content: `# SkillForge Multi-Language Workspace

Welcome to your persistent cloud development playground!

### Quick Actions:
- Edit any file in the file explorer.
- Select your active code file and click **Run** to execute in the cloud runtime.
- Switch between different course project workspaces anytime from the Projects tab.
`,
    language: "markdown",
    isFolder: false,
  },
];

export function getProjectTemplateForStream(stream: string, title?: string): ProjectFileData[] {
  const normalizedStream = stream.toLowerCase();

  if (normalizedStream.includes("frontend")) {
    return [
      {
        name: "index.html",
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title || "Frontend Engineering Project"}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main id="app" class="dashboard-container">
    <header class="app-header">
      <h1>🚀 ${title || "Frontend Engineering Workspace"}</h1>
      <p class="subtitle">Interactive Component Architecture & State Management</p>
    </header>

    <section class="card-grid">
      <article class="metric-card">
        <span class="metric-label">Active Modules</span>
        <strong id="module-count" class="metric-val">8</strong>
      </article>
      <article class="metric-card">
        <span class="metric-label">Render Cycle</span>
        <strong id="render-latency" class="metric-val">16ms (60 FPS)</strong>
      </article>
      <article class="metric-card">
        <span class="metric-label">State Sync</span>
        <strong class="metric-val text-green">Connected</strong>
      </article>
    </section>

    <section class="interactive-area">
      <input type="text" id="item-input" placeholder="Enter new telemetry metric..." />
      <button id="add-btn" class="primary-btn">Add Telemetry Point</button>
      <ul id="telemetry-list" class="list-group"></ul>
    </section>
  </main>
  <script src="app.js"></script>
</body>
</html>`,
        language: "html",
        isFolder: false,
      },
      {
        name: "styles.css",
        path: "styles.css",
        content: `/* Modern Responsive CSS Grid & Glassmorphism Theme */
:root {
  --bg-primary: #0a0e1a;
  --bg-card: rgba(20, 27, 45, 0.85);
  --text-main: #f3f4f6;
  --text-muted: #9ca3af;
  --accent-blue: #3b82f6;
  --accent-green: #10b981;
  --border-subtle: rgba(255, 255, 255, 0.1);
}

* { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }

body { background: var(--bg-primary); color: var(--text-main); padding: 2rem; min-height: 100vh; }
.dashboard-container { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 2rem; }
.app-header h1 { font-size: 2rem; font-weight: 700; color: #fff; }
.subtitle { color: var(--text-muted); margin-top: 0.25rem; }

.card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
.metric-card { background: var(--bg-card); border: 1px solid var(--border-subtle); padding: 1.5rem; border-radius: 12px; }
.metric-label { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; display: block; }
.metric-val { font-size: 1.75rem; font-weight: 700; color: var(--accent-blue); margin-top: 0.5rem; display: block; }
.text-green { color: var(--accent-green) !important; }

.interactive-area { background: var(--bg-card); border: 1px solid var(--border-subtle); padding: 1.5rem; border-radius: 12px; display: flex; flex-direction: column; gap: 1rem; }
input { background: #0f172a; border: 1px solid var(--border-subtle); color: #fff; padding: 0.75rem 1rem; border-radius: 8px; font-size: 1rem; outline: none; }
input:focus { border-color: var(--accent-blue); }
.primary-btn { background: var(--accent-blue); color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
.primary-btn:hover { opacity: 0.9; }
.list-group { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
.list-group li { background: rgba(255, 255, 255, 0.05); padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.95rem; }`,
        language: "css",
        isFolder: false,
      },
      {
        name: "app.js",
        path: "app.js",
        content: `// Reactive DOM State Manager
class TelemetryStore {
  constructor() {
    this.items = ['Initial Sensor Baseline (OK)', 'Core Vitals LCP 1.2s (Passed)', 'Service Worker Registered'];
    this.listeners = [];
  }
  subscribe(fn) { this.listeners.push(fn); }
  notify() { this.listeners.forEach(fn => fn(this.items)); }
  add(item) {
    if (!item.trim()) return;
    this.items.push(item);
    this.notify();
  }
}

const store = new TelemetryStore();
const listEl = document.getElementById('telemetry-list');
const inputEl = document.getElementById('item-input');
const btnEl = document.getElementById('add-btn');

function render(items) {
  if (!listEl) return;
  listEl.innerHTML = items.map(item => \`<li>⚡ \${item}</li>\`).join('');
}

store.subscribe(render);
render(store.items);

btnEl?.addEventListener('click', () => {
  store.add(inputEl.value);
  inputEl.value = '';
});

console.log("Frontend UI Component Runtime initialized.");
`,
        language: "javascript",
        isFolder: false,
      },
      {
        name: "README.md",
        path: "README.md",
        content: `# ${title || "Frontend Engineering"} Project

### Instructions:
1. Inspect \`index.html\`, \`styles.css\`, and \`app.js\`.
2. Add input validation and local storage persistence to the \`TelemetryStore\`.
3. Run or test the client code in real time!
`,
        language: "markdown",
        isFolder: false,
      },
    ];
  }

  if (normalizedStream.includes("fullstack") || normalizedStream.includes("nextjs")) {
    return [
      {
        name: "app/page.tsx",
        path: "app/page.tsx",
        content: `// React Server Component (RSC) with Zero Client Bundle
import { Suspense } from 'react';
import { AnalyticsCard } from '../components/AnalyticsCard';
import { handleNewSubmission } from './actions';

export default async function FullStackDashboard() {
  const systemStatus = { uptime: '99.98%', activeUsers: 1420, buildMode: 'Next.js 15 Standalone' };

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6 text-white bg-slate-950 min-h-screen">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-sky-400">Next.js 15 Full-Stack Architecture</h1>
        <p className="text-slate-400">Server Actions, PPR, and Prisma Singleton Integration</p>
      </header>

      <Suspense fallback={<div className="animate-pulse bg-slate-800 h-24 rounded-lg" />}>
        <AnalyticsCard status={systemStatus} />
      </Suspense>

      <form action={handleNewSubmission} className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
        <h3 className="font-semibold text-lg">Mutate Server State via Server Action</h3>
        <input name="metricName" placeholder="Enter metric key (e.g. latency)" className="w-full bg-slate-950 p-2 rounded border border-slate-700" />
        <button type="submit" className="bg-sky-600 hover:bg-sky-500 px-4 py-2 rounded font-medium">Execute Action</button>
      </form>
    </main>
  );
}
`,
        language: "typescript",
        isFolder: false,
      },
      {
        name: "app/actions.ts",
        path: "app/actions.ts",
        content: `'use server';

export async function handleNewSubmission(formData: FormData) {
  const metric = formData.get('metricName');
  console.log('[Server Action] Mutating server state with metric:', metric);
  return { success: true, timestamp: new Date().toISOString() };
}
`,
        language: "typescript",
        isFolder: false,
      },
      {
        name: "components/AnalyticsCard.tsx",
        path: "components/AnalyticsCard.tsx",
        content: `'use client';

export function AnalyticsCard({ status }: { status: { uptime: string; activeUsers: number; buildMode: string } }) {
  return (
    <div className="grid grid-cols-3 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
      <div><span className="text-xs text-slate-400">Uptime</span><p className="text-xl font-bold text-emerald-400">{status.uptime}</p></div>
      <div><span className="text-xs text-slate-400">Active Users</span><p className="text-xl font-bold text-sky-400">{status.activeUsers}</p></div>
      <div><span className="text-xs text-slate-400">Runtime</span><p className="text-xl font-bold text-indigo-400">{status.buildMode}</p></div>
    </div>
  );
}
`,
        language: "typescript",
        isFolder: false,
      },
      {
        name: "README.md",
        path: "README.md",
        content: `# Next.js 15 Full-Stack Project

This project demonstrates:
- **Server Components** rendering directly on the server.
- **Server Actions** mutating database state with validation.
- **Client Boundary Component** for interactive UI updates.
`,
        language: "markdown",
        isFolder: false,
      },
    ];
  }

  if (normalizedStream.includes("ai") || normalizedStream.includes("prompt")) {
    return [
      {
        name: "rag_pipeline.py",
        path: "rag_pipeline.py",
        content: `"""
Enterprise RAG (Retrieval-Augmented Generation) & Agentic Reasoning Engine
"""
import math
import json

class DenseVectorStore:
    def __init__(self):
        self.documents = []
        self.vectors = []

    def add_document(self, doc_id: str, text: str, embedding: list[float]):
        self.documents.append({"id": doc_id, "text": text})
        self.vectors.append(embedding)

    def cosine_similarity(self, v1: list[float], v2: list[float]) -> float:
        dot = sum(a * b for a, b in zip(v1, v2))
        norm_a = math.sqrt(sum(a * a for a in v1))
        norm_b = math.sqrt(sum(b * b for b in v2))
        return dot / (norm_a * norm_b) if norm_a and norm_b else 0.0

    def query(self, query_vec: list[float], top_k: int = 2):
        scores = [
            (doc, self.cosine_similarity(query_vec, vec))
            for doc, vec in zip(self.documents, self.vectors)
        ]
        return sorted(scores, key=lambda x: x[1], reverse=True)[:top_k]

# Initialize Knowledge Base
store = DenseVectorStore()
store.add_document("doc_1", "Transformer attention uses Q, K, V matrices to compute contextual relevance.", [0.85, 0.12, 0.45])
store.add_document("doc_2", "KV-caching stores past keys and values to prevent redundant computation in autoregression.", [0.88, 0.15, 0.49])
store.add_document("doc_3", "Standard SQL databases use B-tree indices for fast range lookups.", [0.10, 0.85, 0.20])

query_vector = [0.86, 0.14, 0.47] # Query regarding transformer memory
results = store.query(query_vector, top_k=2)

print("=== RAG Vector Retrieval Results ===")
for doc, score in results:
    print(f"[{score:.4f}] {doc['id']}: {doc['text']}")
`,
        language: "python",
        isFolder: false,
      },
      {
        name: "agent_supervisor.py",
        path: "agent_supervisor.py",
        content: `"""
Multi-Agent Cognitive Supervisor with ReAct Loop
"""
class ResearchAgent:
    def execute(self, query: str) -> str:
        return f"Research Finding: Attention head scaling reduces perplexity for query '{query}'."

class SynthesisAgent:
    def synthesize(self, findings: list[str]) -> str:
        return "Synthesis Report: " + " | ".join(findings)

class MultiAgentSupervisor:
    def __init__(self):
        self.researcher = ResearchAgent()
        self.synthesizer = SynthesisAgent()

    def run_task(self, prompt: str):
        print(f"[Supervisor] Delegating prompt: '{prompt}'")
        finding = self.researcher.execute(prompt)
        final_output = self.synthesizer.synthesize([finding])
        return final_output

supervisor = MultiAgentSupervisor()
result = supervisor.run_task("Evaluate Transformer GQA efficiency")
print("Agent Swarm Result:", result)
`,
        language: "python",
        isFolder: false,
      },
      {
        name: "README.md",
        path: "README.md",
        content: `# AI & Large Language Models Project

Includes:
- Dense Vector Store & Cosine Similarity search (\`rag_pipeline.py\`).
- Multi-Agent Orchestration & ReAct loops (\`agent_supervisor.py\`).
`,
        language: "markdown",
        isFolder: false,
      },
    ];
  }

  if (normalizedStream.includes("data") || normalizedStream.includes("science")) {
    return [
      {
        name: "analysis.py",
        path: "analysis.py",
        content: `"""
Statistical Inference & Vectorized NumPy Pipeline
"""
import numpy as np

def calculate_welch_ttest(control: np.ndarray, variant: np.ndarray):
    n1, n2 = len(control), len(variant)
    mean1, mean2 = np.mean(control), np.mean(variant)
    var1, var2 = np.var(control, ddof=1), np.var(variant, ddof=1)

    t_stat = (mean1 - mean2) / np.sqrt((var1 / n1) + (var2 / n2))
    df = ((var1 / n1 + var2 / n2) ** 2) / (
        ((var1 / n1) ** 2) / (n1 - 1) + ((var2 / n2) ** 2) / (n2 - 1)
    )
    return {"t_statistic": float(t_stat), "degrees_of_freedom": float(df), "lift_pct": float(((mean2 - mean1) / mean1) * 100)}

# Simulated A/B Test Experiment
np.random.seed(42)
control_group = np.random.normal(loc=100.0, scale=15.0, size=250)
variant_group = np.random.normal(loc=104.5, scale=14.5, size=250)

results = calculate_welch_ttest(control_group, variant_group)
print("=== A/B Experiment Statistical Results ===")
for k, v in results.items():
    print(f"{k}: {v:.4f}")
`,
        language: "python",
        isFolder: false,
      },
      {
        name: "dataset.csv",
        path: "dataset.csv",
        content: `user_id,cohort_date,revenue,retention_day_7
101,2026-08-01,45.50,1
102,2026-08-01,0.00,0
103,2026-08-02,120.00,1
104,2026-08-02,35.00,1
105,2026-08-03,85.20,0
`,
        language: "csv",
        isFolder: false,
      },
      {
        name: "README.md",
        path: "README.md",
        content: `# Data Science & Machine Learning Project

Analyze statistical distributions, cohort retention, and hypothesis testing.
`,
        language: "markdown",
        isFolder: false,
      },
    ];
  }

  if (normalizedStream.includes("devops")) {
    return [
      {
        name: "Dockerfile",
        path: "Dockerfile",
        content: `# Multi-stage Hardened Production Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build 2>/dev/null || true

FROM node:20-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder --chown=appuser:appgroup /app ./
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "src/server.js"]
`,
        language: "dockerfile",
        isFolder: false,
      },
      {
        name: "docker-compose.yml",
        path: "docker-compose.yml",
        content: `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://cache:6379
    depends_on:
      - cache

  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"
`,
        language: "yaml",
        isFolder: false,
      },
      {
        name: "k8s/deployment.yaml",
        path: "k8s/deployment.yaml",
        content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-service
  template:
    metadata:
      labels:
        app: web-service
    spec:
      containers:
      - name: web
        image: registry.skillforge.com/web-service:v1.0.0
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"
          requests:
            cpu: "100m"
            memory: "128Mi"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
`,
        language: "yaml",
        isFolder: false,
      },
      {
        name: "README.md",
        path: "README.md",
        content: `# DevOps & Cloud Infrastructure Project

Contains multi-stage Docker build, Docker Compose service topology, and Kubernetes manifests.
`,
        language: "markdown",
        isFolder: false,
      },
    ];
  }

  return DEFAULT_PLAYGROUND_FILES;
}

export class PlaygroundService {
  /**
   * Retrieves or initializes the default persistent workspace for a user.
   */
  static async getOrCreateDefaultProject(userId: string) {
    let project = await prisma.playgroundProject.findFirst({
      where: { userId, name: "Default Workspace" },
      include: {
        files: { orderBy: { path: "asc" } },
        sessions: { where: { userId }, orderBy: { updatedAt: "desc" }, take: 1 },
      },
    });

    if (!project) {
      project = await this.createProject({
        userId,
        name: "Default Workspace",
        description: "Primary persistent interactive code playground",
        files: DEFAULT_PLAYGROUND_FILES,
      }) as any;
    }

    return project;
  }

  /**
   * Retrieves or initializes a workspace for a specific course or context.
   */
  static async getOrCreateProjectForContext(userId: string, contextIdOrSlug: string) {
    // 1. Check if contextIdOrSlug matches an existing playground project directly
    const existing = await prisma.playgroundProject.findFirst({
      where: {
        OR: [
          { id: contextIdOrSlug, userId },
          { name: contextIdOrSlug, userId },
        ],
      },
      include: {
        files: { orderBy: { path: "asc" } },
        sessions: { where: { userId }, orderBy: { updatedAt: "desc" }, take: 1 },
      },
    });

    if (existing) {
      return existing;
    }

    // 2. Check if contextIdOrSlug corresponds to a Course
    const course = await prisma.course.findFirst({
      where: {
        OR: [
          { id: contextIdOrSlug },
          { slug: contextIdOrSlug },
        ],
      },
    });

    if (course) {
      // Check if user already has a project for this course
      const courseProject = await prisma.playgroundProject.findFirst({
        where: {
          userId,
          name: course.title,
        },
        include: {
          files: { orderBy: { path: "asc" } },
          sessions: { where: { userId }, orderBy: { updatedAt: "desc" }, take: 1 },
        },
      });

      if (courseProject) {
        return courseProject;
      }

      // Generate tailored starter template based on course stream
      const templateFiles = getProjectTemplateForStream(course.stream, course.title);
      return this.createProject({
        userId,
        name: course.title,
        description: course.description ?? undefined,
        files: templateFiles,
      });
    }

    return this.getOrCreateDefaultProject(userId);
  }

  /**
   * Lists all projects owned by the user.
   */
  static async listProjects(userId: string) {
    return prisma.playgroundProject.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { files: true, executions: true } },
      },
    });
  }

  /**
   * Retrieves full project details, file tree, active session, and recent execution history.
   */
  static async getProject(projectId: string, userId: string) {
    const project = await prisma.playgroundProject.findUnique({
      where: { id: projectId },
      include: {
        files: { orderBy: { path: "asc" } },
        sessions: { where: { userId }, orderBy: { updatedAt: "desc" }, take: 1 },
        executions: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!project || (project.userId !== userId && !project.isPublic)) {
      return null;
    }

    return project;
  }

  /**
   * Creates a new persistent project with initial files.
   */
  static async createProject(input: CreateProjectInput) {
    const { userId, name, description, isPublic = false, files = DEFAULT_PLAYGROUND_FILES } = input;

    const firstCodeFile = files.find(f => !f.isFolder && (f.path.endsWith('.js') || f.path.endsWith('.ts') || f.path.endsWith('.py') || f.path.endsWith('.html') || f.path.endsWith('.php'))) || files[0];
    const initialActiveFile = firstCodeFile ? firstCodeFile.path : "src/main.js";

    const project = await prisma.playgroundProject.create({
      data: {
        userId,
        name,
        description,
        isPublic,
        files: {
          create: files.map((f) => ({
            name: f.name,
            path: f.path,
            content: f.content,
            language: f.language,
            isFolder: f.isFolder ?? false,
          })),
        },
        sessions: {
          create: {
            userId,
            activeFileId: initialActiveFile,
            openTabs: JSON.stringify([initialActiveFile]),
          },
        },
      },
      include: {
        files: true,
        sessions: true,
      },
    });

    return project;
  }

  /**
   * Upserts a file or folder in a project.
   */
  static async saveFile(params: {
    projectId: string;
    userId: string;
    path: string;
    name?: string;
    content: string;
    language?: string;
    isFolder?: boolean;
  }) {
    const { projectId, userId, path, content, isFolder = false } = params;

    const project = await prisma.playgroundProject.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project || project.userId !== userId) {
      throw new Error("Project not found or unauthorized");
    }

    const segments = path.split("/").filter(Boolean);
    const fileName = params.name || segments[segments.length - 1] || "file";
    const inferredLanguage = params.language || this.inferLanguage(fileName);

    const file = await prisma.projectFile.upsert({
      where: {
        projectId_path: {
          projectId,
          path,
        },
      },
      create: {
        projectId,
        name: fileName,
        path,
        content,
        language: inferredLanguage,
        isFolder,
      },
      update: {
        name: fileName,
        content,
        language: inferredLanguage,
        isFolder,
        updatedAt: new Date(),
      },
    });

    await prisma.playgroundProject.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    return file;
  }

  /**
   * Deletes a file or directory path within a project.
   */
  static async deleteFile(projectId: string, userId: string, path: string) {
    const project = await prisma.playgroundProject.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project || project.userId !== userId) {
      throw new Error("Project not found or unauthorized");
    }

    const result = await prisma.projectFile.deleteMany({
      where: {
        projectId,
        OR: [
          { path },
          { path: { startsWith: `${path}/` } },
        ],
      },
    });

    await prisma.playgroundProject.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    return { success: true, count: result.count, deletedCount: result.count };
  }

  /**
   * Saves active user session (cursor, active file, open tabs).
   */
  static async saveSession(input: SaveSessionInput) {
    const { projectId, userId, activeFileId, cursorPos, openTabs } = input;

    const existingSession = await prisma.projectSession.findFirst({
      where: { projectId, userId },
    });

    if (existingSession) {
      return prisma.projectSession.update({
        where: { id: existingSession.id },
        data: {
          activeFileId: activeFileId || existingSession.activeFileId,
          cursorPos: cursorPos ? JSON.stringify(cursorPos) : existingSession.cursorPos,
          openTabs: openTabs ? JSON.stringify(openTabs) : existingSession.openTabs,
          updatedAt: new Date(),
        },
      });
    }

    return prisma.projectSession.create({
      data: {
        projectId,
        userId,
        activeFileId: activeFileId || "src/main.js",
        cursorPos: cursorPos ? JSON.stringify(cursorPos) : null,
        openTabs: openTabs ? JSON.stringify(openTabs) : "[]",
      },
    });
  }

  /**
   * Records a code execution event in the project audit history.
   */
  static async recordExecution(input: RecordExecutionInput) {
    const {
      projectId,
      userId,
      entryFile = "src/main.js",
      language,
      code,
      output,
      error,
      status,
      exitCode = 0,
      executionTime = 0,
      memoryUsed = 0,
    } = input;

    return prisma.projectExecution.create({
      data: {
        projectId,
        userId,
        entryFile,
        language,
        code,
        output,
        error: error || null,
        status,
        exitCode,
        executionTime,
        memoryUsed,
      },
    });
  }

  /**
   * Deletes a project and all associated files, sessions, and executions.
   */
  static async deleteProject(projectId: string, userId: string) {
    const project = await prisma.playgroundProject.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project || project.userId !== userId) {
      throw new Error("Project not found or unauthorized");
    }

    await prisma.playgroundProject.delete({
      where: { id: projectId },
    });

    return { success: true };
  }

  private static inferLanguage(fileName: string): string {
    if (fileName.endsWith(".js") || fileName.endsWith(".jsx")) return "javascript";
    if (fileName.endsWith(".ts") || fileName.endsWith(".tsx")) return "typescript";
    if (fileName.endsWith(".py")) return "python";
    if (fileName.endsWith(".css")) return "css";
    if (fileName.endsWith(".html")) return "html";
    if (fileName.endsWith(".json")) return "json";
    if (fileName.endsWith(".md")) return "markdown";
    if (fileName.endsWith(".sql")) return "sql";
    if (fileName.endsWith(".yml") || fileName.endsWith(".yaml")) return "yaml";
    if (fileName.endsWith("Dockerfile")) return "dockerfile";
    return "javascript";
  }
}
