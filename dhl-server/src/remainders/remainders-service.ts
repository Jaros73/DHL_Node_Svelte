import { jsonArrayFrom } from "kysely/helpers/postgres";
import { DateTime } from "luxon";
import { toCsvBuffer } from "../csv/to-csv";
import { database } from "../database";
import { Forbidden } from "../error/http-error";
import { DateTimeRange } from "../helpers/date-time-range";
import { Find } from "../helpers/find";
import { Role } from "../security/role";
import { User } from "../security/user";
import { RemaindersUpsertSchema, remaindersFilterSchema } from "./remainders-schema";

export async function remaindersMeta() {
  let [locations, crates, technologicalGroups] = await Promise.all([
    database()
      .selectFrom("location")
      .select(["location.id", "location.name"])
      .where("location.postOfficeType", "=", "SPU")
      .orderBy("location.name asc")
      .execute(),
    database().selectFrom("crate").selectAll().orderBy("crate.value", "asc").execute(),
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
    crates,
    technologicalGroups,
  };
}

export async function remaindersExport(range: DateTimeRange) {
  let items = await remaindersFindMany({
    filter: {
      createdAt: [range.from, range.to],
    },
  });

  let flattenedItems = items.map((it) => {
    let res = it as typeof it & { [key: string]: unknown };

    res.amount = `${res.amount} ${res.technologicalGroupUnit}`;
    res.crates.forEach((crate) => {
      if (crate.amount) {
        res[crate.crate] = crate.amount;
      }
    });

    return res;
  });

  return await toCsvBuffer(flattenedItems, [
    ["createdAt", "Vytvořeno"],
    ["createdByFullName", "Vytvořil"],
    ["locationName", "DSPU"],
    ["dateFor", "Datum ku"],
    ["network", "Síť"],
    ["kind", "Druh"],
    ["technologicalGroup", "Technologická skupina"],
    ["amount", "Počet"],
    ["euro-pallet", "EURO paleta"],
    ["cage", "Klec"],
    ["container", "Kontejner"],
    ["other-pallet", "Ostatní palety"],
    ["shipping-container", "Přepravka"],
    ["flatbed", "Valník"],
    ["note", "Poznámka"],
  ]);
}

export async function remaindersFindMany(find: Find) {
  let query = database()
    .selectFrom("remainder")
    .leftJoin("user as creator", "remainder.createdBy", "creator.id")
    .leftJoin("user as updater", "remainder.updatedBy", "updater.id")
    .leftJoin("location", "remainder.locationId", "location.id")
    .leftJoin("technologicalGroup", "remainder.technologicalGroup", "technologicalGroup.value")
    .selectAll("remainder")
    .select(({ selectFrom }) => [
      "creator.fullName as createdByFullName",
      "updater.fullName as updatedByFullName",
      "location.name as locationName",
      "technologicalGroup.unit as technologicalGroupUnit",
      "technologicalGroup.group as technologicalGroupGroup",
      jsonArrayFrom(
        selectFrom("remainderCrate")
          .select(["remainderCrate.crate", "remainderCrate.amount"])
          .whereRef("remainderCrate.remainderId", "=", "remainder.id"),
      ).as("crates"),
    ])
    .orderBy("remainder.createdAt desc")
    .orderBy("remainder.id desc");

  let filter = await remaindersFilterSchema.parseAsync(find.filter);
  if (filter) {
    if (filter.createdAt) {
      let [dateFrom, dateTo] = filter.createdAt;
      if (dateFrom) {
        query = query.where("remainder.createdAt", ">=", DateTime.fromISO(dateFrom).toJSDate());
      }

      if (dateTo) {
        query = query.where("remainder.createdAt", "<=", DateTime.fromISO(dateTo).toJSDate());
      }
    }

    if (filter.locationId && filter.locationId.length > 0) {
      query = query.where("remainder.locationId", "in", filter.locationId);
    }

    if (filter.network && filter.network.length > 0) {
      query = query.where("remainder.network", "in", filter.network);
    }

    if (filter.kind && filter.kind.length > 0) {
      query = query.where("remainder.kind", "in", filter.kind);
    }

    if (filter.technologicalGroup && filter.technologicalGroup.length > 0) {
      query = query.where("remainder.technologicalGroup", "in", filter.technologicalGroup);
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
          fn("unaccent", [ref("remainder.network")]),
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

export async function remaindersGetOne(id: number) {
  return await database()
    .selectFrom("remainder")
    .leftJoin("user as creator", "remainder.createdBy", "creator.id")
    .leftJoin("user as updater", "remainder.updatedBy", "updater.id")
    .leftJoin("location", "remainder.locationId", "location.id")
    .leftJoin("technologicalGroup", "remainder.technologicalGroup", "technologicalGroup.value")
    .selectAll("remainder")
    .select(({ selectFrom }) => [
      "creator.fullName as createdByFullName",
      "updater.fullName as updatedByFullName",
      "location.name as locationName",
      "technologicalGroup.unit as technologicalGroupUnit",
      "technologicalGroup.group as technologicalGroupGroup",
      jsonArrayFrom(
        selectFrom("remainderCrate")
          .select(["remainderCrate.crate", "remainderCrate.amount"])
          .whereRef("remainderCrate.remainderId", "=", "remainder.id"),
      ).as("crates"),
    ])
    .where("remainder.id", "=", id)
    .executeTakeFirst();
}

export async function remaindersCreate(user: User, item: RemaindersUpsertSchema) {
  if (!user.canUseLocation(Role.Dispecink, item.locationId)) {
    throw new Forbidden();
  }

  let id = await database()
    .transaction()
    .execute(async (trx) => {
      let { id } = await trx
        .insertInto("remainder")
        .values({
          createdBy: user.id,
          locationId: item.locationId,
          dateFor: item.dateFor,
          network: item.network,
          kind: item.kind,
          technologicalGroup: item.technologicalGroup,
          amount: item.amount,
          note: item.note,
        })
        .returning("remainder.id")
        .executeTakeFirstOrThrow();

      if (item.crates.length > 0) {
        await trx
          .insertInto("remainderCrate")
          .values(
            item.crates.map((it) => ({
              ...it,
              remainderId: id,
            })),
          )
          .executeTakeFirstOrThrow();
      }

      return id;
    });

  return await remaindersGetOne(id);
}

export async function remaindersUpdate(user: User, id: number, item: RemaindersUpsertSchema) {
  if (!user.canUseLocation(Role.Dispecink, item.locationId)) {
    throw new Forbidden();
  }

  await database()
    .transaction()
    .execute(async (trx) => {
      await trx
        .deleteFrom("remainderCrate")
        .where("remainderCrate.remainderId", "=", id)
        .executeTakeFirst();

      if (item.crates.length > 0) {
        await trx
          .insertInto("remainderCrate")
          .values(
            item.crates.map((it) => ({
              ...it,
              remainderId: id,
            })),
          )
          .executeTakeFirst();
      }

      let { numUpdatedRows } = await trx
        .updateTable("remainder")
        .set({
          updatedBy: user.id,
          updatedAt: new Date(),
          locationId: item.locationId,
          dateFor: item.dateFor,
          network: item.network,
          kind: item.kind,
          technologicalGroup: item.technologicalGroup,
          amount: item.amount,
          note: item.note,
        })
        .where("remainder.id", "=", id)
        .where(({ eb, or, lit }) =>
          or([
            eb(lit(user.isAdminOf(Role.Dispecink)), "=", true),
            eb("remainder.locationId", "in", user.locations[Role.Dispecink] ?? [""]),
          ]),
        )
        .executeTakeFirst();

      if (numUpdatedRows === 0n) {
        throw new Forbidden();
      }
    });

  return await remaindersGetOne(id);
}

export async function remaindersDelete(user: User, id: number) {
  return await database()
    .transaction()
    .execute(async (trx) => {
      await trx
        .deleteFrom("remainderCrate")
        .where("remainderCrate.remainderId", "=", id)
        .executeTakeFirst();

      let { numDeletedRows } = await trx
        .deleteFrom("remainder")
        .where("remainder.id", "=", id)
        .where(({ eb, or, lit }) =>
          or([
            eb(lit(user.isAdminOf(Role.Dispecink)), "=", true),
            eb("remainder.locationId", "in", user.locations[Role.Dispecink] ?? [""]),
          ]),
        )
        .executeTakeFirst();

      if (numDeletedRows === 0n) {
        throw new Forbidden();
      }
    });
}
