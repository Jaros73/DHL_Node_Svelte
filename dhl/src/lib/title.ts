const APP_NAME = "DHL";
const SEPARATOR = " | ";

export function title(...parts: string[]) {
  return parts.concat(APP_NAME).join(SEPARATOR);
}
