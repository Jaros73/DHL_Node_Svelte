import { z } from "zod";

export let locationRequestsCreateSchema = z.object({
  locationId: z.string(),
  role: z.string(),
});

export type LocationRequestsCreateSchema = z.infer<typeof locationRequestsCreateSchema>;

export let locationRequestsApprovalSchema = z.array(
  z.object({
    userId: z.string(),
    locationId: z.string(),
    role: z.string(),
    action: z.enum(["approve", "reject"]),
  }),
);

export type LocationRequestsApprovalSchema = z.infer<typeof locationRequestsApprovalSchema>;
