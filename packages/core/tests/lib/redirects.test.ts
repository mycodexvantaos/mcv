/**
 * MyCodexVantaOS Redirect Tests
 *
 * Tests for Domain & Deployment Contract redirect requirements:
 * - www → apex (301)
 * - HTTP → HTTPS (301)
 */

import { describe, it, expect } from "vitest";
import {
  evaluateRedirect,
  getProductionRedirectRules,
  isWwwRedirect,
  isHttpRedirect,
  getCanonicalRedirectDestination,
  getCloudflareRedirects,
} from "../../src/lib/redirects";

describe("Redirect Rules Tests", () => {
  describe("getProductionRedirectRules()", () => {
    it("should have at least 3 redirect rules", () => {
      const rules = getProductionRedirectRules();
      expect(rules.length).toBeGreaterThanOrEqual(3);
    });

    it("should have www → apex redirect rule", () => {
      const rules = getProductionRedirectRules();
      const wwwRule = rules.find((r) => r.permanent && r.statusCode === 301);
      expect(wwwRule).toBeDefined();
    });

    it("all permanent redirects should use 301 status code", () => {
      const rules = getProductionRedirectRules();
      for (const rule of rules) {
        if (rule.permanent) {
          expect(rule.statusCode).toBe(301);
        }
      }
    });

    it("all redirect destinations should use canonical URL", () => {
      const rules = getProductionRedirectRules();
      for (const rule of rules) {
        expect(rule.destination).toContain("mycodexvantaos.com");
        expect(rule.destination).not.toContain("github.io");
        expect(rule.destination).not.toContain("vercel.app");
      }
    });
  });

  describe("evaluateRedirect()", () => {
    it("should redirect www to apex in production", () => {
      const result = evaluateRedirect("https://www.mycodexvantaos.com/", "production");
      expect(result.shouldRedirect).toBe(true);
      expect(result.destination).toContain("https://mycodexvantaos.com");
      expect(result.statusCode).toBe(301);
    });

    it("should redirect HTTP to HTTPS in production", () => {
      const result = evaluateRedirect("http://mycodexvantaos.com/", "production");
      expect(result.shouldRedirect).toBe(true);
      expect(result.destination).toContain("https://mycodexvantaos.com");
      expect(result.statusCode).toBe(301);
    });

    it("should NOT redirect canonical HTTPS URL", () => {
      const result = evaluateRedirect("https://mycodexvantaos.com/", "production");
      expect(result.shouldRedirect).toBe(false);
    });

    it("should NOT redirect in development", () => {
      const result = evaluateRedirect("https://www.mycodexvantaos.com/", "development");
      expect(result.shouldRedirect).toBe(false);
    });

    it("should preserve path when redirecting www to apex", () => {
      const result = evaluateRedirect("https://www.mycodexvantaos.com/about", "production");
      expect(result.shouldRedirect).toBe(true);
      expect(result.destination).toContain("/about");
    });
  });

  describe("isWwwRedirect()", () => {
    it("should return true for www.mycodexvantaos.com", () => {
      expect(isWwwRedirect("www.mycodexvantaos.com")).toBe(true);
    });

    it("should return false for mycodexvantaos.com", () => {
      expect(isWwwRedirect("mycodexvantaos.com")).toBe(false);
    });

    it("should return false for api.mycodexvantaos.com", () => {
      expect(isWwwRedirect("api.mycodexvantaos.com")).toBe(false);
    });
  });

  describe("isHttpRedirect()", () => {
    it("should return true for http protocol", () => {
      expect(isHttpRedirect("http")).toBe(true);
      expect(isHttpRedirect("http:")).toBe(true);
    });

    it("should return false for https protocol", () => {
      expect(isHttpRedirect("https")).toBe(false);
      expect(isHttpRedirect("https:")).toBe(false);
    });
  });

  describe("getCloudflareRedirects()", () => {
    it("should include www to apex redirect rule", () => {
      const redirects = getCloudflareRedirects();
      expect(redirects).toContain("www.mycodexvantaos.com");
      expect(redirects).toContain("https://mycodexvantaos.com");
    });

    it("should use 301 status code", () => {
      const redirects = getCloudflareRedirects();
      expect(redirects).toContain("301");
    });
  });
});
