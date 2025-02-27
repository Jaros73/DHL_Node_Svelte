import { sql } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/postgres";
import { DateTime } from "luxon";
import { toCsvBuffer } from "../csv/to-csv";
import { database } from "../database";
import { EnumKey } from "../enums/enums-service";
import { Forbidden } from "../error/http-error";
import { filesPersist, filesRead, filesRemove, filesRemoveGroup } from "../files/files-service";
import { DateTimeRange } from "../helpers/date-time-range";
import { Find } from "../helpers/find";
import { Role } from "../security/role";
import { User } from "../security/user";
import {
  RegionalReportsUpsertSchema,
  regionalReportsFilterSchema,
} from "./regional-reports-schema";

export async function regionalReportsMeta() {
  let [locations, delayReasons] = await Promise.all([
    database()
      .selectFrom("location")
      .select(["location.id", "location.name"])
      .where("location.postOfficeType", "=", "SPU")
      .orderBy("location.name asc")
      .execute(),
    database()
      .selectFrom("enumValue")
      .select(["enumValue.key", "enumValue.id", "enumValue.name"])
      .where("enumValue.key", "=", EnumKey.DelayReason)
      .where("enumValue.enabled", "=", true)
      .execute(),
  ]);

  return {
    locations,
    delayReasons,
  };
}

export async function regionalReportsExport(user: User, range: DateTimeRange) {
  let items = await regionalReportsFindMany(user, {
    filter: {
      createdAt: [range.from, range.to],
    },
  });

  return await toCsvBuffer(items, [
    ["createdAt", "Vytvořeno"],
    ["createdByFullName", "Vytvořil"],
    ["category", "Kategorie"],
    ["network", "Typ sítě"],
    ["locationName", "Provozovna"],
    ["dateFor", "Datum nepravidelnosti"],
    ["description", "Popis"],
    ["actionTaken", "Přijatá opatření"],
    ["courseCode", "Číslo kurzu"],
    ["coursePlannedArrival", "Plánovaný příjezd"],
    ["courseRealArrival", "Skutečný příjezd"],
    ["courseDelayName", "Příčina zpoždění"],
    ["note", "Poznámka"],
  ]);
}

export async function regionalReportsFindMany(user: User, find: Find) {
  let query = database()
    .with("attachments", (db) =>
      db
        .selectFrom("regionalReportFile")
        .select(({ fn }) => [
          "regionalReportFile.regionalReportId",
          fn.count("regionalReportFile.regionalReportId").as("count"),
        ])
        .groupBy("regionalReportFile.regionalReportId"),
    )
    .selectFrom("regionalReport")
    .leftJoin("user as creator", "regionalReport.createdBy", "creator.id")
    .leftJoin("user as updater", "regionalReport.createdBy", "updater.id")
    .leftJoin("location", "regionalReport.locationId", "location.id")
    .leftJoin("enumValue", "regionalReport.courseDelayEnumId", "enumValue.id")
    .leftJoin("attachments", "attachments.regionalReportId", "regionalReport.id")
    .selectAll("regionalReport")
    .select(({ fn, val }) => [
      "creator.fullName as createdByFullName",
      "updater.fullName as updatedByFullName",
      "location.name as locationName",
      "location.zip as locationZip",
      "enumValue.name as courseDelayName",
      fn.coalesce("attachments.count", val(0)).as("attachments"),
    ])
    .where(({ eb, or, lit }) =>
      or([
        eb(lit(user.isAdminOf(Role.RegLogistika)), "=", true),
        eb("regionalReport.locationId", "in", user.locations[Role.RegLogistika] ?? [""]),
      ]),
    )
    .orderBy("regionalReport.createdAt desc")
    .orderBy("regionalReport.id desc");

  let filter = await regionalReportsFilterSchema.parseAsync(find.filter);
  if (filter) {
    if (filter.createdAt) {
      let [dateFrom, dateTo] = filter.createdAt;
      if (dateFrom) {
        query = query.where(
          "regionalReport.createdAt",
          ">=",
          DateTime.fromISO(dateFrom).toJSDate(),
        );
      }

      if (dateTo) {
        query = query.where("regionalReport.createdAt", "<=", DateTime.fromISO(dateTo).toJSDate());
      }
    }

    if (filter.locationId && filter.locationId.length > 0) {
      query = query.where("regionalReport.locationId", "in", filter.locationId);
    }

    if (filter.category && filter.category.length > 0) {
      query = query.where("regionalReport.category", "in", filter.category);
    }

    if (filter.network && filter.network.length > 0) {
      query = query.where("regionalReport.network", "in", filter.network);
    }

    if (filter.attachment && filter.attachment.length === 1) {
      query = query.where(
        "attachments.count",
        filter.attachment.includes("yes") ? "is not" : "is",
        null,
      );
    }
  }

  if (find.search) {
    query = query.where(({ eb, fn, or, ref, val }) =>
      or([
        eb(
          fn("unaccent", [ref("location.name")]),
          "ilike",
          fn("unaccent", [val(`%${find.search}%`)]),
        ),
        eb(
          fn("unaccent", [ref("location.zip")]),
          "ilike",
          fn("unaccent", [val(`%${find.search}%`)]),
        ),
      ]),
    );
  }

  if (find.limit) {
    query = query.limit(find.limit);
  }

  if (find.offset) {
    query = query.offset(find.offset);
  }

  return await query.execute();
}

export async function regionalReportsGetOne(user: User, id: number) {
  return await database()
    .selectFrom("regionalReport")
    .leftJoin("user as creator", "regionalReport.createdBy", "creator.id")
    .leftJoin("user as updater", "regionalReport.createdBy", "updater.id")
    .leftJoin("location", "regionalReport.locationId", "location.id")
    .leftJoin("enumValue", "regionalReport.courseDelayEnumId", "enumValue.id")
    .selectAll("regionalReport")
    .select(({ selectFrom }) => [
      "creator.fullName as createdByFullName",
      "updater.fullName as updatedByFullName",
      "location.name as locationName",
      "location.zip as locationZip",
      "enumValue.name as courseDelayName",
      jsonArrayFrom(
        selectFrom("regionalReportFile")
          .select([
            "regionalReportFile.filename",
            sql<string>`regional_report_file.display_name collate "C.utf8"`.as("displayName"),
          ])
          .whereRef("regionalReportFile.regionalReportId", "=", "regionalReport.id"),
      ).as("attachments"),
    ])
    .where("regionalReport.id", "=", id)
    .where(({ eb, or, lit }) =>
      or([
        eb(lit(user.isAdminOf(Role.RegLogistika)), "=", true),
        eb("regionalReport.locationId", "in", user.locations[Role.RegLogistika] ?? [""]),
      ]),
    )
    .executeTakeFirst();
}

export async function regionalReportsCreate(
  user: User,
  item: RegionalReportsUpsertSchema,
  files: Express.Multer.File[],
) {
  if (!user.canUseLocation(Role.RegLogistika, item.locationId)) {
    throw new Forbidden();
  }

  let id = await database()
    .transaction()
    .execute(async (trx) => {
      let { id } = await trx
        .insertInto("regionalReport")
        .values({
          createdBy: user.id,
          ...item,
        })
        .returning("regionalReport.id")
        .executeTakeFirstOrThrow();

      await trx
        .insertInto("regionalReportFile")
        .values(
          files.map((it) => ({
            regionalReportId: id,
            filename: it.filename,
            type: it.mimetype,
            displayName: it.originalname,
          })),
        )
        .executeTakeFirst();

      await filesPersist("regional_report", `${id}`, files);

      return id;
    });

  return await regionalReportsGetOne(user, id);
}

export async function regionalReportsUpdate(
  user: User,
  id: number,
  item: RegionalReportsUpsertSchema,
) {
  if (!user.canUseLocation(Role.RegLogistika, item.locationId)) {
    throw new Forbidden();
  }

  let { numUpdatedRows } = await database()
    .updateTable("regionalReport")
    .set({
      updatedBy: user.id,
      updatedAt: new Date(),
      ...item,
    })
    .where("regionalReport.id", "=", id)
    .where(({ eb, or, lit }) =>
      or([
        eb(lit(user.isAdminOf(Role.RegLogistika)), "=", true),
        eb("regionalReport.locationId", "in", user.locations[Role.RegLogistika] ?? [""]),
      ]),
    )
    .executeTakeFirst();

  if (numUpdatedRows === 0n) {
    throw new Forbidden();
  }

  return await regionalReportsGetOne(user, id);
}

export async function regionalReportsDelete(user: User, id: number) {
  await database()
    .transaction()
    .execute(async (trx) => {
      await trx
        .deleteFrom("regionalReportFile")
        .where("regionalReportFile.regionalReportId", "=", id)
        .executeTakeFirst();

      let { numDeletedRows } = await trx
        .deleteFrom("regionalReport")
        .where("regionalReport.id", "=", id)
        .where(({ eb, or, lit }) =>
          or([
            eb(lit(user.isAdminOf(Role.RegLogistika)), "=", true),
            eb("regionalReport.locationId", "in", user.locations[Role.RegLogistika] ?? [""]),
          ]),
        )
        .executeTakeFirst();

      if (numDeletedRows === 0n) {
        throw new Forbidden();
      }

      await filesRemoveGroup("regional_report", `${id}`);
    });
}

export async function regionalReportsReadFileOne(user: User, id: number, filename: string) {
  let item = await database()
    .selectFrom("regionalReportFile")
    .leftJoin("regionalReport", "regionalReportFile.regionalReportId", "regionalReport.id")
    .selectAll("regionalReportFile")
    .where("regionalReportFile.regionalReportId", "=", id)
    .where("regionalReportFile.filename", "=", filename)
    .where(({ eb, or, lit }) =>
      or([
        eb(lit(user.isAdminOf(Role.RegLogistika)), "=", true),
        eb("regionalReport.locationId", "in", user.locations[Role.RegLogistika] ?? [""]),
      ]),
    )
    .executeTakeFirst();

  if (!item) {
    throw new Forbidden();
  }

  return {
    buffer: await filesRead("regional_report", `${id}`, {
      filename: item.filename,
      originalname: item.displayName,
    }),
    file: item,
  };
}

export async function regionalReportsAddFiles(
  user: User,
  id: number,
  files: Express.Multer.File[],
) {
  await database()
    .transaction()
    .execute(async (trx) => {
      try {
        await trx
          .selectFrom("regionalReport")
          .select(({ lit }) => [lit(true).as("exists")])
          .where("regionalReport.id", "=", id)
          .where(({ eb, or, lit }) =>
            or([
              eb(lit(user.isAdminOf(Role.RegLogistika)), "=", true),
              eb("regionalReport.locationId", "in", user.locations[Role.RegLogistika] ?? [""]),
            ]),
          )
          .executeTakeFirstOrThrow();
      } catch {
        throw new Forbidden();
      }

      await trx
        .insertInto("regionalReportFile")
        .values(
          files.map((it) => ({
            regionalReportId: id,
            filename: it.filename,
            type: it.mimetype,
            displayName: it.originalname,
          })),
        )
        .executeTakeFirst();

      await filesPersist("regional_report", `${id}`, files);
    });

  return await regionalReportsGetOne(user, id);
}

export async function regionalReportsRemoveFiles(user: User, id: number, filenames: string[]) {
  await database()
    .transaction()
    .execute(async (trx) => {
      let files = await trx
        .selectFrom("regionalReportFile")
        .select(["regionalReportFile.filename", "regionalReportFile.displayName"])
        .where("regionalReportFile.regionalReportId", "=", id)
        .where("regionalReportFile.filename", "in", filenames)
        .execute();

      let { numDeletedRows } = await trx
        .deleteFrom("regionalReportFile")
        .where("regionalReportFile.regionalReportId", "=", id)
        .where("regionalReportFile.filename", "in", filenames)
        .where(({ selectFrom, exists }) =>
          exists(
            selectFrom("regionalReport")
              .select(({ lit }) => [lit(true).as("exists")])
              .where(({ eb, ref }) =>
                eb("regionalReport.id", "=", ref("regionalReportFile.regionalReportId")),
              )
              .where(({ eb, or, lit }) =>
                or([
                  eb(lit(user.isAdminOf(Role.RegLogistika)), "=", true),
                  eb("regionalReport.locationId", "in", user.locations[Role.RegLogistika] ?? [""]),
                ]),
              ),
          ),
        )
        .executeTakeFirst();

      if (numDeletedRows === 0n) {
        throw new Forbidden();
      }

      await filesRemove(
        "regional_report",
        `${id}`,
        files.map((it) => ({
          filename: it.filename,
          originalname: it.displayName,
        })),
      );
    });

  return await regionalReportsGetOne(user, id);
}
