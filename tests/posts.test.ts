import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThreadsClient } from '../src/client';
import { PostsResource } from '../src/resources/posts';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('PostsResource', () => {
  it('creates a text post (two-step publish)', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 'container_1' }));
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 'post_1' }));

    const client = new ThreadsClient({ accessToken: 'tok', maxRetries: 0 });
    const posts = new PostsResource(client);
    const result = await posts.create({ text: 'Hello Threads!' });

    expect(result.data.id).toBe('post_1');
    expect(mockFetch).toHaveBeenCalledTimes(2);

    const [url1, init1] = mockFetch.mock.calls[0];
    expect(url1).toContain('/me/threads');
    expect(init1.method).toBe('POST');
    const body1 = JSON.parse(init1.body);
    expect(body1.media_type).toBe('TEXT');
    expect(body1.text).toBe('Hello Threads!');

    const [url2, init2] = mockFetch.mock.calls[1];
    expect(url2).toContain('/me/threads_publish');
    expect(init2.method).toBe('POST');
    const body2 = JSON.parse(init2.body);
    expect(body2.creation_id).toBe('container_1');
  });

  it('creates an image post with media polling', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 'container_2' }));
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 'container_2', status: 'FINISHED' }));
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 'post_2' }));

    const client = new ThreadsClient({ accessToken: 'tok', maxRetries: 0 });
    const posts = new PostsResource(client);
    const result = await posts.create({
      mediaType: 'IMAGE',
      mediaUrl: 'https://example.com/pic.jpg',
      text: 'Check this out',
    });

    expect(result.data.id).toBe('post_2');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('creates a carousel post', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 'child_1' }));
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 'child_2' }));
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 'carousel_container' }));
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 'carousel_post' }));

    const client = new ThreadsClient({ accessToken: 'tok', maxRetries: 0 });
    const posts = new PostsResource(client);
    const result = await posts.create({
      mediaType: 'CAROUSEL',
      text: 'Gallery',
      children: [
        { mediaType: 'IMAGE', mediaUrl: 'https://example.com/1.jpg' },
        { mediaType: 'IMAGE', mediaUrl: 'https://example.com/2.jpg' },
      ],
    });

    expect(result.data.id).toBe('carousel_post');
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it('gets a post by ID', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ id: 'post_1', text: 'Hello', media_type: 'TEXT' }),
    );

    const client = new ThreadsClient({ accessToken: 'tok', maxRetries: 0 });
    const posts = new PostsResource(client);
    const result = await posts.get('post_1');

    expect(result.data.id).toBe('post_1');
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/post_1');
    expect(url).toContain('fields=');
  });

  it('lists user posts', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: [{ id: 'p1' }, { id: 'p2' }] }),
    );

    const client = new ThreadsClient({ accessToken: 'tok', maxRetries: 0 });
    const posts = new PostsResource(client);
    const result = await posts.list();

    expect(result.data).toHaveLength(2);
    expect(result.data[0].id).toBe('p1');
  });

  it('deletes a post', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

    const client = new ThreadsClient({ accessToken: 'tok', maxRetries: 0 });
    const posts = new PostsResource(client);
    await posts.delete('post_1');

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/post_1');
    expect(init.method).toBe('DELETE');
  });
});
