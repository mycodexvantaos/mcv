#!/usr/bin/env npx ts-node
// ═══════════════════════════════════════════════════════════════════════
// MyCodeXvantaOS — Audit Chain Integrity Verifier
// Verifies the SHA-256 integrity chain of audit events
// Usage: npx ts-node tools/verify-integrity.ts [--since <timestamp>]
// ═══════════════════════════════════════════════════════════════════════

import * as crypto from 'crypto';

// ── Types ──────────────────────────────────────────────────────────────
interface AuditEvent {
  event_id: string;
  event_type: string;
  source: string;
  timestamp: string;
  subject_id: string;
  workspace_id: string;
  payload: string;
  hash: string;
  previous_hash: string;
  chain_index: number;
  pair_id?: string;
  pair_role?: 'request' | 'completion' | 'failure';
  timeout_seconds?: number;
}

interface IntegrityReport {
  total_events: number;
  verified: number;
  broken_chain: number;
  hash_mismatch: number;
  missing_previous: number;
  unpaired_requests: number;
  unpaired_completions: number;
  gaps: number[];
  details: string[];
}

// ── Hash Computation ───────────────────────────────────────────────────
function computeHash(event: AuditEvent): string {
  const input = `${event.payload}:${event.previous_hash}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

// ── Verification Logic ─────────────────────────────────────────────────
function verifyChain(events: AuditEvent[]): IntegrityReport {
  const report: IntegrityReport = {
    total_events: events.length,
    verified: 0,
    broken_chain: 0,
    hash_mismatch: 0,
    missing_previous: 0,
    unpaired_requests: 0,
    unpaired_completions: 0,
    gaps: [],
    details: [],
  };

  events.sort((a, b) => a.chain_index - b.chain_index);

  const indexMap = new Map<number, AuditEvent>();
  for (const event of events) {
    indexMap.set(event.chain_index, event);
  }

  for (let i = 0; i < events.length; i++) {
    const event = events[i];

    // Check for gaps
    if (i > 0 && event.chain_index !== events[i - 1].chain_index + 1) {
      const missingStart = events[i - 1].chain_index + 1;
      const missingEnd = event.chain_index - 1;
      for (let g = missingStart; g <= missingEnd; g++) {
        report.gaps.push(g);
      }
      report.details.push(`GAP: chain_index ${missingStart}-${missingEnd} missing between events`);
      report.broken_chain++;
    }

    // Verify hash
    const expectedHash = computeHash(event);
    if (event.hash !== expectedHash) {
      report.hash_mismatch++;
      report.details.push(
        `HASH_MISMATCH: event_id=${event.event_id} chain_index=${event.chain_index} ` +
        `expected=${expectedHash.slice(0, 16)}... got=${event.hash.slice(0, 16)}...`
      );
    }

    // Verify previous_hash linkage
    if (event.chain_index === 0) {
      if (event.previous_hash !== 'genesis') {
        report.missing_previous++;
        report.details.push(
          `INVALID_GENESIS: chain_index=0 previous_hash should be "genesis", got "${event.previous_hash}"`
        );
      }
    } else {
      const prevEvent = indexMap.get(event.chain_index - 1);
      if (prevEvent && event.previous_hash !== prevEvent.hash) {
        report.missing_previous++;
        report.details.push(
          `BROKEN_LINK: event_id=${event.event_id} chain_index=${event.chain_index} ` +
          `previous_hash doesn't match predecessor's hash`
        );
      }
    }

    if (event.hash === expectedHash && 
        (event.chain_index === 0 ? event.previous_hash === 'genesis' : 
         indexMap.get(event.chain_index - 1)?.hash === event.previous_hash)) {
      report.verified++;
    }
  }

  // Verify closed-loop pairing
  const pairs = new Map<string, AuditEvent[]>();
  for (const event of events) {
    if (event.pair_id) {
      if (!pairs.has(event.pair_id)) pairs.set(event.pair_id, []);
      pairs.get(event.pair_id)!.push(event);
    }
  }

  for (const [pairId, pairEvents] of pairs) {
    const roles = pairEvents.map(e => e.pair_role);
    const hasRequest = roles.includes('request');
    const hasCompletion = roles.includes('completion') || roles.includes('failure');

    if (hasRequest && !hasCompletion) {
      report.unpaired_requests++;
      report.details.push(`UNPAIRED_REQUEST: pair_id=${pairId} has request but no completion/failure`);
    }
    if (hasCompletion && !hasRequest) {
      report.unpaired_completions++;
      report.details.push(`UNPAIRED_COMPLETION: pair_id=${pairId} has completion but no request`);
    }
  }

  return report;
}

// ── Report Formatting ──────────────────────────────────────────────────
function formatReport(report: IntegrityReport): string {
  const lines: string[] = [];
  lines.push('════════════════════════════════════════════════════════');
  lines.push('  MyCodeXvantaOS — Audit Chain Integrity Report');
  lines.push('════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`  Total Events:       ${report.total_events}`);
  lines.push(`  Verified:           ${report.verified} (${((report.verified / Math.max(report.total_events, 1)) * 100).toFixed(1)}%)`);
  lines.push(`  Hash Mismatches:    ${report.hash_mismatch}`);
  lines.push(`  Broken Links:       ${report.missing_previous}`);
  lines.push(`  Chain Gaps:         ${report.gaps.length} missing indices`);
  lines.push(`  Unpaired Requests:  ${report.unpaired_requests}`);
  lines.push(`  Unpaired Completions: ${report.unpaired_completions}`);
  lines.push('');

  if (report.details.length > 0) {
    lines.push('──────────────────────────────────────────────────────');
    lines.push('  Details:');
    lines.push('──────────────────────────────────────────────────────');
    for (const detail of report.details.slice(0, 50)) {
      lines.push(`  ${detail}`);
    }
    if (report.details.length > 50) {
      lines.push(`  ... and ${report.details.length - 50} more`);
    }
  }

  lines.push('');
  lines.push('──────────────────────────────────────────────────────');

  const isHealthy = report.hash_mismatch === 0 && report.missing_previous === 0;
  lines.push(`  Status: ${isHealthy ? '✅ CHAIN INTEGRITY VERIFIED' : '❌ CHAIN INTEGRITY COMPROMISED'}`);
  lines.push('──────────────────────────────────────────────────────');

  return lines.join('\n');
}

// ── Main ───────────────────────────────────────────────────────────────
function main() {
  console.log('Note: This tool requires database access to fetch audit events.');
  console.log('In production, this would query the audit_events table.\n');

  // Demo with sample data
  const sampleEvents: AuditEvent[] = [
    {
      event_id: 'evt-001',
      event_type: 'identity.subject.registered',
      source: 'identity',
      timestamp: new Date().toISOString(),
      subject_id: 'sub-001',
      workspace_id: 'ws-001',
      payload: '{"action":"register","subject_id":"sub-001"}',
      hash: '',
      previous_hash: 'genesis',
      chain_index: 0,
    },
  ];

  sampleEvents[0].hash = computeHash(sampleEvents[0]);

  const report = verifyChain(sampleEvents);
  console.log(formatReport(report));

  if (report.hash_mismatch > 0 || report.missing_previous > 0) {
    process.exit(1);
  }
}

main();
