/**
 * REST API routes for AI Team Service
 * @module @mycodexvantaos/ai-team-service/api
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  Orchestrator,
  AgentProfile,
  TeamTopology,
  AgentTask,
} from '@mycodexvantaos/ai-team-orchestrator';

/**
 * Create API router
 */
export function setupRoutes(orchestrator: Orchestrator): Router {
  const router = Router();

  // ============================================================================
  // Agent Routes
  // ============================================================================

  /**
   * @route GET /agents
   * @description Get all registered agents
   */
  router.get('/agents', (_req: Request, res: Response) => {
    const agents = orchestrator.getAllAgents();
    return res.json({
      success: true,
      data: agents,
      count: agents.length,
    });
  });

  /**
   * @route GET /agents/:id
   * @description Get agent by ID
   */
  router.get('/agents/:id', (req: Request, res: Response) => {
    const agent = orchestrator.getAgent(req.params.id as any);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }
    return res.json({ success: true, data: agent });
  });

  /**
   * @route POST /agents
   * @description Register a new agent
   */
  router.post('/agents', (req: Request, res: Response) => {
    try {
      const profile: AgentProfile = req.body;
      const agentId = orchestrator.registerAgent(profile);
      return res.status(201).json({
        success: true,
        data: { id: agentId },
        message: 'Agent registered successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to register agent',
      });
    }
  });

  /**
   * @route DELETE /agents/:id
   * @description Unregister an agent
   */
  router.delete('/agents/:id', (req: Request, res: Response) => {
    try {
      const success = orchestrator.unregisterAgent(req.params.id as any);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found',
        });
      }
      return res.json({
        success: true,
        message: 'Agent unregistered successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unregister agent',
      });
    }
  });

  /**
   * @route GET /agents/available
   * @description Get available (idle) agents
   */
  router.get('/agents/available', (_req: Request, res: Response) => {
    const agents = orchestrator.getAvailableAgents();
    return res.json({
      success: true,
      data: agents,
      count: agents.length,
    });
  });

  // ============================================================================
  // Team Routes
  // ============================================================================

  /**
   * @route GET /teams
   * @description Get all teams
   */
  router.get('/teams', (_req: Request, res: Response) => {
    const teams = orchestrator.getAllTeams();
    return res.json({
      success: true,
      data: teams,
      count: teams.length,
    });
  });

  /**
   * @route GET /teams/:id
   * @description Get team by ID
   */
  router.get('/teams/:id', (req: Request, res: Response) => {
    const team = orchestrator.getTeam(req.params.id as any);
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }
    return res.json({ success: true, data: team });
  });

  /**
   * @route POST /teams
   * @description Create a new team
   */
  router.post('/teams', (req: Request, res: Response) => {
    try {
      const { name, topology_type, agents, ...options } = req.body;
      const teamId = orchestrator.createTeam({
        name,
        topology_type,
        agents,
        ...options,
      });
      return res.status(201).json({
        success: true,
        data: { id: teamId },
        message: 'Team created successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create team',
      });
    }
  });

  /**
   * @route POST /teams/:id/activate
   * @description Activate a team
   */
  router.post('/teams/:id/activate', (req: Request, res: Response) => {
    try {
      const success = orchestrator.activateTeam(req.params.id as any);
      return res.json({
        success,
        message: 'Team activated successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to activate team',
      });
    }
  });

  /**
   * @route POST /teams/:id/deactivate
   * @description Deactivate a team
   */
  router.post('/teams/:id/deactivate', (req: Request, res: Response) => {
    const success = orchestrator.deactivateTeam(req.params.id as any);
    return res.json({
      success,
      message: 'Team deactivated successfully',
    });
  });

  /**
   * @route DELETE /teams/:id
   * @description Destroy a team
   */
  router.delete('/teams/:id', (req: Request, res: Response) => {
    const success = orchestrator.destroyTeam(req.params.id as any);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }
    return res.json({
      success: true,
      message: 'Team destroyed successfully',
    });
  });

  /**
   * @route POST /teams/:id/agents
   * @description Add agent to team
   */
  router.post('/teams/:id/agents', (req: Request, res: Response) => {
    try {
      const { agent_id, position } = req.body;
      const success = orchestrator.addAgentToTeam(req.params.id as any, agent_id, position);
      return res.json({
        success,
        message: 'Agent added to team successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add agent to team',
      });
    }
  });

  /**
   * @route DELETE /teams/:id/agents/:agentId
   * @description Remove agent from team
   */
  router.delete('/teams/:id/agents/:agentId', (req: Request, res: Response) => {
    try {
      const success = orchestrator.removeAgentFromTeam(
        req.params.id as any,
        req.params.agentId as any
      );
      return res.json({
        success,
        message: 'Agent removed from team successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove agent from team',
      });
    }
  });

  // ============================================================================
  // Task Routes
  // ============================================================================

  /**
   * @route POST /tasks
   * @description Create a new task
   */
  router.post('/tasks', (req: Request, res: Response) => {
    try {
      const { objective, context, priority, assigned_agents, deadline } = req.body;
      const taskId = orchestrator.createTask(objective, {
        context,
        priority,
        assigned_agents,
        deadline,
      });
      return res.status(201).json({
        success: true,
        data: { id: taskId },
        message: 'Task created successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create task',
      });
    }
  });

  /**
   * @route POST /tasks/:id/decompose
   * @description Decompose a task into subtasks
   */
  router.post('/tasks/:id/decompose', (req: Request, res: Response) => {
    try {
      const task = req.body.task as AgentTask;
      if (!task) {
        return res.status(400).json({
          success: false,
          error: 'Task body is required',
        });
      }
      const result = orchestrator.decomposeTask(task);
      return res.json({
        success: result.success,
        data: {
          subtasks: result.subtasks,
          strategy: result.strategy,
          dependencies: result.dependencies,
        },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to decompose task',
      });
    }
  });

  /**
   * @route POST /tasks/:id/assign
   * @description Assign task to agent
   */
  router.post('/tasks/:id/assign', (req: Request, res: Response) => {
    try {
      const { agent_id } = req.body;
      const success = orchestrator.assignTask(agent_id, req.params.id as any);
      return res.json({
        success,
        message: 'Task assigned successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign task',
      });
    }
  });

  // ============================================================================
  // Workflow Routes
  // ============================================================================

  /**
   * @route POST /workflows/start
   * @description Start a workflow for a team
   */
  router.post('/workflows/start', (req: Request, res: Response) => {
    try {
      const { team_id, variables } = req.body;
      const workflowId = orchestrator.startWorkflow(team_id, variables);
      return res.status(201).json({
        success: true,
        data: { workflow_id: workflowId },
        message: 'Workflow started successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start workflow',
      });
    }
  });

  /**
   * @route POST /workflows/:id/pause
   * @description Pause a workflow
   */
  router.post('/workflows/:id/pause', (req: Request, res: Response) => {
    const success = orchestrator.pauseWorkflow(req.params.id);
    return res.json({
      success,
      message: success ? 'Workflow paused successfully' : 'Failed to pause workflow',
    });
  });

  /**
   * @route POST /workflows/:id/resume
   * @description Resume a workflow
   */
  router.post('/workflows/:id/resume', (req: Request, res: Response) => {
    const success = orchestrator.resumeWorkflow(req.params.id);
    return res.json({
      success,
      message: success ? 'Workflow resumed successfully' : 'Failed to resume workflow',
    });
  });

  /**
   * @route POST /workflows/:id/cancel
   * @description Cancel a workflow
   */
  router.post('/workflows/:id/cancel', (req: Request, res: Response) => {
    const success = orchestrator.cancelWorkflow(req.params.id);
    return res.json({
      success,
      message: success ? 'Workflow cancelled successfully' : 'Failed to cancel workflow',
    });
  });

  /**
   * @route GET /workflows/:id
   * @description Get workflow state
   */
  router.get('/workflows/:id', (req: Request, res: Response) => {
    const state = orchestrator.getWorkflow(req.params.id);
    if (!state) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
      });
    }
    return res.json({ success: true, data: state });
  });

  // ============================================================================
  // HITL Routes
  // ============================================================================

  /**
   * @route POST /hitl/approve
   * @description Approve HITL checkpoint
   */
  router.post('/hitl/approve', (req: Request, res: Response) => {
    try {
      const { workflow_id, node_id, approver } = req.body;
      orchestrator.approveHITLCheckpoint(workflow_id, node_id, approver);
      return res.json({
        success: true,
        message: 'Checkpoint approved successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve checkpoint',
      });
    }
  });

  /**
   * @route POST /hitl/reject
   * @description Reject HITL checkpoint
   */
  router.post('/hitl/reject', (req: Request, res: Response) => {
    try {
      const { workflow_id, node_id, reason } = req.body;
      orchestrator.rejectHITLCheckpoint(workflow_id, node_id, reason);
      return res.json({
        success: true,
        message: 'Checkpoint rejected successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reject checkpoint',
      });
    }
  });

  // ============================================================================
  // Governance Routes
  // ============================================================================

  /**
   * @route POST /governance/approval-requests
   * @description Request approval for an operation
   */
  router.post('/governance/approval-requests', (req: Request, res: Response) => {
    try {
      const { permission, requester_id, context } = req.body;
      const requestId = orchestrator.requestApproval(permission, requester_id, context);
      return res.status(201).json({
        success: true,
        data: { request_id: requestId },
        message: 'Approval request created',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create approval request',
      });
    }
  });

  /**
   * @route GET /governance/approval-requests/:id
   * @description Get approval request status
   */
  router.get('/governance/approval-requests/:id', (req: Request, res: Response) => {
    const request = orchestrator.getApprovalStatus(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Approval request not found',
      });
    }
    return res.json({ success: true, data: request });
  });

  /**
   * @route POST /governance/approval-requests/:id/approve
   * @description Approve a request
   */
  router.post('/governance/approval-requests/:id/approve', (req: Request, res: Response) => {
    try {
      const { approver_tier } = req.body;
      const success = orchestrator.approveRequest(req.params.id, approver_tier);
      return res.json({
        success,
        message: 'Request approved successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve request',
      });
    }
  });

  // ============================================================================
  // Stats Routes
  // ============================================================================

  /**
   * @route GET /stats
   * @description Get orchestrator statistics
   */
  router.get('/stats', (_req: Request, res: Response) => {
    const stats = orchestrator.getStats();
    return res.json({ success: true, data: stats });
  });

  return router;
}
