import { NextRequest, NextResponse } from 'next/server';

const CONNECTORS = [
  { id: 'connector-github', name: 'GitHub', type: 'vcs', status: 'healthy', latencyMs: 42, version: '1.0.0', endpoint: 'https://api.github.com', authType: 'token', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'connector-postgresql', name: 'PostgreSQL', type: 'database', status: 'healthy', latencyMs: 8, version: '1.0.0', endpoint: 'postgresql://localhost:5432/mycodexvantaos', authType: 'password', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'connector-redis', name: 'Redis', type: 'cache', status: 'healthy', latencyMs: 2, version: '1.0.0', endpoint: 'redis://localhost:6379', authType: 'password', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'connector-kafka', name: 'Kafka', type: 'queue', status: 'healthy', latencyMs: 15, version: '1.0.0', endpoint: 'kafka://localhost:9092', authType: 'sasl', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'connector-s3', name: 'S3 / R2', type: 'storage', status: 'healthy', latencyMs: 55, version: '1.0.0', endpoint: 'https://s3.amazonaws.com', authType: 'iam', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'connector-mongodb', name: 'MongoDB', type: 'database', status: 'degraded', latencyMs: 320, version: '1.0.0', endpoint: 'mongodb://localhost:27017/mycodexvantaos', authType: 'password', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'connector-elastic', name: 'Elasticsearch', type: 'search', status: 'healthy', latencyMs: 28, version: '1.0.0', endpoint: 'https://localhost:9200', authType: 'api-key', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'connector-auth', name: 'Auth (Keycloak)', type: 'auth', status: 'healthy', latencyMs: 12, version: '1.0.0', endpoint: 'https://auth.mycodexvantaos.dev', authType: 'oidc', createdAt: '2026-01-01T00:00:00Z' },
];

/** GET /api/connectors — list all connectors */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');

  let result = [...CONNECTORS];
  if (status) result = result.filter(c => c.status === status);
  if (type) result = result.filter(c => c.type === type);

  return NextResponse.json({ success: true, data: result, total: result.length });
}

/** POST /api/connectors — create a new connector */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, type, endpoint, authType } = body;

  if (!name || !type || !endpoint) {
    return NextResponse.json({ success: false, error: 'name, type, and endpoint are required' }, { status: 400 });
  }

  const newConnector = {
    id: `connector-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    type,
    status: 'pending',
    latencyMs: null,
    version: '1.0.0',
    endpoint,
    authType: authType ?? 'token',
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ success: true, data: newConnector }, { status: 201 });
}

/** PUT /api/connectors — update a connector */
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }

  const connector = CONNECTORS.find(c => c.id === id);
  if (!connector) {
    return NextResponse.json({ success: false, error: `Connector '${id}' not found` }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: { ...connector, ...updates, updatedAt: new Date().toISOString() } });
}

/** DELETE /api/connectors?id=<id> — remove a connector */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'id query param is required' }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: `Connector '${id}' deleted` });
}
