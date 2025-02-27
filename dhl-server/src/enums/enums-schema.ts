import { z } from "zod";

export let enumValuesCreateSchema = z.object({
  name: z
    .string()
    .transform((it) => it.trim())
    .refine((it) => it.length > 0, { message: "Must be non-empty string" }),
});

export type EnumValuesCreateSchema = z.infer<typeof enumValuesCreateSchema>;

export let enumValuesUpdateSchema = enumValuesCreateSchema.extend({
  enabled: z.boolean(),
});

export type EnumValuesUpdateSchema = z.infer<typeof enumValuesUpdateSchema>;
