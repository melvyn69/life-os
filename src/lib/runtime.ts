export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readString(value: unknown, field: string) {
  if (typeof value !== "string") {
    throw new Error(`Invalid ${field}.`);
  }
  return value;
}

export function readNullableString(value: unknown, field: string): string | null {
  if (value === null) {
    return null;
  }
  return readString(value, field);
}

export function readBoolean(value: unknown, field: string) {
  if (typeof value !== "boolean") {
    throw new Error(`Invalid ${field}.`);
  }
  return value;
}

export function readNumber(value: unknown, field: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid ${field}.`);
  }
  return value;
}

export function readStringArray(value: unknown, field: string) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Invalid ${field}.`);
  }
  return value.filter((item): item is string => typeof item === "string");
}
