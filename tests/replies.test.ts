import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThreadsClient } from "../src/client";
import { RepliesResource } from "../src/resources/replies";

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

describe("RepliesResource", () => {
  it("lists replies for a post", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: [{ id: "r1" }, { id: "r2" }] }),
    );

    const client = new ThreadsClient({ accessToken: "tok" });
    const replies = new RepliesResource(client);
    const result = await replies.list("post_1");

    expect(result.data).toHaveLength(2);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/post_1/replies");
  });

  it("creates a reply", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: "container_r1" }));
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: "reply_1" }));

    const client = new ThreadsClient({ accessToken: "tok" });
    const replies = new RepliesResource(client);
    const result = await replies.create({ replyTo: "post_1", text: "Nice!" });

    expect(result.data.id).toBe("reply_1");
    const body1 = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body1.reply_to_id).toBe("post_1");
    expect(body1.text).toBe("Nice!");
    expect(body1.media_type).toBe("TEXT");
  });

  it("hides a reply", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

    const client = new ThreadsClient({ accessToken: "tok" });
    const replies = new RepliesResource(client);
    await replies.hide("reply_1");

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain("/reply_1/manage_reply");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.hide).toBe(true);
  });

  it("unhides a reply", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

    const client = new ThreadsClient({ accessToken: "tok" });
    const replies = new RepliesResource(client);
    await replies.unhide("reply_1");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.hide).toBe(false);
  });
});
