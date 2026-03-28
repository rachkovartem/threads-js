import { ThreadsApiError } from './errors';
import type {
  AccessTokenResponse,
  BuildAuthUrlParams,
  ExchangeCodeParams,
  RefreshTokenParams,
} from './types';

const AUTHORIZE_URL = 'https://threads.net/oauth/authorize';
const TOKEN_URL = 'https://graph.threads.net/oauth/access_token';
const GRAPH_URL = 'https://graph.threads.net';

export function buildAuthUrl(params: BuildAuthUrlParams): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('scope', params.scopes.join(','));
  url.searchParams.set('response_type', 'code');
  if (params.state) {
    url.searchParams.set('state', params.state);
  }
  return url.toString();
}

export async function exchangeCode(params: ExchangeCodeParams): Promise<AccessTokenResponse> {
  const body = new URLSearchParams({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    grant_type: 'authorization_code',
    code: params.code,
    redirect_uri: params.redirectUri,
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new ThreadsApiError({
      status: response.status,
      message: data?.error_message ?? `HTTP ${response.status}`,
      body: data,
    });
  }

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
  };
}

export async function exchangeLongLivedToken(params: {
  clientSecret: string;
  accessToken: string;
}): Promise<AccessTokenResponse> {
  const url = new URL('/access_token', GRAPH_URL);
  url.searchParams.set('grant_type', 'th_exchange_token');
  url.searchParams.set('client_secret', params.clientSecret);
  url.searchParams.set('access_token', params.accessToken);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok) {
    throw new ThreadsApiError({
      status: response.status,
      message: data?.error?.message ?? `HTTP ${response.status}`,
      body: data,
    });
  }

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
  };
}

export async function refreshToken(params: RefreshTokenParams): Promise<AccessTokenResponse> {
  const url = new URL('/refresh_access_token', GRAPH_URL);
  url.searchParams.set('grant_type', 'th_refresh_token');
  url.searchParams.set('access_token', params.token);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok) {
    throw new ThreadsApiError({
      status: response.status,
      message: data?.error?.message ?? `HTTP ${response.status}`,
      body: data,
    });
  }

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
  };
}
