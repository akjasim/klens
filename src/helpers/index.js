export function convertESData(
  hits,
  { yearField = "zeitbezug", valueField = "wert" } = {}
) {
  if (!Array.isArray(hits)) return [];

  return hits
    .map((h) => h._source)
    .filter((s) => s && s[yearField] && s[valueField])
    .map((s) => ({
      year: Number(s[yearField]),
      value: Number(s[valueField]),
    }))
    .sort((a, b) => a.year - b.year);
}
