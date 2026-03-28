import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThreadsClient } from "../src/client";
import { ThreadsApiError } from "../src/errors";

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("ThreadsClient", () => {
  it("makes GET requests with access token", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: "123" }));

    const client = new ThreadsClient({ accessToken: "tok_123" });
    const result = await client.get<{ id: string }>("/me");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/me");
    expect(url).toContain("access_token=tok_123");
    expect(result.data).toEqual({ id: "123" });
  });

  it("makes POST requests with body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: "456" }));

    const client = new ThreadsClient({ accessToken: "tok_123" });
    const result = await client.post<{ id: string }>("/me/threads", {
      text: "hello",
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain("/me/threads");
    expect(init.method).toBe("POST");
  });

  it("throws ThreadsApiError on error response", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        { error: { message: "Invalid token", code: 190, error_subcode: 463 } },
        401,
      ),
    );

    const client = new ThreadsClient({ accessToken: "bad" });
    await expect(client.get("/me")).rejects.toThrow(ThreadsApiError);
  });

  it("retries on 429 and 5xx", async () => {
    vi.useFakeTimers();
    mockFetch
      .mockResolvedValueOnce(jsonResponse({}, 429))
      .mockResolvedValueOnce(jsonResponse({ id: "1" }));

    const client = new ThreadsClient({ accessToken: "tok", maxRetries: 2 });
    const promise = client.get<{ id: string }>("/me");
    await vi.advanceTimersByTimeAsync(10000);
    const result = await promise;

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.data).toEqual({ id: "1" });
    vi.useRealTimers();
  });

  it("parses rate limit headers", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ id: "1" }, 200, {
        "x-app-usage": JSON.stringify({
          call_count: 10,
          total_cputime: 5,
          total_time: 5,
        }),
      }),
    );

    const client = new ThreadsClient({ accessToken: "tok" });
    const result = await client.get<{ id: string }>("/me");

    expect(result.data).toEqual({ id: "1" });
    expect(result.rateLimit).toBeDefined();
    expect(result.rateLimit!.remaining).toBe(90);
  });

  it("stops retrying after maxRetries", async () => {
    vi.useFakeTimers();
    mockFetch
      .mockResolvedValueOnce(jsonResponse({}, 500))
      .mockResolvedValueOnce(jsonResponse({}, 500))
      .mockResolvedValueOnce(jsonResponse({}, 500));

    const client = new ThreadsClient({ accessToken: "tok", maxRetries: 2 });
    const promise = client.get("/me").catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(10000);
    const error = await promise;

    expect(error).toBeInstanceOf(ThreadsApiError);
    expect(mockFetch).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    vi.useRealTimers();
  });
});
