import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThreadsClient } from "../src/client";
import { UsersResource } from "../src/resources/users";

const mockFetch = vi.fn();

beforeEach(() => {
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

describe("UsersResource", () => {
  it("fetches the authenticated user profile", async () => {
    const user = {
      id: "123",
      username: "testuser",
      name: "Test User",
      threads_profile_picture_url: "https://example.com/pic.jpg",
      threads_biography: "Hello world",
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(user));

    const client = new ThreadsClient({ accessToken: "tok" });
    const users = new UsersResource(client);
    const result = await users.me();

    expect(result.data.id).toBe("123");
    expect(result.data.username).toBe("testuser");
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/me");
    expect(url).toContain("fields=");
  });
});
