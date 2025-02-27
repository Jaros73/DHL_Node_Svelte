import { database } from "../database";
import { Find } from "../helpers/find";
import { User } from "../security/user";
import { EnumValuesCreateSchema, EnumValuesUpdateSchema } from "./enums-schema";

export enum EnumKey {
  Key = "klic",
  DelayReason = "pricina-zpozdeni",
  DispatchType = "type",
  Transporter = "transporter",
  Stop = "stop",
  VehiclePlate = "vehicle-plate",
  TrailerPlate = "trailer-plate",
}

const EDITABLE_ENUMS: string[] = [
  EnumKey.Key,
  EnumKey.DelayReason,
  EnumKey.Transporter,
  EnumKey.Stop,
  EnumKey.VehiclePlate,
  EnumKey.TrailerPlate,
];

export function enumsGetEditableKeys() {
  return EDITABLE_ENUMS;
}

export function enumsIsEditable(key: string) {
  return EDITABLE_ENUMS.includes(key);
}

export async function enumValuesFindMany(key: string, find: Find) {
  let query = database()
    .selectFrom("enumValue")
    .leftJoin("user as creator", "createdBy", "creator.id")
    .leftJoin("user as updater", "updatedBy", "updater.id")
    .selectAll("enumValue")
    .select(["creator.fullName as createdBy", "updater.fullName as updatedBy"])
    .orderBy("enumValue.name", "asc")
    .where("enumValue.key", "=", key);

  if (find.search) {
    query = query.where(({ eb, fn, ref, val }) =>
      eb(
        fn("unaccent", [ref("enumValue.name")]),
        "ilike",
        fn("unaccent", [val(`%${find.search}%`)]),
      ),
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

export async function enumValuesGetOne(key: string, id: number) {
  return await database()
    .selectFrom("enumValue")
    .leftJoin("user as creator", "createdBy", "creator.id")
    .leftJoin("user as updater", "updatedBy", "updater.id")
    .selectAll("enumValue")
    .select(["creator.fullName as createdBy", "updater.fullName as updatedBy"])
    .where("enumValue.key", "=", key)
    .where("enumValue.id", "=", id)
    .executeTakeFirst();
}

export async function enumValuesCreate(user: User, key: string, item: EnumValuesCreateSchema) {
  let { id } = await database()
    .insertInto("enumValue")
    .values({
      createdBy: user.id,
      key,
      ...item,
    })
    .returning("enumValue.id")
    .executeTakeFirstOrThrow();

  return await enumValuesGetOne(key, id);
}

export async function enumValuesUpdate(
  user: User,
  key: string,
  id: number,
  item: EnumValuesUpdateSchema,
) {
  await database()
    .updateTable("enumValue")
    .set({
      updatedBy: user.id,
      updatedAt: new Date(),
      ...item,
    })
    .where("enumValue.key", "=", key)
    .where("enumValue.id", "=", id)
    .executeTakeFirst();

  return await enumValuesGetOne(key, id);
}

export async function enumValuesDelete(key: string, id: number) {
  await database()
    .deleteFrom("enumValue")
    .where("enumValue.key", "=", key)
    .where("enumValue.id", "=", id)
    .executeTakeFirst();
}
