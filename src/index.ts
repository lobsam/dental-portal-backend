import { Container, getContainer } from "@cloudflare/containers";

// One container instance, kept warm; requests are forwarded to the
// FastAPI app running inside the Docker image on port 8080.
export class Backend extends Container {
  defaultPort = 8080;
  sleepAfter = "10m";
}

export interface Env {
  BACKEND: DurableObjectNamespace<Backend>;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Single shared instance is enough for this app; switch to
    // getContainer(env.BACKEND, someKey) if you need per-tenant isolation.
    const container = getContainer(env.BACKEND);
    return container.fetch(request);
  },
};
