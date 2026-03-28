import type { ThreadsClient } from '../client';
import type {
  ContainerStatusResponse,
  CreatePostParams,
  ListPostsParams,
  PaginatedResponse,
  Post,
  ThreadsResponse,
} from '../types';

const POST_FIELDS = 'id,text,media_type,media_url,permalink,timestamp,shortcode,is_quote_post,children';

export class PostsResource {
  constructor(private readonly client: ThreadsClient) {}

  async create(params: CreatePostParams): Promise<ThreadsResponse<Post>> {
    if (params.mediaType === 'CAROUSEL') {
      return this.createCarousel(params);
    }

    const containerBody: Record<string, unknown> = {
      media_type: params.mediaType ?? 'TEXT',
      text: params.text,
    };

    if ('mediaUrl' in params && params.mediaUrl) {
      if (params.mediaType === 'IMAGE') containerBody.image_url = params.mediaUrl;
      if (params.mediaType === 'VIDEO') containerBody.video_url = params.mediaUrl;
    }

    if (params.replyControl) {
      containerBody.reply_control = params.replyControl;
    }

    const container = await this.client.post<{ id: string }>('/me/threads', containerBody);

    if (params.mediaType === 'IMAGE' || params.mediaType === 'VIDEO') {
      await this.waitForContainer(container.data.id);
    }

    const published = await this.client.post<Post>('/me/threads_publish', {
      creation_id: container.data.id,
    });

    return published;
  }

  async get(postId: string): Promise<ThreadsResponse<Post>> {
    return this.client.get<Post>(`/${postId}`, { fields: POST_FIELDS });
  }

  async list(params?: ListPostsParams): Promise<PaginatedResponse<Post>> {
    const queryParams: Record<string, string> = { fields: POST_FIELDS };
    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.after) queryParams.after = params.after;
    if (params?.before) queryParams.before = params.before;

    const response = await this.client.get<{ data: Post[]; paging?: PaginatedResponse<Post>['paging'] }>(
      '/me/threads',
      queryParams,
    );

    return {
      data: response.data.data,
      paging: response.data.paging,
      rateLimit: response.rateLimit,
    };
  }

  async delete(postId: string): Promise<void> {
    await this.client.delete(`/${postId}`);
  }

  private async createCarousel(
    params: Extract<CreatePostParams, { mediaType: 'CAROUSEL' }>,
  ): Promise<ThreadsResponse<Post>> {
    const childIds: string[] = [];

    for (const child of params.children) {
      const childBody: Record<string, unknown> = {
        media_type: child.mediaType,
        is_carousel_item: true,
      };
      if (child.mediaType === 'IMAGE') childBody.image_url = child.mediaUrl;
      if (child.mediaType === 'VIDEO') childBody.video_url = child.mediaUrl;

      const result = await this.client.post<{ id: string }>('/me/threads', childBody);
      childIds.push(result.data.id);
    }

    const containerBody: Record<string, unknown> = {
      media_type: 'CAROUSEL',
      children: childIds.join(','),
      text: params.text,
    };
    if (params.replyControl) {
      containerBody.reply_control = params.replyControl;
    }

    const container = await this.client.post<{ id: string }>('/me/threads', containerBody);
    return this.client.post<Post>('/me/threads_publish', {
      creation_id: container.data.id,
    });
  }

  private async waitForContainer(containerId: string, maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.client.get<ContainerStatusResponse>(`/${containerId}`, {
        fields: 'id,status,error_message',
      });

      if (status.data.status === 'FINISHED') return;
      if (status.data.status === 'ERROR' || status.data.status === 'EXPIRED') {
        throw new Error(
          `Container ${containerId} failed: ${status.data.error_message ?? status.data.status}`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error(`Container ${containerId} timed out after ${maxAttempts} attempts`);
  }
}
