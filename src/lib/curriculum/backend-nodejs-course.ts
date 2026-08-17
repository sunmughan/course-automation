// Complete Enterprise Node.js Backend Course covering all 110 Chapters from PDF
import { nodejsPhase1 } from "./nodejs-phases/phase-1";
import { nodejsPhase2 } from "./nodejs-phases/phase-2";
import { nodejsPhase3 } from "./nodejs-phases/phase-3";
import { nodejsPhase4 } from "./nodejs-phases/phase-4";
import { nodejsPhase5 } from "./nodejs-phases/phase-5";
import { nodejsPhase6 } from "./nodejs-phases/phase-6";
import { nodejsPhase7 } from "./nodejs-phases/phase-7";
import { nodejsPhase8 } from "./nodejs-phases/phase-8";
import { nodejsPhase9 } from "./nodejs-phases/phase-9";
import { nodejsPhase10 } from "./nodejs-phases/phase-10";

export const nodejsBackendCourse = {
  title: "Complete Node.js & Express Backend Enterprise Mastery (110 Chapters)",
  description: "Exhaustive, professional enterprise Node.js course covering all 110 chapters from foundational V8 internals, Modules, Async/Promises, Buffers & Streams, HTTP/Sockets, Express & Koa, PostgreSQL, MySQL, MongoDB, Redis, OAuth 2.0, Clustering, Worker Threads, and Production PM2 DevOps.",
  slug: "nodejs-backend-mastery",
  stream: "backend",
  imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
  order: 2,
  modules: [
    nodejsPhase1,
    nodejsPhase2,
    nodejsPhase3,
    nodejsPhase4,
    nodejsPhase5,
    nodejsPhase6,
    nodejsPhase7,
    nodejsPhase8,
    nodejsPhase9,
    nodejsPhase10,
  ],
};
