import { WorkflowGenerator, TaskDefinition, WorkflowDefinition } from '../src/index';

describe('WorkflowGenerator', () => {
  let generator: WorkflowGenerator;

  beforeEach(() => {
    generator = new WorkflowGenerator({
      format: 'yaml',
      includeErrorHandling: true,
      includeLogging: true,
      retryStrategy: 'exponential',
    });
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const defaultGen = new WorkflowGenerator();
      expect(defaultGen).toBeInstanceOf(WorkflowGenerator);
    });

    it('should initialize with custom options', () => {
      const customGen = new WorkflowGenerator({
        format: 'json',
        includeErrorHandling: false,
        retryStrategy: 'linear',
      });
      expect(customGen).toBeInstanceOf(WorkflowGenerator);
    });
  });

  describe('generateLinearWorkflow', () => {
    it('should generate linear workflow from tasks', () => {
      const tasks: TaskDefinition[] = [
        { id: 'task1', name: 'First Task', type: 'http', config: { url: 'http://example.com' } },
        {
          id: 'task2',
          name: 'Second Task',
          type: 'database',
          config: { query: 'SELECT * FROM users' },
        },
      ];

      const workflow = generator.generateLinearWorkflow('Test Workflow', tasks);

      expect(workflow.id).toBe('test_workflow');
      expect(workflow.name).toBe('Test Workflow');
      expect(workflow.steps).toHaveLength(2);
      expect(workflow.steps[0].type).toBe('action');
      expect(workflow.steps[0].next).toBe('task2');
    });

    it('should include retry policy when enabled', () => {
      const retryGen = new WorkflowGenerator({ retryStrategy: 'exponential' });
      const tasks: TaskDefinition[] = [
        { id: 'task1', name: 'First Task', type: 'http', config: {} },
      ];

      const workflow = retryGen.generateLinearWorkflow('Test Workflow', tasks);

      expect(workflow.steps[0].retryPolicy).toBeDefined();
      expect(workflow.steps[0].retryPolicy?.maxAttempts).toBe(3);
      expect(workflow.steps[0].retryPolicy?.backoff).toBe('exponential');
    });

    it('should not include retry policy when disabled', () => {
      const noRetryGen = new WorkflowGenerator({ retryStrategy: 'none' });
      const tasks: TaskDefinition[] = [
        { id: 'task1', name: 'First Task', type: 'http', config: {} },
      ];

      const workflow = noRetryGen.generateLinearWorkflow('Test Workflow', tasks);

      expect(workflow.steps[0].retryPolicy).toBeUndefined();
    });
  });

  describe('generateParallelWorkflow', () => {
    it('should generate parallel workflow', () => {
      const parallelTasks: TaskDefinition[][] = [
        [{ id: 'task1', name: 'Task 1', type: 'http', config: {} }],
        [{ id: 'task2', name: 'Task 2', type: 'database', config: {} }],
      ];

      const workflow = generator.generateParallelWorkflow('Parallel Workflow', parallelTasks);

      expect(workflow.steps).toHaveLength(1); // One parallel step
      expect(workflow.steps[0].type).toBe('parallel');
      expect(workflow.steps[0].config.branches).toHaveLength(2);
    });

    it('should include final task when provided', () => {
      const parallelTasks: TaskDefinition[][] = [
        [{ id: 'task1', name: 'Task 1', type: 'http', config: {} }],
      ];
      const finalTask: TaskDefinition = { id: 'final', name: 'Final', type: 'merge', config: {} };

      const workflow = generator.generateParallelWorkflow(
        'Parallel Workflow',
        parallelTasks,
        finalTask
      );

      expect(workflow.steps).toHaveLength(2);
      expect(workflow.steps[0].type).toBe('parallel');
      expect(workflow.steps[1].type).toBe('action');
      expect(workflow.steps[1].id).toBe('final');
    });

    it('should handle multiple tasks in parallel branches', () => {
      const parallelTasks: TaskDefinition[][] = [
        [
          { id: 'task1', name: 'Task 1', type: 'http', config: {} },
          { id: 'task2', name: 'Task 2', type: 'http', config: {} },
        ],
        [{ id: 'task3', name: 'Task 3', type: 'database', config: {} }],
      ];

      const workflow = generator.generateParallelWorkflow('Parallel Workflow', parallelTasks);

      expect(workflow.steps[0].config.branches[0].steps.length).toBe(2);
      expect(workflow.steps[0].config.branches[1].steps.length).toBe(1);
    });
  });

  describe('generateConditionalWorkflow', () => {
    it('should generate conditional workflow with both branches', () => {
      const trueBranch: TaskDefinition[] = [
        { id: 'task1', name: 'Task 1', type: 'http', config: {} },
      ];
      const falseBranch: TaskDefinition[] = [
        { id: 'task2', name: 'Task 2', type: 'database', config: {} },
      ];

      const workflow = generator.generateConditionalWorkflow(
        'Conditional Workflow',
        'input.value > 10',
        trueBranch,
        falseBranch
      );

      expect(workflow.steps).toHaveLength(3);
      expect(workflow.steps[0].type).toBe('condition');
      expect(workflow.steps[1].type).toBe('sequence');
      expect(workflow.steps[2].type).toBe('sequence');
      expect(workflow.steps[0].config.expression).toBe('input.value > 10');
    });

    it('should include final task when provided', () => {
      const trueBranch: TaskDefinition[] = [
        { id: 'task1', name: 'Task 1', type: 'http', config: {} },
      ];
      const falseBranch: TaskDefinition[] = [
        { id: 'task2', name: 'Task 2', type: 'database', config: {} },
      ];
      const finalTask: TaskDefinition = { id: 'final', name: 'Final', type: 'merge', config: {} };

      const workflow = generator.generateConditionalWorkflow(
        'Conditional Workflow',
        'input.value > 10',
        trueBranch,
        falseBranch,
        finalTask
      );

      expect(workflow.steps).toHaveLength(4);
      expect(workflow.steps[3].id).toBe('final');
    });
  });

  describe('generateWorkflowFile', () => {
    it('should generate JSON format', () => {
      const jsonGen = new WorkflowGenerator({ format: 'json' });
      const tasks: TaskDefinition[] = [{ id: 'task1', name: 'Task 1', type: 'http', config: {} }];
      const workflow = jsonGen.generateLinearWorkflow('Test', tasks);
      const content = jsonGen.generateWorkflowFile(workflow);

      expect(() => JSON.parse(content)).not.toThrow();
      const parsed = JSON.parse(content);
      expect(parsed.name).toBe('Test');
    });

    it('should generate YAML format', () => {
      const yamlGen = new WorkflowGenerator({ format: 'yaml' });
      const tasks: TaskDefinition[] = [{ id: 'task1', name: 'Task 1', type: 'http', config: {} }];
      const workflow = yamlGen.generateLinearWorkflow('Test', tasks);
      const content = yamlGen.generateWorkflowFile(workflow);

      expect(content).toContain('id: test');
      expect(content).toContain('name: Test');
      expect(content).toContain('steps:');
    });

    it('should generate TypeScript format', () => {
      const tsGen = new WorkflowGenerator({ format: 'typescript' });
      const tasks: TaskDefinition[] = [{ id: 'task1', name: 'Task 1', type: 'http', config: {} }];
      const workflow = tsGen.generateLinearWorkflow('Test', tasks);
      const content = tsGen.generateWorkflowFile(workflow);

      expect(content).toContain('import');
      expect(content).toContain('export const Test');
      expect(content).toContain('id:');
      expect(content).toContain('name:');
    });
  });

  describe('generateCiCdPipeline', () => {
    it('should generate CI/CD pipeline', () => {
      const stages = ['build', 'test', 'deploy'];
      const workflow = generator.generateCiCdPipeline('Main Pipeline', stages);

      expect(workflow.id).toBe('main_pipeline');
      expect(workflow.name).toBe('Main Pipeline Pipeline');
      expect(workflow.steps).toHaveLength(3);
      expect(workflow.steps[0].name).toBe('build');
      expect(workflow.steps[1].name).toBe('test');
      expect(workflow.steps[2].name).toBe('deploy');
    });

    it('should link stages sequentially', () => {
      const stages = ['build', 'test'];
      const workflow = generator.generateCiCdPipeline('Test Pipeline', stages);

      expect(workflow.steps[0].next).toBe('stage_1');
      expect(workflow.steps[1].next).toBeUndefined();
    });
  });

  describe('generateDataPipeline', () => {
    it('should generate ETL pipeline with single source and destination', () => {
      const workflow = generator.generateDataPipeline(
        'Test Pipeline',
        ['api_source'],
        ['filter', 'transform'],
        ['database_dest']
      );

      expect(workflow.steps).toHaveLength(4); // source, filter, transform, dest
      expect(workflow.steps[0].type).toBe('action');
      expect(workflow.steps[0].name).toContain('Extract');
      expect(workflow.steps[3].name).toContain('Load');
    });

    it('should generate ETL pipeline with multiple sources', () => {
      const workflow = generator.generateDataPipeline(
        'Test Pipeline',
        ['source1', 'source2'],
        ['transform'],
        ['dest1']
      );

      expect(workflow.steps).toHaveLength(5); // 2 sources + merge + transform + dest
      const mergeStep = workflow.steps.find((s) => s.name.includes('Merge'));
      expect(mergeStep).toBeDefined();
      expect(mergeStep?.type).toBe('action');
    });

    it('should generate ETL pipeline with multiple destinations in parallel', () => {
      const workflow = generator.generateDataPipeline(
        'Test Pipeline',
        ['source1'],
        ['transform'],
        ['dest1', 'dest2']
      );

      expect(workflow.steps).toHaveLength(3); // source, transform, parallel dests
      const parallelStep = workflow.steps[workflow.steps.length - 1];
      expect(parallelStep.type).toBe('parallel');
      expect(parallelStep.config.branches).toHaveLength(2);
    });
  });

  describe('ID and name formatting', () => {
    it('should format workflow IDs correctly', () => {
      const tasks: TaskDefinition[] = [{ id: 'task1', name: 'Task', type: 'http', config: {} }];
      const workflow = generator.generateLinearWorkflow('My Test Workflow', tasks);

      expect(workflow.id).toBe('my_test_workflow');
    });

    it('should format variable names correctly', () => {
      const tasks: TaskDefinition[] = [{ id: 'task1', name: 'Task', type: 'http', config: {} }];
      const workflow = generator.generateLinearWorkflow('Test Workflow 123', tasks);

      // Test through TypeScript generation
      const tsGen = new WorkflowGenerator({ format: 'typescript' });
      const content = tsGen.generateWorkflowFile(workflow);

      expect(content).toContain('const TestWorkflow123');
    });
  });
});
