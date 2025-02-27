import { z } from "zod";
import { inputNumberOptional } from "../schemas/input-number";

function emptyStringToNull(value: string | null | undefined) {
  if (value == null) {
    return value;
  }

  return value.trim() === "" ? null : value;
}

export let coursesFilterSchema = z
  .object({
    createdAt: z
      .tuple([
        z.string().datetime().optional().nullable(),
        z.string().datetime().optional().nullable(),
      ])
      .optional(),
    locationId: z.array(z.string()).optional(),
    network: z.array(z.string()).optional(),
    departureDelay: z.array(z.string()).optional(),
    arrivalDelay: z.array(z.string()).optional(),
  })
  .optional();

export let coursesUpsertSchema = z
  .object({
    locationId: z.string(),
    courseCode: z.string(),
    departureDate: z.string(),
    network: z.string(),
    transporterEnumId: z.coerce.number(),
    seals: z.string().nullish().transform(emptyStringToNull),
    departurePlannedTime: z.string().nullish().transform(emptyStringToNull),
    departureRealTime: z.string().nullish().transform(emptyStringToNull),
    departureDelayReasonEnumId: z.coerce.number().nullish().default(null),
    departureNote: z.string().nullish().transform(emptyStringToNull),
    departureLoad: inputNumberOptional().default(null),
    departureOther: z.string().nullish().transform(emptyStringToNull),
    departureLoads: z
      .array(
        z.object({
          technologicalGroup: z.string(),
          amount: inputNumberOptional().default(null),
          note: z.string().nullish().transform(emptyStringToNull),
        }),
      )
      .optional(),
    departureCrates: z
      .array(
        z.object({
          technologicalGroup: z.string(),
          crate: z.string(),
          amount: z.coerce.number(),
        }),
      )
      .optional(),
    arrivalPlannedTime: z.string().nullish().transform(emptyStringToNull),
    arrivalRealTime: z.string().nullish().transform(emptyStringToNull),
    arrivalDelayReasonEnumId: z.coerce.number().nullish().default(null),
    arrivalNote: z.string().nullish().transform(emptyStringToNull),
    arrivalLoad: inputNumberOptional().default(null),
    arrivalOther: z.string().nullish().transform(emptyStringToNull),
    arrivalLoads: z
      .array(
        z.object({
          technologicalGroup: z.string(),
          amount: inputNumberOptional().default(null),
          note: z.string().nullish().transform(emptyStringToNull),
        }),
      )
      .optional(),
    arrivalCrates: z
      .array(
        z.object({
          technologicalGroup: z.string(),
          crate: z.string(),
          amount: z.coerce.number(),
        }),
      )
      .optional(),
  })
  .passthrough();

export type CoursesUpsertSchema = z.infer<typeof coursesUpsertSchema>;

let numeric = /^\d*(?:\.|,)?\d+$/i;

export function mapCoursesUpserSchemaFromForm(data: CoursesUpsertSchema): CoursesUpsertSchema {
  data.departureLoads ??= [];
  data.departureCrates ??= [];
  data.arrivalLoads ??= [];
  data.arrivalCrates ??= [];

  let departureLoads = new Map<
    string,
    { technologicalGroup: string; amount: number | null; note: string | null }
  >();
  let arrivalLoads = new Map<
    string,
    { technologicalGroup: string; amount: number | null; note: string | null }
  >();

  for (let [key, value] of Object.entries(data)) {
    if (key.startsWith("departure-")) {
      let strippedKey = key.replace("departure-", "");

      if (strippedKey.startsWith("load-")) {
        let technologicalGroup = strippedKey.replace("load-amount-", "").replace("load-note-", "");
        let amount = data[`departure-load-amount-${technologicalGroup}`] as string;
        let note = data[`departure-load-note-${technologicalGroup}`];

        if ((amount && numeric.test(amount)) || note) {
          departureLoads.set(technologicalGroup, {
            technologicalGroup,
            amount: amount ? Number(amount) : null,
            note: note ? (note as string) : null,
          });
        }

        continue;
      }

      if (strippedKey.startsWith("crate-") && value) {
        let [technologicalGroup, crate] = strippedKey.replace("crate-amount-", "").split(":");
        if (technologicalGroup && crate) {
          data.departureCrates.push({ technologicalGroup, crate, amount: Number(value) });
        }
      }

      continue;
    }

    if (key.startsWith("arrival-")) {
      let strippedKey = key.replace("arrival-", "");

      if (strippedKey.startsWith("load-amount-")) {
        let technologicalGroup = key.replace("load-amount-", "").replace("load-note-", "");
        let amount = data[`arrival-load-amount-${technologicalGroup}`] as string;
        let note = data[`arrival-load-note-${technologicalGroup}`];

        if ((amount && numeric.test(amount)) || note) {
          arrivalLoads.set(technologicalGroup, {
            technologicalGroup,
            amount: amount ? Number(amount) : null,
            note: note ? (note as string) : null,
          });
        }

        continue;
      }

      if (strippedKey.startsWith("crate-") && value && numeric.test(value as string)) {
        let [technologicalGroup, crate] = strippedKey.replace("crate-amount-", "").split(":");
        if (technologicalGroup && crate) {
          data.arrivalCrates.push({ technologicalGroup, crate, amount: Number(value) });
        }

        continue;
      }
    }
  }

  data.departureLoads = [...departureLoads.values()];
  data.arrivalLoads = [...arrivalLoads.values()];

  return data;
}
