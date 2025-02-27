import { z } from "zod";

export function inputNumberOptional() {
  return z.preprocess((value) => {
    if ((value as string) === "") {
      return null;
    }

    let numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return null;
    }

    return numeric;
  }, z.number().nullable());
}
