import { DateTime } from "luxon";
import { ESB_TTL_LOCATIONS } from "../config";
import { database } from "../database";
import { Forbidden } from "../error/http-error";
import { logger } from "../logger";
import { postInfoGetDetail } from "../postinfo/postinfo-service";
import { User } from "../security/user";
import { LocationRequestsApprovalSchema, LocationRequestsCreateSchema } from "./locations-schema";

let log = logger("locations-service");

let lastSynchronizeLocationsAt: DateTime = DateTime.utc().minus({ seconds: ESB_TTL_LOCATIONS * 2 });
export async function synchronizeLocations(force = false) {
  if (
    !force &&
    DateTime.utc().diff(lastSynchronizeLocationsAt, "seconds").seconds < ESB_TTL_LOCATIONS
  ) {
    return;
  }

  let locations = await postInfoGetDetail();
  await database()
    .insertInto("location")
    .values(
      locations.map((it) => ({
        id: it.postId,
        zip: it.postCode,
        name: it.name,
        region: it.region,
        regionOrg: it.region1,
        spuName: it.spuName ?? null,
        postOfficeType: it.postOfficeTypeName,
        email: it.email ?? null,
      })),
    )
    .onConflict((oc) =>
      oc.column("id").doUpdateSet(({ ref }) => ({
        zip: ref("excluded.zip"),
        name: ref("excluded.name"),
        region: ref("excluded.region"),
        regionOrg: ref("excluded.regionOrg"),
        spuName: ref("excluded.spuName"),
        postOfficeType: ref("excluded.postOfficeType"),
        email: ref("excluded.email"),
      })),
    )
    .executeTakeFirst();

  lastSynchronizeLocationsAt = DateTime.utc();
}

export async function synchronizeLocationsScheduleStart() {
  let jitter = Math.random() * 20000;
  let ttlInMs = ESB_TTL_LOCATIONS * 1000;
  let timeout = ttlInMs + jitter;
  if (timeout > Number.MAX_SAFE_INTEGER) {
    timeout = Number.MAX_SAFE_INTEGER - 1;
  }

  async function synchronizeLocationsScheduled() {
    try {
      await synchronizeLocations();
    } catch (err) {
      log.warn({ err, nextSyncInSeconds: timeout / 1000 }, "failed to synchronize locations");
    }

    globalThis.setTimeout(() => synchronizeLocationsScheduled(), timeout);
  }

  synchronizeLocationsScheduled();
}

export async function locationsFindMany() {
  return await database()
    .selectFrom("location")
    .selectAll("location")
    .orderBy(["location.name asc", "location.regionOrg asc"])
    .execute();
}

export async function locationsGetForUser(userId: string) {
  return await database()
    .selectFrom("userLocation")
    .select(["userLocation.locationId", "userLocation.role"])
    .where("userLocation.userId", "=", userId)
    .execute();
}

export async function locationRequestsGetForUser(userId: string) {
  return await database()
    .selectFrom("locationRequest")
    .select(["locationRequest.locationId", "locationRequest.role", "locationRequest.timeRequested"])
    .where("locationRequest.userId", "=", userId)
    .execute();
}

export async function locationRequestsCreate(userId: string, item: LocationRequestsCreateSchema) {
  return await database()
    .insertInto("locationRequest")
    .values({
      locationId: item.locationId,
      role: item.role,
      userId,
    })
    .returning([
      "locationRequest.locationId",
      "locationRequest.role",
      "locationRequest.timeRequested",
    ])
    .executeTakeFirst();
}

export async function locationRequestsDelete(userId: string, role: string, locationId: string) {
  await database()
    .deleteFrom("locationRequest")
    .where("locationRequest.userId", "=", userId)
    .where("locationRequest.locationId", "=", locationId)
    .where("locationRequest.role", "=", role)
    .executeTakeFirst();
}

export async function locationRequestsGetForRoles(roles: string[]) {
  return await database()
    .selectFrom("locationRequest")
    .leftJoin("user", "locationRequest.userId", "user.id")
    .leftJoin("location", "locationRequest.locationId", "location.id")
    .selectAll("locationRequest")
    .select([
      "user.id as userId",
      "user.givenName as userGivenName",
      "user.surname as userSurname",
      "location.name as locationName",
    ])
    .where("locationRequest.role", "in", roles)
    .execute();
}

export async function locationRequestsPatch(user: User, item: LocationRequestsApprovalSchema) {
  if (item.some((it) => !user.isAdminOf(it.role))) {
    throw new Forbidden();
  }

  await database()
    .transaction()
    .execute(async (trx) => {
      let approved = item.filter((it) => it.action === "approve");
      if (approved.length > 0) {
        await trx
          .insertInto("userLocation")
          .values(
            approved.map((it) => ({
              userId: it.userId,
              locationId: it.locationId,
              role: it.role,
            })),
          )
          .onConflict((oc) => oc.constraint("user_location_pk").doNothing())
          .executeTakeFirst();
      }

      if (item.length > 0) {
        await trx
          .deleteFrom("locationRequest")
          .where(({ eb, tuple, refTuple }) =>
            eb(
              refTuple(
                "locationRequest.userId",
                "locationRequest.locationId",
                "locationRequest.role",
              ),
              "in",
              item.map((it) => tuple(it.userId, it.locationId, it.role)),
            ),
          )
          .executeTakeFirst();
      }
    });
}
