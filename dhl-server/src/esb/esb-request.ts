import { Buffer } from "node:buffer";
import { IncomingHttpHeaders, OutgoingHttpHeaders } from "node:http";
import { request } from "node:https";
import { StatusCodes } from "http-status-codes";
import { ESB_PASSWORD, ESB_USERNAME } from "../config";

const CREDENTIALS = Buffer.from(`${ESB_USERNAME}:${ESB_PASSWORD}`, "utf-8").toString("base64");

interface EsbRequest {
  method?: string;
  headers?: OutgoingHttpHeaders;
  body?: string;
}

interface EsbResponse {
  statusCode: StatusCodes;
  headers: IncomingHttpHeaders;
  body: string;
}

export function esbRequest(url: string | URL, options: EsbRequest = {}) {
  return new Promise<EsbResponse>((resolve, reject) => {
    let req = request(
      url,
      {
        method: options.method ?? "GET",
        headers: {
          authorization: `Basic ${CREDENTIALS}`,
          ...(options.body ? { "content-length": options.body.length } : undefined),
          ...options.headers,
        },
        rejectUnauthorized: false,
      },
      (res) => {
        res.on("error", (err) => reject(err));

        let responseBody = "";
        res.on("data", (chunk) => {
          responseBody += chunk;
        });

        res.on("end", () => {
          resolve({
            statusCode: res.statusCode ?? 0,
            headers: res.headers,
            body: responseBody,
          });
        });
      },
    );

    req.on("error", (err) => reject(err));

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}
