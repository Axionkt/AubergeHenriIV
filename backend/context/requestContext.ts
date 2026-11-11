import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  requestId: string | null;
  method: string;
  path: string;
  ip: string | null;
  userId: string | null;
  query: Record<string, unknown>;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getRequestContext() {
  return requestContext.getStore();
}

export function setRequestUser(userId: string | null) {
  const context = requestContext.getStore();

  if (context) {
    context.userId = userId;
  }
}
