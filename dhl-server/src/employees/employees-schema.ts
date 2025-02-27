import { z } from "zod";

export let employeesSetLocationsSchema = z.record(
  z.enum(["add", "remove"]),
  z.array(
    z.object({
      id: z.string(),
      role: z.string(),
    }),
  ),
);

export type EmployeesSetLocationsSchema = z.infer<typeof employeesSetLocationsSchema>;
