import { DateTime } from "luxon";

const DATE_INPUT_FORMAT = "yyyy-MM-dd";
const TIME_INPUT_FORMAT = "HH:mm";
const DATETIME_INPUT_FORMAT = `${DATE_INPUT_FORMAT}'T'${TIME_INPUT_FORMAT}`;

export function formatDate(value?: string | null | undefined) {
  return value ? DateTime.fromISO(value).setLocale("cs-CZ").toLocaleString(DateTime.DATE_SHORT) : undefined;
}

export function formatTime(value?: string | null | undefined) {
  return value ? DateTime.fromISO(value).setLocale("cs-CZ").toLocaleString(DateTime.TIME_SIMPLE) : undefined;
}

export function formatDateTime(value?: string | null | undefined) {
  return value ? DateTime.fromISO(value).setLocale("cs-CZ").toLocaleString(DateTime.DATETIME_SHORT) : undefined;
}

export function formatDateInput(value?: string | null | undefined) {
  return value ? DateTime.fromISO(value).toFormat(DATE_INPUT_FORMAT) : undefined;
}

export function inputDateToISO(value?: string | null | undefined) {
  return value ? DateTime.fromFormat(value, DATE_INPUT_FORMAT).toUTC().toISO() : undefined;
}

export function formatDateTimeInput(value?: string | null | undefined) {
  return value ? DateTime.fromISO(value).toFormat(DATETIME_INPUT_FORMAT) : undefined;
}

export function inputDateTimeToISO(value?: string | null | undefined) {
  return value ? DateTime.fromFormat(value, DATETIME_INPUT_FORMAT).toUTC().toISO() : undefined;
}

export let numeric = /^\d*(?:\.|,)?\d+$/i;
