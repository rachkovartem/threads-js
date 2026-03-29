/**
 * threads-kit demo — run with: npm run dev
 *
 * Tests all SDK features interactively.
 * Set THREADS_ACCESS_TOKEN in .env first (use `npm run auth` to get one).
 */

import { ThreadsClient, ThreadsApiError } from "threads-kit";
import * as readline from "node:readline";

const TOKEN = process.env.THREADS_ACCESS_TOKEN;
if (!TOKEN) {
  console.error("Set THREADS_ACCESS_TOKEN in .env (run `npm run auth` to get one)");
  process.exit(1);
}

const threads = new ThreadsClient({ accessToken: TOKEN, maxRetries: 2 });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function printResult(label: string, data: unknown) {
  console.log(`\n--- ${label} ---`);
  console.log(JSON.stringify(data, null, 2));
  console.log();
}

async function testProfile() {
  console.log("\n=== Profile ===");
  const me = await threads.users.me();
  printResult("Your profile", me.data);
  if (me.rateLimit) {
    console.log("Rate limit:", me.rateLimit);
  }
}

async function testCreateTextPost(): Promise<string | null> {
  console.log("\n=== Create Text Post ===");
  const text = await ask('Enter post text (or "skip"): ');
  if (text === "skip") return null;

  const post = await threads.posts.create({ text });
  printResult("Created post", post.data);
  return post.data.id;
}

async function testCreateImagePost(): Promise<string | null> {
  console.log("\n=== Create Image Post ===");
  const url = await ask('Enter public image URL (or "skip"): ');
  if (url === "skip") return null;

  const text = await ask("Caption (optional, press Enter to skip): ");
  const post = await threads.posts.create({
    mediaType: "IMAGE",
    mediaUrl: url,
    text: text || undefined,
  });
  printResult("Created image post", post.data);
  return post.data.id;
}

async function testCreateCarousel(): Promise<string | null> {
  console.log("\n=== Create Carousel ===");
  const proceed = await ask('Enter 2 public image URLs separated by comma (or "skip"): ');
  if (proceed === "skip") return null;

  const urls = proceed.split(",").map((u) => u.trim());
  const text = await ask("Caption (optional, press Enter to skip): ");

  const post = await threads.posts.create({
    mediaType: "CAROUSEL",
    text: text || undefined,
    children: urls.map((mediaUrl) => ({ mediaType: "IMAGE" as const, mediaUrl })),
  });
  printResult("Created carousel", post.data);
  return post.data.id;
}

async function testListPosts() {
  console.log("\n=== List Posts ===");
  const posts = await threads.posts.list({ limit: 5 });
  printResult(`Your latest ${posts.data.length} posts`, posts.data);
  return posts.data;
}

async function testGetPost(postId: string) {
  console.log("\n=== Get Post ===");
  const post = await threads.posts.get(postId);
  printResult(`Post ${postId}`, post.data);
}

async function testReplies(postId: string) {
  console.log("\n=== Replies ===");

  // List replies
  const replies = await threads.replies.list(postId);
  printResult(`Replies to ${postId}`, replies.data);

  // Create reply
  const replyText = await ask('Reply text (or "skip"): ');
  if (replyText !== "skip") {
    const reply = await threads.replies.create({
      replyTo: postId,
      text: replyText,
    });
    printResult("Created reply", reply.data);

    // Hide/unhide
    const hideIt = await ask("Hide this reply? (y/n): ");
    if (hideIt === "y") {
      await threads.replies.hide(reply.data.id);
      console.log("Reply hidden!");

      const unhideIt = await ask("Unhide it? (y/n): ");
      if (unhideIt === "y") {
        await threads.replies.unhide(reply.data.id);
        console.log("Reply unhidden!");
      }
    }
  }
}

async function testDeletePost(postId: string) {
  const confirm = await ask(`Delete post ${postId}? (y/n): `);
  if (confirm === "y") {
    await threads.posts.delete(postId);
    console.log("Post deleted!");
  }
}

async function testTokenRefresh() {
  console.log("\n=== Token Refresh ===");
  const proceed = await ask('Refresh current token? (y/n): ');
  if (proceed !== "y") return;

  const refreshed = await ThreadsClient.refreshToken({ token: TOKEN });
  printResult("Refreshed token", {
    accessToken: refreshed.accessToken.slice(0, 20) + "...",
    expiresIn: refreshed.expiresIn,
  });
}

async function testErrorHandling() {
  console.log("\n=== Error Handling ===");
  try {
    const badClient = new ThreadsClient({ accessToken: "invalid_token", maxRetries: 0 });
    await badClient.users.me();
  } catch (err) {
    if (err instanceof ThreadsApiError) {
      printResult("Caught ThreadsApiError", {
        status: err.status,
        code: err.code,
        message: err.message,
      });
    }
  }
}

// --- Main menu ---

const MENU = `
What do you want to test?

  1. Profile (users.me)
  2. Create text post
  3. Create image post
  4. Create carousel
  5. List posts
  6. Get post by ID
  7. Replies (list, create, hide/unhide)
  8. Delete post
  9. Token refresh
  10. Error handling
  0. Exit

`;

async function main() {
  console.log("\n=== threads-kit demo ===\n");

  let createdPostId: string | null = null;

  while (true) {
    console.log(MENU);
    const choice = await ask("Choose (0-10): ");

    try {
      switch (choice) {
        case "1":
          await testProfile();
          break;
        case "2":
          createdPostId = await testCreateTextPost();
          break;
        case "3":
          createdPostId = await testCreateImagePost();
          break;
        case "4":
          createdPostId = await testCreateCarousel();
          break;
        case "5":
          await testListPosts();
          break;
        case "6": {
          const id = await ask(`Post ID (${createdPostId ? `Enter for ${createdPostId}` : "required"}): `);
          await testGetPost(id || createdPostId!);
          break;
        }
        case "7": {
          const id = await ask(`Post ID to interact with (${createdPostId ? `Enter for ${createdPostId}` : "required"}): `);
          await testReplies(id || createdPostId!);
          break;
        }
        case "8": {
          const id = await ask(`Post ID to delete (${createdPostId ? `Enter for ${createdPostId}` : "required"}): `);
          await testDeletePost(id || createdPostId!);
          break;
        }
        case "9":
          await testTokenRefresh();
          break;
        case "10":
          await testErrorHandling();
          break;
        case "0":
          console.log("Bye!");
          rl.close();
          process.exit(0);
        default:
          console.log("Invalid choice");
      }
    } catch (err) {
      if (err instanceof ThreadsApiError) {
        console.error(`\nAPI Error: ${err.status} — ${err.message}`);
        if (err.code) console.error(`Code: ${err.code}, Subcode: ${err.subcode}`);
      } else {
        console.error("\nUnexpected error:", err);
      }
    }
  }
}

main();
