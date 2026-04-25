export function newId(prefix: string): string {
  // Compact, stable id without external deps.
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36)}`;
}

