import { describe, test, expect } from "@jest/globals";
import request from "supertest";
import pino from "pino";
import { createApp } from "../src/app.js";

const app = createApp({ logger: pino({ level: "silent" }) });

describe("Namespace Governance API", () => {
  test("GET /healthz", async () => {
    const res = await request(app).get("/healthz");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  describe("POST /governance/namespace", () => {
    test("201 on valid payload with audit", async () => {
      const res = await request(app)
        .post("/governance/namespace")
        .send({ name: "test-ns", owner: "dev" });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.id).toBe("test-ns");
      expect(res.body.audit.hash).toMatch(/^[a-f0-9]{64}$/);
    });
    test("400 on missing owner (schema)", async () => {
      const res = await request(app).post("/governance/namespace").send({ name: "test-ns" });
      expect(res.statusCode).toBe(400);
    });
    test("400 on additional property", async () => {
      const res = await request(app)
        .post("/governance/namespace")
        .send({ name: "test-ns", owner: "dev", rogue: 1 });
      expect(res.statusCode).toBe(400);
    });
    test("honors x-correlation-id", async () => {
      const res = await request(app)
        .post("/governance/namespace")
        .set("x-correlation-id", "corr-123")
        .send({ name: "test-ns", owner: "dev" });
      expect(res.body.audit.correlationId).toBe("corr-123");
    });
  });

  describe("POST /governance/closure", () => {
    test("200 on valid closure", async () => {
      const res = await request(app)
        .post("/governance/closure")
        .send({ namespace: "mycodexvantaos", rules: { codes: ["mycodexvantaos-50100"] } });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.era.era).toBe("era-two");
    });
    test("422 with violations on bad closure", async () => {
      const res = await request(app)
        .post("/governance/closure")
        .send({ namespace: "mycodexvantaos", rules: { codes: ["bad-code"] } });
      expect(res.statusCode).toBe(422);
      expect(res.body.error.violations.length).toBeGreaterThan(0);
    });
    test("400 on schema violation", async () => {
      const res = await request(app).post("/governance/closure").send({ rules: {} });
      expect(res.statusCode).toBe(400);
    });
    test("422 when machine name itself is invalid", async () => {
      const res = await request(app).post("/governance/closure").send({ namespace: "Bad_NS" });
      expect(res.statusCode).toBe(422);
    });
  });
});
