import { Router } from "express";
import { context } from "../context";
import { InternalServerError, NotFound } from "../error/http-error";
import { findFromRequest } from "../helpers/find";
import { paginated } from "../helpers/paginated";
import { requireAdmin } from "../security/authorization";
import { employeesSetLocationsSchema } from "./employees-schema";
import {
  employeesFindMany,
  employeesGetOne,
  employeesMeta,
  employeesSetLocations,
} from "./employees-service";

export function employeesRouter() {
  let router = Router();

  router.use(requireAdmin());

  router.get("/meta", async (_, res) => {
    let meta = await employeesMeta();

    return res.json(meta);
  });

  router.get("/", async (req, res) => {
    let find = findFromRequest(req);
    let user = context(res).user;
    let items = await employeesFindMany(user, find);

    return res.json(paginated(items, find));
  });

  router.get("/:id", async (req, res) => {
    let id = req.params.id;
    let user = context(res).user;
    let item = await employeesGetOne(user, id);
    if (!item) {
      throw new NotFound();
    }

    return res.json(item);
  });

  router.put("/:id", async (req, res) => {
    let id = req.params.id;
    let user = context(res).user;
    let body = await employeesSetLocationsSchema.parseAsync(req.body);
    let item = await employeesSetLocations(user, id, body);
    if (!item) {
      throw new InternalServerError();
    }

    return res.json(item);
  });

  return router;
}
