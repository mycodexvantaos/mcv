import { BackgroundJobRuntime, Job } from '../src/index';

describe('BackgroundJobRuntime', () => {
  let runtime: BackgroundJobRuntime;

  beforeEach(() => {
    runtime = new BackgroundJobRuntime({
      concurrency: 2,
      maxRetries: 3,
    });
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const defaultRuntime = new BackgroundJobRuntime();
      expect(defaultRuntime).toBeInstanceOf(BackgroundJobRuntime);
    });

    it('should initialize with custom options', () => {
      const customRuntime = new BackgroundJobRuntime({
        concurrency: 5,
        maxRetries: 5,
      });
      expect(customRuntime).toBeInstanceOf(BackgroundJobRuntime);
    });
  });

  describe('register', () => {
    it('should register a job handler', () => {
      const handler = async (data: any) => {
        return data.length;
      };

      runtime.register('test-job', handler);

      expect(runtime.getJobs()).toHaveLength(0);
    });
  });

  describe('add', () => {
    it('should add a job to the queue', async () => {
      const job = await runtime.add('test-job', { value: 123 });

      expect(job).toBeDefined();
      expect(job.status).toBe('pending');
      expect(job.name).toBe('test-job');
      expect(runtime.getJob(job.id)).toBeDefined();
    });

    it('should add job with custom priority', async () => {
      const job = await runtime.add('test-job', {}, 10);

      expect(job.priority).toBe(10);
    });
  });

  describe('getJob', () => {
    it('should retrieve job by ID', async () => {
      const job = await runtime.add('test-job', {});
      const retrieved = runtime.getJob(job.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(job.id);
    });

    it('should return undefined for non-existent job', () => {
      const retrieved = runtime.getJob('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getJobs', () => {
    it('should return all jobs', async () => {
      await runtime.add('job1', {});
      await runtime.add('job2', {});
      await runtime.add('job3', {});

      const jobs = runtime.getJobs();
      expect(jobs).toHaveLength(3);
    });
  });

  describe('getJobsByStatus', () => {
    it('should filter jobs by status', async () => {
      await runtime.add('job1', {});
      await runtime.add('job2', {});
      await runtime.add('job3', {});

      const pendingJobs = runtime.getJobsByStatus('pending');
      expect(pendingJobs).toHaveLength(3);

      const runningJobs = runtime.getJobsByStatus('running');
      expect(runningJobs).toHaveLength(0);
    });
  });

  describe('removeJob', () => {
    it('should remove job from queue', async () => {
      const job = await runtime.add('test-job', {});

      const removed = runtime.removeJob(job.id);

      expect(removed).toBe(true);
      expect(runtime.getJob(job.id)).toBeUndefined();
    });

    it('should return false for non-existent job', () => {
      const removed = runtime.removeJob('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all jobs', async () => {
      await runtime.add('job1', {});
      await runtime.add('job2', {});

      runtime.clear();

      expect(runtime.getJobs()).toHaveLength(0);
    });
  });
});
