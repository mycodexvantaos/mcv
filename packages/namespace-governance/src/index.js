/**
 * Process entrypoint. Binds the governance app to a port and logs readiness.
 * Kept side-effect-light so importing the package for tests never starts a
 * server (the listen() call is guarded by direct-execution detection).
 *
 * Rationale: separating app construction (app.js) from process binding lets the
 * same artifact run as a server and be unit-tested without port conflicts.
 */
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { initLogger } from "./logger.js";

const logger = initLogger();
const app = createApp({ logger });

/* istanbul ignore next -- process bootstrap, exercised by integration, not unit */
function start() {
  const port = Number(process.env.GOVERNANCE_PORT) || 3001;
  return app.listen(port, () => {
    logger.info(`Namespace Governance listening on ${port}`);
  });
}

/* istanbul ignore next -- only runs when invoked as the main module */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  start();
}

export { app, start };
export default app;
