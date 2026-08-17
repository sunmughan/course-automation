// Complete Next.js 15+ Full-Stack Architecture Course (Zero to Hero)

export const nextjsFullstackCourse = {
  title: "Next.js 15+ Full-Stack Architecture",
  description: "Master enterprise full-stack development with Next.js 15, React 19, App Router, React Server Components (RSC), Server Actions, Partial Prerendering (PPR), Caching strategies, Auth.js v5 authentication, and Prisma/PostgreSQL database integration.",
  slug: "nextjs-fullstack-architecture",
  stream: "fullstack",
  imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
  order: 2,
  modules: [
    {
      title: "Phase 1: App Router & React Server Components (RSC)",
      description: "Understand the Next.js 15 App Router architecture, React Server Components, Client Components boundary, streaming with Suspense, and layouts.",
      slug: "phase-1-app-router-rsc",
      topics: [
        {
          title: "React Server Components (RSC) vs Client Components",
          description: "Learn how Server Components execute exclusively on the server, zero client bundle size, 'use client' directives, and component tree serialization.",
          slug: "rsc-vs-client-components",
          difficulty: 3,
          prerequisites: [],
          concepts: [
            {
              title: "React Server Components Architecture",
              description: "In Next.js App Router, all components inside `app/` are React Server Components by default. They can query databases and read filesystem directly with zero client-side JavaScript overhead."
            },
            {
              title: "The 'use client' Directive Boundary",
              description: "'use client' marks the boundary between server-only and client-interactive code. It does NOT make a component render only on the client — it enables client hydration for React hooks (`useState`, `useEffect`) and browser event listeners."
            },
            {
              title: "Streaming SSR with React Suspense",
              description: "Instead of waiting for all data before sending HTML, Next.js streams initial page skeleton instantly and streams slower data-dependent components as they resolve via `<Suspense fallback={<Skeleton />}>`."
            }
          ],
          examples: [
            {
              title: "Server Component Direct Database Query with Suspense",
              description: "Fetching database data directly inside an async Server Component with streaming suspense",
              starterCode: `// app/dashboard/page.tsx
export default async function DashboardPage() {
    // Query data directly on server and render
}`,
              solutionCode: `// app/dashboard/page.tsx
import { Suspense } from 'react';
import { prisma } from '@/lib/db';

async function UserStats() {
    const userCount = await prisma.user.count();
    return <div className="p-4 bg-zinc-900 rounded-lg">Total Active Users: {userCount}</div>;
}

export default async function DashboardPage() {
    return (
        <main className="p-8">
            <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
            <Suspense fallback={<div className="animate-pulse h-16 bg-zinc-800 rounded-lg" />}>
                <UserStats />
            </Suspense>
        </main>
    );
}`,
              expectedOutput: "Async Server Component with streaming Suspense skeleton"
            }
          ],
          exercises: [
            {
              title: "Build a Server-Client Component Boundary",
              description: "Create an interactive Client Component for like button and pass server-fetched count as props from Server Component",
              instructions: "Define LikeButton with 'use client' and render it inside an async PostPage server component.",
              starterCode: `// LikeButton.tsx (Client) and PostPage.tsx (Server)
export function LikeButton() {}
export default async function PostPage() {}`,
              solutionCode: `// LikeButton.tsx
'use client';
import { useState } from 'react';

export function LikeButton({ initialLikes }: { initialLikes: number }) {
    const [likes, setLikes] = useState(initialLikes);
    return (
        <button 
            onClick={() => setLikes(l => l + 1)}
            className="px-4 py-2 bg-blue-600 text-white rounded"
        >
            Likes: {likes}
        </button>
    );
}

// app/posts/[id]/page.tsx (Server Component)
export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <div>
            <h1>Post {id}</h1>
            <LikeButton initialLikes={42} />
        </div>
    );
}`,
              testCases: "LikeButton marked with 'use client'; PostPage is async Server Component; Initial state passed via props",
              hints: "Put 'use client' at top of interactive button and import into Server Component.",
              difficulty: 2
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "React Server Components (RSC) vs Client Boundary",
              config: JSON.stringify({
                nodes: [
                  { id: "server", label: "Server Component\nExecutes on Node.js / V8 (0kb JS)", x: 80, y: 120 },
                  { id: "stream", label: "RSC Payload Stream\nSerialized Virtual DOM Tree", x: 300, y: 120 },
                  { id: "boundary", label: "'use client' Island\nInteractive Hydration Boundary", x: 520, y: 120 },
                  { id: "dom", label: "Fast Interactive UI\nInstant Paint + Hydration", x: 720, y: 120 }
                ],
                edges: [
                  { from: "server", to: "stream", label: "direct DB query" },
                  { from: "stream", to: "boundary", label: "stream HTML" },
                  { from: "boundary", to: "dom", label: "hydrate state" }
                ],
                steps: [
                  { id: "1", activeNodes: ["server", "stream"], description: "Server components query database directly with 0 client JS bundle size" },
                  { id: "2", activeNodes: ["stream", "boundary"], description: "HTML and RSC payload streamed progressively to the browser" },
                  { id: "3", activeNodes: ["boundary", "dom"], description: "Only interactive 'use client' components are hydrated with event listeners" }
                ]
              })
            }
          ],
          lesson: {
            title: "React Server Components (RSC) vs Client Components",
            content: `## Next.js 15 App Router & RSC Architecture

### 1. Server Components vs Client Components
| Feature | Server Components (Default) | Client Components (\`'use client'\`) |
|---|---|---|
| **Execution** | Server-only (build or request) | Server SSR + Client Browser |
| **Database Access** | Direct (\`prisma\`, \`sql\`, \`fs\`) | Via Server Actions / API |
| **Bundle Impact** | 0 KB JavaScript sent to browser | Included in client JS bundle |
| **React Hooks** | ❌ No (\`useState\`, \`useEffect\`) | ✅ Yes |
| **Event Listeners** | ❌ No (\`onClick\`, \`onChange\`) | ✅ Yes |

### 2. Composition Rules
- Import Client Components into Server Components.
- Pass Server Components as \`children\` into Client Components to preserve server-side rendering!`,
            explanation: "Understand the React Server Components paradigm that powers modern Next.js 15 full-stack applications."
          }
        }
      ]
    },
    {
      title: "Phase 2: Server Actions, Form Mutations & Zod Validation",
      description: "Master Next.js 15 Server Actions, progressive enhancement, form mutations, useActionState, useOptimistic, and schema validation with Zod.",
      slug: "phase-2-server-actions-mutations",
      topics: [
        {
          title: "Server Actions, Optimistic UI & Form Validation",
          description: "Implement type-safe Server Actions, form validation with Zod, instant feedback with useOptimistic, and cache revalidation.",
          slug: "server-actions-optimistic-ui",
          difficulty: 3,
          prerequisites: [0],
          concepts: [
            {
              title: "What are Server Actions?",
              description: "Server Actions are asynchronous functions defined with the `'use server'` directive that execute on the server, callable directly from Client Components or HTML `<form action={...}>` without writing manual REST endpoints."
            },
            {
              title: "useOptimistic for Zero-Latency UI",
              description: "The `useOptimistic` hook allows immediately updating the UI with expected state before the server mutation finishes, automatically reverting if the action fails."
            },
            {
              title: "Zod Schema Validation & Safe Action Pattern",
              description: "Validating inputs on the server using Zod schemas (`UserSchema.safeParse(data)`) ensures strict type safety and structured error reporting."
            }
          ],
          examples: [
            {
              title: "Next.js 15 Server Action with Zod Validation",
              description: "A secure server action that validates form input, mutates database, and revalidates cache",
              starterCode: `// app/actions/create-task.ts
'use server';
export async function createTask(prevState: any, formData: FormData) {
    // Validate with Zod and save to DB
}`,
              solutionCode: `// app/actions/create-task.ts
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

const TaskSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});

export async function createTask(prevState: any, formData: FormData) {
    const validated = TaskSchema.safeParse({
        title: formData.get('title'),
        priority: formData.get('priority'),
    });

    if (!validated.success) {
        return {
            success: false,
            errors: validated.error.flatten().fieldErrors,
        };
    }

    try {
        await prisma.task.create({
            data: validated.data,
        });

        revalidatePath('/dashboard/tasks');
        return { success: true, errors: null };
    } catch (error) {
        return { success: false, errors: { form: ['Database error occurred'] } };
    }
}`,
              expectedOutput: "Type-safe Server Action with Zod validation and cache revalidation"
            }
          ],
          exercises: [
            {
              title: "Build an Optimistic Like Server Action",
              description: "Write a server action and client component that uses useOptimistic to update like counter instantly",
              instructions: "Implement toggleLikeAction(postId) with revalidatePath and wrap in useOptimistic.",
              starterCode: `// actions.ts & LikeComponent.tsx
'use server';
export async function toggleLike(postId: string) {}`,
              solutionCode: `// app/actions.ts
'use server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function toggleLike(postId: string) {
    await prisma.post.update({
        where: { id: postId },
        data: { likes: { increment: 1 } },
    });
    revalidatePath('/posts');
}`,
              testCases: "Server action increments post likes; Calls revalidatePath; Updates database safely",
              hints: "Use prisma.post.update with data: { likes: { increment: 1 } }.",
              difficulty: 3
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "Next.js 15 Server Action & Cache Revalidation",
              config: JSON.stringify({
                nodes: [
                  { id: "form", label: "Form Submit / Button\nCalls Server Action", x: 80, y: 120 },
                  { id: "zod", label: "Zod Validation\nType & Schema Check", x: 280, y: 120 },
                  { id: "db", label: "Database Mutation\nPrisma / Drizzle", x: 480, y: 120 },
                  { id: "reval", label: "revalidatePath()\nAutomatic UI Refresh", x: 670, y: 120 }
                ],
                edges: [
                  { from: "form", to: "zod", label: "dispatch" },
                  { from: "zod", to: "db", label: "safe payload" },
                  { from: "db", to: "reval", label: "purge cache tag" }
                ],
                steps: [
                  { id: "1", activeNodes: ["form", "zod"], description: "Client invokes Server Action directly via RPC protocol" },
                  { id: "2", activeNodes: ["zod", "db"], description: "Server validates schema using Zod and executes database transaction" },
                  { id: "3", activeNodes: ["db", "reval"], description: "Cache tags purged; fresh HTML streamed back without full page reload" }
                ]
              })
            }
          ],
          lesson: {
            title: "Server Actions, Optimistic UI & Form Validation",
            content: `## Server Actions & Full-Stack Mutations

Server Actions replace traditional API route boilerplates (\`/api/tasks/create\`) with simple server functions.

### Key Advantages:
1. **Zero API Boilerplate**: Direct function calls across client-server boundaries.
2. **Progressive Enhancement**: Forms work even before client JavaScript has finished downloading.
3. **Automatic Cache Revalidation**: \`revalidatePath('/dashboard')\` immediately purges stale server cache and re-renders affected UI.`,
            explanation: "Master Server Actions, optimistic UI patterns, and input validation in Next.js 15."
          }
        }
      ]
    },
    {
      title: "Phase 3: Data Fetching, Caching & Partial Prerendering (PPR)",
      description: "Master the Next.js 15 caching architecture: Request Memoization, Data Cache, Full Route Cache, Router Cache, and Partial Prerendering (PPR).",
      slug: "phase-3-caching-ppr",
      topics: [
        {
          title: "Next.js 15 Caching Architecture & Partial Prerendering",
          description: "Understand fetch caching defaults, unstable_cache, cache tags (revalidateTag), on-demand revalidation, and Partial Prerendering (PPR).",
          slug: "caching-architecture-ppr",
          difficulty: 4,
          prerequisites: [0, 1],
          concepts: [
            {
              title: "Next.js 15 Caching Defaults",
              description: "In Next.js 15, `fetch` requests and GET route handlers are un-cached by default (`no-store`), ensuring dynamic data freshness unless explicitly configured with `cache: 'force-cache'` or `next: { revalidate: 60 }`."
            },
            {
              title: "Tag-Based Cache Invalidation",
              description: "Attaching tags to fetched data (`next: { tags: ['products'] }`) enables instant on-demand invalidation via `revalidateTag('products')` from anywhere in your backend."
            },
            {
              title: "Partial Prerendering (PPR)",
              description: "PPR combines static shell prerendering with dynamic streaming: the static navigation shell is served instantly from edge CDN, while dynamic personalized content streams into `<Suspense>` holes."
            }
          ],
          examples: [
            {
              title: "Tag-Based Cached Data Fetching in Next.js 15",
              description: "Using fetch with cache tags and on-demand revalidation",
              starterCode: `// lib/api.ts
export async function getProducts() {
    // Fetch products with cache tag 'products'
}`,
              solutionCode: `// lib/api.ts
export async function getProducts() {
    const res = await fetch('https://api.example.com/products', {
        next: {
            tags: ['products'],
            revalidate: 3600, // Revalidate background every hour
        },
    });

    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
}

// In a Server Action after creating a product:
import { revalidateTag } from 'next/cache';

export async function onProductCreated() {
    revalidateTag('products'); // Instantly purges cache across all edge regions
}`,
              expectedOutput: "Cached fetch with tags and on-demand revalidation"
            }
          ],
          exercises: [
            {
              title: "Configure On-Demand Cache Invalidation",
              description: "Write a webhook handler that verifies secret token and calls revalidateTag for dynamic content",
              instructions: "Export POST handler reading searchParams secret and tag to call revalidateTag(tag).",
              starterCode: `// app/api/revalidate/route.ts
export async function POST(request: Request) {
    // Validate secret and revalidate tag
}`,
              solutionCode: `// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const secret = request.nextUrl.searchParams.get('secret');
    const tag = request.nextUrl.searchParams.get('tag');

    if (secret !== process.env.REVALIDATION_SECRET) {
        return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    if (!tag) {
        return NextResponse.json({ message: 'Missing tag param' }, { status: 400 });
    }

    revalidateTag(tag);
    return NextResponse.json({ revalidated: true, tag, now: Date.now() });
}`,
              testCases: "Checks secret matching env; Validates tag presence; Calls revalidateTag; Returns 200 JSON",
              hints: "Check secret !== process.env.REVALIDATION_SECRET, then call revalidateTag(tag).",
              difficulty: 3
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "Partial Prerendering (PPR) Architecture",
              config: JSON.stringify({
                nodes: [
                  { id: "edge", label: "Edge CDN\nInstant Static Shell (<20ms)", x: 80, y: 120 },
                  { id: "user", label: "Browser Paint\nInstant Header & Navigation", x: 280, y: 120 },
                  { id: "hole", label: "Suspense Boundary\nDynamic Server Streaming", x: 480, y: 120 },
                  { id: "full", label: "Interactive Page\nComplete Personalized UI", x: 680, y: 120 }
                ],
                edges: [
                  { from: "edge", to: "user", label: "static HTML" },
                  { from: "user", to: "hole", label: "render skeleton" },
                  { from: "hole", to: "full", label: "stream dynamic chunk" }
                ],
                steps: [
                  { id: "1", activeNodes: ["edge", "user"], description: "Static layout served from edge CDN with sub-20ms Time to First Byte (TTFB)" },
                  { id: "2", activeNodes: ["user", "hole"], description: "Suspense fallback skeletons displayed immediately" },
                  { id: "3", activeNodes: ["hole", "full"], description: "Personalized user data streamed in parallel without blocking the page" }
                ]
              })
            }
          ],
          lesson: {
            title: "Next.js 15 Caching Architecture & Partial Prerendering",
            content: `## Next.js 15 Caching Deep Dive

### 1. The 4 Caching Layers
1. **Request Memoization**: Deduplicates identical \`fetch\` requests within the same render pass.
2. **Data Cache**: Persists data across server requests and deployments (\`next: { tags }\`).
3. **Full Route Cache**: Stores HTML and RSC payload of static routes on the server.
4. **Router Cache**: Client-side in-memory cache of visited route segments.

### 2. Partial Prerendering (PPR)
PPR eliminates the choice between static (fast, but generic) and dynamic (slow, but personalized) by rendering both together in a single HTTP stream.`,
            explanation: "Master the modern caching architecture and Partial Prerendering in Next.js 15."
          }
        }
      ]
    },
    {
      title: "Phase 4: Authentication with Auth.js v5 & Middleware",
      description: "Implement secure enterprise authentication using Auth.js (NextAuth v5), OAuth providers, JWT session tokens, and route protection middleware.",
      slug: "phase-4-authjs-middleware",
      topics: [
        {
          title: "Auth.js v5 Integration & Edge Route Protection Middleware",
          description: "Configure Auth.js with OAuth (GitHub/Google) and Credentials providers, JWT session callbacks, and edge middleware.",
          slug: "authjs-v5-edge-middleware",
          difficulty: 3,
          prerequisites: [0, 1, 2],
          concepts: [
            {
              title: "Auth.js v5 Architecture",
              description: "Auth.js v5 provides universal authentication across App Router Server Components, Server Actions, Route Handlers, and Edge Middleware via a unified `auth()` helper."
            },
            {
              title: "Edge Middleware Route Protection",
              description: "Middleware runs on edge V8 runtime before requests reach page handlers, verifying JWT tokens and redirecting unauthenticated users with zero cold start latency."
            },
            {
              title: "Session Callbacks & Role-Based Access Control",
              description: "Extending session payloads via `jwt` and `session` callbacks attaches custom fields (`user.id`, `user.role`, `user.permissions`) for granular authorization."
            }
          ],
          examples: [
            {
              title: "Auth.js v5 Configuration & Protected Server Component",
              description: "Setting up Auth.js and accessing authenticated user in a Server Component",
              starterCode: `// auth.ts
import NextAuth from 'next-auth';
export const { handlers, signIn, signOut, auth } = NextAuth({ ... });`,
              solutionCode: `// auth.ts
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [GitHub],
    callbacks: {
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }
            return session;
        },
    },
});

// app/dashboard/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) {
        redirect('/api/auth/signin');
    }

    return (
        <div>
            <h1>Welcome back, {session.user.name}!</h1>
            <p>User ID: {session.user.id}</p>
        </div>
    );
}`,
              expectedOutput: "Auth.js v5 configured with universal auth() helper"
            }
          ],
          exercises: [
            {
              title: "Write Edge Route Protection Middleware",
              description: "Create a Next.js middleware that redirects unauthenticated users away from /dashboard to /login",
              instructions: "Export middleware using auth() that checks req.auth and redirects when accessing /dashboard without session.",
              starterCode: `// middleware.ts
import { auth } from '@/auth';
export default auth((req) => {
    // check auth and redirect
});`,
              solutionCode: `// middleware.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isDashboard = req.nextUrl.pathname.startsWith('/dashboard');

    if (isDashboard && !isLoggedIn) {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }
    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};`,
              testCases: "Protects dashboard routes; Redirects unauthenticated visitors to login; Allows authenticated visitors",
              hints: "Check req.nextUrl.pathname.startsWith('/dashboard') and !req.auth.",
              difficulty: 3
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "Auth.js Edge Middleware & Session Validation",
              config: JSON.stringify({
                nodes: [
                  { id: "req", label: "User Request\nGET /dashboard/settings", x: 80, y: 120 },
                  { id: "mid", label: "Edge Middleware\nVerify JWT Cookie", x: 280, y: 120 },
                  { id: "pass", label: "Authenticated\nStream Server Component", x: 480, y: 60 },
                  { id: "fail", label: "Unauthenticated\n307 Redirect to /login", x: 480, y: 180 }
                ],
                edges: [
                  { from: "req", to: "mid", label: "inspect headers" },
                  { from: "mid", to: "pass", label: "valid session" },
                  { from: "mid", to: "fail", label: "no session" }
                ],
                steps: [
                  { id: "1", activeNodes: ["req", "mid"], description: "Edge middleware validates session token before route handler executes" },
                  { id: "2", activeNodes: ["mid", "pass"], description: "Authenticated session passes directly to Server Component with populated user context" },
                  { id: "3", activeNodes: ["mid", "fail"], description: "Unauthenticated requests intercepted immediately at the edge without hitting origin server" }
                ]
              })
            }
          ],
          lesson: {
            title: "Auth.js v5 Integration & Edge Route Protection Middleware",
            content: `## Full-Stack Authentication in Next.js 15

### 1. Universal \`auth()\` Function
With Auth.js v5, the same \`auth()\` method works across:
- **Server Components**: \`const session = await auth();\`
- **Server Actions**: \`const session = await auth();\`
- **Route Handlers**: \`const session = await auth();\`
- **Edge Middleware**: \`export default auth((req) => ...);\`

### 2. Edge Middleware Performance
Edge middleware runs globally across worldwide CDN points of presence in **< 5ms**, securing private endpoints before backend servers are touched!`,
            explanation: "Master modern full-stack authentication and edge route security in Next.js 15."
          }
        }
      ]
    },
    {
      title: "Phase 5: Database Persistence (Prisma / Drizzle) & Production Ops",
      description: "Build robust data layers with Prisma/Drizzle ORM, connection pooling, Docker containerization, and production deployment.",
      slug: "phase-5-database-production-ops",
      topics: [
        {
          title: "Prisma ORM, Connection Pooling & Production Docker Builds",
          description: "Learn Prisma Client singleton patterns, Supabase/Neon connection poolers, multi-stage standalone Dockerfiles, and observability.",
          slug: "prisma-pooling-docker-production",
          difficulty: 4,
          prerequisites: [0, 1, 2, 3],
          concepts: [
            {
              title: "Prisma Client Global Singleton",
              description: "In Next.js development with Hot Module Replacement (HMR), instantiating Prisma directly creates dozens of connections. Attaching the client to `globalThis.prisma` ensures a single reused connection pool."
            },
            {
              title: "Connection Pooling for Serverless",
              description: "Serverless functions spin up dynamically, exhausting database connection limits. Connection poolers (Neon, Supabase PgBouncer, Prisma Accelerate) multiplex hundreds of serverless instances onto a fixed database connection pool."
            },
            {
              title: "Standalone Docker Output",
              description: "Setting `output: 'standalone'` in `next.config.js` extracts only required node_modules and server files, producing ultra-lightweight ~80MB production Docker images."
            }
          ],
          examples: [
            {
              title: "Prisma Client Singleton & Standalone Dockerfile",
              description: "Setting up a singleton Prisma instance and production multi-stage Docker build",
              starterCode: `// lib/db.ts
import { PrismaClient } from '@prisma/client';
// export global singleton prisma`,
              solutionCode: `// lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;`,
              expectedOutput: "Safe singleton Prisma client preventing connection exhaustion"
            }
          ],
          exercises: [
            {
              title: "Configure Standalone Next.js Dockerfile",
              description: "Write a multi-stage Dockerfile that builds Next.js in standalone mode and runs as a non-root user",
              instructions: "Define stages: deps, builder, runner with node:20-alpine.",
              starterCode: `# Multi-stage Next.js Dockerfile
FROM node:20-alpine AS deps
# Install deps and build`,
              solutionCode: `FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]`,
              testCases: "Multi-stage build deps, builder, runner; Standalone output copied; Runs as non-root nextjs user",
              hints: "Copy from builder: standalone ./ and static ./.next/static.",
              difficulty: 4
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "Next.js Production Deployment & Standalone Build",
              config: JSON.stringify({
                nodes: [
                  { id: "code", label: "Source Code\nnext.config.js (standalone)", x: 80, y: 120 },
                  { id: "build", label: "next build\nExtract Minimal Dependencies", x: 280, y: 120 },
                  { id: "docker", label: "Docker Container\n~80MB Alpine Image", x: 480, y: 120 },
                  { id: "cluster", label: "Production Cluster\nAuto-Scaled Kubernetes / VPS", x: 670, y: 120 }
                ],
                edges: [
                  { from: "code", to: "build", label: "compile" },
                  { from: "build", to: "docker", label: "bundle standalone" },
                  { from: "docker", to: "cluster", label: "deploy" }
                ],
                steps: [
                  { id: "1", activeNodes: ["code", "build"], description: "Next.js analyzes AST and traces exact node_modules required for execution" },
                  { id: "2", activeNodes: ["build", "docker"], description: "Multi-stage Docker build copies minimal standalone server" },
                  { id: "3", activeNodes: ["docker", "cluster"], description: "Container boots instantly in production with low memory footprint" }
                ]
              })
            }
          ],
          lesson: {
            title: "Prisma ORM, Connection Pooling & Production Docker Builds",
            content: `## Production Engineering for Next.js

### 1. Database Connection Management
Always reuse database connections and configure connection pools:
\`\`\`env
DATABASE_URL="postgresql://user:password@pooler.neon.tech/main?pgbouncer=true"
\`\`\`

### 2. Standalone Docker Builds
Enabling \`output: 'standalone'\` in \`next.config.js\` shrinks production container sizes by **up to 85%**, cutting cloud hosting bills and drastically improving cold-start times.`,
            explanation: "Master production database integration, connection pooling, and Docker deployment for Next.js 15."
          }
        }
      ]
    }
  ]
};
