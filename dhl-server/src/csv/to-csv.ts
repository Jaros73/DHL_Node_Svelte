import { Buffer } from "node:buffer";
import { EOL } from "node:os";
import { DateTime } from "luxon";

export function csvExportFilename(prefix: string) {
  let timestamp = DateTime.local()
    .toISO({ includeOffset: false, suppressMilliseconds: true })
    .replaceAll("-", "_");

  return `${prefix}_${timestamp}.csv`;
}

export async function toCsvBuffer<T extends Record<string, unknown>>(
  values: T[],
  headers?: [header: keyof T, alias?: string][],
) {
  let [first] = values;
  if (!first || values.length === 0) {
    return;
  }

  let derivedHeader =
    headers?.map(([header, alias]) => [header, alias ?? header] as [keyof T, string]) ??
    Object.keys(first).map((it) => [it, it] as [keyof T, string]);

  let rows = values.map((row) =>
    derivedHeader
      .map(([header]) => {
        let value = row[header];

        if (value instanceof Date) {
          return value.toISOString();
        }

        if (typeof value === "string") {
          return `"${value.replaceAll(`"`, `""`)}"`;
        }

        return value;
      })
      .join(","),
  );

  let result = [derivedHeader.map(([, alias]) => alias).join(","), ...rows].join(EOL);
  return Buffer.from(result, "utf-8");
}
