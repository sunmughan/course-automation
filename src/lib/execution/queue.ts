import { randomUUID } from "crypto";
import type { ExecutionResult } from "@/types";

export interface ExecutionJobOptions {
  code: string;
  language: string;
  timeoutMs?: number;
  trace?: boolean;
  userId?: string;
}

export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled" | "timeout";

export interface ExecutionJob {
  id: string;
  code: string;
  language: string;
  timeoutMs: number;
  trace?: boolean;
  userId?: string;
  status: JobStatus;
  enqueuedAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: ExecutionResult;
  error?: string;
  cancelFn?: () => void;
  resolve?: (value: ExecutionResult) => void;
  reject?: (reason?: unknown) => void;
}

export class ExecutionQueue {
  private queue: ExecutionJob[] = [];
  private activeJobs: Map<string, ExecutionJob> = new Map();
  private completedJobs: Map<string, ExecutionJob> = new Map();
  private maxConcurrency: number;
  private maxCompletedHistory: number = 100;

  constructor(maxConcurrency: number = 4) {
    this.maxConcurrency = maxConcurrency;
  }

  async enqueue(
    options: ExecutionJobOptions,
    executor: (job: ExecutionJob) => Promise<ExecutionResult>
  ): Promise<ExecutionResult> {
    const jobId = `exec-${randomUUID()}`;
    const timeoutMs = options.timeoutMs && options.timeoutMs > 0 && options.timeoutMs <= 30000
      ? options.timeoutMs
      : 5000;

    return new Promise<ExecutionResult>((resolve, reject) => {
      const job: ExecutionJob = {
        id: jobId,
        code: options.code,
        language: options.language,
        timeoutMs,
        trace: options.trace,
        userId: options.userId,
        status: "queued",
        enqueuedAt: Date.now(),
        resolve,
        reject,
      };

      this.queue.push(job);
      this.processNext(executor);
    });
  }

  private async processNext(
    executor: (job: ExecutionJob) => Promise<ExecutionResult>
  ): Promise<void> {
    if (this.activeJobs.size >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    if (job.status === "cancelled") {
      this.finishJob(job, {
        output: "",
        error: "Execution was cancelled before starting",
        events: [],
        executionTime: 0,
        memoryUsed: 0,
        exitCode: 130,
        status: "cancelled",
      });
      return;
    }

    job.status = "running";
    job.startedAt = Date.now();
    this.activeJobs.set(job.id, job);

    try {
      const result = await executor(job);
      const currentStatus = job.status as JobStatus;
      if (currentStatus !== "cancelled") {
        job.status = result.error ? (result.exitCode === 124 ? "timeout" : "failed") : "completed";
        this.finishJob(job, result);
      }
    } catch (err) {
      const currentStatus = job.status as JobStatus;
      if (currentStatus !== "cancelled") {
        const errorMsg = err instanceof Error ? err.message : "Execution failed";
        const isTimeout = errorMsg.toLowerCase().includes("timed out");
        job.status = isTimeout ? "timeout" : "failed";
        this.finishJob(job, {
          output: "",
          error: errorMsg,
          events: [],
          executionTime: Date.now() - (job.startedAt || job.enqueuedAt),
          memoryUsed: 0,
          exitCode: isTimeout ? 124 : 1,
          status: job.status,
        });
      }
    } finally {
      this.activeJobs.delete(job.id);
      this.processNext(executor);
    }
  }

  private finishJob(job: ExecutionJob, result: ExecutionResult): void {
    job.completedAt = Date.now();
    job.result = result;
    if (result.error) job.error = result.error;

    this.completedJobs.set(job.id, job);
    if (this.completedJobs.size > this.maxCompletedHistory) {
      const oldestKey = this.completedJobs.keys().next().value;
      if (oldestKey) this.completedJobs.delete(oldestKey);
    }

    if (job.resolve) {
      job.resolve(result);
    }
  }

  cancel(jobId: string): boolean {
    const queuedIndex = this.queue.findIndex((j) => j.id === jobId);
    if (queuedIndex >= 0) {
      const job = this.queue.splice(queuedIndex, 1)[0];
      job.status = "cancelled";
      this.finishJob(job, {
        output: "",
        error: "Execution was cancelled",
        events: [],
        executionTime: 0,
        memoryUsed: 0,
        exitCode: 130,
        status: "cancelled",
      });
      return true;
    }

    const activeJob = this.activeJobs.get(jobId);
    if (activeJob) {
      activeJob.status = "cancelled";
      if (typeof activeJob.cancelFn === "function") {
        activeJob.cancelFn();
      }
      this.finishJob(activeJob, {
        output: "",
        error: "Execution was cancelled",
        events: [],
        executionTime: Date.now() - (activeJob.startedAt || activeJob.enqueuedAt),
        memoryUsed: 0,
        exitCode: 130,
        status: "cancelled",
      });
      this.activeJobs.delete(jobId);
      return true;
    }

    return false;
  }

  getJob(jobId: string): ExecutionJob | undefined {
    return (
      this.activeJobs.get(jobId) ||
      this.queue.find((j) => j.id === jobId) ||
      this.completedJobs.get(jobId)
    );
  }

  getStats(): {
    queuedCount: number;
    runningCount: number;
    completedCount: number;
    maxConcurrency: number;
  } {
    return {
      queuedCount: this.queue.length,
      runningCount: this.activeJobs.size,
      completedCount: this.completedJobs.size,
      maxConcurrency: this.maxConcurrency,
    };
  }

  clear(): void {
    for (const job of this.activeJobs.values()) {
      if (typeof job.cancelFn === "function") {
        job.cancelFn();
      }
    }
    this.queue = [];
    this.activeJobs.clear();
    this.completedJobs.clear();
  }
}

export const globalExecutionQueue = new ExecutionQueue(4);
