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

export function formatNumber(num) {
  const absNum = Math.abs(num);
  if (absNum >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + "B";
  } else if (absNum >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  } else if (absNum >= 1_000) {
    return (num / 1_000).toFixed(1) + "K";
  } else {
    return num.toFixed(2);
  }
}
