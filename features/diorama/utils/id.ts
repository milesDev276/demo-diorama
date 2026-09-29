/** Shared ID generator — used for objects, scenes, and re-keying invalid imports. */
export function createId(prefix = "obj"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
