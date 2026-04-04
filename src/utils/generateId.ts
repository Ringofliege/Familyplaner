let fallbackCounter = 0;

export function generateId(prefix: string) {
  fallbackCounter = (fallbackCounter + 1) % Number.MAX_SAFE_INTEGER;
  const uniquePart =
    globalThis.crypto?.randomUUID?.().slice(0, 8) ??
    `${Date.now().toString(36)}-${fallbackCounter.toString(36)}`;
  return `${prefix}-${Date.now()}-${uniquePart}`;
}
