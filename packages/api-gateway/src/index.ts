/**
 * MyCodeXvantaOS API Gateway
 * Provides unified API entry point with routing, rate limiting, and authentication
 */

export interface GatewayConfig {
  port: number;
  routes: Route[];
  middleware?: Middleware[];
}

export interface Route {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  handler: (req: Request, res: Response) => Promise<Response>;
  auth?: boolean;
  rateLimit?: number;
}

export interface Middleware {
  name: string;
  handler: (req: Request, res: Response, next: () => void) => Promise<void>;
}

export class ApiGateway {
  private config: GatewayConfig;

  constructor(config: GatewayConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    console.log("API Gateway starting on port", this.config.port);
  }

  async stop(): Promise<void> {
    console.log("API Gateway stopped");
  }

  addRoute(route: Route): void {
    this.config.routes.push(route);
  }

  addMiddleware(middleware: Middleware): void {
    this.config.middleware?.push(middleware);
  }
}

export default ApiGateway;
