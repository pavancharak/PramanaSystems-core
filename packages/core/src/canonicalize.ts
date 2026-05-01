function sortKeys(value: any): any {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortKeys(value[key]);
        return acc;
      }, {} as Record<string, unknown>);
  }

  return value;
}

export function canonicalize(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}