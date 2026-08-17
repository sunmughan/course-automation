import { executeMultiLanguage } from "@/lib/execution/multi-lang-sandbox";

export interface ExecutionJobData {
  id: string;
  code: string;
  language: string;
  userId?: string;
  timeoutMs?: number;
  priority?: "low" | "normal" | "high";
  createdAt: number;
}

export interface JobExecutionResult {
  jobId: string;
  status: "completed" | "failed" | "timeout";
  output: string;
  error?: string;
  executionTime: number;
  memoryUsed: number;
  exitCode: number;
}

export interface WorkerPoolMetrics {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  queueDepth: number;
  totalJobsProcessed: number;
  totalJobsFailed: number;
  averageExecutionTimeMs: number;
  health: "healthy" | "degraded" | "overloaded";
}

export class ExecutionWorkerPool {
  private static maxConcurrency = 4;
  private static activeJobs = new Map<string, ExecutionJobData>();
  private static queue: ExecutionJobData[] = [];
  private static totalProcessed = 0;
  private static totalFailed = 0;
  private static totalExecutionTime = 0;

  /**
   * Enqueues a code execution job.
   */
  static async submitJob(job: Omit<ExecutionJobData, "id" | "createdAt">): Promise<JobExecutionResult> {
    const fullJob: ExecutionJobData = {
      ...job,
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };

    // If concurrency limit reached, queue it
    if (this.activeJobs.size >= this.maxConcurrency) {
      this.queue.push(fullJob);
    }

    this.activeJobs.set(fullJob.id, fullJob);
    const startTime = Date.now();

    try {
      const execResult = await executeMultiLanguage({
        code: fullJob.code,
        language: fullJob.language,
        userId: fullJob.userId,
        timeoutMs: fullJob.timeoutMs || 5000,
      });

      const duration = Date.now() - startTime;
      this.totalProcessed++;
      this.totalExecutionTime += duration;

      const isSuccess = !execResult.error;
      if (!isSuccess) this.totalFailed++;

      return {
        jobId: fullJob.id,
        status: isSuccess ? "completed" : "failed",
        output: execResult.output || "",
        error: execResult.error || undefined,
        executionTime: execResult.executionTime || duration / 1000,
        memoryUsed: execResult.memoryUsed || 0,
        exitCode: execResult.exitCode ?? (isSuccess ? 0 : 1),
      };
    } catch (err: any) {
      this.totalFailed++;
      return {
        jobId: fullJob.id,
        status: "failed",
        output: "",
        error: err.message || "Worker execution failed",
        executionTime: 0,
        memoryUsed: 0,
        exitCode: 1,
      };
    } finally {
      this.activeJobs.delete(fullJob.id);
      // Process next queued job if any
      if (this.queue.length > 0) {
        this.queue.shift();
      }
    }
  }

  /**
   * Returns live metrics and health status of the worker pool.
   */
  static getMetrics(): WorkerPoolMetrics {
    const active = this.activeJobs.size;
    const idle = Math.max(0, this.maxConcurrency - active);
    const queueDepth = this.queue.length;

    let health: WorkerPoolMetrics["health"] = "healthy";
    if (queueDepth > 10) health = "overloaded";
    else if (queueDepth > 0 || active >= this.maxConcurrency) health = "degraded";

    const avgTime = this.totalProcessed > 0
      ? Math.round(this.totalExecutionTime / this.totalProcessed)
      : 0;

    return {
      totalWorkers: this.maxConcurrency,
      activeWorkers: active,
      idleWorkers: idle,
      queueDepth,
      totalJobsProcessed: this.totalProcessed,
      totalJobsFailed: this.totalFailed,
      averageExecutionTimeMs: avgTime,
      health,
    };
  }

  /**
   * Resets internal metrics (useful for testing).
   */
  static resetForTesting() {
    this.activeJobs.clear();
    this.queue = [];
    this.totalProcessed = 0;
    this.totalFailed = 0;
    this.totalExecutionTime = 0;
  }
}
