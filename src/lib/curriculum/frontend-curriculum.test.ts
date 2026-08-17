import { describe, expect, it } from "vitest";
import { phase5, phase6, phase7 } from "@/lib/curriculum/frontend-phases";
import { phase3AdvancedAI } from "@/lib/curriculum/ai-phases";
import { analyzeTopicCoverage, analyzeModuleCoverage } from "@/lib/curriculum/coverage-engine";

describe("Wave 9: Complete Frontend Curriculum", () => {
  describe("Phase 5: Frontend Architecture", () => {
    it("has the required title, slug, and description", () => {
      expect(phase5.title).toBe("Phase 5: Frontend Architecture");
      expect(phase5.slug).toBe("phase-5-frontend-architecture");
      expect(phase5.description).toBeDefined();
    });

    it("contains 4 comprehensive architecture topics", () => {
      expect(phase5.topics).toHaveLength(4);
      const slugs = phase5.topics.map((t) => t.slug);
      expect(slugs).toContain("module-systems-bundlers");
      expect(slugs).toContain("design-patterns-js");
      expect(slugs).toContain("state-management-fundamentals");
      expect(slugs).toContain("testing-fundamentals");
    });

    it("has full learning artifacts for every Phase 5 topic", () => {
      for (const topic of phase5.topics) {
        expect(topic.concepts.length).toBeGreaterThanOrEqual(3);
        expect(topic.examples.length).toBeGreaterThanOrEqual(2);
        expect(topic.exercises.length).toBeGreaterThanOrEqual(1);
        expect(topic.visualizations.length).toBeGreaterThanOrEqual(1);
        expect(topic.lesson.content.length).toBeGreaterThan(50);
        expect(topic.lesson.explanation.length).toBeGreaterThan(20);

        for (const ex of topic.examples) {
          expect(ex.starterCode).toBeDefined();
          expect(ex.solutionCode).toBeDefined();
          expect(ex.solutionCode.length).toBeGreaterThan(30);
        }

        for (const exercise of topic.exercises) {
          expect(exercise.starterCode).toBeDefined();
          expect(exercise.testCases.length).toBeGreaterThan(10);
        }
      }
    });

    it("passes coverage analysis with high satisfaction", () => {
      const moduleReport = analyzeModuleCoverage({
        ...phase5,
        topics: phase5.topics.map((t) => ({
          ...t,
          lessons: [
            {
              id: `lesson-${t.slug}`,
              title: t.lesson.title,
              content: t.lesson.content,
              explanation: t.lesson.explanation,
              concepts: t.concepts,
              examples: t.examples,
              exercises: t.exercises,
              visualizations: t.visualizations,
              assessments: [{ id: "a1", title: `${t.title} Quiz`, questions: [{ question: "Test?", correctAnswer: "Yes" }] }],
            },
          ],
        })),
      });

      expect(moduleReport.topicCount).toBe(4);
      expect(moduleReport.percentage).toBeGreaterThanOrEqual(65);
      for (const t of moduleReport.topics) {
        expect(t.mandatoryMissing).not.toContain("Theory");
        expect(t.mandatoryMissing).not.toContain("Simple Example");
        expect(t.mandatoryMissing).not.toContain("Visualization");
        expect(t.mandatoryMissing).not.toContain("Practice");
      }
    });
  });

  describe("Phase 6: React / Frameworks", () => {
    it("has the required title, slug, and description", () => {
      expect(phase6.title).toBe("Phase 6: React / Frameworks");
      expect(phase6.slug).toBe("phase-6-react-frameworks");
      expect(phase6.description).toBeDefined();
    });

    it("contains 4 comprehensive React topics", () => {
      expect(phase6.topics).toHaveLength(4);
      const slugs = phase6.topics.map((t) => t.slug);
      expect(slugs).toContain("react-fundamentals");
      expect(slugs).toContain("react-state-hooks");
      expect(slugs).toContain("react-router-data-fetching");
      expect(slugs).toContain("component-architecture");
    });

    it("has full learning artifacts for every Phase 6 topic", () => {
      for (const topic of phase6.topics) {
        expect(topic.concepts.length).toBeGreaterThanOrEqual(3);
        expect(topic.examples.length).toBeGreaterThanOrEqual(2);
        expect(topic.exercises.length).toBeGreaterThanOrEqual(1);
        expect(topic.visualizations.length).toBeGreaterThanOrEqual(1);
        expect(topic.lesson.content.length).toBeGreaterThan(50);
        expect(topic.lesson.explanation.length).toBeGreaterThan(20);

        for (const ex of topic.examples) {
          expect(ex.starterCode).toBeDefined();
          expect(ex.solutionCode).toBeDefined();
          expect(ex.solutionCode.length).toBeGreaterThan(30);
        }

        for (const exercise of topic.exercises) {
          expect(exercise.starterCode).toBeDefined();
          expect(exercise.testCases.length).toBeGreaterThan(10);
        }
      }
    });

    it("passes coverage analysis with high satisfaction", () => {
      const moduleReport = analyzeModuleCoverage({
        ...phase6,
        topics: phase6.topics.map((t) => ({
          ...t,
          lessons: [
            {
              id: `lesson-${t.slug}`,
              title: t.lesson.title,
              content: t.lesson.content,
              explanation: t.lesson.explanation,
              concepts: t.concepts,
              examples: t.examples,
              exercises: t.exercises,
              visualizations: t.visualizations,
              assessments: [{ id: "a1", title: `${t.title} Quiz`, questions: [{ question: "Test?", correctAnswer: "Yes" }] }],
            },
          ],
        })),
      });

      expect(moduleReport.topicCount).toBe(4);
      expect(moduleReport.percentage).toBeGreaterThanOrEqual(65);
      for (const t of moduleReport.topics) {
        expect(t.mandatoryMissing).not.toContain("Theory");
        expect(t.mandatoryMissing).not.toContain("Simple Example");
        expect(t.mandatoryMissing).not.toContain("Visualization");
        expect(t.mandatoryMissing).not.toContain("Practice");
      }
    });
  });

  describe("Phase 7: Professional Frontend", () => {
    it("has the required title, slug, and description", () => {
      expect(phase7.title).toBe("Phase 7: Professional Frontend");
      expect(phase7.slug).toBe("phase-7-professional-frontend");
      expect(phase7.description).toBeDefined();
    });

    it("contains 4 comprehensive professional topics", () => {
      expect(phase7.topics).toHaveLength(4);
      const slugs = phase7.topics.map((t) => t.slug);
      expect(slugs).toContain("performance-optimization");
      expect(slugs).toContain("accessibility-a11y");
      expect(slugs).toContain("typescript-frontend");
      expect(slugs).toContain("frontend-cicd-deployment");
    });

    it("has full learning artifacts for every Phase 7 topic", () => {
      for (const topic of phase7.topics) {
        expect(topic.concepts.length).toBeGreaterThanOrEqual(3);
        expect(topic.examples.length).toBeGreaterThanOrEqual(2);
        expect(topic.exercises.length).toBeGreaterThanOrEqual(1);
        expect(topic.visualizations.length).toBeGreaterThanOrEqual(1);
        expect(topic.lesson.content.length).toBeGreaterThan(50);
        expect(topic.lesson.explanation.length).toBeGreaterThan(20);

        for (const ex of topic.examples) {
          expect(ex.starterCode).toBeDefined();
          expect(ex.solutionCode).toBeDefined();
          expect(ex.solutionCode.length).toBeGreaterThan(30);
        }

        for (const exercise of topic.exercises) {
          expect(exercise.starterCode).toBeDefined();
          expect(exercise.testCases.length).toBeGreaterThan(10);
        }
      }
    });

    it("passes coverage analysis with high satisfaction", () => {
      const moduleReport = analyzeModuleCoverage({
        ...phase7,
        topics: phase7.topics.map((t) => ({
          ...t,
          lessons: [
            {
              id: `lesson-${t.slug}`,
              title: t.lesson.title,
              content: t.lesson.content,
              explanation: t.lesson.explanation,
              concepts: t.concepts,
              examples: t.examples,
              exercises: t.exercises,
              visualizations: t.visualizations,
              assessments: [{ id: "a1", title: `${t.title} Quiz`, questions: [{ question: "Test?", correctAnswer: "Yes" }] }],
            },
          ],
        })),
      });

      expect(moduleReport.topicCount).toBe(4);
      expect(moduleReport.percentage).toBeGreaterThanOrEqual(65);
      for (const t of moduleReport.topics) {
        expect(t.mandatoryMissing).not.toContain("Theory");
        expect(t.mandatoryMissing).not.toContain("Simple Example");
        expect(t.mandatoryMissing).not.toContain("Visualization");
        expect(t.mandatoryMissing).not.toContain("Practice");
      }
    });
  });

  describe("AI Module Relocation", () => {
    it("relocated AI module has all 4 advanced AI topics", () => {
      expect(phase3AdvancedAI.title).toBe("Phase 3: Advanced AI Engineering");
      expect(phase3AdvancedAI.slug).toBe("phase-3-advanced-ai");
      expect(phase3AdvancedAI.topics).toHaveLength(4);
      const slugs = phase3AdvancedAI.topics.map((t) => t.slug);
      expect(slugs).toContain("fine-tuning-models");
      expect(slugs).toContain("ai-safety-responsible");
      expect(slugs).toContain("multimodal-ai-vision");
      expect(slugs).toContain("ai-system-design");
    });
  });
});
