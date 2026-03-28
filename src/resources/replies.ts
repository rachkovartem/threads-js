import type { ThreadsClient } from "../client";
import type {
  CreateReplyParams,
  ListRepliesParams,
  PaginatedResponse,
  Reply,
  ThreadsResponse,
} from "../types";

const REPLY_FIELDS =
  "id,text,media_type,media_url,permalink,timestamp,hide_status";

export class RepliesResource {
  constructor(private readonly client: ThreadsClient) {}

  async list(
    postId: string,
    params?: ListRepliesParams,
  ): Promise<PaginatedResponse<Reply>> {
    const queryParams: Record<string, string> = { fields: REPLY_FIELDS };
    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.after) queryParams.after = params.after;
    if (params?.before) queryParams.before = params.before;

    const response = await this.client.get<{
      data: Reply[];
      paging?: PaginatedResponse<Reply>["paging"];
    }>(`/${postId}/replies`, queryParams);

    return {
      data: response.data.data,
      paging: response.data.paging,
      rateLimit: response.rateLimit,
    };
  }

  async create(params: CreateReplyParams): Promise<ThreadsResponse<Reply>> {
    const containerBody: Record<string, unknown> = {
      media_type: params.mediaType ?? "TEXT",
      text: params.text,
      reply_to_id: params.replyTo,
    };

    if (params.mediaUrl) {
      if (params.mediaType === "IMAGE")
        containerBody.image_url = params.mediaUrl;
      if (params.mediaType === "VIDEO")
        containerBody.video_url = params.mediaUrl;
    }

    const container = await this.client.post<{ id: string }>(
      "/me/threads",
      containerBody,
    );
    return this.client.post<Reply>("/me/threads_publish", {
      creation_id: container.data.id,
    });
  }

  async hide(replyId: string): Promise<void> {
    await this.client.post(`/${replyId}/manage_reply`, { hide: true });
  }

  async unhide(replyId: string): Promise<void> {
    await this.client.post(`/${replyId}/manage_reply`, { hide: false });
  }
}
