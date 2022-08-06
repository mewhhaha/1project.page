import type { DurableObjectNamespaceIs } from "ditty";
import { ws, accept, client, call } from "ditty";

const COUNT_KEY = "count";

export type Env = {
  COUNTER_DO: DurableObjectNamespaceIs<Counter>;
};

export class Counter {
  private sessions: ReturnType<typeof ws>;
  private storage: DurableObjectStorage;
  private count = 0;

  constructor(state: DurableObjectState) {
    this.sessions = ws();
    this.storage = state.storage;
    state.blockConcurrencyWhile(async () => {
      const value = await this.storage.get<number>(COUNT_KEY);
      if (value !== undefined) {
        this.count = value;
      }
    });
  }

  connect() {
    return this.sessions.connect({
      onConnect: (websocket) => {
        websocket.send(this.count.toString());
      },
      onMessage: () => {
        this.count++;
        this.sessions.broadcast(this.count.toString());
        this.storage.put(COUNT_KEY, this.count);
      },
    });
  }

  fetch = accept;
}

export default {
  fetch: async (request: Request, env: Env): Promise<Response> => {
    const url = new URL(request.url);

    switch (url.pathname) {
      case "/connect": {
        const main = client(request, env.COUNTER_DO, "main");
        return await call(main, "connect");
      }
    }

    return new Response("not found", { status: 404 });
  },
};
