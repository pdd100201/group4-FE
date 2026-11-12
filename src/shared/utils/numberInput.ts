/** Preserve an empty draft and decimal zeroes while removing redundant integer prefixes. */
export function normalizeNumberInput(value: string): string {
  return value.replace(/^(-?)0+(?=\d)/, '$1')
}
