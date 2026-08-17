import { describe, expect, it, vi, beforeEach } from "vitest";
import { PlaygroundService } from "./playground-service";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    playgroundProject: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    projectFile: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    projectSession: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    projectExecution: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

describe("Wave 17: Persistent Playground Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOrCreateDefaultProject", () => {
    it("returns existing default project if present", async () => {
      prismaMock.playgroundProject.findFirst.mockResolvedValue({
        id: "proj-1",
        userId: "user-1",
        name: "Default Workspace",
        files: [{ id: "f1", name: "main.js", path: "src/main.js", content: "console.log('hi');" }],
        sessions: [{ activeFileId: "src/main.js" }],
      });

      const project = await PlaygroundService.getOrCreateDefaultProject("user-1");

      expect(project).toBeDefined();
      expect(project!.id).toBe("proj-1");
      expect(project!.files).toHaveLength(1);
      expect(prismaMock.playgroundProject.create).not.toHaveBeenCalled();
    });

    it("creates a new default workspace with starter files when none exists", async () => {
      prismaMock.playgroundProject.findFirst.mockResolvedValue(null);
      prismaMock.playgroundProject.create.mockResolvedValue({
        id: "proj-new",
        userId: "user-1",
        name: "Default Workspace",
        files: [{ name: "main.js" }, { name: "utils.js" }],
      });

      const project = await PlaygroundService.getOrCreateDefaultProject("user-1");

      expect(project).toBeDefined();
      expect(project!.id).toBe("proj-new");
      expect(prismaMock.playgroundProject.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            name: "Default Workspace",
          }),
        })
      );
    });
  });

  describe("saveFile & deleteFile", () => {
    it("upserts file content and updates project timestamp", async () => {
      prismaMock.playgroundProject.findUnique.mockResolvedValue({
        id: "proj-1",
        userId: "user-1",
      });

      prismaMock.projectFile.upsert.mockResolvedValue({
        id: "file-1",
        projectId: "proj-1",
        name: "app.tsx",
        path: "src/app.tsx",
        content: "export const App = () => <div>Hello</div>;",
        language: "typescript",
      });

      prismaMock.playgroundProject.update.mockResolvedValue({});

      const file = await PlaygroundService.saveFile({
        projectId: "proj-1",
        userId: "user-1",
        path: "src/app.tsx",
        content: "export const App = () => <div>Hello</div>;",
      });

      expect(file.name).toBe("app.tsx");
      expect(file.language).toBe("typescript");
      expect(prismaMock.projectFile.upsert).toHaveBeenCalledTimes(1);
      expect(prismaMock.playgroundProject.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "proj-1" } })
      );
    });

    it("throws error if user is not authorized to edit project file", async () => {
      prismaMock.playgroundProject.findUnique.mockResolvedValue({
        id: "proj-1",
        userId: "other-user",
      });

      await expect(
        PlaygroundService.saveFile({
          projectId: "proj-1",
          userId: "user-1",
          path: "src/app.js",
          content: "code",
        })
      ).rejects.toThrow("Project not found or unauthorized");
    });

    it("deletes file or folder subtree", async () => {
      prismaMock.playgroundProject.findUnique.mockResolvedValue({
        id: "proj-1",
        userId: "user-1",
      });
      prismaMock.projectFile.deleteMany.mockResolvedValue({ count: 3 });
      prismaMock.playgroundProject.update.mockResolvedValue({});

      const result = await PlaygroundService.deleteFile("proj-1", "user-1", "src/components");

      expect(result.deletedCount).toBe(3);
      expect(prismaMock.projectFile.deleteMany).toHaveBeenCalledTimes(1);
    });
  });

  describe("saveSession", () => {
    it("updates existing editor session with active file and open tabs", async () => {
      prismaMock.projectSession.findFirst.mockResolvedValue({
        id: "sess-1",
        activeFileId: "src/main.js",
      });

      prismaMock.projectSession.update.mockResolvedValue({
        id: "sess-1",
        activeFileId: "src/utils.js",
      });

      await PlaygroundService.saveSession({
        projectId: "proj-1",
        userId: "user-1",
        activeFileId: "src/utils.js",
        openTabs: ["src/main.js", "src/utils.js"],
      });

      expect(prismaMock.projectSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "sess-1" },
          data: expect.objectContaining({
            activeFileId: "src/utils.js",
          }),
        })
      );
    });
  });

  describe("recordExecution", () => {
    it("records code execution run in database", async () => {
      prismaMock.projectExecution.create.mockResolvedValue({
        id: "exec-1",
        status: "success",
      });

      const exec = await PlaygroundService.recordExecution({
        projectId: "proj-1",
        userId: "user-1",
        language: "javascript",
        code: "console.log(42);",
        output: "42\n",
        status: "success",
        executionTime: 0.12,
        memoryUsed: 15.4,
      });

      expect(exec.id).toBe("exec-1");
      expect(prismaMock.projectExecution.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: "proj-1",
            userId: "user-1",
            output: "42\n",
            status: "success",
          }),
        })
      );
    });
  });
});
