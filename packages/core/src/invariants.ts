export function assertNonEmptyString(
  value: unknown
): boolean {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

export function assertArray(
  value: unknown
): boolean {
  return Array.isArray(value);
}

function scanObject(
  value: unknown,
  forbiddenFields:
    readonly string[]
): boolean {

  if (
    typeof value !== "object" ||
    value === null
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(
      (item) =>
        scanObject(
          item,
          forbiddenFields
        )
    );
  }

  for (
    const [key, nested]
    of Object.entries(value)
  ) {

    if (
      forbiddenFields.includes(
        key
      )
    ) {
      return false;
    }

    if (
      !scanObject(
        nested,
        forbiddenFields
      )
    ) {
      return false;
    }
  }

  return true;
}

export function assertNoOperationalMetadata(
  payload: unknown,
  forbiddenFields:
    readonly string[]
): boolean {

  return scanObject(
    payload,
    forbiddenFields
  );
}