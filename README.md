# AI-Powered Software Engineering Training Platform

Production-grade interactive learning platform for software engineering. Built with Next.js 16, PostgreSQL, Prisma 7, and a multi-provider AI Gateway.

## Architecture

```
Student → Learning UI → { Lessons, IDE, AI Tutor }
                            ↓
              Execution API → Queue → Workers → Sandbox
                            ↓
              AI Gateway → { NVIDIA, Gemini, AgentRouter, TokenRouter }
                            ↓
              Visualization Engine → { Flow Diagrams, Call Stack, Memory View }
                            ↓
              Adaptive Learning → Assessment → Skill Graph
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL 18 |
| ORM | Prisma 7 |
| Auth | JWT (jose) |
| UI | shadcn/ui, Tailwind CSS, Framer Motion |
| AI | NVIDIA NIM, Google Gemini, AgentRouter.org, TokenRouter.com |
| Validation | Zod |
| Editor | Monaco Editor |
| Visualization | ReactFlow, Custom Canvas |

## Courses

1. **Frontend Development** (14 modules) - HTML, CSS, JavaScript, React, TypeScript, Next.js, Testing
2. **Backend Development** (12 modules) - Node.js, Express, Laravel, PHP, Databases, REST, GraphQL, Microservices
3. **Mobile App Development** (10 modules) - React Native, Flutter, Swift, Kotlin, Firebase
4. **AI & Prompt Engineering** (10 modules) - ML Basics, NLP, LLMs, RAG, Agents, Prompt Design
5. **Data Science** (10 modules) - Python, NumPy, Pandas, SQL, ML, Stats, Visualization

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm or yarn

### Installation

```bash
git clone https://github.com/sunmughan/course-automation.git
cd course-automation

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Edit .env with your PostgreSQL and AI API keys
# DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/platform_db"
# NVIDIA_API_KEY="nvapi-..."
# GEMINI_API_KEY="..."
# AGENTROUTER_API_KEY="..."
# TOKENROUTER_API_KEY="sk-..."

# Push schema to database
npx prisma db push

# Seed curriculum data
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

### AI Providers

The platform supports 4 AI providers with automatic fallback:

| Provider | Purpose | Config |
|----------|---------|--------|
| NVIDIA NIM | High-quality code generation | `NVIDIA_API_KEY` |
| Google Gemini | Explanations and tutoring | `GEMINI_API_KEY` |
| AgentRouter.org | Agent orchestration | `AGENTROUTER_API_KEY` |
| TokenRouter.com | Cost-optimized routing | `TOKENROUTER_API_KEY` |

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes (auth, courses, lessons, ai, code)
│   ├── dashboard/     # Protected dashboard pages
│   ├── login/         # Auth pages
│   └── layout.tsx     # Root layout
├── components/
│   ├── ui/            # shadcn/ui components
│   ├── tutor/         # AI Tutor component
│   ├── visualization/ # Flow diagrams, call stack, memory view
│   └── editor/        # Monaco code editor
├── hooks/             # React hooks
├── lib/
│   ├── ai/            # AI Gateway, Router, Orchestrator, Token Router
│   ├── curriculum/    # Seed data
│   ├── auth.ts        # JWT authentication
│   ├── db.ts          # Prisma client
│   ├── api-handler.ts # API handler wrapper + validation
│   ├── errors.ts      # Error classes + Zod schemas
│   └── logger.ts      # Centralized logging
└── types/             # TypeScript types
```

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | No | User registration |
| POST | `/api/auth/login` | No | User login |
| GET | `/api/auth/session` | Yes | Current session |
| GET | `/api/courses` | No | List courses |
| GET | `/api/courses/:id` | No | Course detail |
| POST | `/api/courses/:id/enroll` | Yes | Enroll in course |
| GET | `/api/lessons/:id` | No | Lesson content |
| POST | `/api/lessons/:id/complete` | Yes | Mark lesson complete |
| POST | `/api/ai/chat` | Yes | AI Tutor chat |
| POST | `/api/ai/orchestrate` | Yes | Agent orchestration |
| POST | `/api/code/run` | Yes | Execute code |
| GET | `/api/progress` | Yes | Student progress |

## Scripts

```bash
npm run dev       # Development server (Turbopack)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Lint code
npm run db:push   # Push schema to database
npm run db:seed   # Seed curriculum data
npm run db:studio # Open Prisma Studio
```

## License

MIT