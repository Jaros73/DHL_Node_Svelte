import { Request } from "express";
import { z } from "zod";

let dateTimeRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export type DateTimeRange = z.infer<typeof dateTimeRangeSchema>;

export async function dateTimeRangeFromRequest(req: Request) {
  let range = await dateTimeRangeSchema.parseAsync(req.query);

  return range;
}
