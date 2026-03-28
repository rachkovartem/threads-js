import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildAuthUrl,
  exchangeCode,
  exchangeLongLivedToken,
  refreshToken,
} from "../src/auth";

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("OAuth", () => {
  describe("buildAuthUrl", () => {
    it("builds a valid authorization URL", () => {
      const url = buildAuthUrl({
        clientId: "app_123",
        redirectUri: "https://example.com/callback",
        scopes: ["threads_basic", "threads_content_publish"],
      });

      expect(url).toContain("https://threads.net/oauth/authorize");
      expect(url).toContain("client_id=app_123");
      expect(url).toContain("redirect_uri=");
      expect(url).toContain("scope=threads_basic%2Cthreads_content_publish");
      expect(url).toContain("response_type=code");
    });

    it("includes state parameter when provided", () => {
      const url = buildAuthUrl({
        clientId: "app_123",
        redirectUri: "https://example.com/callback",
        scopes: ["threads_basic"],
        state: "random_state",
      });

      expect(url).toContain("state=random_state");
    });
  });

  describe("exchangeCode", () => {
    it("exchanges authorization code for short-lived token", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ access_token: "short_tok", token_type: "bearer" }),
      );

      const result = await exchangeCode({
        clientId: "app_123",
        clientSecret: "secret",
        code: "auth_code",
        redirectUri: "https://example.com/callback",
      });

      expect(result.accessToken).toBe("short_tok");
      expect(result.tokenType).toBe("bearer");
    });
  });

  describe("exchangeLongLivedToken", () => {
    it("exchanges short-lived token for long-lived token", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          access_token: "long_tok",
          token_type: "bearer",
          expires_in: 5184000,
        }),
      );

      const result = await exchangeLongLivedToken({
        clientSecret: "secret",
        accessToken: "short_tok",
      });

      expect(result.accessToken).toBe("long_tok");
      expect(result.expiresIn).toBe(5184000);
    });
  });

  describe("refreshToken", () => {
    it("refreshes a long-lived token", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          access_token: "refreshed_tok",
          token_type: "bearer",
          expires_in: 5184000,
        }),
      );

      const result = await refreshToken({ token: "old_tok" });

      expect(result.accessToken).toBe("refreshed_tok");
      expect(result.expiresIn).toBe(5184000);

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("grant_type=th_refresh_token");
      expect(url).toContain("access_token=old_tok");
    });
  });
});
