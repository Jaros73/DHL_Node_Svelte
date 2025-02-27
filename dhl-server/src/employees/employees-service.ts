import { sql } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/postgres";
import { database } from "../database";
import { Forbidden } from "../error/http-error";
import { Find } from "../helpers/find";
import { User } from "../security/user";
import { EmployeesSetLocationsSchema } from "./employees-schema";

export async function employeesMeta() {
  let locations = await database()
    .selectFrom("location")
    .selectAll("location")
    .orderBy(["location.name asc", "location.regionOrg asc"])
    .execute();

  return {
    locations,
  };
}

export async function employeesFindMany(user: User, find: Find) {
  let query = database()
    .selectFrom("user")
    .selectAll("user")
    .where("user.roles", "&&", () => sql`array[${sql.join(user.adminOf)}]`)
    .orderBy(["user.surname asc", "user.givenName asc", "user.id asc"]);

  if (find.search) {
    query = query.where(({ eb, fn, or, ref, val }) =>
      or([
        eb(
          fn("unaccent", [ref("user.surname")]),
          "ilike",
          fn("unaccent", [val(`%${find.search}%`)]),
        ),
        eb(
          fn("unaccent", [ref("user.givenName")]),
          "ilike",
          fn("unaccent", [val(`%${find.search}%`)]),
        ),
        eb("user.id", "ilike", val(`%${find.search}%`)),
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

export async function employeesGetOne(user: User, id: string) {
  return await database()
    .selectFrom("user")
    .selectAll("user")
    .select(({ eb }) =>
      jsonArrayFrom(
        eb
          .selectFrom("userLocation")
          .selectAll("userLocation")
          .whereRef("userLocation.userId", "=", "user.id"),
      ).as("locations"),
    )
    .where("user.id", "=", id)
    .where("user.roles", "&&", () => sql`array[${sql.join(user.adminOf)}]`)
    .executeTakeFirst();
}

export async function employeesSetLocations(
  user: User,
  id: string,
  item: EmployeesSetLocationsSchema,
) {
  await database()
    .transaction()
    .execute(async (trx) => {
      try {
        await trx
          .selectFrom("user")
          .where("user.id", "=", id)
          .where("user.roles", "&&", () => sql`array[${sql.join(user.adminOf)}]`)
          .executeTakeFirstOrThrow();
      } catch {
        throw new Forbidden();
      }

      let { add, remove } = item;
      if (remove && remove.length > 0) {
        await trx
          .deleteFrom("userLocation")
          .where(({ eb, tuple, refTuple }) =>
            eb(
              refTuple("userLocation.userId", "userLocation.locationId", "userLocation.role"),
              "in",
              remove.map((it) => tuple(id, it.id, it.role)),
            ),
          )
          .executeTakeFirst();
      }

      if (add && add.length > 0) {
        await trx
          .insertInto("userLocation")
          .values(add.map((it) => ({ userId: id, locationId: it.id, role: it.role })))
          .onConflict((oc) => oc.constraint("user_location_pk").doNothing())
          .executeTakeFirst();
      }
    });

  return await employeesGetOne(user, id);
}
