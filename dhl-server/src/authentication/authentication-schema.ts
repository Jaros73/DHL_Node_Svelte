import { z } from "zod";

export let authenticationExchangeCodeSchema = z.object({
  code: z.string().nullish(),
});
