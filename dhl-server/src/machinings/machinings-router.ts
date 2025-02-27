import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { context } from "../context";
import { csvExportFilename } from "../csv/to-csv";
import { InternalServerError, NotFound } from "../error/http-error";
import { dateTimeRangeFromRequest } from "../helpers/date-time-range";
import { findFromRequest } from "../helpers/find";
import { toNumber } from "../helpers/number";
import { paginated } from "../helpers/paginated";
import { requireRole } from "../security/authorization";
import { Role } from "../security/role";
import { machiningsCreateSchema, machiningsUpdateSchema } from "./machinings-schema";
import {
  machiningsCreate,
  machiningsDelete,
  machiningsExport,
  machiningsFindMany,
  machiningsGetOne,
  machiningsMeta,
  machiningsUpdate,
} from "./machinings-service";

export function machiningsRouter() {
  let router = Router();

  router.use(requireRole(Role.Dispecink));

  router.get("/meta", async (_, res) => {
    let meta = await machiningsMeta();

    return res.json(meta);
  });

  router.get("/export", async (req, res) => {
    let range = await dateTimeRangeFromRequest(req);
    let buffer = await machiningsExport(range);
    let filename = csvExportFilename("vykony_mechanizace");

    return res.contentType("text/csv").attachment(filename).send(buffer);
  });

  router.get("/", async (req, res) => {
    let find = findFromRequest(req);
    let items = await machiningsFindMany(find);

    return res.json(paginated(items, find));
  });

  router.post("/", async (req, res) => {
    let user = context(res).user;
    let body = await machiningsCreateSchema.parseAsync(req.body);
    let item = await machiningsCreate(user, body);

    return res.status(StatusCodes.CREATED).json(item);
  });

  router.get("/:id", async (req, res) => {
    let id = toNumber(req.params.id);
    let item = await machiningsGetOne(id);
    if (!item) {
      throw new NotFound();
    }

    return res.json(item);
  });

  router.put("/:id", async (req, res) => {
    let id = toNumber(req.params.id);
    let user = context(res).user;
    let body = await machiningsUpdateSchema.parseAsync(req.body);
    let item = await machiningsUpdate(user, id, body);
    if (!item) {
      throw new InternalServerError();
    }

    return res.json(item);
  });

  router.delete("/:id", async (req, res) => {
    let id = toNumber(req.params.id);
    let user = context(res).user;
    await machiningsDelete(user, id);

    return res.status(StatusCodes.NO_CONTENT).end();
  });

  return router;
}
