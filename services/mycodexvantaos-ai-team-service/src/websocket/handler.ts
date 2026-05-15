/**
 * WebSocket handler for real-time AI Team communication
 * @module @mycodexvantaos/ai-team-service/websocket
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Orchestrator, OrchestratorEvent } from '@mycodexvantaos/ai-team-orchestrator';
import { v4 as uuidv4 } from 'uuid';

/**
 * WebSocket client state
 */
interface WSClient {
  id: string;
  ws: WebSocket;
  subscriptions: Set<string>;
  isAlive: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Message types
 */
type WSMessageType = 'subscribe' | 'unsubscribe' | 'event' | 'ping' | 'pong' | 'error' | 'message';

/**
 * WebSocket message structure
 */
interface WSMessage {
  type: WSMessageType;
  payload?: unknown;
  correlationId?: string;
}

/**
 * Setup WebSocket server
 */
export function setupWebSocket(wss: WebSocketServer, orchestrator: Orchestrator): void {
  const clients = new Map<string, WSClient>();

  // Heartbeat interval
  const heartbeatInterval = setInterval(() => {
    for (const [id, client] of clients) {
      if (!client.isAlive) {
        client.ws.terminate();
        clients.delete(id);
        continue;
      }
      client.isAlive = false;
      client.ws.ping();
    }
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  wss.on('connection', (ws: WebSocket) => {
    const clientId = uuidv4();
    const client: WSClient = {
      id: clientId,
      ws,
      subscriptions: new Set(),
      isAlive: true,
    };

    clients.set(clientId, client);

    // Send connection confirmation
    sendMessage(ws, 'event', {
      event: 'connected',
      clientId,
      timestamp: new Date().toISOString(),
    });

    // Handle pong responses
    ws.on('pong', () => {
      client.isAlive = true;
    });

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        handleMessage(client, message, orchestrator);
      } catch (error) {
        sendMessage(ws, 'error', {
          message: 'Invalid message format',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Handle close
    ws.on('close', () => {
      clients.delete(clientId);
      console.log(`Client ${clientId} disconnected`);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      clients.delete(clientId);
    });
  });

  // Subscribe to orchestrator events and broadcast to clients
  setupOrchestratorEventForwarding(orchestrator, clients);
}

/**
 * Handle incoming WebSocket message
 */
function handleMessage(client: WSClient, message: WSMessage, orchestrator: Orchestrator): void {
  switch (message.type) {
    case 'subscribe':
      handleSubscribe(client, message);
      break;

    case 'unsubscribe':
      handleUnsubscribe(client, message);
      break;

    case 'ping':
      sendMessage(client.ws, 'pong', { timestamp: new Date().toISOString() });
      break;

    case 'message':
      handleCustomMessage(client, message, orchestrator);
      break;

    default:
      sendMessage(client.ws, 'error', {
        message: `Unknown message type: ${message.type}`,
      });
  }
}

/**
 * Handle subscription request
 */
function handleSubscribe(client: WSClient, message: WSMessage): void {
  const { eventType } = message.payload as { eventType: string };

  if (!eventType) {
    return sendMessage(client.ws, 'error', {
      message: 'eventType is required for subscription',
    });
  }

  client.subscriptions.add(eventType);

  sendMessage(client.ws, 'event', {
    event: 'subscribed',
    eventType,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle unsubscription request
 */
function handleUnsubscribe(client: WSClient, message: WSMessage): void {
  const { eventType } = message.payload as { eventType: string };

  if (!eventType) {
    return sendMessage(client.ws, 'error', {
      message: 'eventType is required for unsubscription',
    });
  }

  client.subscriptions.delete(eventType);

  sendMessage(client.ws, 'event', {
    event: 'unsubscribed',
    eventType,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle custom message (for agent communication)
 */
function handleCustomMessage(
  client: WSClient,
  message: WSMessage,
  orchestrator: Orchestrator
): void {
  const payload = message.payload as any;

  // Handle different custom message types
  if (payload.action === 'send_message') {
    // Send message through orchestrator
    try {
      const messageId = orchestrator.sendMessage({
        sender_id: payload.sender_id,
        recipient_id: payload.recipient_id,
        message_type: payload.message_type,
        content: payload.content,
        priority: payload.priority,
        requires_response: payload.requires_response,
      });

      sendMessage(client.ws, 'event', {
        event: 'message_sent',
        message_id: messageId,
        correlationId: message.correlationId,
      });
    } catch (error) {
      sendMessage(client.ws, 'error', {
        message: 'Failed to send message',
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: message.correlationId,
      });
    }
  } else if (payload.action === 'broadcast') {
    // Broadcast message
    try {
      const messageId = orchestrator.broadcastMessage(
        payload.sender_id,
        payload.message_type,
        payload.content
      );

      sendMessage(client.ws, 'event', {
        event: 'message_broadcast',
        message_id: messageId,
        correlationId: message.correlationId,
      });
    } catch (error) {
      sendMessage(client.ws, 'error', {
        message: 'Failed to broadcast message',
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: message.correlationId,
      });
    }
  } else {
    sendMessage(client.ws, 'error', {
      message: `Unknown action: ${payload.action}`,
    });
  }
}

/**
 * Setup event forwarding from orchestrator to WebSocket clients
 */
function setupOrchestratorEventForwarding(
  orchestrator: Orchestrator,
  clients: Map<string, WSClient>
): void {
  const eventTypes = [
    'agent:registered',
    'agent:unregistered',
    'agent:activated',
    'agent:deactivated',
    'team:created',
    'team:updated',
    'team:destroyed',
    'task:created',
    'task:updated',
    'task:completed',
    'task:failed',
    'message:sent',
    'message:received',
    'workflow:started',
    'workflow:paused',
    'workflow:resumed',
    'workflow:completed',
    'hitl:checkpoint',
    'hitl:approved',
    'hitl:rejected',
  ];

  for (const eventType of eventTypes) {
    orchestrator.onEvent(eventType, (event: unknown) => {
      broadcastToSubscribers(clients, eventType, event);
    });
  }

  // Wildcard subscription for all events
  orchestrator.onEvent('*', (event: unknown) => {
    broadcastToSubscribers(clients, '*', event as OrchestratorEvent);
  });
}

/**
 * Broadcast event to subscribed clients
 */
function broadcastToSubscribers(
  clients: Map<string, WSClient>,
  eventType: string,
  payload: unknown
): void {
  const message = JSON.stringify({
    type: 'event',
    payload: {
      eventType,
      data: payload,
      timestamp: new Date().toISOString(),
    },
  });

  for (const client of clients.values()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      // Check if client is subscribed to this event type or all events
      if (client.subscriptions.has(eventType) || client.subscriptions.has('*')) {
        client.ws.send(message);
      }
    }
  }
}

/**
 * Send message to WebSocket client
 */
function sendMessage(ws: WebSocket, type: WSMessageType, payload: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type,
        payload,
        timestamp: new Date().toISOString(),
      })
    );
  }
}

export { sendMessage, broadcastToSubscribers };
