import { Container, getContainer } from "@cloudflare/containers";
import { env } from "cloudflare:workers";

const CONTAINER_ENV_KEYS = [
  "APP_NAME",
  "APP_VERSION",
  "DEBUG",
  "DATABASE_URL",
  "JWT_SECRET_KEY",
  "JWT_ALGORITHM",
  "ACCESS_TOKEN_EXPIRE_MINUTES",
  "REFRESH_TOKEN_EXPIRE_MINUTES",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USERNAME",
  "SMTP_PASSWORD",
  "SMTP_USE_TLS",
  "SMTP_FROM_EMAIL",
  "SMTP_FROM_NAME",
  "FRONTEND_URL",
  "PASSWORD_RESET_TOKEN_EXPIRE_MINUTES",
] as const;

function envVarsFromDotEnv(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const key of CONTAINER_ENV_KEYS) {
    const value = (env as Record<string, unknown>)[key];
    if (typeof value === "string") {
      vars[key] = value;
    }
  }
  return vars;
}

export class Backend extends Container {
  defaultPort = 8000;
  envVars = envVarsFromDotEnv();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx as DurableObjectState<{}>, env);
  }

  override async fetch(request: Request): Promise<Response> {
    await this.startAndWaitForPorts({
      ports: 8000,
      cancellationOptions: { portReadyTimeoutMS: 60_000 },
    });
    return this.containerFetch(request);
  }
}

export interface Env {
  BACKEND: DurableObjectNamespace<Backend>;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const container = getContainer(env.BACKEND);
    return container.fetch(request);
  },
};
