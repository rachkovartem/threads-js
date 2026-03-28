import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThreadsClient } from "../src/index";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
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

describe("ThreadsClient (full integration)", () => {
  it("has posts, replies, and users resources", () => {
    const client = new ThreadsClient({ accessToken: "tok" });
    expect(client.posts).toBeDefined();
    expect(client.replies).toBeDefined();
    expect(client.users).toBeDefined();
  });

  it("exposes static OAuth helpers", () => {
    expect(ThreadsClient.buildAuthUrl).toBeTypeOf("function");
    expect(ThreadsClient.exchangeCode).toBeTypeOf("function");
    expect(ThreadsClient.exchangeLongLivedToken).toBeTypeOf("function");
    expect(ThreadsClient.refreshToken).toBeTypeOf("function");
  });

  it("posts.create works end-to-end", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: "c1" }));
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: "p1" }));

    const client = new ThreadsClient({ accessToken: "tok", maxRetries: 0 });
    const post = await client.posts.create({ text: "Hello!" });
    expect(post.data.id).toBe("p1");
  });

  it("users.me works end-to-end", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ id: "123", username: "test" }),
    );

    const client = new ThreadsClient({ accessToken: "tok", maxRetries: 0 });
    const me = await client.users.me();
    expect(me.data.id).toBe("123");
  });
});
