import { Transaction } from "kysely";
import { DB } from "kysely-codegen";
import { jsonArrayFrom } from "kysely/helpers/postgres";
import { DateTime } from "luxon";
import { toCsvBuffer } from "../csv/to-csv";
import { database } from "../database";
import { EnumKey } from "../enums/enums-service";
import { Conflict, Forbidden, InternalServerError } from "../error/http-error";
import { DateTimeRange } from "../helpers/date-time-range";
import { Find } from "../helpers/find";
import { Role } from "../security/role";
import { User } from "../security/user";
import {
  IrregularCoursesUpsertSchema,
  irregularCoursesFilterSchema,
} from "./irregular-courses-schema";

export async function irregularCoursesMeta() {
  let [locations, enums, technologicalGroups] = await Promise.all([
    database()
      .selectFrom("location")
      .select(["location.id", "location.name", "location.postOfficeType"])
      .where("location.postOfficeType", "in", ["SPU", "DEPO"])
      .orderBy("location.name asc")
      .execute(),
    database()
      .selectFrom("enumValue")
      .select(["enumValue.id", "enumValue.key", "enumValue.name"])
      .where("enumValue.key", "in", [
        EnumKey.Stop,
        EnumKey.VehiclePlate,
        EnumKey.TrailerPlate,
        EnumKey.Transporter,
      ])
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
    locations: locations.filter((it) => it.postOfficeType === "SPU"),
    stopLocations: locations,
    stops: enums.filter((it) => it.key === EnumKey.Stop),
    transporters: enums.filter((it) => it.key === EnumKey.Transporter),
    vehiclePlates: enums.filter((it) => it.key === EnumKey.VehiclePlate),
    trailerPlates: enums.filter((it) => it.key === EnumKey.TrailerPlate),
    technologicalGroups,
  };
}

export async function irregularCoursesExport(range: DateTimeRange) {
  let items = await irregularCoursesFindMany({
    filter: {
      createdAt: [range.from, range.to],
    },
  });

  let groupedItems = items.map((it) => {
    let res = it as typeof it & { [key: string]: unknown };
    res["stops"] = "TODO";
    return res;
  });

  return await toCsvBuffer(groupedItems, [
    ["createdAt", "Vytvořeno"],
    ["createdByFullName", "Vytvořil"],
    ["locationName", "DSPU"],
    ["network", "Síť"],
    ["load", "Vytížení"],
    ["initialStopName", "Počáteční zastávka"],
    ["initialStopDate", "Odjezd"], // add time
    ["stops", "Zastávky"],
    ["finalStopName", "Koneční zastávka"],
    ["finalStopDate", "Příjezd"], // add time
    ["transporter", "Dopravce"],
    ["vehiclePlate", "Vozidlo"],
    ["trailerPlate", "Příp. vp"],
    ["distance", "Vzdálenost"],
  ]);
}

export async function irregularCoursesFindMany(find: Find) {
  let query = database()
    .selectFrom("irregularCourse")
    .leftJoin("user as creator", "irregularCourse.createdBy", "creator.id")
    .leftJoin("user as updater", "irregularCourse.updatedBy", "updater.id")
    .leftJoin("location", "irregularCourse.locationId", "location.id")
    .leftJoin("location as initialStop", "irregularCourse.initialStop", "initialStop.id")
    .leftJoin("location as finalStop", "irregularCourse.finalStop", "finalStop.id")
    .selectAll("irregularCourse")
    .select(({ selectFrom }) => [
      "creator.fullName as createdByFullName",
      "updater.fullName as updatedByFullName",
      "location.name as locationName",
      "initialStop.name as initialStopName",
      "finalStop.name as finalStopName",
      selectFrom("irregularCourseStop")
        .select(({ fn }) => fn.count("irregularCourseStop.sequence").as("stopsCount"))
        .whereRef("irregularCourseStop.irregularCourseId", "=", "irregularCourse.id")
        .as("stopsCount"),
    ])
    .orderBy("irregularCourse.createdAt desc");

  let filter = await irregularCoursesFilterSchema.parseAsync(find.filter);
  if (filter) {
    if (filter.createdAt) {
      let [dateFrom, dateTo] = filter.createdAt;
      if (dateFrom) {
        query = query.where(
          "irregularCourse.createdAt",
          ">=",
          DateTime.fromISO(dateFrom).toJSDate(),
        );
      }

      if (dateTo) {
        query = query.where("irregularCourse.createdAt", "<=", DateTime.fromISO(dateTo).toJSDate());
      }
    }

    if (filter.locationId && filter.locationId.length > 0) {
      query = query.where("irregularCourse.locationId", "in", filter.locationId);
    }

    if (filter.network && filter.network.length > 0) {
      query = query.where("irregularCourse.network", "in", filter.network);
    }

    if (filter.load && filter.load.length === 1) {
      query = query.where(
        "irregularCourse.load",
        filter.load.includes("empty") ? "is" : "is not",
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
          fn("unaccent", [ref("irregularCourse.network")]),
          "ilike",
          fn("unaccent", [val(`%${find.search}%`)]),
        ),
        eb(
          fn("unaccent", [ref("initialStop.name")]),
          "ilike",
          fn("unaccent", [val(`%${find.search}%`)]),
        ),
        eb(
          fn("unaccent", [ref("finalStop.name")]),
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
    query = query.limit(find.offset);
  }

  return await query.execute();
}

export async function irregularCoursesGetOne(id: number) {
  return await database()
    .selectFrom("irregularCourse")
    .leftJoin("user as creator", "irregularCourse.createdBy", "creator.id")
    .leftJoin("user as updater", "irregularCourse.updatedBy", "updater.id")
    .leftJoin("location", "irregularCourse.locationId", "location.id")
    .leftJoin("location as initialStop", "irregularCourse.initialStop", "initialStop.id")
    .leftJoin("location as finalStop", "irregularCourse.finalStop", "finalStop.id")
    .leftJoin("enumValue as vehiclePlate", "irregularCourse.vehiclePlate", "vehiclePlate.id")
    .leftJoin("enumValue as trailerPlate", "irregularCourse.trailerPlate", "trailerPlate.id")
    .selectAll("irregularCourse")
    .select(({ selectFrom }) => [
      "creator.fullName as createdByFullName",
      "updater.fullName as updatedByFullName",
      "location.name as locationName",
      "initialStop.name as initialStopName",
      "finalStop.name as finalStopName",
      "vehiclePlate.name as vehiclePlate",
      "trailerPlate.name as trailerPlate",
      jsonArrayFrom(
        selectFrom("irregularCourseStop")
          .leftJoin("enumValue", "irregularCourseStop.stopEnumId", "enumValue.id")
          .selectAll("irregularCourseStop")
          .select("enumValue.name as stopName")
          .whereRef("irregularCourseStop.irregularCourseId", "=", "irregularCourse.id")
          .orderBy("irregularCourseStop.sequence asc"),
      ).as("stops"),
      jsonArrayFrom(
        selectFrom("irregularCourseLoad")
          .selectAll("irregularCourseLoad")
          .whereRef("irregularCourseLoad.irregularCourseId", "=", "irregularCourse.id"),
      ).as("loads"),
      jsonArrayFrom(
        selectFrom("irregularCourseCrate")
          .selectAll("irregularCourseCrate")
          .whereRef("irregularCourseCrate.irregularCourseId", "=", "irregularCourse.id"),
      ).as("crates"),
    ])
    .where("irregularCourse.id", "=", id)
    .executeTakeFirst();
}

async function prepareEnums(trx: Transaction<DB>, user: User, item: IrregularCoursesUpsertSchema) {
  let enumValuesToCreate = [
    { createdBy: user.id, key: EnumKey.VehiclePlate, name: item.vehiclePlate, enabled: true },
    ...item.stops.map((it) => ({
      createdBy: user.id,
      key: EnumKey.Stop,
      name: it,
      enabled: true,
    })),
  ];
  if (item.trailerPlate) {
    enumValuesToCreate.push({
      createdBy: user.id,
      key: EnumKey.TrailerPlate,
      name: item.trailerPlate,
      enabled: true,
    });
  }

  await trx
    .insertInto("enumValue")
    .values(enumValuesToCreate)
    .onConflict((oc) => oc.doNothing())
    .executeTakeFirst();

  let enums = await trx
    .selectFrom("enumValue")
    .select(["enumValue.id", "enumValue.key", "enumValue.name", "enumValue.enabled"])
    .where("enumValue.key", "in", [EnumKey.VehiclePlate, EnumKey.TrailerPlate, EnumKey.Stop])
    .execute();

  for (let { enabled, key, name } of enums) {
    if (enabled) {
      continue;
    }

    if (key === EnumKey.VehiclePlate && name === item.vehiclePlate) {
      throw new Conflict("vehiclePlate");
    }

    if (item.trailerPlate && key === EnumKey.TrailerPlate && name === item.trailerPlate) {
      throw new Conflict("trailerPlate");
    }

    if (key === EnumKey.Stop && item.stops.includes(name)) {
      throw new Conflict(`stop:${name}`);
    }
  }

  let vehiclePlateEnumId = enums.find(
    (it) => it.key === EnumKey.VehiclePlate && it.name === item.vehiclePlate,
  )?.id;
  let trailerPlateEnumId = item.trailerPlate
    ? enums.find((it) => it.key === EnumKey.VehiclePlate && it.name === item.trailerPlate)?.id
    : undefined;

  if (!vehiclePlateEnumId) {
    throw new InternalServerError();
  }

  return {
    vehiclePlateEnumId,
    trailerPlateEnumId,
    enabledStops: enums.filter((it) => it.key === EnumKey.Stop && it.enabled),
  };
}

export async function irregularCoursesCreate(user: User, item: IrregularCoursesUpsertSchema) {
  if (!user.canUseLocation(Role.Dispecink, item.locationId)) {
    throw new Forbidden();
  }

  let id = await database()
    .transaction()
    .execute(async (trx) => {
      let { enabledStops, trailerPlateEnumId, vehiclePlateEnumId } = await prepareEnums(
        trx,
        user,
        item,
      );

      let { id } = await database()
        .insertInto("irregularCourse")
        .values({
          createdBy: user.id,
          locationId: item.locationId,
          initialStop: item.initialStop,
          initialStopDate: item.initialStopDate,
          initialStopTime: item.initialStopTime,
          finalStop: item.finalStop,
          finalStopDate: item.finalStopDate,
          finalStopTime: item.finalStopTime,
          network: item.network,
          transporter: item.transporter,
          distance: item.distance,
          note: item.note,
          otherLoad: item.otherLoad,
          load: item.load,
          vehiclePlate: vehiclePlateEnumId,
          trailerPlate: trailerPlateEnumId,
        })
        .returning("irregularCourse.id")
        .executeTakeFirstOrThrow();

      let stops = item.stops
        .filter((it) => Boolean(it))
        .map((it, ix) => ({
          sequence: ix,
          stopEnumId: enabledStops.find((v) => v.name === it)!.id,
          irregularCourseId: id,
        }));
      if (stops.length > 0) {
        await trx.insertInto("irregularCourseStop").values(stops).executeTakeFirst();
      }

      if (item.loads.length > 0) {
        await trx
          .insertInto("irregularCourseLoad")
          .values(item.loads.map((it) => ({ ...it, irregularCourseId: id })))
          .executeTakeFirst();
      }

      if (item.crates.length > 0) {
        await trx
          .insertInto("irregularCourseCrate")
          .values(item.crates.map((it) => ({ ...it, irregularCourseId: id })))
          .executeTakeFirst();
      }

      return id;
    });

  return await irregularCoursesGetOne(id);
}

export async function irregularCoursesUpdate(
  user: User,
  id: number,
  item: IrregularCoursesUpsertSchema,
) {
  if (!user.canUseLocation(Role.Dispecink, item.locationId)) {
    throw new Forbidden();
  }

  await database()
    .transaction()
    .execute(async (trx) => {
      let { enabledStops, trailerPlateEnumId, vehiclePlateEnumId } = await prepareEnums(
        trx,
        user,
        item,
      );

      let { numUpdatedRows } = await trx
        .updateTable("irregularCourse")
        .set({
          updatedBy: user.id,
          updatedAt: new Date(),
          locationId: item.locationId,
          initialStop: item.initialStop,
          initialStopDate: item.initialStopDate,
          initialStopTime: item.initialStopTime,
          finalStop: item.finalStop,
          finalStopDate: item.finalStopDate,
          finalStopTime: item.finalStopTime,
          network: item.network,
          transporter: item.transporter,
          distance: item.distance,
          note: item.note,
          otherLoad: item.otherLoad,
          load: item.load,
          vehiclePlate: vehiclePlateEnumId,
          trailerPlate: trailerPlateEnumId,
        })
        .where("irregularCourse.id", "=", id)
        .where(({ eb, or, lit }) =>
          or([
            eb(lit(user.isAdminOf(Role.Dispecink)), "=", true),
            eb("irregularCourse.locationId", "in", user.locations[Role.Dispecink] ?? [""]),
          ]),
        )
        .executeTakeFirst();

      if (numUpdatedRows === 0n) {
        throw new Forbidden();
      }

      await trx
        .deleteFrom("irregularCourseStop")
        .where("irregularCourseStop.irregularCourseId", "=", id)
        .executeTakeFirst();

      let stops = item.stops
        .filter((it) => Boolean(it))
        .map((it, ix) => ({
          sequence: ix,
          stopEnumId: enabledStops.find((v) => v.name === it)!.id,
          irregularCourseId: id,
        }));
      if (stops.length > 0) {
        await trx.insertInto("irregularCourseStop").values(stops).executeTakeFirst();
      }

      await trx
        .deleteFrom("irregularCourseLoad")
        .where("irregularCourseLoad.irregularCourseId", "=", id)
        .executeTakeFirst();

      if (item.loads.length > 0) {
        await trx
          .insertInto("irregularCourseLoad")
          .values(item.loads.map((it) => ({ ...it, irregularCourseId: id })))
          .executeTakeFirst();
      }

      await trx
        .deleteFrom("irregularCourseCrate")
        .where("irregularCourseCrate.irregularCourseId", "=", id)
        .executeTakeFirst();

      if (item.crates.length > 0) {
        await trx
          .insertInto("irregularCourseCrate")
          .values(item.crates.map((it) => ({ ...it, irregularCourseId: id })))
          .executeTakeFirst();
      }
    });

  return await irregularCoursesGetOne(id);
}

export async function irregularCoursesDelete(user: User, id: number) {
  return await database()
    .transaction()
    .execute(async (trx) => {
      await Promise.all([
        trx
          .deleteFrom("irregularCourseCrate")
          .where("irregularCourseCrate.irregularCourseId", "=", id)
          .executeTakeFirst(),
        trx
          .deleteFrom("irregularCourseLoad")
          .where("irregularCourseLoad.irregularCourseId", "=", id)
          .executeTakeFirst(),
        trx
          .deleteFrom("irregularCourseStop")
          .where("irregularCourseStop.irregularCourseId", "=", id)
          .executeTakeFirst(),
      ]);

      let { numDeletedRows } = await trx
        .deleteFrom("irregularCourse")
        .where("irregularCourse.id", "=", id)
        .where(({ eb, or, lit }) =>
          or([
            eb(lit(user.isAdminOf(Role.Dispecink)), "=", true),
            eb("irregularCourse.locationId", "in", user.locations[Role.Dispecink] ?? [""]),
          ]),
        )
        .executeTakeFirst();

      if (numDeletedRows === 0n) {
        throw new Forbidden();
      }
    });
}
