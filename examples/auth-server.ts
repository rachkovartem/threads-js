/**
 * OAuth flow demo — run with: npm run auth
 *
 * 1. Opens browser at http://localhost:3000
 * 2. Redirects to Threads OAuth
 * 3. Catches callback, exchanges code for token
 * 4. Prints access token to console
 */

import express from "express";
import { ThreadsClient } from "threads-kit";

const app = express();
const PORT = 3000;

const CLIENT_ID = process.env.THREADS_APP_ID!;
const CLIENT_SECRET = process.env.THREADS_APP_SECRET!;
const REDIRECT_URI =
  process.env.THREADS_REDIRECT_URI || `http://localhost:${PORT}/callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set THREADS_APP_ID and THREADS_APP_SECRET in .env");
  process.exit(1);
}

// Step 1: Redirect to Threads auth
app.get("/", (_req, res) => {
  const url = ThreadsClient.buildAuthUrl({
    clientId: CLIENT_ID,
    redirectUri: REDIRECT_URI,
    scopes: ["threads_basic", "threads_content_publish", "threads_manage_replies"],
  });
  console.log("\nRedirecting to Threads OAuth...\n");
  res.redirect(url);
});

// Step 2: Handle callback
app.get("/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).send("No code received");
    return;
  }

  try {
    // Exchange code for short-lived token
    console.log("Exchanging code for short-lived token...");
    const shortLived = await ThreadsClient.exchangeCode({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      code,
      redirectUri: REDIRECT_URI,
    });
    console.log("Short-lived token:", shortLived.accessToken);

    // Exchange for long-lived token (60 days)
    console.log("\nExchanging for long-lived token...");
    const longLived = await ThreadsClient.exchangeLongLivedToken({
      clientSecret: CLIENT_SECRET,
      accessToken: shortLived.accessToken,
    });
    console.log("Long-lived token:", longLived.accessToken);
    console.log("Expires in:", longLived.expiresIn, "seconds");

    res.send(`
      <h1>Auth successful!</h1>
      <p>Check the terminal for your access token.</p>
      <p>Copy it to .env as THREADS_ACCESS_TOKEN, then run <code>npm run dev</code></p>
    `);
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).send("Auth failed — check terminal");
  }
});

app.listen(PORT, () => {
  console.log(`\nOpen http://localhost:${PORT} to start OAuth flow\n`);
});
