import { z } from "zod";

export let machiningsFilterSchema = z
  .object({
    dateFor: z.tuple([
      z.string().datetime().optional().nullable(),
      z.string().datetime().optional().nullable(),
    ]),
    locationId: z.array(z.string()).optional(),
  })
  .optional();

export let machiningsCreateSchema = z.object({
  dateFor: z.string().date(),
  locationId: z.string(),
});

export type MachiningsCreateSchema = z.infer<typeof machiningsCreateSchema>;

export let machiningsUpdateSchema = z.array(
  z.object({
    machine: z.string(),
    value: z.string().optional().nullable(),
    note: z.string().optional().nullable(),
  }),
);

export type MachiningsUpdateSchema = z.infer<typeof machiningsUpdateSchema>;
