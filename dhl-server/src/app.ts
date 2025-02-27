import cookieParser from "cookie-parser";
import express, { json } from "express";
import "express-async-errors";
import { authenticationRouter } from "./authentication/authentication-router";
import { coursesRouter } from "./courses/courses-router";
import { dispatchRouter } from "./dispatch/dispatch-router";
import { employeesRouter } from "./employees/employees-router";
import { enumsRouter } from "./enums/enums-router";
import { errorHandler } from "./error/error-handler";
import { notFoundHandler } from "./error/not-found-handler";
import { irregularCoursesRouter } from "./irregular-courses/irregular-courses-router";
import { locationsRouter } from "./locations/locations-router";
import { synchronizeLocationsScheduleStart } from "./locations/locations-service";
import { requestContextLogger } from "./logger";
import { machiningsRouter } from "./machinings/machinings-router";
import { regionalReportsRouter } from "./regional-reports/regional-reports-router";
import { remaindersRouter } from "./remainders/remainders-router";
import { authentication } from "./security/authentication";

export function createApp() {
  let app = express();
  app.disable("x-powered-by");

  app.use(json());
  app.use(cookieParser());

  app.use(requestContextLogger());
  app.use(authentication());

  app.use("/auth", authenticationRouter());
  app.use("/courses", coursesRouter());
  app.use("/dispatch", dispatchRouter());
  app.use("/employees", employeesRouter());
  app.use("/enums", enumsRouter());
  app.use("/irregular-courses", irregularCoursesRouter());
  app.use("/locations", locationsRouter());
  app.use("/machinings", machiningsRouter());
  app.use("/regional-reports", regionalReportsRouter());
  app.use("/remainders", remaindersRouter());

  app.use(notFoundHandler());
  app.use(errorHandler());

  synchronizeLocationsScheduleStart();

  return app;
}
