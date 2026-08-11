/** Joins conditional class names. Deliberately tiny — no runtime merge logic. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
