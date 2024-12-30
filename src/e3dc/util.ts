
export type Objectified<T extends Record<string, unknown[]>> = {
  [K in keyof T]: T[K][number];
};

export function objectify<T extends Record<string, unknown[]>>(
  data: T,
): Objectified<T>[] {
  const keys = Object.keys(data) as Array<keyof T>;
  const length = data[keys[0]].length;

  return Array.from({ length }, (_, i) => {
    return keys.reduce((obj, key) => {
      obj[key] = data[key][i];
      return obj;
    }, {} as { [K in keyof T]: T[K][number] });
  });
}
