/**
 * Governance HTTP routes. Thin transport layer: validate shape (Ajv) → delegate
 * to the closure engine → emit audit evidence → return a consistent envelope.
 *
 * Rationale: a single, uniform response envelope ({ data | error, audit })
 * gives clients a stable contract (charter: API response format strictly
 * consistent, actionable errors).
 */
import { Router } from "express";
import { validateNamespace, validateClosure } from "./validators.js";
import { checkMachineName } from "./naming.js";
import { closureEngine } from "./closure-engine.js";
import { buildAuditRecord } from "./audit.js";

/**
 * Build the governance router. Logger is injected for test isolation.
 * @param {{ info: Function, warn: Function }} logger
 * @returns {import('express').Router}
 */
export function createGovernanceRouter(logger) {
  const router = Router();

  router.post("/namespace", (req, res) => {
    if (!validateNamespace(req.body)) {
      return res.status(400).json({ error: { rule: "schema", details: validateNamespace.errors } });
    }
    const nameViolations = checkMachineName(req.body.name);
    const audit = buildAuditRecord({
      actor: req.body.owner,
      action: "create-namespace",
      resource: req.body.name,
      passed: nameViolations.length === 0,
      violations: nameViolations.length,
      correlationId: req.get("x-correlation-id") || undefined,
    });
    if (nameViolations.length > 0) {
      logger.warn({ audit }, "namespace rejected");
      return res.status(422).json({ error: { violations: nameViolations }, audit });
    }
    logger.info({ audit }, "namespace created");
    return res.status(201).json({ data: { id: req.body.name, owner: req.body.owner }, audit });
  });

  router.post("/closure", (req, res) => {
    if (!validateClosure(req.body)) {
      return res.status(400).json({ error: { rule: "schema", details: validateClosure.errors } });
    }
    const result = closureEngine.evaluate(req.body);
    const passed = result.ok;
    const audit = buildAuditRecord({
      actor: req.get("x-actor") || "anonymous",
      action: "evaluate-closure",
      resource: req.body.namespace,
      passed,
      violations: passed ? 0 : result.violations.length,
      correlationId: req.get("x-correlation-id") || undefined,
    });
    if (!passed) {
      logger.warn({ audit }, "closure failed");
      return res.status(422).json({ error: { violations: result.violations }, audit });
    }
    logger.info({ audit }, "closure passed");
    return res.status(200).json({ data: result.value, audit });
  });

  return router;
}
