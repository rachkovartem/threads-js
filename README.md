# threads-js

TypeScript SDK for the official [Meta Threads API](https://developers.facebook.com/docs/threads). Zero dependencies. Full type safety.

## Install

```bash
npm install threads-js
```

## Quick Start

```ts
import { ThreadsClient } from 'threads-js';

const threads = new ThreadsClient({
  accessToken: 'your-access-token',
});

// Post to Threads
const post = await threads.posts.create({ text: 'Hello from threads-js!' });

// Get your profile
const me = await threads.users.me();
console.log(me.data.username);
```

## Posts

```ts
// Text post
await threads.posts.create({ text: 'Hello!' });

// Image post
await threads.posts.create({
  text: 'Check this out',
  mediaType: 'IMAGE',
  mediaUrl: 'https://example.com/image.jpg',
});

// Video post
await threads.posts.create({
  mediaType: 'VIDEO',
  mediaUrl: 'https://example.com/video.mp4',
});

// Carousel
await threads.posts.create({
  text: 'A gallery',
  mediaType: 'CAROUSEL',
  children: [
    { mediaType: 'IMAGE', mediaUrl: 'https://example.com/1.jpg' },
    { mediaType: 'IMAGE', mediaUrl: 'https://example.com/2.jpg' },
  ],
});

// Get a post
const post = await threads.posts.get('post_id');

// List your posts
const posts = await threads.posts.list({ limit: 10 });

// Delete a post
await threads.posts.delete('post_id');
```

## Replies

```ts
// List replies
const replies = await threads.replies.list('post_id');

// Reply to a post
await threads.replies.create({ replyTo: 'post_id', text: 'Great post!' });

// Hide / unhide a reply
await threads.replies.hide('reply_id');
await threads.replies.unhide('reply_id');
```

## OAuth

```ts
import { ThreadsClient } from 'threads-js';

// 1. Build authorization URL
const authUrl = ThreadsClient.buildAuthUrl({
  clientId: 'your-app-id',
  redirectUri: 'https://yourapp.com/callback',
  scopes: ['threads_basic', 'threads_content_publish'],
});
// Redirect user to authUrl

// 2. Exchange code for token (in your callback handler)
const { accessToken } = await ThreadsClient.exchangeCode({
  clientId: 'your-app-id',
  clientSecret: 'your-app-secret',
  code: 'code-from-callback',
  redirectUri: 'https://yourapp.com/callback',
});

// 3. Exchange for long-lived token (60 days)
const longLived = await ThreadsClient.exchangeLongLivedToken({
  clientSecret: 'your-app-secret',
  accessToken,
});

// 4. Refresh before it expires
const refreshed = await ThreadsClient.refreshToken({
  token: longLived.accessToken,
});
```

## Configuration

```ts
const threads = new ThreadsClient({
  accessToken: 'your-token',
  maxRetries: 3,       // Retry on 429/5xx (default: 3)
  apiVersion: 'v1.0',  // API version (default: v1.0)
});
```

## Rate Limits

Rate limit info is available on every response:

```ts
const result = await threads.posts.list();
console.log(result.rateLimit);
// { limit: 100, remaining: 95, resetAt: Date }
```

## Error Handling

```ts
import { ThreadsApiError } from 'threads-js';

try {
  await threads.posts.create({ text: 'Hello!' });
} catch (error) {
  if (error instanceof ThreadsApiError) {
    console.log(error.status);   // 400
    console.log(error.code);     // Meta error code
    console.log(error.message);  // Human-readable message
  }
}
```

## Requirements

- Node.js >= 18
- A Meta app with Threads API access ([setup guide](https://developers.facebook.com/docs/threads/get-started))

## License

MIT
