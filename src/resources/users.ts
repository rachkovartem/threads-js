import type { ThreadsClient } from '../client';
import type { ThreadsResponse, User } from '../types';

const USER_FIELDS = 'id,username,name,threads_profile_picture_url,threads_biography';

export class UsersResource {
  constructor(private readonly client: ThreadsClient) {}

  async me(): Promise<ThreadsResponse<User>> {
    const response = await this.client.get<Record<string, unknown>>('/me', {
      fields: USER_FIELDS,
    });

    const raw = response.data;
    const user: User = {
      id: raw.id as string,
      username: raw.username as string | undefined,
      name: raw.name as string | undefined,
      threadsProfilePictureUrl: raw.threads_profile_picture_url as string | undefined,
      threadsBiography: raw.threads_biography as string | undefined,
    };

    return { data: user, rateLimit: response.rateLimit };
  }
}
