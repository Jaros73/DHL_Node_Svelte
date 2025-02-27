import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { context } from "../context";
import { csvExportFilename } from "../csv/to-csv";
import { Forbidden, InternalServerError, NotFound, UnprocessableEntity } from "../error/http-error";
import { filesRemoveUploaded, filesUploadHandler } from "../files/files-service";
import { dateTimeRangeFromRequest } from "../helpers/date-time-range";
import { findFromRequest } from "../helpers/find";
import { toNumber } from "../helpers/number";
import { paginated } from "../helpers/paginated";
import { requireRole } from "../security/authorization";
import { Role } from "../security/role";
import { coursesUpsertSchema, mapCoursesUpserSchemaFromForm } from "./courses-schema";
import {
  coursesAddFiles,
  coursesCreate,
  coursesDelete,
  coursesExport,
  coursesFindMany,
  coursesGetOne,
  coursesMeta,
  coursesReadFileOne,
  coursesRemoveFiles,
  coursesUpdate,
} from "./courses-service";

export function coursesRouter() {
  let router = Router();

  router.use(requireRole(Role.Dispecink));

  router.get("/meta", async (_, res) => {
    let meta = await coursesMeta();

    return res.json(meta);
  });

  router.get("/export", async (req, res) => {
    let range = await dateTimeRangeFromRequest(req);
    let buffer = await coursesExport(range);
    let filename = csvExportFilename("kurzy");

    return res.contentType("text/csv").attachment(filename).send(buffer);
  });

  router.get("/", async (req, res) => {
    let find = findFromRequest(req);
    let items = await coursesFindMany(find);

    return res.json(paginated(items, find));
  });

  router.post(
    "/",
    filesUploadHandler.fields([{ name: "departureFiles" }, { name: "arrivalFiles" }]),
    async (req, res) => {
      let { departureFiles = [], arrivalFiles = [] } = req.files as Record<
        string,
        Express.Multer.File[] | undefined
      >;

      try {
        let user = context(res).user;
        let body = mapCoursesUpserSchemaFromForm(await coursesUpsertSchema.parseAsync(req.body));
        let item = await coursesCreate(user, body, {
          departure: departureFiles,
          arrival: arrivalFiles,
        });
        if (!item) {
          throw new InternalServerError();
        }

        return res.status(StatusCodes.CREATED).json(item);
      } catch (err) {
        await filesRemoveUploaded(departureFiles.concat(arrivalFiles));
        throw err;
      }
    },
  );

  router.get("/:id", async (req, res) => {
    let id = toNumber(req.params.id);
    let item = await coursesGetOne(id);
    if (!item) {
      throw new NotFound();
    }

    return res.json(item);
  });

  router.put("/:id", async (req, res) => {
    let id = toNumber(req.params.id);
    let user = context(res).user;
    let body = mapCoursesUpserSchemaFromForm(await coursesUpsertSchema.parseAsync(req.body));
    let item = await coursesUpdate(user, id, body);
    if (!item) {
      throw new InternalServerError();
    }

    return res.json(item);
  });

  router.post(
    "/:id",
    filesUploadHandler.fields([{ name: "departureFiles" }, { name: "arrivalFiles" }]),
    async (req, res) => {
      let { departureFiles = [], arrivalFiles = [] } = req.files as Record<
        string,
        Express.Multer.File[] | undefined
      >;

      try {
        if (departureFiles.length === 0 && arrivalFiles.length === 0) {
          throw new UnprocessableEntity();
        }

        let id = toNumber(req.params["id"] as string);
        let user = context(res).user;

        let item = await coursesAddFiles(user, id, {
          departure: departureFiles,
          arrival: arrivalFiles,
        });
        if (!item) {
          throw new Forbidden();
        }

        return res.json(item);
      } catch (err) {
        await filesRemoveUploaded(departureFiles.concat(arrivalFiles));
        throw err;
      }
    },
  );

  router.delete("/:id", async (req, res) => {
    let id = toNumber(req.params.id);
    let user = context(res).user;
    await coursesDelete(user, id);

    return res.status(StatusCodes.NO_CONTENT).end();
  });

  router.get("/:id/:filename", async (req, res) => {
    let id = toNumber(req.params.id);
    let filename = req.params.filename;
    let item = await coursesReadFileOne(id, filename);

    return res
      .contentType(item.file.type)
      .set("content-disposition", `inline; filename="${item.file.displayName}"`)
      .send(item.buffer);
  });

  router.delete("/:id/:filename", async (req, res) => {
    let id = toNumber(req.params.id);
    let filename = req.params.filename;
    let user = context(res).user;
    let item = await coursesRemoveFiles(user, id, [filename]);
    if (!item) {
      throw new InternalServerError();
    }

    return res.json(item);
  });

  return router;
}
