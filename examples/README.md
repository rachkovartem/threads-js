# threads-kit examples

## Setup

```bash
cd examples
npm install
cp .env.example .env
```

## 1. Get an access token

Fill in `THREADS_APP_ID` and `THREADS_APP_SECRET` in `.env`, then:

```bash
npm run auth
```

Open http://localhost:3000, complete the OAuth flow, and copy the token to `.env`.

## 2. Run the demo

```bash
npm run dev
```

Interactive menu to test all SDK features:
- Profile
- Create posts (text, image, carousel)
- List / get posts
- Replies (create, hide, unhide)
- Delete posts
- Token refresh
- Error handling
