// --- Client Config ---

export interface ThreadsClientConfig {
  accessToken: string;
  apiVersion?: string;
  baseUrl?: string;
  maxRetries?: number;
}

// --- Rate Limit ---

export interface RateLimit {
  limit: number;
  remaining: number;
  resetAt: Date;
}

export interface ThreadsResponse<T> {
  data: T;
  rateLimit?: RateLimit;
}

export interface PaginatedResponse<T> {
  data: T[];
  paging?: {
    cursors?: { before?: string; after?: string };
    next?: string;
    previous?: string;
  };
  rateLimit?: RateLimit;
}

// --- Media Types ---

export type MediaType = "TEXT" | "IMAGE" | "VIDEO" | "CAROUSEL";

export type ReplyControl =
  | "everyone"
  | "accounts_you_follow"
  | "mentioned_only";

// --- Posts ---

export interface CreateTextPostParams {
  text: string;
  mediaType?: never;
  replyControl?: ReplyControl;
}

export interface CreateImagePostParams {
  text?: string;
  mediaType: "IMAGE";
  mediaUrl: string;
  replyControl?: ReplyControl;
}

export interface CreateVideoPostParams {
  text?: string;
  mediaType: "VIDEO";
  mediaUrl: string;
  replyControl?: ReplyControl;
}

export interface CarouselChild {
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
}

export interface CreateCarouselPostParams {
  text?: string;
  mediaType: "CAROUSEL";
  children: CarouselChild[];
  replyControl?: ReplyControl;
}

export type CreatePostParams =
  | CreateTextPostParams
  | CreateImagePostParams
  | CreateVideoPostParams
  | CreateCarouselPostParams;

export interface Post {
  id: string;
  text?: string;
  mediaType: MediaType;
  mediaUrl?: string;
  permalink?: string;
  timestamp?: string;
  shortcode?: string;
  isQuotePost?: boolean;
  children?: { data: { id: string }[] };
}

export interface ListPostsParams {
  limit?: number;
  after?: string;
  before?: string;
}

// --- Replies ---

export interface CreateReplyParams {
  replyTo: string;
  text: string;
  mediaType?: "IMAGE" | "VIDEO";
  mediaUrl?: string;
}

export interface ListRepliesParams {
  limit?: number;
  after?: string;
  before?: string;
}

export interface Reply {
  id: string;
  text?: string;
  mediaType?: MediaType;
  mediaUrl?: string;
  permalink?: string;
  timestamp?: string;
  hideStatus?: "NOT_HUSHED" | "UNHUSHED" | "HIDDEN";
}

// --- Users ---

export interface User {
  id: string;
  username?: string;
  name?: string;
  threadsProfilePictureUrl?: string;
  threadsBiography?: string;
}

// --- OAuth ---

export interface BuildAuthUrlParams {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state?: string;
}

export interface ExchangeCodeParams {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}

export interface RefreshTokenParams {
  token: string;
}

export interface AccessTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn?: number;
}

// --- Container Status (internal) ---

export type ContainerStatus =
  | "IN_PROGRESS"
  | "FINISHED"
  | "ERROR"
  | "EXPIRED"
  | "PUBLISHED";

export interface ContainerStatusResponse {
  id: string;
  status: ContainerStatus;
  error_message?: string;
}
