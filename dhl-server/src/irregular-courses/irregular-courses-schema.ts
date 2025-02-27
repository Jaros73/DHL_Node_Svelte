import { z } from "zod";
import { inputNumberOptional } from "../schemas/input-number";

export let irregularCoursesFilterSchema = z
  .object({
    createdAt: z.tuple([
      z.string().datetime().optional().nullable().default(null),
      z.string().datetime().optional().nullable().default(null),
    ]),
    locationId: z.array(z.string()).optional(),
    network: z.array(z.string()).optional(),
    load: z.array(z.enum(["empty", "filled"])).optional(),
  })
  .optional();

export let irregularCoursesUpsertSchema = z.object({
  locationId: z.string(),
  initialStop: z.string(),
  initialStopDate: z.string(),
  initialStopTime: z.string(),
  finalStop: z.string(),
  finalStopDate: z.string(),
  finalStopTime: z.string(),
  network: z.enum(["hps", "obps", "ups"]),
  transporter: z.string(),
  vehiclePlate: z.string(),
  trailerPlate: z.string().optional(),
  distance: inputNumberOptional().default(null),
  note: z.string().optional(),
  otherLoad: z.string().optional(),
  load: inputNumberOptional().default(null),
  stops: z.array(z.string()),
  loads: z.array(
    z.object({
      technologicalGroup: z.string(),
      amount: inputNumberOptional().default(null),
      note: z.string().nullish().default(null),
    }),
  ),
  crates: z.array(
    z.object({
      technologicalGroup: z.string(),
      crate: z.string(),
      amount: z.coerce.number(),
    }),
  ),
});

export type IrregularCoursesUpsertSchema = z.infer<typeof irregularCoursesUpsertSchema>;
