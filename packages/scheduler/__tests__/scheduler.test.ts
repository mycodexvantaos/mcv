import { Scheduler } from '../src/index';

describe('Scheduler', () => {
  let scheduler: Scheduler;

  beforeEach(() => {
    scheduler = new Scheduler();
  });

  afterEach(() => {
    scheduler.clear();
  });

  describe('schedule', () => {
    it('should schedule an interval job', async () => {
      let executed = false;
      const handler = async () => {
        executed = true;
      };

      const job = scheduler.schedule('test-job', 100, handler);

      expect(job).toBeDefined();
      expect(job.name).toBe('test-job');
      expect(job.interval).toBe(100);
      expect(job.isActive).toBe(true);
    });

    it('should execute scheduled job', async () => {
      let executed = false;
      const handler = async () => {
        executed = true;
      };

      scheduler.schedule('test-job', 10, handler);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(executed).toBe(true);
    });
  });

  describe('cron', () => {
    it('should schedule a cron job', () => {
      const handler = async () => {};

      const job = scheduler.cron('test-cron', '0 * * * *', handler);

      expect(job).toBeDefined();
      expect(job.name).toBe('test-cron');
      expect(job.cron).toBe('0 * * * *');
      expect(job.isActive).toBe(true);
    });
  });

  describe('stop', () => {
    it('should stop a job', async () => {
      let executionCount = 0;
      const handler = async () => {
        executionCount++;
      };

      const job = scheduler.schedule('test-job', 10, handler);

      await new Promise((resolve) => setTimeout(resolve, 30));

      scheduler.stop(job.id);

      const initialCount = executionCount;

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(executionCount).toBe(initialCount);
    });

    it('should return false for non-existent job', () => {
      const result = scheduler.stop('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('start', () => {
    it('should start a stopped job', () => {
      const handler = async () => {};
      const job = scheduler.schedule('test-job', 1000, handler);

      scheduler.stop(job.id);
      expect(job.isActive).toBe(false);

      const result = scheduler.start(job.id);

      expect(result).toBe(true);
      expect(job.isActive).toBe(true);
    });

    it('should return false for non-existent job', () => {
      const result = scheduler.start('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('remove', () => {
    it('should remove a job', () => {
      const handler = async () => {};
      const job = scheduler.schedule('test-job', 1000, handler);

      const result = scheduler.remove(job.id);

      expect(result).toBe(true);
      expect(scheduler.getJob(job.id)).toBeUndefined();
    });

    it('should return false for non-existent job', () => {
      const result = scheduler.remove('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('getJob', () => {
    it('should retrieve job by ID', () => {
      const handler = async () => {};
      const job = scheduler.schedule('test-job', 1000, handler);

      const retrieved = scheduler.getJob(job.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(job.id);
    });

    it('should return undefined for non-existent job', () => {
      const retrieved = scheduler.getJob('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getJobs', () => {
    it('should return all jobs', () => {
      scheduler.schedule('job1', 1000, async () => {});
      scheduler.schedule('job2', 1000, async () => {});

      const jobs = scheduler.getJobs();

      expect(jobs).toHaveLength(2);
    });
  });

  describe('getActiveJobs', () => {
    it('should return only active jobs', () => {
      const job1 = scheduler.schedule('job1', 1000, async () => {});
      const job2 = scheduler.schedule('job2', 1000, async () => {});

      scheduler.stop(job1.id);

      const activeJobs = scheduler.getActiveJobs();

      expect(activeJobs).toHaveLength(1);
      expect(activeJobs[0].id).toBe(job2.id);
    });
  });

  describe('clear', () => {
    it('should clear all jobs', () => {
      scheduler.schedule('job1', 1000, async () => {});
      scheduler.schedule('job2', 1000, async () => {});

      scheduler.clear();

      expect(scheduler.getJobs()).toHaveLength(0);
    });
  });
});
