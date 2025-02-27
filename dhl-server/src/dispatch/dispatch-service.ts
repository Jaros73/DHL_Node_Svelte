import { DateTime } from "luxon";
import { toCsvBuffer } from "../csv/to-csv";
import { database } from "../database";
import { EnumKey } from "../enums/enums-service";
import { Forbidden } from "../error/http-error";
import { DateTimeRange } from "../helpers/date-time-range";
import { Find } from "../helpers/find";
import { Role } from "../security/role";
import { User } from "../security/user";
import { DispatchUpsertSchema, dispatchFilterSchema } from "./dispatch-schema";

export async function dispatchMeta() {
  let [locations, enums] = await Promise.all([
    database()
      .selectFrom("location")
      .select(["location.id", "location.name"])
      .where("location.postOfficeType", "=", "SPU")
      .orderBy("location.name asc")
      .execute(),
    database()
      .selectFrom("enumValue")
      .select(["enumValue.key", "enumValue.id", "enumValue.name"])
      .where("enumValue.key", "in", [EnumKey.Key, EnumKey.DispatchType])
      .where("enumValue.enabled", "=", true)
      .execute(),
  ]);

  return {
    locations,
    types: enums
      .filter((it) => it.key === EnumKey.DispatchType)
      .sort((a, z) => a.name.localeCompare(z.name)),
    keys: enums.filter((it) => it.key === EnumKey.Key).sort((a, z) => a.name.localeCompare(z.name)),
  };
}

export async function dispatchExport(range: DateTimeRange) {
  let items = await dispatchFindMany({
    filter: {
      createdAt: [range.from, range.to],
    },
  });

  return toCsvBuffer(items, [
    ["createdAt", "Vytvořeno"],
    ["createdByFullName", "Vytvořil"],
    ["locationName", "DSPU"],
    ["userTime", "Datum ku"],
    ["typeEnumName", "Typ"],
    ["keyEnumName", "Klíč"],
    ["description", "Popis"],
  ]);
}

export async function dispatchFindMany(find: Find) {
  let query = database()
    .selectFrom("dispatch")
    .leftJoin("user as creator", "dispatch.createdBy", "creator.id")
    .leftJoin("user as updater", "dispatch.updatedBy", "updater.id")
    .leftJoin("location", "dispatch.locationId", "location.id")
    .leftJoin("enumValue as type", "dispatch.typeEnumId", "type.id")
    .leftJoin("enumValue as key", "dispatch.keyEnumId", "key.id")
    .selectAll("dispatch")
    .select([
      "creator.fullName as createdByFullName",
      "updater.fullName as updatedByFullName",
      "location.name as locationName",
      "type.name as typeEnumName",
      "key.name as keyEnumName",
    ])
    .orderBy(["dispatch.createdAt desc", "dispatch.id desc"]);

  let filter = await dispatchFilterSchema.parseAsync(find.filter);
  if (filter) {
    if (filter.createdAt) {
      let [dateFrom, dateTo] = filter.createdAt;
      if (dateFrom) {
        query = query.where("dispatch.createdAt", ">=", DateTime.fromISO(dateFrom).toJSDate());
      }

      if (dateTo) {
        query = query.where("dispatch.createdAt", "<=", DateTime.fromISO(dateTo).toJSDate());
      }
    }

    if (filter.locationId && filter.locationId.length > 0) {
      query = query.where("dispatch.locationId", "in", filter.locationId);
    }

    if (filter.typeEnumId && filter.typeEnumId.length > 0) {
      query = query.where("dispatch.typeEnumId", "in", filter.typeEnumId);
    }

    if (filter.keyEnumId && filter.keyEnumId.length > 0) {
      query = query.where("dispatch.keyEnumId", "in", filter.keyEnumId);
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
        eb(fn("unaccent", [ref("type.name")]), "ilike", fn("unaccent", [val(`%${find.search}%`)])),
        eb(fn("unaccent", [ref("key.name")]), "ilike", fn("unaccent", [val(`%${find.search}%`)])),
        eb(
          fn("unaccent", [ref("dispatch.description")]),
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

export async function dispatchGetOne(id: number) {
  return await database()
    .selectFrom("dispatch")
    .leftJoin("user as creator", "dispatch.createdBy", "creator.id")
    .leftJoin("user as updater", "dispatch.updatedBy", "updater.id")
    .leftJoin("location", "dispatch.locationId", "location.id")
    .leftJoin("enumValue as type", "dispatch.typeEnumId", "type.id")
    .leftJoin("enumValue as key", "dispatch.keyEnumId", "key.id")
    .selectAll("dispatch")
    .select([
      "creator.fullName as createdByFullName",
      "updater.fullName as updatedByFullName",
      "location.name as locationName",
      "type.name as typeEnumName",
      "key.name as keyEnumName",
    ])
    .where("dispatch.id", "=", id)
    .executeTakeFirst();
}

export async function dispatchCreate(user: User, item: DispatchUpsertSchema) {
  if (!user.canUseLocation(Role.Dispecink, item.locationId)) {
    throw new Forbidden();
  }

  let { id } = await database()
    .insertInto("dispatch")
    .values({
      ...item,
      createdBy: user.id,
    })
    .returning(["dispatch.id"])
    .executeTakeFirstOrThrow();

  return await dispatchGetOne(id);
}

export async function dispatchUpdate(user: User, id: number, item: DispatchUpsertSchema) {
  if (!user.canUseLocation(Role.Dispecink, item.locationId)) {
    throw new Forbidden();
  }

  let { numUpdatedRows } = await database()
    .updateTable("dispatch")
    .set({
      ...item,
      updatedAt: new Date(),
      updatedBy: user.id,
    })
    .where("dispatch.id", "=", id)
    .where(({ eb, or, lit }) =>
      or([
        eb(lit(user.isAdminOf(Role.Dispecink)), "=", true),
        eb("dispatch.locationId", "in", user.locations[Role.Dispecink] ?? [""]),
      ]),
    )
    .executeTakeFirst();

  if (numUpdatedRows === 0n) {
    throw new Forbidden();
  }

  return await dispatchGetOne(id);
}

export async function dispatchDelete(user: User, id: number) {
  let { numDeletedRows } = await database()
    .deleteFrom("dispatch")
    .where("dispatch.id", "=", id)
    .where(({ eb, or, lit }) =>
      or([
        eb(lit(user.isAdminOf(Role.Dispecink)), "=", true),
        eb("dispatch.locationId", "in", user.locations[Role.Dispecink] ?? [""]),
      ]),
    )
    .executeTakeFirst();

  if (numDeletedRows === 0n) {
    throw new Forbidden();
  }
}
