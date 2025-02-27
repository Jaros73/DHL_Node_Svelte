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
import { CoursesUpsertSchema, coursesFilterSchema } from "./courses-schema";

enum CourseGroup {
  Arrival = "arrival",
  Departure = "departure",
}

export async function coursesMeta() {
  let [locations, enumValues, technologicalGroups] = await Promise.all([
    database()
      .selectFrom("location")
      .select(["location.id", "location.name", "location.postOfficeType"])
      .where("location.postOfficeType", "=", "SPU")
      .orderBy("location.name asc")
      .execute(),
    database()
      .selectFrom("enumValue")
      .select(["enumValue.id", "enumValue.key", "enumValue.name"])
      .where("enumValue.key", "in", [EnumKey.Transporter, EnumKey.DelayReason])
      .where("enumValue.enabled", "=", true)
      .orderBy("enumValue.name asc")
      .execute(),
    database()
      .selectFrom("technologicalGroup")
      .selectAll("technologicalGroup")
      .select(({ selectFrom }) =>
        jsonArrayFrom(
          selectFrom("technologicalGroupCrate")
            .select("technologicalGroupCrate.crate")
            .whereRef("technologicalGroupCrate.technologicalGroup", "=", "technologicalGroup.value")
            .orderBy("technologicalGroup.value asc"),
        ).as("crates"),
      )
      .orderBy("technologicalGroup.value asc")
      .execute(),
  ]);

  return {
    locations,
    transporters: enumValues.filter((it) => it.key === EnumKey.Transporter),
    delayReasons: enumValues.filter((it) => it.key === EnumKey.DelayReason),
    technologicalGroups,
  };
}

export async function coursesExport(range: DateTimeRange) {
  let items = await database()
    .selectFrom("course")
    .leftJoin("user as creator", "course.createdBy", "creator.id")
    .leftJoin("location", "course.locationId", "location.id")
    .leftJoin("enumValue as transporter", "course.transporterEnumId", "transporter.id")
    .leftJoin(
      "enumValue as departureDelay",
      "course.departureDelayReasonEnumId",
      "departureDelay.id",
    )
    .leftJoin("enumValue as arrivalDelay", "course.arrivalDelayReasonEnumId", "arrivalDelay.id")
    .select([
      "course.createdAt",
      "creator.fullName as createdByFullName",
      "location.name as locationName",
      "course.network",
      "transporter.name as transporterName",
      "course.courseCode",
      "course.departureDate",
      "course.departurePlannedTime",
      "course.departureRealTime",
      sql<
        number | null
      >`(extract(epoch from course.departure_real_time - course.departure_planned_time) / 60)::int`.as(
        "departureDiff",
      ),
      "departureDelay.name as departureDelayName",
      "course.departureLoad",
      "course.departureNote",
      "course.arrivalPlannedTime",
      "course.arrivalRealTime",
      sql<
        number | null
      >`(extract(epoch from course.arrival_real_time - course.arrival_planned_time) / 60)::int`.as(
        "arrivalDiff",
      ),
      "arrivalDelay.name as arrivalDelayName",
      "course.arrivalLoad",
      "course.arrivalNote",
      "course.seals",
    ])
    .orderBy(["course.createdAt desc", "course.id desc"])
    .where("course.createdAt", ">=", DateTime.fromISO(range.from).toJSDate())
    .where("course.createdAt", "<=", DateTime.fromISO(range.to).toJSDate())
    .execute();

  let payload = items.map((it) => ({
    ...it,
    departureDiff: `${it.departureDiff && it.departureDiff > 0 ? "+" : ""}${it.departureDiff}`,
    arrivalDiff: `${it.arrivalDiff && it.arrivalDiff > 0 ? "+" : ""}${it.departureDiff}`,
  }));

  return toCsvBuffer(payload, [
    ["createdAt", "Vytvořeno"],
    ["createdByFullName", "Vytvořil"],
    ["locationName", "DSPU"],
    ["network", "Síť"],
    ["transporterName", "Dopravce"],
    ["courseCode", "Kurz"],
    ["departureDate", "Datum odjezdu"],
    ["departurePlannedTime", "Odjezd plánovaný"],
    ["departureRealTime", "Odjezd skutečný"],
    ["departureDiff", "Odjezd rozdíl"],
    ["departureDelayName", "Odjezd příčina meškání"],
    ["departureLoad", "Vytížení na odjezdu"],
    ["departureNote", "Poznámka na odjezdu"],
    ["arrivalPlannedTime", "Příjezd plánovaný"],
    ["arrivalRealTime", "Příjezd skutečný"],
    ["arrivalDiff", "Příjezd rozdíl"],
    ["arrivalDelayName", "Příjezd příčina meškání"],
    ["arrivalLoad", "Vytížení na příjezdu"],
    ["arrivalNote", "Poznámka na příjezdu"],
    ["seals", "Plomby"],
  ]);
}

export async function coursesFindMany(find: Find) {
  let query = database()
    .selectFrom("course")
    .leftJoin("location", "course.locationId", "location.id")
    .select([
      "course.id",
      "course.createdAt",
      "course.locationId",
      "course.network",
      "course.courseCode",
      "course.departureDate",
      "course.departurePlannedTime",
      "course.arrivalPlannedTime",
      "course.updatedAt",
      "location.name as locationName",
      sql<
        number | null
      >`(extract(epoch from course.departure_real_time - course.departure_planned_time) / 60)::int`.as(
        "departureDiff",
      ),
      sql<
        number | null
      >`(extract(epoch from course.arrival_real_time - course.arrival_planned_time) / 60)::int`.as(
        "arrivalDiff",
      ),
    ])
    .orderBy(["course.createdAt desc", "course.id desc"]);

  let filter = await coursesFilterSchema.parseAsync(find.filter);
  if (filter) {
    if (filter.createdAt) {
      let [dateFrom, dateTo] = filter.createdAt;
      if (dateFrom) {
        query = query.where("course.createdAt", ">=", DateTime.fromISO(dateFrom).toJSDate());
      }

      if (dateTo) {
        query = query.where("course.createdAt", "<=", DateTime.fromISO(dateTo).toJSDate());
      }
    }

    if (filter.locationId && filter.locationId.length > 0) {
      query = query.where("course.locationId", "in", filter.locationId);
    }

    if (filter.network && filter.network.length > 0) {
      query = query.where("course.network", "in", filter.network);
    }

    if (filter.departureDelay && filter.departureDelay.length === 1) {
      query = query.where(
        sql<number>`coalesce(extract(epoch from course.departure_real_time - course.departure_planned_time) / 60, 0)::int`,
        filter.departureDelay.includes("yes") ? ">" : "<=",
        0,
      );
    }

    if (filter.arrivalDelay && filter.arrivalDelay.length === 1) {
      query = query.where(
        sql<number>`coalesce(extract(epoch from course.arrival_real_time - course.arrival_planned_time) / 60, 0)::int`,
        filter.arrivalDelay.includes("yes") ? ">" : "<=",
        0,
      );
    }
  }

  if (find.search) {
    query = query.where(({ eb, or, fn, ref, val }) =>
      or([
        eb(
          fn("unaccent", [ref("location.name")]),
          "ilike",
          fn("unaccent", [val(`%${find.search}%`)]),
        ),
        eb(
          fn("unaccent", [ref("course.courseCode")]),
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

export async function coursesGetOne(id: number) {
  return await database()
    .selectFrom("course")
    .leftJoin("user as creator", "course.createdBy", "creator.id")
    .leftJoin("user as updater", "course.createdBy", "updater.id")
    .leftJoin("location", "course.locationId", "location.id")
    .leftJoin("enumValue as transporter", "course.transporterEnumId", "transporter.id")
    .leftJoin(
      "enumValue as departureDelay",
      "course.departureDelayReasonEnumId",
      "departureDelay.id",
    )
    .leftJoin("enumValue as arrivalDelay", "course.arrivalDelayReasonEnumId", "arrivalDelay.id")
    .selectAll("course")
    .select(({ selectFrom }) => [
      "creator.fullName as createdByFullName",
      "updater.fullName as updatedByFullName",
      "location.name as locationName",
      "transporter.name as transporterName",
      "departureDelay.name as departureDelayName",
      "arrivalDelay.name as arrivalDelayName",
      sql<
        number | null
      >`(extract(epoch from course.departure_real_time - course.departure_planned_time) / 60)::int`.as(
        "departureDiff",
      ),
      sql<
        number | null
      >`(extract(epoch from course.arrival_real_time - course.arrival_planned_time) / 60)::int`.as(
        "arrivalDiff",
      ),
      jsonArrayFrom(
        selectFrom("courseLoad")
          .selectAll("courseLoad")
          .whereRef("courseLoad.courseId", "=", "course.id"),
      ).as("loads"),
      jsonArrayFrom(
        selectFrom("courseCrate")
          .selectAll("courseCrate")
          .whereRef("courseCrate.courseId", "=", "course.id"),
      ).as("crates"),
      jsonArrayFrom(
        selectFrom("courseFile")
          .selectAll("courseFile")
          .whereRef("courseFile.courseId", "=", "course.id"),
      ).as("files"),
    ])
    .where("course.id", "=", id)
    .executeTakeFirst();
}

export async function coursesCreate(
  user: User,
  item: CoursesUpsertSchema,
  files: Record<"departure" | "arrival", Express.Multer.File[]>,
) {
  if (!user.canUseLocation(Role.Dispecink, item.locationId)) {
    throw new Forbidden();
  }

  let id = await database()
    .transaction()
    .execute(async (trx) => {
      let { id } = await trx
        .insertInto("course")
        .values({
          createdBy: user.id,
          courseCode: item.courseCode,
          departureDate: item.departureDate,
          locationId: item.locationId,
          network: item.network,
          transporterEnumId: item.transporterEnumId,
          arrivalDelayReasonEnumId: item.arrivalDelayReasonEnumId || null,
          arrivalLoad: item.arrivalLoad || null,
          arrivalNote: item.arrivalNote || null,
          arrivalOther: item.arrivalOther || null,
          arrivalPlannedTime: item.arrivalPlannedTime || null,
          arrivalRealTime: item.arrivalRealTime || null,
          departureDelayReasonEnumId: item.departureDelayReasonEnumId || null,
          departureLoad: item.departureLoad || null,
          departureNote: item.departureNote || null,
          departureOther: item.departureOther || null,
          departurePlannedTime: item.departurePlannedTime || null,
          departureRealTime: item.departureRealTime || null,
          seals: item.seals || null,
        })
        .returning("course.id")
        .executeTakeFirstOrThrow();

      let loads =
        item.departureLoads
          ?.map((it) => ({
            courseId: id,
            group: CourseGroup.Departure,
            ...it,
          }))
          .concat(
            item.arrivalLoads?.map((it) => ({
              courseId: id,
              group: CourseGroup.Arrival,
              ...it,
            })) ?? [],
          ) ?? [];
      if (loads.length > 0) {
        await trx.insertInto("courseLoad").values(loads).executeTakeFirst();
      }

      let crates =
        item.departureCrates
          ?.map((it) => ({
            courseId: id,
            group: CourseGroup.Departure,
            ...it,
          }))
          .concat(
            item.arrivalCrates?.map((it) => ({
              courseId: id,
              group: CourseGroup.Arrival,
              ...it,
            })) ?? [],
          ) ?? [];
      if (crates.length > 0) {
        await trx.insertInto("courseCrate").values(crates).executeTakeFirst();
      }

      let allFiles =
        files.departure
          ?.map((it) => ({
            courseId: id,
            group: CourseGroup.Departure,
            filename: it.filename,
            type: it.mimetype,
            displayName: it.originalname,
          }))
          .concat(
            files.arrival?.map(
              (it) =>
                ({
                  courseId: id,
                  group: CourseGroup.Arrival,
                  filename: it.filename,
                  type: it.mimetype,
                  displayName: it.originalname,
                }) ?? [],
            ),
          ) ?? [];
      if (allFiles.length > 0) {
        await trx.insertInto("courseFile").values(allFiles).executeTakeFirst();
        await filesPersist("course", `${id}`, (files.departure ?? []).concat(files.arrival ?? []));
      }

      return id;
    });

  return await coursesGetOne(id);
}

export async function coursesUpdate(user: User, id: number, item: CoursesUpsertSchema) {
  if (!user.canUseLocation(Role.Dispecink, item.locationId)) {
    throw new Forbidden();
  }

  await database()
    .transaction()
    .execute(async (trx) => {
      let { numUpdatedRows } = await trx
        .updateTable("course")
        .set({
          updatedBy: user.id,
          updatedAt: new Date(),
          courseCode: item.courseCode,
          departureDate: item.departureDate,
          locationId: item.locationId,
          network: item.network,
          transporterEnumId: item.transporterEnumId,
          arrivalDelayReasonEnumId: item.arrivalDelayReasonEnumId || null,
          arrivalLoad: item.arrivalLoad || null,
          arrivalNote: item.arrivalNote || null,
          arrivalOther: item.arrivalOther || null,
          arrivalPlannedTime: item.arrivalPlannedTime || null,
          arrivalRealTime: item.arrivalRealTime || null,
          departureDelayReasonEnumId: item.departureDelayReasonEnumId || null,
          departureLoad: item.departureLoad || null,
          departureNote: item.departureNote || null,
          departureOther: item.departureOther || null,
          departurePlannedTime: item.departurePlannedTime || null,
          departureRealTime: item.departureRealTime || null,
          seals: item.seals || null,
        })
        .where("course.id", "=", id)
        .where(({ eb, or, lit }) =>
          or([
            eb(lit(user.isAdminOf(Role.Dispecink)), "=", true),
            eb("course.locationId", "in", user.locations[Role.Dispecink] ?? [""]),
          ]),
        )
        .executeTakeFirst();

      if (numUpdatedRows === 0n) {
        throw new Forbidden();
      }

      await trx.deleteFrom("courseCrate").where("courseCrate.courseId", "=", id).executeTakeFirst();
      await trx.deleteFrom("courseLoad").where("courseLoad.courseId", "=", id).executeTakeFirst();

      let loads =
        item.departureLoads
          ?.map((it) => ({
            courseId: id,
            group: CourseGroup.Departure,
            ...it,
          }))
          .concat(
            item.arrivalLoads?.map((it) => ({
              courseId: id,
              group: CourseGroup.Arrival,
              ...it,
            })) ?? [],
          ) ?? [];
      if (loads.length > 0) {
        await trx.insertInto("courseLoad").values(loads).executeTakeFirst();
      }

      let crates =
        item.departureCrates
          ?.map((it) => ({
            courseId: id,
            group: CourseGroup.Departure,
            ...it,
          }))
          .concat(
            item.arrivalCrates?.map((it) => ({
              courseId: id,
              group: CourseGroup.Arrival,
              ...it,
            })) ?? [],
          ) ?? [];
      if (crates.length > 0) {
        await trx.insertInto("courseCrate").values(crates).executeTakeFirst();
      }
    });

  return await coursesGetOne(id);
}

export async function coursesDelete(user: User, id: number) {
  await database()
    .transaction()
    .execute(async (trx) => {
      await Promise.all([
        trx.deleteFrom("courseCrate").where("courseCrate.courseId", "=", id).executeTakeFirst(),
        trx.deleteFrom("courseLoad").where("courseLoad.courseId", "=", id).executeTakeFirst(),
        trx.deleteFrom("courseFile").where("courseFile.courseId", "=", id).executeTakeFirst(),
      ]);

      let { numDeletedRows } = await trx
        .deleteFrom("course")
        .where("course.id", "=", id)
        .where(({ eb, or, lit }) =>
          or([
            eb(lit(user.isAdminOf(Role.Dispecink)), "=", true),
            eb("course.locationId", "in", user.locations[Role.Dispecink] ?? [""]),
          ]),
        )
        .executeTakeFirst();

      if (numDeletedRows === 0n) {
        throw new Forbidden();
      }

      await filesRemoveGroup("course", `${id}`);
    });
}

export async function coursesReadFileOne(id: number, filename: string) {
  let item = await database()
    .selectFrom("courseFile")
    .selectAll("courseFile")
    .where("courseFile.courseId", "=", id)
    .where("courseFile.filename", "=", filename)

    .executeTakeFirst();

  if (!item) {
    throw new Forbidden();
  }

  return {
    buffer: await filesRead("course", `${id}`, {
      filename: item.filename,
      originalname: item.displayName,
    }),
    file: item,
  };
}

export async function coursesAddFiles(
  user: User,
  id: number,
  files: Record<"departure" | "arrival", Express.Multer.File[]>,
) {
  await database()
    .transaction()
    .execute(async (trx) => {
      try {
        await trx
          .selectFrom("course")
          .select(({ lit }) => [lit(true).as("exists")])
          .where("course.id", "=", id)
          .where(({ eb, or, lit }) =>
            or([
              eb(lit(user.isAdminOf(Role.Dispecink)), "=", true),
              eb("course.locationId", "in", user.locations[Role.Dispecink] ?? [""]),
            ]),
          )
          .executeTakeFirstOrThrow();
      } catch {
        throw new Forbidden();
      }

      let allFiles =
        files.departure
          ?.map((it) => ({
            courseId: id,
            group: CourseGroup.Departure,
            filename: it.filename,
            type: it.mimetype,
            displayName: it.originalname,
          }))
          .concat(
            files.arrival?.map(
              (it) =>
                ({
                  courseId: id,
                  group: CourseGroup.Arrival,
                  filename: it.filename,
                  type: it.mimetype,
                  displayName: it.originalname,
                }) ?? [],
            ),
          ) ?? [];
      if (allFiles.length > 0) {
        await trx.insertInto("courseFile").values(allFiles).executeTakeFirst();
        await filesPersist("course", `${id}`, (files.departure ?? []).concat(files.arrival ?? []));
      }
    });

  return await coursesGetOne(id);
}

export async function coursesRemoveFiles(user: User, id: number, filenames: string[]) {
  await database()
    .transaction()
    .execute(async (trx) => {
      let files = await trx
        .selectFrom("courseFile")
        .select(["courseFile.filename", "courseFile.displayName"])
        .where("courseFile.courseId", "=", id)
        .where("courseFile.filename", "in", filenames)
        .execute();

      let { numDeletedRows } = await trx
        .deleteFrom("courseFile")
        .where("courseFile.courseId", "=", id)
        .where("courseFile.filename", "in", filenames)
        .where(({ selectFrom, exists }) =>
          exists(
            selectFrom("course")
              .select(({ lit }) => [lit(true).as("exists")])
              .where(({ eb, ref }) => eb("course.id", "=", ref("courseFile.courseId")))
              .where(({ eb, or, lit }) =>
                or([
                  eb(lit(user.isAdminOf(Role.Dispecink)), "=", true),
                  eb("course.locationId", "in", user.locations[Role.Dispecink] ?? [""]),
                ]),
              ),
          ),
        )
        .executeTakeFirst();

      if (numDeletedRows === 0n) {
        throw new Forbidden();
      }

      await filesRemove(
        "course",
        `${id}`,
        files.map((it) => ({
          filename: it.filename,
          originalname: it.displayName,
        })),
      );
    });

  return await coursesGetOne(id);
}
