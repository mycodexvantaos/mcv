/**
 * MyCodexVantaOS URL Builder Tests
 */

import { describe, it, expect } from "vitest";
import {
  UrlBuilder,
  urlBuilder,
  canonicalUrl,
  apiUrl,
  oauthCallbackUrl,
  webhookUrl,
  assertProductionSafeUrl,
  getAllOAuthCallbackUrls,
  getAllWebhookUrls,
} from "../../src/lib/url-builder";

describe("URL Builder Tests", () => {
  describe("UrlBuilder class", () => {
    const productionBuilder = new UrlBuilder("production");
    const devBuilder = new UrlBuilder("development");

    describe("canonical()", () => {
      it("should return production canonical URL", () => {
        expect(productionBuilder.canonical()).toBe("https://mycodexvantaos.com/");
      });

      it("should build URL with path", () => {
        expect(productionBuilder.canonical("/about")).toBe("https://mycodexvantaos.com/about");
      });

      it("should handle path without leading slash", () => {
        expect(productionBuilder.canonical("pricing")).toBe("https://mycodexvantaos.com/pricing");
      });
    });

    describe("api()", () => {
      it("should build API URL with version prefix", () => {
        const url = productionBuilder.api("/agents");
        expect(url).toContain("api.mycodexvantaos.com");
        expect(url).toContain("/v1/agents");
      });

      it("should use v2 when specified", () => {
        const url = productionBuilder.api("/agents", "v2");
        expect(url).toContain("/v2/agents");
      });
    });

    describe("oauthCallback()", () => {
      it("should build GitHub OAuth callback URL", () => {
        const url = productionBuilder.oauthCallback("github");
        expect(url).toBe("https://mycodexvantaos.com/api/auth/callback/github");
      });

      it("should build Google OAuth callback URL", () => {
        const url = productionBuilder.oauthCallback("google");
        expect(url).toBe("https://mycodexvantaos.com/api/auth/callback/google");
      });

      it("should NOT use vendor-generated URLs", () => {
        const url = productionBuilder.oauthCallback("github");
        expect(url).not.toMatch(/\.(github\.io|pages\.dev|vercel\.app|netlify\.app|run\.app)/);
      });
    });

    describe("webhook()", () => {
      it("should build GitHub webhook URL", () => {
        const url = productionBuilder.webhook("github");
        expect(url).toBe("https://api.mycodexvantaos.com/webhooks/github");
      });

      it("should build Stripe webhook URL", () => {
        const url = productionBuilder.webhook("stripe");
        expect(url).toBe("https://api.mycodexvantaos.com/webhooks/stripe");
      });
    });

    describe("validate()", () => {
      it("should validate canonical URL as safe", () => {
        const result = productionBuilder.validate("https://mycodexvantaos.com");
        expect(result.valid).toBe(true);
      });

      it("should reject vendor-generated URL", () => {
        const result = productionBuilder.validate("https://example.vercel.app");
        expect(result.valid).toBe(false);
        expect(result.reason).toBeDefined();
      });

      it("should reject HTTP URL in production", () => {
        const result = productionBuilder.validate("http://mycodexvantaos.com");
        expect(result.valid).toBe(false);
      });
    });
  });

  describe("assertProductionSafeUrl()", () => {
    it("should not throw for safe URL", () => {
      expect(() => assertProductionSafeUrl("https://mycodexvantaos.com", "test")).not.toThrow();
    });

    it("should throw for vendor-generated URL", () => {
      expect(() =>
        assertProductionSafeUrl("https://example.vercel.app", "OAuth callback")
      ).toThrow("Domain Contract Violation");
    });
  });

  describe("getAllOAuthCallbackUrls()", () => {
    it("should return all OAuth callback URLs for production", () => {
      const urls = getAllOAuthCallbackUrls("production");
      expect(urls.github).toBe("https://mycodexvantaos.com/api/auth/callback/github");
      expect(urls.google).toBe("https://mycodexvantaos.com/api/auth/callback/google");
      expect(urls.microsoft).toBe("https://mycodexvantaos.com/api/auth/callback/microsoft");
      expect(urls.slack).toBe("https://mycodexvantaos.com/api/auth/callback/slack");
    });

    it("all production OAuth URLs should use canonical domain", () => {
      const urls = getAllOAuthCallbackUrls("production");
      for (const url of Object.values(urls)) {
        expect(url).toContain("mycodexvantaos.com");
        expect(url).not.toMatch(/\.(github\.io|pages\.dev|vercel\.app|netlify\.app)/);
      }
    });
  });

  describe("getAllWebhookUrls()", () => {
    it("should return all webhook URLs for production", () => {
      const urls = getAllWebhookUrls("production");
      expect(urls.github).toBe("https://api.mycodexvantaos.com/webhooks/github");
      expect(urls.stripe).toBe("https://api.mycodexvantaos.com/webhooks/stripe");
      expect(urls.resend).toBe("https://api.mycodexvantaos.com/webhooks/resend");
    });

    it("all production webhook URLs should use api subdomain", () => {
      const urls = getAllWebhookUrls("production");
      for (const url of Object.values(urls)) {
        expect(url).toContain("api.mycodexvantaos.com");
        expect(url).not.toMatch(/\.(run\.app|appspot\.com|cloudfunctions\.net)/);
      }
    });
  });
});
