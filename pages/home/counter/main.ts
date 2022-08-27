import type { DurableObjectNamespaceIs } from "ditty";
import { CallableDurableObject } from "ditty";
import { ws, client, call } from "ditty";

export type Env = {
  COUNTER_DO: DurableObjectNamespaceIs<Counter>;
};

export class Counter extends CallableDurableObject {
  private sessions: ReturnType<typeof ws>;
  private storage: DurableObjectStorage;
  private count: Map<string, number> = new Map();

  constructor(state: DurableObjectState) {
    super();
    this.sessions = ws();
    this.storage = state.storage;
    state.blockConcurrencyWhile(async () => {
      this.count = await this.storage.list<number>();
    });
  }

  connect(country: string, ip: string) {
    const numbers = ip
      .split(".")
      .map((x) => parseInt(x))
      .map((x) => x % 2);

    let updates: Record<string, number> = {};
    let recent = Date.now();

    return this.sessions.connect({
      onConnect: (websocket) => {
        websocket.send(
          JSON.stringify(Object.fromEntries([...this.count.entries()]))
        );
      },
      onMessage: (websocket) => {
        const segments = [country, ...numbers];

        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i];
          const key = [...segments.slice(0, i), segment].join(".");
          const current = this.count.get(key) ?? 0;
          const next = current + 1;

          this.count.set(key, next);
          updates[key] = next;
        }

        websocket.send(JSON.stringify(updates));

        if (Date.now() - recent < 1000) return;
        recent = Date.now();

        const update = () => {
          for (const [key, value] of Object.entries(updates)) {
            this.storage.put(key, value);
          }
          this.sessions.broadcast(JSON.stringify(updates));
          updates = {};
        };

        setTimeout(update, 1000);
      },
    });
  }
}

export default {
  fetch: async (request: Request, env: Env): Promise<Response> => {
    const url = new URL(request.url);

    switch (url.pathname) {
      case "/connect": {
        const country = request.headers.get("cf-ipcountry");
        const ip = request.headers.get("cf-connecting-ip");
        if (country === null || ip === null)
          return new Response("bad request", { status: 400 });

        const main = client(request, env.COUNTER_DO, "main");
        return await call(main, "connect", country, ip);
      }
    }

    return new Response("not found", { status: 404 });
  },
};
