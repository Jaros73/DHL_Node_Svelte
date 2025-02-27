import { Response } from "express";
import { Logger } from "./logger";
import { User } from "./security/user";

interface Context {
  logger: Logger;
  user: User;
}

export function context(res: Response): Context {
  return res.locals as Context;
}
