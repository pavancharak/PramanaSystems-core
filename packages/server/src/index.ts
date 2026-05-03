import { createServer } from "./server.js";
import { signingKeySource } from "./runtime.js";

const port = parseInt(process.env.PORT ?? "3000", 10);
const host = process.env.HOST ?? "0.0.0.0";

const { app, auditDb } = createServer();

async function shutdown(signal: string): Promise<void> {
  app.log.info(`Shutdown signal received (${signal}), closing server...`);

  const shutdownTimeout = setTimeout(() => {
    app.log.error("Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 10000);
  shutdownTimeout.unref(); // don't keep process alive just for the timer

  try {
    await app.close();
    if (auditDb) {
      await auditDb.disconnect();
    }
    clearTimeout(shutdownTimeout);
    app.log.info("Server closed cleanly");
    process.exit(0);
  } catch (err) {
    app.log.error({ err }, "Error during shutdown");
    process.exit(1);
  }
}

process.on("SIGTERM", () => { void shutdown("SIGTERM"); });
process.on("SIGINT",  () => { void shutdown("SIGINT"); });

try {
  await app.listen({ port, host });
  app.log.info(`Server listening on http://${host}:${port}`);

  if (auditDb) {
    app.log.info("Audit DB connected");
  } else {
    app.log.info("Audit DB not configured");
  }

  const keyMsg: Record<typeof signingKeySource, string> = {
    env:       "Signing key loaded from env",
    disk:      "Signing key loaded from disk",
    ephemeral: "Using ephemeral signing key",
  };
  app.log.info(keyMsg[signingKeySource]);

} catch (err) {
  app.log.error(err);
  process.exit(1);
}
