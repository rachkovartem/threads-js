import {
  buildAuthUrl,
  exchangeCode,
  exchangeLongLivedToken,
  refreshToken,
} from "./auth";
import { ThreadsApiError } from "./errors";
import { PostsResource } from "./resources/posts";
import { RepliesResource } from "./resources/replies";
import { UsersResource } from "./resources/users";
import type { RateLimit, ThreadsClientConfig, ThreadsResponse } from "./types";

const DEFAULT_BASE_URL = "https://graph.threads.net";
const DEFAULT_API_VERSION = "v1.0";
const DEFAULT_MAX_RETRIES = 3;

export class ThreadsClient {
  readonly posts: PostsResource;
  readonly replies: RepliesResource;
  readonly users: UsersResource;

  private readonly accessToken: string;
  private readonly baseUrl: string;
  private readonly apiVersion: string;
  private readonly maxRetries: number;

  static buildAuthUrl = buildAuthUrl;
  static exchangeCode = exchangeCode;
  static exchangeLongLivedToken = exchangeLongLivedToken;
  static refreshToken = refreshToken;

  constructor(config: ThreadsClientConfig) {
    this.accessToken = config.accessToken;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.apiVersion = config.apiVersion ?? DEFAULT_API_VERSION;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;

    this.posts = new PostsResource(this);
    this.replies = new RepliesResource(this);
    this.users = new UsersResource(this);
  }

  async get<T>(
    path: string,
    params?: Record<string, string>,
  ): Promise<ThreadsResponse<T>> {
    return this.request<T>("GET", path, params);
  }

  async post<T>(
    path: string,
    body?: Record<string, unknown>,
    params?: Record<string, string>,
  ): Promise<ThreadsResponse<T>> {
    return this.request<T>("POST", path, params, body);
  }

  async delete<T>(
    path: string,
    params?: Record<string, string>,
  ): Promise<ThreadsResponse<T>> {
    return this.request<T>("DELETE", path, params);
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(`${this.apiVersion}${path}`, this.baseUrl);
    url.searchParams.set("access_token", this.accessToken);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }

  private async request<T>(
    method: string,
    path: string,
    params?: Record<string, string>,
    body?: Record<string, unknown>,
  ): Promise<ThreadsResponse<T>> {
    const url = this.buildUrl(path, params);
    let lastError: ThreadsApiError | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const init: RequestInit = { method };
      if (body) {
        init.headers = { "Content-Type": "application/json" };
        init.body = JSON.stringify(body);
      }

      const response = await fetch(url, init);
      const responseBody = await response.json();

      if (response.ok) {
        const rateLimit = this.parseRateLimit(response);
        return { data: responseBody as T, rateLimit };
      }

      const apiError = new ThreadsApiError({
        status: response.status,
        message: responseBody?.error?.message ?? `HTTP ${response.status}`,
        code: responseBody?.error?.code,
        subcode: responseBody?.error?.error_subcode,
        body: responseBody,
      });

      if (response.status === 429 || response.status >= 500) {
        lastError = apiError;
        continue;
      }

      throw apiError;
    }

    throw lastError!;
  }

  private parseRateLimit(response: Response): RateLimit | undefined {
    const usage = response.headers.get("x-app-usage");
    if (!usage) return undefined;
    try {
      const parsed = JSON.parse(usage);
      return {
        limit: 100,
        remaining: Math.max(0, 100 - (parsed.call_count ?? 0)),
        resetAt: new Date(Date.now() + 60 * 60 * 1000),
      };
    } catch {
      return undefined;
    }
  }
}
