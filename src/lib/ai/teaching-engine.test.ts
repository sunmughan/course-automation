import { describe, it, expect, vi } from "vitest";
import { teachingEngine } from "@/lib/ai/teaching-engine";
import { loadTopicIntelligenceFromDB, registerTopicKnowledge } from "@/lib/curriculum/intelligence";

describe("Professor Teaching Engine (Pedagogical Grounding)", () => {
  it("grounds teaching responses in authoritative topic intelligence", async () => {
    registerTopicKnowledge({
      topicId: "top_sql",
      topicSlug: "sql-indexes",
      topicTitle: "Database Indexing & B-Trees",
      courseTitle: "Database Engineering",
      moduleTitle: "Performance & Storage",
      difficultyLevel: 3,
      prerequisites: [],
      isComplete: true,
      gapsDetected: [],
      learningObjectives: ["Optimize SQL query execution times using B-Tree and Hash indexes"],
      mentalModel: {
        analogy: "An index is like a book index at the back that points directly to page numbers without scanning every page.",
        coreMechanism: "B-Tree data structures maintain sorted key pointers to reduce disk I/O from O(N) to O(log N).",
        keyMetaphor: "B-Tree sorted directory",
      },
      syntax: {
        pattern: "CREATE INDEX idx_users_email ON users(email);",
        breakdown: [{ part: "CREATE INDEX", purpose: "Builds index structure" }],
      },
      counterExamples: [
        { code: "SELECT * FROM users WHERE LOWER(email) = 'a@b.com';", whyWrong: "Function on indexed column prevents index seek", correction: "Index expression or match raw case" },
      ],
      useCases: ["High-frequency WHERE lookups on unique or foreign keys"],
      nonUseCases: ["Low-cardinality boolean columns with frequent write mutations"],
      advantages: ["Sub-millisecond query execution on large datasets"],
      limitations: ["Increased write latency and additional disk storage"],
      alternatives: ["Clustered tables, Covering indexes"],
      commonMistakes: [{ pattern: "Over-indexing write-heavy tables", consequence: "Slow INSERT throughput", fix: "Only index read-heavy query filters" }],
      misconceptions: [{ belief: "Indexes speed up all database operations", reality: "Indexes slow down INSERT, UPDATE, and DELETE operations due to index tree rebalancing", diagnosticQuestion: "What happens to write performance when you add 10 indexes to a table?" }],
      visualModel: { type: "tree", nodes: [{ id: "root", label: "B-Tree Root", role: "Search Node" }], dataFlow: [] },
      masteryCriteria: { minPracticeRuns: 2, requiredScore: 85, mustClearMisconceptions: [] },
    });

    const response = await teachingEngine.teach({
      userId: "usr_db_student",
      topicId: "top_sql",
      topicSlug: "sql-indexes",
      topicTitle: "Database Indexing & B-Trees",
      courseTitle: "Database Engineering",
      studentSkillScore: 70,
      studentAttempts: 2,
      previousMistakes: [],
      detectedMisconceptions: [],
      studentQuery: "Why do indexes make database lookups faster?",
    });

    expect(response.simpleDefinition).toContain("B-Tree data structures");
    expect(response.mentalModelAnalogy).toContain("book index");
    expect(response.codeExample.code).toContain("CREATE INDEX");
    expect(response.understandingCheckQuestion.question).toContain("write performance");
  });
});
