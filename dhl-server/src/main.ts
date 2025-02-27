import { argv } from "node:process";
import { migrate } from "./migrate";
import { serveHttp } from "./server";

async function main() {
  let cmd = argv[2];

  if (cmd === "migrate") {
    return migrate();
  }

  return serveHttp();
}

main();
