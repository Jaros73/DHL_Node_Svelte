import { jsonArrayFrom } from "kysely/helpers/postgres";
import { DateTime } from "luxon";
import { toCsvBuffer } from "../csv/to-csv";
import { database, isDuplicateKeyError } from "../database";
import { Forbidden } from "../error/http-error";
import { DateTimeRange } from "../helpers/date-time-range";
import { Find } from "../helpers/find";
import { Role } from "../security/role";
import { User } from "../security/user";
import {
  MachiningsCreateSchema,
  MachiningsUpdateSchema,
  machiningsFilterSchema,
} from "./machinings-schema";

export async function machiningsMeta() {
  let [locations, machines] = await Promise.all([
    database()
      .selectFrom("location")
      .select(["location.id", "location.name"])
      .where("location.postOfficeType", "=", "SPU")
      .orderBy("location.name asc")
      .execute(),
    database()
      .selectFrom("machine")
      .select(["machine.value"])
      .orderBy("machine.value asc")
      .execute(),
  ]);

  return {
    locations,
    machines,
  };
}

export async function machiningsExport(range: DateTimeRange) {
  let items = await machiningsFindMany({
    filter: {
      dateFor: [range.from, range.to],
    },
  });

  let flattenedItems = items.map((it) => {
    let res = it as typeof it & { [key: string]: unknown };

    it.machines.forEach((machine) => {
      if (machine.value !== null) {
        res[machine.machine] = machine.value;
      }
    });

    return res;
  });

  return await toCsvBuffer(flattenedItems, [
    ["dateFor", "Datum"],
    ["locationName", "DSPU"],
    ["bez-kodu", "Bez kódu"],
    ["cfc", "CFC"],
    ["n4l", "N4L"],
    ["pro-bm02", "Pro BM02"],
    ["pro-ol02", "Pro OL02"],
    ["pro-p022", "Pro P022"],
    ["pro-pm02", "Pro PM02"],
    ["sz-d-1", "SZ D+1"],
    ["sz-tech", "SZ Tech"],
    ["tb", "TB"],
    ["vcd-do", "VCD DO"],
    ["vcd-psc", "VCD PSC"],
  ]);
}

function findQuery() {
  return database()
    .selectFrom("machining")
    .leftJoin("user as creator", "machining.createdBy", "creator.id")
    .leftJoin("user as updater", "machining.updatedBy", "updater.id")
    .leftJoin("location", "machining.locationId", "location.id")
    .selectAll("machining")
    .select(({ selectFrom }) => [
      "creator.fullName as createdByFullName",
      "updater.fullName as updatedByFullName",
      "location.name as locationName",
      jsonArrayFrom(
        selectFrom("locationMachine")
          .leftJoin("machiningMachine", (join) =>
            join
              .onRef("locationMachine.machine", "=", "machiningMachine.machine")
              .onRef("machiningMachine.machiningId", "=", "machining.id"),
          )
          .select(["locationMachine.machine", "machiningMachine.value", "machiningMachine.note"])
          .whereRef("locationMachine.locationId", "=", "machining.locationId"),
      ).as("machines"),
    ]);
}

export async function machiningsFindMany(find: Find) {
  let query = findQuery().orderBy(["machining.dateFor desc", "machining.id desc"]);

  let filter = await machiningsFilterSchema.parseAsync(find.filter);
  if (filter) {
    if (filter.dateFor) {
      let [dateFrom, dateTo] = filter.dateFor;
      if (dateFrom) {
        query = query.where("machining.dateFor", ">=", DateTime.fromISO(dateFrom).toJSDate());
      }

      if (dateTo) {
        query = query.where("machining.dateFor", "<=", DateTime.fromISO(dateTo).toJSDate());
      }
    }

    if (filter.locationId && filter.locationId.length > 0) {
      query = query.where("machining.locationId", "in", filter.locationId);
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

export async function machiningsGetOne(id: number) {
  return await findQuery().where("machining.id", "=", id).executeTakeFirst();
}

export async function machiningsCreate(user: User, item: MachiningsCreateSchema) {
  if (!user.canUseLocation(Role.Dispecink, item.locationId)) {
    throw new Forbidden();
  }

  try {
    let { id } = await database()
      .insertInto("machining")
      .values({
        ...item,
        createdBy: user.id,
      })
      .returning(["machining.id"])
      .executeTakeFirstOrThrow();

    return await machiningsGetOne(id);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return await findQuery()
        .where("machining.dateFor", "=", DateTime.fromISO(item.dateFor).toJSDate())
        .where("machining.locationId", "=", item.locationId)
        .executeTakeFirst();
    }

    throw err;
  }
}

export async function machiningsUpdate(user: User, id: number, item: MachiningsUpdateSchema) {
  await database()
    .transaction()
    .execute(async (trx) => {
      let row = await trx
        .selectFrom("machining")
        .select(["machining.locationId"])
        .where("machining.id", "=", id)
        .executeTakeFirstOrThrow();

      if (!user.canUseLocation(Role.Dispecink, row.locationId)) {
        throw new Forbidden();
      }

      await trx
        .deleteFrom("machiningMachine")
        .where("machiningMachine.machiningId", "=", id)
        .execute();

      if (item.length > 0) {
        await trx
          .insertInto("machiningMachine")
          .values(
            item.map((it) => ({
              ...it,
              machiningId: id,
            })),
          )
          .execute();
      }

      let { numUpdatedRows } = await trx
        .updateTable("machining")
        .set({
          updatedAt: new Date(),
          updatedBy: user.id,
        })
        .where("machining.id", "=", id)
        .executeTakeFirst();

      if (numUpdatedRows === 0n) {
        throw new Forbidden();
      }
    });

  return await machiningsGetOne(id);
}

export async function machiningsDelete(user: User, id: number) {
  return await database()
    .transaction()
    .execute(async (trx) => {
      await trx
        .deleteFrom("machiningMachine")
        .where("machiningMachine.machiningId", "=", id)
        .executeTakeFirst();

      let { numDeletedRows } = await trx
        .deleteFrom("machining")
        .where("machining.id", "=", id)
        .where(({ eb, or, lit }) =>
          or([
            eb(lit(user.isAdminOf(Role.Dispecink)), "=", true),
            eb("machining.locationId", "in", user.locations[Role.Dispecink] ?? [""]),
          ]),
        )
        .executeTakeFirst();

      if (numDeletedRows === 0n) {
        throw new Forbidden();
      }
    });
}
