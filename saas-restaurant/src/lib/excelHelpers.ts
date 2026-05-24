export function getVal(item: Record<string, string | number | undefined>, keys: string[], fallback = '-'): string {
  const normalized: Record<string, string | number | undefined> = {};
  Object.keys(item).forEach(k => {
    normalized[k.trim().toLowerCase()] = item[k];
  });
  for (const k of keys) {
    const val = normalized[k.toLowerCase().trim()];
    if (val !== undefined && val !== null && val !== '') return String(val);
  }
  return fallback;
}

export function findValue(row: Record<string, string | number | undefined>, keywords: string[]): string {
  const key = Object.keys(row).find(k =>
    keywords.some(keyword => k.toLowerCase().includes(keyword))
  );
  const val = key ? row[key] : '';
  return val !== undefined && val !== null && val !== '' ? String(val) : '';
}
