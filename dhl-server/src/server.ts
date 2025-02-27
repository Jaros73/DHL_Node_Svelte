import { createServer } from "node:http";
import { createApp } from "./app";
import { HOST, PORT } from "./config";
import { logger } from "./logger";

export function serveHttp() {
  let log = logger("server");
  let app = createApp();
  let server = createServer(app);

  server.listen(PORT, HOST, () => {
    log.info({ port: PORT, host: HOST }, "server listening");
  });
}
