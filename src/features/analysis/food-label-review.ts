export function isUserCorrected(original: string | number | null, current: string): boolean {
  const sourceValue = original === null ? "" : String(original);
  return current !== sourceValue;
}
