import { z } from "zod";

export let dispatchFilterSchema = z
  .object({
    createdAt: z
      .tuple([
        z.string().datetime().optional().nullable(),
        z.string().datetime().optional().nullable(),
      ])
      .optional(),
    locationId: z.array(z.string()).optional(),
    typeEnumId: z.array(z.coerce.number()).optional(),
    keyEnumId: z.array(z.coerce.number()).optional(),
  })
  .optional();

export let dispatchUpsertSchema = z.object({
  userTime: z.string().datetime({}),
  locationId: z.string(),
  typeEnumId: z.coerce.number(),
  keyEnumId: z.coerce.number(),
  description: z.string().optional().nullable(),
});

export type DispatchUpsertSchema = z.infer<typeof dispatchUpsertSchema>;
