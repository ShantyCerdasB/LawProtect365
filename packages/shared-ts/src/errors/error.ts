
export function normalizeError(input: unknown): Error {
  if (input instanceof Error) return input;
  try {
    return new Error(typeof input === 'string' ? input : JSON.stringify(input));
  } catch {
    return new Error(String(input));
  }
}

export function rethrow(input: unknown): never {
  throw normalizeError(input);
}

/**
 * Ejecuta una promesa y suprime errores con .catch(() => undefined),
 * evitando bloques catch vacíos en el código llamador.
 */
export function fireAndForget<T>(p: Promise<T>): void {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  p.catch(() => undefined);
}
