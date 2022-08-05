import { createSessions, DurableObjectTemplate, init } from "ditty";

export type Env = {
  COUNTER_DO: DurableObjectNamespace;
};

export class Counter extends DurableObjectTemplate {
  sessions: ReturnType<typeof createSessions>;
  storage: DurableObjectStorage;
  count = 0;

  constructor(state: DurableObjectState) {
    super();
    this.sessions = createSessions();
    this.storage = state.storage;
    state.blockConcurrencyWhile(async () => {
      const value = await this.storage.get<number>("count");
      if (value !== undefined) {
        this.count = value;
      }
    });
  }

  async connect() {
    return await this.sessions.connect({
      onConnect: (websocket) => {
        websocket.send(this.count.toString());
      },
    });
  }

  async increment() {
    this.count++;
    this.sessions.broadcast(this.count.toString());
    await this.storage.put("count", this.count);
    return new Response("ok", { status: 200 });
  }
}

export default {
  fetch: async (request: Request, env: Env): Promise<Response> => {
    const url = new URL(request.url);
    const main = () => init<Counter>(request, env.COUNTER_DO).get("main");

    switch (url.pathname) {
      case "/increment": {
        return await main().call("increment");
      }

      case "/connect": {
        return await main().call("connect");
      }
    }

    return new Response("not found", { status: 404 });
  },
};
