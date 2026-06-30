/**
 * Scheduler Module
 *
 * This module provides job scheduling capabilities including
 * interval-based and cron-based scheduling.
 */

export interface ScheduledJob {
  id: string;
  name: string;
  handler: () => Promise<void>;
  interval?: number; // milliseconds
  cron?: string;
  nextRun?: Date;
  isActive: boolean;
  lastRun?: Date;
  runCount: number;
}

export class Scheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Schedule a job to run at an interval
   */
  schedule(name: string, interval: number, handler: () => Promise<void>): ScheduledJob {
    const job: ScheduledJob = {
      id: this.generateId(),
      name,
      handler,
      interval,
      nextRun: new Date(Date.now() + interval),
      isActive: true,
      runCount: 0,
    };

    this.jobs.set(job.id, job);
    this.startJob(job);

    return job;
  }

  /**
   * Schedule a cron job
   */
  cron(name: string, cronExpression: string, handler: () => Promise<void>): ScheduledJob {
    const job: ScheduledJob = {
      id: this.generateId(),
      name,
      handler,
      cron: cronExpression,
      nextRun: this.calculateNextRun(cronExpression),
      isActive: true,
      runCount: 0,
    };

    this.jobs.set(job.id, job);
    this.startJob(job);

    return job;
  }

  /**
   * Stop a scheduled job
   */
  stop(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    job.isActive = false;
    const timer = this.timers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(jobId);
    }

    return true;
  }

  /**
   * Start a stopped job
   */
  start(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    job.isActive = true;
    this.startJob(job);

    return true;
  }

  /**
   * Remove a job
   */
  remove(jobId: string): boolean {
    this.stop(jobId);
    return this.jobs.delete(jobId);
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): ScheduledJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  getJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get active jobs
   */
  getActiveJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values()).filter((job) => job.isActive);
  }

  /**
   * Clear all jobs
   */
  clear(): void {
    for (const jobId of this.jobs.keys()) {
      this.stop(jobId);
    }
    this.jobs.clear();
    this.timers.clear();
  }

  /**
   * Start job execution
   */
  private startJob(job: ScheduledJob): void {
    if (!job.isActive) return;

    const delay = job.nextRun ? job.nextRun.getTime() - Date.now() : job.interval || 0;

    const timer = setTimeout(async () => {
      await this.executeJob(job);

      if (job.isActive) {
        if (job.cron) {
          job.nextRun = this.calculateNextRun(job.cron);
        } else if (job.interval) {
          job.nextRun = new Date(Date.now() + job.interval);
        }
        this.startJob(job);
      }
    }, delay);

    this.timers.set(job.id, timer);
  }

  /**
   * Execute a job
   */
  private async executeJob(job: ScheduledJob): Promise<void> {
    try {
      await job.handler();
      job.lastRun = new Date();
      job.runCount++;
    } catch (error) {
      console.error(`Job ${job.name} failed:`, error);
    }
  }

  /**
   * Calculate next run time for cron expression (simplified)
   */
  private calculateNextRun(cron: string): Date {
    // Simplified implementation - in production use a cron parser library
    const parts = cron.split(" ");
    const minute = parseInt(parts[0]);
    const now = new Date();
    const next = new Date(now);

    if (!isNaN(minute)) {
      next.setMinutes(minute, 0, 0);
      if (next <= now) {
        next.setHours(next.getHours() + 1);
      }
    } else {
      next.setHours(now.getHours() + 1);
    }

    return next;
  }

  /**
   * Generate unique job ID
   */
  private generateId(): string {
    return `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default Scheduler;
