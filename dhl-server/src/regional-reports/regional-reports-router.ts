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
import { regionalReportsUpsertSchema } from "./regional-reports-schema";
import {
  regionalReportsAddFiles,
  regionalReportsCreate,
  regionalReportsDelete,
  regionalReportsExport,
  regionalReportsFindMany,
  regionalReportsGetOne,
  regionalReportsMeta,
  regionalReportsReadFileOne,
  regionalReportsRemoveFiles,
  regionalReportsUpdate,
} from "./regional-reports-service";

export function regionalReportsRouter() {
  let router = Router();

  router.use(requireRole(Role.RegLogistika));

  router.get("/meta", async (_, res) => {
    let meta = await regionalReportsMeta();

    return res.json(meta);
  });

  router.get("/export", async (req, res) => {
    let range = await dateTimeRangeFromRequest(req);
    let user = context(res).user;
    let buffer = await regionalReportsExport(user, range);
    let filename = csvExportFilename("hlaseni_rl");

    return res.contentType("text/csv").attachment(filename).send(buffer);
  });

  router.get("/", async (req, res) => {
    let user = context(res).user;
    let find = findFromRequest(req);
    let items = await regionalReportsFindMany(user, find);

    return res.json(paginated(items, find));
  });

  router.post("/", filesUploadHandler.array("files"), async (req, res) => {
    let files = req.files as Express.Multer.File[];

    try {
      let user = context(res).user;
      let body = await regionalReportsUpsertSchema.parseAsync(req.body);
      let item = await regionalReportsCreate(user, body, files);
      if (!item) {
        throw new InternalServerError();
      }

      return res.status(StatusCodes.CREATED).json(item);
    } catch (err) {
      await filesRemoveUploaded(files);
      throw err;
    }
  });

  router.get("/:id", async (req, res) => {
    let id = toNumber(req.params.id);
    let user = context(res).user;
    let item = await regionalReportsGetOne(user, id);
    if (!item) {
      throw new NotFound();
    }

    return res.json(item);
  });

  router.put("/:id", async (req, res) => {
    let id = toNumber(req.params.id);
    let user = context(res).user;
    let body = await regionalReportsUpsertSchema.parseAsync(req.body);
    let item = await regionalReportsUpdate(user, id, body);
    if (!item) {
      throw new InternalServerError();
    }

    return res.json(item);
  });

  router.post("/:id", filesUploadHandler.single("file"), async (req, res) => {
    let file = req.file;
    if (!file) {
      throw new UnprocessableEntity();
    }

    try {
      let id = toNumber(req.params["id"] as string);
      let user = context(res).user;

      let item = await regionalReportsAddFiles(user, id, [file]);
      if (!item) {
        throw new Forbidden();
      }

      return res.json(item);
    } catch (err) {
      await filesRemoveUploaded([file]);
      throw err;
    }
  });

  router.delete("/:id", async (req, res) => {
    let id = toNumber(req.params.id);
    let user = context(res).user;
    await regionalReportsDelete(user, id);

    return res.status(StatusCodes.NO_CONTENT).end();
  });

  router.get("/:id/:filename", async (req, res) => {
    let id = toNumber(req.params.id);
    let filename = req.params.filename;
    let user = context(res).user;
    let item = await regionalReportsReadFileOne(user, id, filename);

    return res
      .contentType(item.file.type)
      .set("content-disposition", `inline; filename="${item.file.displayName}"`)
      .send(item.buffer);
  });

  router.delete("/:id/:filename", async (req, res) => {
    let id = toNumber(req.params.id);
    let filename = req.params.filename;
    let user = context(res).user;
    let item = await regionalReportsRemoveFiles(user, id, [filename]);
    if (!item) {
      throw new InternalServerError();
    }

    return res.json(item);
  });

  return router;
}
