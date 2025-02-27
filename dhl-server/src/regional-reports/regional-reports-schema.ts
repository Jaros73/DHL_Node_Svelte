import { z } from "zod";

function emptyStringToNull(value: string | null | undefined) {
  if (value == null) {
    return value;
  }

  return value.trim() === "" ? null : value;
}

export let regionalReportsFilterSchema = z
  .object({
    createdAt: z
      .tuple([
        z.string().datetime().optional().nullable(),
        z.string().datetime().optional().nullable(),
      ])
      .optional(),
    locationId: z.array(z.string()).optional(),
    category: z.array(z.string()).optional(),
    network: z.array(z.string()).optional(),
    attachment: z.array(z.string()).optional(),
  })
  .optional();

export let regionalReportsUpsertSchema = z.object({
  dateFor: z.string(),
  category: z.string(),
  network: z.string(),
  locationId: z.string(),
  description: z.string(),
  actionTaken: z.string().nullish().transform(emptyStringToNull),
  courseCode: z.string().nullish().transform(emptyStringToNull),
  coursePlannedArrival: z.string().nullish().transform(emptyStringToNull),
  courseRealArrival: z.string().nullish().transform(emptyStringToNull),
  courseDelayEnumId: z.coerce.number().nullish(),
  note: z.string().nullish().transform(emptyStringToNull),
});

export type RegionalReportsUpsertSchema = z.infer<typeof regionalReportsUpsertSchema>;
