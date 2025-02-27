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
import { remaindersUpsertSchema } from "./remainders-schema";
import {
  remaindersCreate,
  remaindersDelete,
  remaindersExport,
  remaindersFindMany,
  remaindersGetOne,
  remaindersMeta,
  remaindersUpdate,
} from "./remainders-service";

export function remaindersRouter() {
  let router = Router();

  router.use(requireRole(Role.Dispecink));

  router.get("/meta", async (_, res) => {
    let meta = await remaindersMeta();

    return res.json(meta);
  });

  router.get("/export", async (req, res) => {
    let range = await dateTimeRangeFromRequest(req);
    let buffer = await remaindersExport(range);
    let filename = csvExportFilename("zbytky");

    return res.contentType("text/csv").attachment(filename).send(buffer);
  });

  router.get("/", async (req, res) => {
    let find = findFromRequest(req);
    let items = await remaindersFindMany(find);

    return res.json(paginated(items, find));
  });

  router.post("/", async (req, res) => {
    let user = context(res).user;
    let body = await remaindersUpsertSchema.parseAsync(req.body);
    let item = await remaindersCreate(user, body);
    if (!item) {
      throw new InternalServerError();
    }

    return res.status(StatusCodes.CREATED).json(item);
  });

  router.get("/:id", async (req, res) => {
    let id = toNumber(req.params.id);
    let item = await remaindersGetOne(id);
    if (!item) {
      throw new NotFound();
    }

    return res.json(item);
  });

  router.put("/:id", async (req, res) => {
    let id = toNumber(req.params.id);
    let user = context(res).user;
    let body = await remaindersUpsertSchema.parseAsync(req.body);
    let item = await remaindersUpdate(user, id, body);
    if (!item) {
      throw new InternalServerError();
    }

    return res.json(item);
  });

  router.delete("/:id", async (req, res) => {
    let id = toNumber(req.params.id);
    let user = context(res).user;
    await remaindersDelete(user, id);

    return res.status(StatusCodes.NO_CONTENT).end();
  });

  return router;
}
