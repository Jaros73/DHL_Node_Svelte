import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import { DB } from "kysely-codegen";
import { DatabaseError, Pool } from "pg";
import { DB_URL } from "./config";

let connection: Kysely<DB>;

function createConnection() {
  let pool = new Pool({ connectionString: DB_URL });
  let dialect = new PostgresDialect({ pool });

  connection = new Kysely<DB>({ dialect, plugins: [new CamelCasePlugin()] });
}

export function database() {
  if (!connection) {
    createConnection();
  }

  return connection;
}

export function isDuplicateKeyError(err: unknown) {
  return err instanceof DatabaseError && err.code === "23505";
}
