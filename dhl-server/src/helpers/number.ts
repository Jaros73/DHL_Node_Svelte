export class ConversionError extends Error {}

export function toNumber(value: string) {
  let res = globalThis.parseInt(value, 10);
  if (Number.isNaN(res)) {
    throw new ConversionError();
  }

  return res;
}
