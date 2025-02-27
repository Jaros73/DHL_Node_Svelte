import { z } from "zod";

export let remaindersFilterSchema = z
  .object({
    createdAt: z.tuple([
      z.string().datetime().optional().nullable().default(null),
      z.string().datetime().optional().nullable().default(null),
    ]),
    locationId: z.array(z.string()).optional(),
    network: z.array(z.string()).optional(),
    kind: z.array(z.string()).optional(),
    technologicalGroup: z.array(z.string()).optional(),
  })
  .optional();

export let remaindersUpsertSchema = z.object({
  locationId: z.string(),
  dateFor: z.string().date(),
  network: z.string(),
  kind: z.string(),
  technologicalGroup: z.string(),
  amount: z.coerce.number(),
  crates: z.array(
    z.object({
      crate: z.string(),
      amount: z.coerce.number(),
    }),
  ),
  note: z.string().nullish().default(null),
});

export type RemaindersUpsertSchema = z.infer<typeof remaindersUpsertSchema>;
