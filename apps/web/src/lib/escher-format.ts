/**
 * Escher maps are conventionally a two-element JSON array — `[metadata, content]` —
 * where both elements are objects. The actual schema validation happens inside
 * escher when the map is rendered; this cheap shape check just gates obvious
 * garbage on upload.
 */
export function isPlausibleEscherMap(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "object" &&
    value[0] !== null &&
    typeof value[1] === "object" &&
    value[1] !== null
  );
}
