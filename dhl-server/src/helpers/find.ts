import { Request } from "express";
import { PAGE_ROWS } from "../config";

export type Find = {
  limit?: number | undefined;
  offset?: number | undefined;
  search?: string | undefined;
  filter?: Record<string, unknown> | undefined;
};

function parseCursor(cursor: string | undefined) {
  let offset = Number(cursor);
  return Number.isNaN(offset) ? 0 : offset;
}

function parseSort(sort: string | undefined) {
  let [sortBy, order] = sort?.split(";") ?? [];

  return {
    sortBy,
    sortOrder: ["asc", "desc"].includes(order ?? "") ? (order as "asc" | "desc") : undefined,
  };
}

function parseFilter(filter: string | undefined) {
  if (!filter) {
    return undefined;
  }

  try {
    return JSON.parse(filter);
  } catch {
    return undefined;
  }
}

export function findFromRequest(req: Request): Find {
  let { cursor, search, sort, filter } = req.query as Record<string, string>;

  return {
    search,
    ...parseSort(sort),
    limit: PAGE_ROWS,
    offset: parseCursor(cursor),
    filter: parseFilter(filter),
  };
}
