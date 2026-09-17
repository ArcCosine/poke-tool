export interface Env {
  DB: D1Database;
  AUTH_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  X_CLIENT_ID?: string;
  X_CLIENT_SECRET?: string;
  TURNSTILE_SECRET_KEY?: string;
}

export interface EventContext<Env, P extends string = string, Data = unknown> {
  request: Request;
  functionPath: string;
  waitUntil: (promise: Promise<unknown>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  env: Env;
  params: Record<P, string | string[]>;
  data: Data;
}

export type PagesFunction<
  E = Env,
  P extends string = string,
  Data = unknown,
> = (context: EventContext<E, P, Data>) => Response | Promise<Response>;
