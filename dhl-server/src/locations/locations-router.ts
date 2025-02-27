import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { context } from "../context";
import { InternalServerError } from "../error/http-error";
import { paginated } from "../helpers/paginated";
import { requireAdmin, requireAuthenticated } from "../security/authorization";
import { locationRequestsApprovalSchema, locationRequestsCreateSchema } from "./locations-schema";
import {
  locationRequestsCreate,
  locationRequestsDelete,
  locationRequestsGetForRoles,
  locationRequestsGetForUser,
  locationRequestsPatch,
  locationsFindMany,
  locationsGetForUser,
  synchronizeLocations,
} from "./locations-service";

export function locationsRouter() {
  let router = Router();

  router.use(requireAuthenticated());

  router.get("/", async (_, res) => {
    let items = await locationsFindMany();

    return res.json(paginated(items));
  });

  router.get("/me", async (_, res) => {
    let user = context(res).user;
    let items = await locationsGetForUser(user.id);

    return res.json(paginated(items));
  });

  router.get("/me/requests", async (_, res) => {
    let user = context(res).user;
    let items = await locationRequestsGetForUser(user.id);

    return res.json(paginated(items));
  });

  router.post("/me/requests", async (req, res) => {
    let user = context(res).user;
    let body = await locationRequestsCreateSchema.parseAsync(req.body);
    let items = await locationRequestsCreate(user.id, body);
    if (!items) {
      throw new InternalServerError();
    }

    return res.status(StatusCodes.CREATED).json(items);
  });

  router.delete("/me/requests/:role/:locationId", async (req, res) => {
    let { role, locationId } = req.params;
    let user = context(res).user;
    await locationRequestsDelete(user.id, role, locationId);

    return res.status(StatusCodes.NO_CONTENT).end();
  });

  router.post("/sync", requireAdmin(), async (_, res) => {
    await synchronizeLocations(true);

    return res.status(StatusCodes.NO_CONTENT).end();
  });

  router.get("/requests", requireAdmin(), async (_, res) => {
    let user = context(res).user;
    let items = await locationRequestsGetForRoles(user.adminOf);

    return res.json(paginated(items));
  });

  router.patch("/requests", requireAdmin(), async (req, res) => {
    let user = context(res).user;
    let body = await locationRequestsApprovalSchema.parseAsync(req.body);
    await locationRequestsPatch(user, body);

    return res.status(StatusCodes.NO_CONTENT).end();
  });

  return router;
}
