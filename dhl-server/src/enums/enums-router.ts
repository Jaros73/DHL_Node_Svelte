import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { context } from "../context";
import { InternalServerError, NotFound } from "../error/http-error";
import { findFromRequest } from "../helpers/find";
import { toNumber } from "../helpers/number";
import { paginated } from "../helpers/paginated";
import { requireAdmin } from "../security/authorization";
import { enumValuesCreateSchema, enumValuesUpdateSchema } from "./enums-schema";
import {
  enumValuesCreate,
  enumValuesDelete,
  enumValuesFindMany,
  enumValuesGetOne,
  enumValuesUpdate,
  enumsGetEditableKeys,
  enumsIsEditable,
} from "./enums-service";

export function enumsRouter() {
  let router = Router();

  router.use(requireAdmin());

  router.get("/", (_, res) => {
    return res.json(enumsGetEditableKeys());
  });

  router.get("/:key", async (req, res) => {
    let key = req.params.key;
    if (!enumsIsEditable(key)) {
      throw new NotFound();
    }

    let find = findFromRequest(req);
    let item = await enumValuesFindMany(key, find);

    return res.json(paginated(item, find));
  });

  router.post("/:key", async (req, res) => {
    let key = req.params.key;
    if (!enumsIsEditable(key)) {
      throw new NotFound();
    }

    let user = context(res).user;
    let body = await enumValuesCreateSchema.parseAsync(req.body);
    let item = await enumValuesCreate(user, key, body);
    if (!item) {
      throw new InternalServerError();
    }

    return res.status(StatusCodes.CREATED).json(item);
  });

  router.get("/:key/:id", async (req, res) => {
    let key = req.params.key;
    if (!enumsIsEditable(key)) {
      throw new NotFound();
    }

    let id = toNumber(req.params.id);
    let item = await enumValuesGetOne(key, id);
    if (!item) {
      throw new NotFound();
    }

    return res.json(item);
  });

  router.put("/:key/:id", async (req, res) => {
    let key = req.params.key;
    if (!enumsIsEditable(key)) {
      throw new NotFound();
    }

    let id = toNumber(req.params.id);
    let user = context(res).user;
    let body = await enumValuesUpdateSchema.parseAsync(req.body);
    let item = await enumValuesUpdate(user, key, id, body);
    if (!item) {
      throw new InternalServerError();
    }

    return res.json(item);
  });

  router.delete("/:key/:id", async (req, res) => {
    let key = req.params.key;
    if (!enumsIsEditable(key)) {
      throw new NotFound();
    }

    let id = toNumber(req.params.id);
    await enumValuesDelete(key, id);

    return res.status(StatusCodes.NO_CONTENT).end();
  });

  return router;
}
