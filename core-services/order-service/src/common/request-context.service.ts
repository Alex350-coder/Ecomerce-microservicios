import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  requestId: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

@Injectable()
export class RequestContextService {
  run<T>(context: RequestContext, fn: () => T): T {
    return storage.run(context, fn);
  }

  getRequestId(): string {
    return storage.getStore()?.requestId ?? 'unknown';
  }
}
