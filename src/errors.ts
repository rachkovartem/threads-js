export interface ThreadsApiErrorParams {
  status: number;
  code?: number;
  subcode?: number;
  message: string;
  body?: unknown;
}

export class ThreadsApiError extends Error {
  readonly status: number;
  readonly code?: number;
  readonly subcode?: number;
  readonly body?: unknown;

  constructor(params: ThreadsApiErrorParams) {
    super(params.message);
    this.name = "ThreadsApiError";
    this.status = params.status;
    this.code = params.code;
    this.subcode = params.subcode;
    this.body = params.body;
  }
}
