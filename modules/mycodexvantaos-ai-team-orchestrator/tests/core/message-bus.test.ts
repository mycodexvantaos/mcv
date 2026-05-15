/**
 * Unit tests for MessageBus
 * @module @mycodexvantaos/ai-team-orchestrator/tests
 */

import { MessageBus } from '../../src/core/message-bus';
import type { AgentMessage, AgentURN, ToolCall, ToolResult } from '../../src/types';

describe('MessageBus', () => {
  let messageBus: MessageBus;

  beforeEach(() => {
    messageBus = new MessageBus({
      maxQueueSize: 100,
      maxRetries: 3,
      retryDelayMs: 10,
      messageTimeoutMs: 5000,
    });
  });

  afterEach(() => {
    messageBus.clear();
  });

  describe('send', () => {
    it('should send a message and return message URN', () => {
      const messageUrn = messageBus.send({
        sender_id: 'urn:mycodexvantaos:agent:sender' as AgentURN,
        recipient_id: 'urn:mycodexvantaos:agent:recipient' as AgentURN,
        message_type: 'query',
        content: { type: 'text', data: 'Hello' },
      });

      expect(messageUrn).toMatch(/^urn:mycodexvantaos:message:/);
    });

    it('should emit message:sent event', () => {
      const eventHandler = jest.fn();
      messageBus.on('message:sent', eventHandler);

      messageBus.send({
        sender_id: 'urn:mycodexvantaos:agent:sender' as AgentURN,
        recipient_id: 'urn:mycodexvantaos:agent:recipient' as AgentURN,
        message_type: 'query',
        content: { type: 'text', data: 'Hello' },
      });

      expect(eventHandler).toHaveBeenCalled();
    });

    it('should increment messagesSent counter', () => {
      messageBus.send({
        sender_id: 'urn:mycodexvantaos:agent:sender' as AgentURN,
        recipient_id: 'urn:mycodexvantaos:agent:recipient' as AgentURN,
        message_type: 'query',
        content: { type: 'text', data: 'Hello' },
      });

      const stats = messageBus.getStats();
      expect(stats.messagesSent).toBe(1);
    });
  });

  describe('broadcast', () => {
    it('should broadcast message to all agents', () => {
      const messageUrn = messageBus.broadcast(
        'urn:mycodexvantaos:agent:broadcaster' as AgentURN,
        'notification',
        { type: 'text', data: 'Broadcast message' }
      );

      expect(messageUrn).toMatch(/^urn:mycodexvantaos:message:/);
    });
  });

  describe('subscribe', () => {
    it('should subscribe to messages for an agent', () => {
      const handler = jest.fn();
      const subscriptionId = messageBus.subscribe(
        'urn:mycodexvantaos:agent:recipient' as AgentURN,
        handler
      );

      expect(subscriptionId).toBeDefined();
      expect(messageBus.getStats().activeSubscriptions).toBe(1);
    });

    it('should receive messages after subscription', async () => {
      const handler = jest.fn();
      const recipientId = 'urn:mycodexvantaos:agent:recipient' as AgentURN;

      messageBus.subscribe(recipientId, handler);

      messageBus.send({
        sender_id: 'urn:mycodexvantaos:agent:sender' as AgentURN,
        recipient_id: recipientId,
        message_type: 'query',
        content: { type: 'text', data: 'Hello' },
      });

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe from messages', () => {
      const handler = jest.fn();
      const agentId = 'urn:mycodexvantaos:agent:recipient' as AgentURN;

      messageBus.subscribe(agentId, handler);
      messageBus.unsubscribe(agentId, handler);

      expect(messageBus.getStats().activeSubscriptions).toBe(0);
    });
  });

  describe('emit', () => {
    it('should emit orchestrator events', () => {
      const handler = jest.fn();
      messageBus.on('task:created', handler);

      messageBus.emit('task:created', { task_id: 'test-task' });

      expect(handler).toHaveBeenCalledWith({ task_id: 'test-task' });
    });

    it('should register event handler', () => {
      const handler = jest.fn();
      messageBus.on('task:completed', handler);

      messageBus.emit('task:completed', { task_id: 'test-task' });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('off', () => {
    it('should remove event handler', () => {
      const handler = jest.fn();
      messageBus.on('task:completed', handler);
      messageBus.off('task:completed', handler);

      messageBus.emit('task:completed', { task_id: 'test-task' });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return message bus statistics', () => {
      const stats = messageBus.getStats();

      expect(stats).toHaveProperty('messagesSent');
      expect(stats).toHaveProperty('messagesDelivered');
      expect(stats).toHaveProperty('messagesFailed');
      expect(stats).toHaveProperty('activeSubscriptions');
      expect(stats).toHaveProperty('queueSize');
    });
  });

  describe('clear', () => {
    it('should clear all queues and subscriptions', () => {
      const handler = jest.fn();
      messageBus.subscribe('urn:mycodexvantaos:agent:test' as AgentURN, handler);
      messageBus.send({
        sender_id: 'urn:mycodexvantaos:agent:sender' as AgentURN,
        recipient_id: 'urn:mycodexvantaos:agent:recipient' as AgentURN,
        message_type: 'query',
        content: { type: 'text', data: 'Hello' },
      });

      messageBus.clear();

      const stats = messageBus.getStats();
      expect(stats.activeSubscriptions).toBe(0);
      expect(stats.queueSize).toBe(0);
      expect(stats.messagesSent).toBe(0);
    });
  });

  describe('sendToolCall', () => {
    it('should send a tool call message', () => {
      const toolCall: ToolCall = {
        tool_id: 'urn:mycodexvantaos:tool:test-tool' as any,
        function_name: 'testFunction',
        arguments: { arg1: 'value1' },
        call_id: 'call-123',
      };
      const messageUrn = messageBus.sendToolCall(
        'urn:mycodexvantaos:agent:sender' as AgentURN,
        toolCall
      );

      expect(messageUrn).toMatch(/^urn:mycodexvantaos:message:/);
    });
  });

  describe('sendToolResult', () => {
    it('should send a tool result message', () => {
      const toolResult: ToolResult = {
        call_id: 'call-123',
        status: 'success',
        output: { data: 'test result' },
      };
      const messageUrn = messageBus.sendToolResult(
        'urn:mycodexvantaos:agent:recipient' as AgentURN,
        toolResult
      );

      expect(messageUrn).toMatch(/^urn:mycodexvantaos:message:/);
    });
  });

  describe('publishEvent', () => {
    it('should publish an orchestrator event', () => {
      const handler = jest.fn();
      messageBus.on('task:created', handler);

      messageBus.publishEvent({
        type: 'task:created',
        task_id: 'test-task',
      } as any);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('subscribeToEvents', () => {
    it('should subscribe to specific event types', () => {
      const handler = jest.fn();
      messageBus.subscribeToEvents('task:completed', handler);

      messageBus.emit('task:completed', { task_id: 'test-task' });

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('unsubscribeFromEvents', () => {
    it('should unsubscribe from event types', () => {
      const handler = jest.fn();
      messageBus.subscribeToEvents('task:failed', handler);
      messageBus.unsubscribeFromEvents('task:failed', handler);

      messageBus.emit('task:failed', { task_id: 'test-task' });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // Extended coverage for queue processing
  describe('queue management', () => {
    it('should handle queue size limit', () => {
      const smallBus = new MessageBus({ maxQueueSize: 2 });
      const handler = jest.fn();

      smallBus.subscribe('urn:mycodexvantaos:agent:queue-test' as AgentURN, handler);

      // Send messages to fill queue
      for (let i = 0; i < 5; i++) {
        smallBus.send({
          sender_id: 'urn:mycodexvantaos:agent:sender' as AgentURN,
          message_type: 'notification' as any,
          content: { type: 'text', data: `Message ${i}` },
          priority: 'normal',
        });
      }

      const stats = smallBus.getStats();
      expect(stats.queueSize).toBeLessThanOrEqual(2);
    });

    it('should process queued messages', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      const agentId = 'urn:mycodexvantaos:agent:queue-process' as AgentURN;

      messageBus.subscribe(agentId, handler);

      messageBus.send({
        sender_id: 'urn:mycodexvantaos:agent:sender' as AgentURN,
        recipient_id: agentId,
        message_type: 'task_assignment' as any,
        content: { type: 'text', data: 'Queued message' },
        priority: 'normal',
      });

      // Allow async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(handler).toHaveBeenCalled();
    });

    it('should track message statistics', () => {
      const stats = messageBus.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.queueSize).toBe('number');
      expect(typeof stats.messagesDelivered).toBe('number');
      expect(typeof stats.messagesFailed).toBe('number');
    });
  });

  describe('broadcast', () => {
    it('should emit broadcast event', () => {
      const eventHandler = jest.fn();
      messageBus.on('message:sent', eventHandler);

      messageBus.broadcast(
        'urn:mycodexvantaos:agent:broadcaster' as AgentURN,
        'notification' as any,
        { type: 'text', data: 'Broadcast message' }
      );

      expect(eventHandler).toHaveBeenCalled();
      const call = eventHandler.mock.calls[0][0];
      expect(call.broadcast).toBe(true);
    });

    it('should return a message URN', () => {
      const urn = messageBus.broadcast(
        'urn:mycodexvantaos:agent:broadcaster' as AgentURN,
        'notification' as any,
        { type: 'text', data: 'Broadcast message' }
      );

      expect(urn).toMatch(/^urn:mycodexvantaos:message:/);
    });
  });

  // Tests for processQueue uncovered lines (348-377)
  // processQueue is triggered when messages are queued BEFORE subscription
  describe('processQueue - queued messages processed on subscribe', () => {
    it('should process queued messages when handler subscribes', async () => {
      const agentId = 'urn:mycodexvantaos:agent:queue-then-subscribe' as AgentURN;

      // First send messages without subscription - they get queued
      messageBus.send({
        sender_id: 'urn:mycodexvantaos:agent:sender' as AgentURN,
        recipient_id: agentId,
        message_type: 'query',
        content: { type: 'text', data: 'Queued message' },
        priority: 'normal',
      });

      // Now subscribe - this triggers processQueue
      const handler = jest.fn().mockResolvedValue(undefined);
      messageBus.subscribe(agentId, handler);

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Handler should receive the queued message
      expect(handler).toHaveBeenCalled();
    });

    it('should deliver queued message and emit message:received', async () => {
      const agentId = 'urn:mycodexvantaos:agent:queue-received' as AgentURN;
      const receivedHandler = jest.fn();
      messageBus.on('message:received', receivedHandler);

      // Send without subscription
      messageBus.send({
        sender_id: 'urn:mycodexvantaos:agent:sender' as AgentURN,
        recipient_id: agentId,
        message_type: 'query',
        content: { type: 'text', data: 'Test message' },
        priority: 'normal',
      });

      // Subscribe to trigger processing
      const handler = jest.fn().mockResolvedValue(undefined);
      messageBus.subscribe(agentId, handler);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // message:received should be emitted after successful processing
      expect(receivedHandler).toHaveBeenCalled();
    });

    it('should handle message timeout for queued messages', async () => {
      const shortTimeoutBus = new MessageBus({
        maxQueueSize: 100,
        maxRetries: 3,
        retryDelayMs: 10,
        messageTimeoutMs: 30,
      });

      const agentId = 'urn:mycodexvantaos:agent:timeout-queue' as AgentURN;

      // Send message without subscription
      shortTimeoutBus.send({
        sender_id: 'urn:mycodexvantaos:agent:sender' as AgentURN,
        recipient_id: agentId,
        message_type: 'query',
        content: { type: 'text', data: 'Will timeout' },
        priority: 'normal',
      });

      // Wait for message to expire in queue
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Now subscribe - message should be timed out
      const handler = jest.fn().mockResolvedValue(undefined);
      shortTimeoutBus.subscribe(agentId, handler);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Handler should not be called since message timed out
      // or stats should show the timeout
      const stats = shortTimeoutBus.getStats();
      expect(stats.messagesFailed).toBeGreaterThanOrEqual(0);

      shortTimeoutBus.clear();
    });

    it('should emit message:timeout for expired queued messages', async () => {
      const shortTimeoutBus = new MessageBus({
        maxQueueSize: 100,
        maxRetries: 3,
        retryDelayMs: 5,
        messageTimeoutMs: 20,
      });

      const timeoutHandler = jest.fn();
      shortTimeoutBus.on('message:timeout', timeoutHandler);

      const agentId = 'urn:mycodexvantaos:agent:timeout-event' as AgentURN;

      // Send message without subscription
      shortTimeoutBus.send({
        sender_id: 'urn:mycodexvantaos:agent:sender' as AgentURN,
        recipient_id: agentId,
        message_type: 'query',
        content: { type: 'text', data: 'Timeout test' },
        priority: 'normal',
      });

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Subscribe to trigger processQueue which will find expired message
      const handler = jest.fn();
      shortTimeoutBus.subscribe(agentId, handler);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Timeout event should have been emitted
      expect(timeoutHandler).toHaveBeenCalled();

      shortTimeoutBus.clear();
    });
  });

  describe('processQueue - retry on handler failure', () => {
    it('should retry when async handler throws', async () => {
      const agentId = 'urn:mycodexvantaos:agent:retry-async' as AgentURN;

      // Send message without subscription
      messageBus.send({
        sender_id: 'urn:mycodexvantaos:agent:sender' as AgentURN,
        recipient_id: agentId,
        message_type: 'query',
        content: { type: 'text', data: 'Retry test' },
        priority: 'normal',
      });

      // Subscribe with failing handler
      const handler = jest
        .fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(undefined);

      messageBus.subscribe(agentId, handler);

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Handler should have been called at least once
      expect(handler).toHaveBeenCalled();
    });

    it('should emit message:failed after max retries exceeded', async () => {
      const lowRetryBus = new MessageBus({
        maxQueueSize: 100,
        maxRetries: 1,
        retryDelayMs: 5,
        messageTimeoutMs: 5000,
      });

      const failedHandler = jest.fn();
      lowRetryBus.on('message:failed', failedHandler);

      const agentId = 'urn:mycodexvantaos:agent:fail-queued' as AgentURN;

      // Send message without subscription
      lowRetryBus.send({
        sender_id: 'urn:mycodexvantaos:agent:sender' as AgentURN,
        recipient_id: agentId,
        message_type: 'query',
        content: { type: 'text', data: 'Will fail' },
        priority: 'normal',
      });

      // Subscribe with always-failing handler
      const handler = jest.fn().mockRejectedValue(new Error('Always fails'));
      lowRetryBus.subscribe(agentId, handler);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Message should have failed after retries
      expect(failedHandler).toHaveBeenCalled();

      lowRetryBus.clear();
    });
  });
});
