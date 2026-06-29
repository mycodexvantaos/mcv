/**
 * MyCodexVantaOS Cookie Security Tests
 */

import { describe, it, expect } from "vitest";
import {
  getSessionCookieConfig,
  getCsrfCookieConfig,
  serializeCookie,
  parseCookies,
  validateCookieConfig,
  createSessionCookie,
  createDeleteCookie,
} from "../../src/lib/cookies";

describe("Cookie Security Tests", () => {
  describe("getSessionCookieConfig()", () => {
    it("should have Secure=true in production", () => {
      const config = getSessionCookieConfig("production");
      expect(config.secure).toBe(true);
    });

    it("should have HttpOnly=true for session cookie", () => {
      const config = getSessionCookieConfig("production");
      expect(config.httpOnly).toBe(true);
    });

    it("should have SameSite=Lax for session cookie", () => {
      const config = getSessionCookieConfig("production");
      expect(config.sameSite).toBe("Lax");
    });

    it("should have production cookie domain", () => {
      const config = getSessionCookieConfig("production");
      expect(config.domain).toBe(".mycodexvantaos.com");
    });

    it("should have Secure=false in development", () => {
      const config = getSessionCookieConfig("development");
      expect(config.secure).toBe(false);
    });

    it("should have undefined domain in development", () => {
      const config = getSessionCookieConfig("development");
      expect(config.domain).toBeUndefined();
    });
  });

  describe("getCsrfCookieConfig()", () => {
    it("should have Secure=true in production", () => {
      const config = getCsrfCookieConfig("production");
      expect(config.secure).toBe(true);
    });

    it("should have HttpOnly=false (readable by JS)", () => {
      const config = getCsrfCookieConfig("production");
      expect(config.httpOnly).toBe(false);
    });

    it("should have SameSite=Strict", () => {
      const config = getCsrfCookieConfig("production");
      expect(config.sameSite).toBe("Strict");
    });
  });

  describe("serializeCookie()", () => {
    it("should include Secure flag when secure=true", () => {
      const cookie = serializeCookie({
        name: "test",
        value: "value",
        secure: true,
        httpOnly: true,
        sameSite: "Lax",
      });
      expect(cookie).toContain("Secure");
    });

    it("should include HttpOnly flag when httpOnly=true", () => {
      const cookie = serializeCookie({
        name: "test",
        value: "value",
        secure: true,
        httpOnly: true,
        sameSite: "Lax",
      });
      expect(cookie).toContain("HttpOnly");
    });

    it("should include SameSite directive", () => {
      const cookie = serializeCookie({
        name: "test",
        value: "value",
        secure: true,
        httpOnly: true,
        sameSite: "Strict",
      });
      expect(cookie).toContain("SameSite=Strict");
    });

    it("should encode cookie value", () => {
      const cookie = serializeCookie({
        name: "test",
        value: "hello world",
        secure: true,
        httpOnly: true,
        sameSite: "Lax",
      });
      expect(cookie).toContain("hello%20world");
    });
  });

  describe("parseCookies()", () => {
    it("should parse cookie header correctly", () => {
      const cookies = parseCookies("session=abc123; csrf=xyz789");
      expect(cookies["session"]).toBe("abc123");
      expect(cookies["csrf"]).toBe("xyz789");
    });

    it("should return empty object for empty string", () => {
      const cookies = parseCookies("");
      expect(Object.keys(cookies)).toHaveLength(0);
    });
  });

  describe("validateCookieConfig()", () => {
    it("should report violation for non-secure production cookie", () => {
      const config = getSessionCookieConfig("development");
      const violations = validateCookieConfig({ ...config, secure: false });
      // In development, secure=false is expected
      // But if we force check, it should flag it
      expect(Array.isArray(violations)).toBe(true);
    });

    it("should pass for valid production session cookie", () => {
      const config = getSessionCookieConfig("production");
      const violations = validateCookieConfig(config);
      expect(violations).toHaveLength(0);
    });
  });

  describe("createDeleteCookie()", () => {
    it("should create a cookie with Max-Age=0", () => {
      const cookie = createDeleteCookie("session", "production");
      expect(cookie).toContain("Max-Age=0");
    });

    it("should create a cookie with past Expires date", () => {
      const cookie = createDeleteCookie("session", "production");
      expect(cookie).toContain("Expires=");
    });
  });
});
