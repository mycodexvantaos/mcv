/**
 * MyCodexVantaOS CSP Tests
 */

import { describe, it, expect } from "vitest";
import {
  buildCspDirectives,
  buildProductionCsp,
  serializeCsp,
  getCspHeader,
  validateCsp,
} from "../../src/lib/csp";

describe("Content Security Policy Tests", () => {
  describe("buildProductionCsp()", () => {
    it("should include self in default-src", () => {
      const csp = buildProductionCsp();
      expect(csp["default-src"]).toContain("'self'");
    });

    it("should set frame-ancestors to none", () => {
      const csp = buildProductionCsp();
      expect(csp["frame-ancestors"]).toContain("'none'");
    });

    it("should set object-src to none", () => {
      const csp = buildProductionCsp();
      expect(csp["object-src"]).toContain("'none'");
    });

    it("should enable upgrade-insecure-requests", () => {
      const csp = buildProductionCsp();
      expect(csp["upgrade-insecure-requests"]).toBe(true);
    });

    it("should include canonical URL in connect-src", () => {
      const csp = buildProductionCsp();
      const connectSrc = csp["connect-src"] as string[];
      expect(connectSrc.some((s) => s.includes("mycodexvantaos.com"))).toBe(true);
    });

    it("should NOT include wildcard in default-src", () => {
      const csp = buildProductionCsp();
      expect(csp["default-src"]).not.toContain("*");
    });
  });

  describe("serializeCsp()", () => {
    it("should serialize directives to valid CSP header string", () => {
      const csp = buildProductionCsp();
      const header = serializeCsp(csp);
      expect(header).toContain("default-src 'self'");
      expect(header).toContain("frame-ancestors 'none'");
      expect(header).toContain("object-src 'none'");
      expect(header).toContain("upgrade-insecure-requests");
    });

    it("should separate directives with semicolons", () => {
      const csp = buildProductionCsp();
      const header = serializeCsp(csp);
      expect(header).toContain(";");
    });
  });

  describe("validateCsp()", () => {
    it("should warn about unsafe-eval in production", () => {
      const csp = buildCspDirectives("development");
      const warnings = validateCsp(csp);
      expect(warnings.some((w) => w.includes("unsafe-eval"))).toBe(true);
    });

    it("should pass for valid production CSP", () => {
      const csp = buildProductionCsp();
      const warnings = validateCsp(csp);
      // Production CSP should have minimal warnings
      expect(warnings.filter((w) => w.includes("unsafe-eval"))).toHaveLength(0);
    });
  });
});
