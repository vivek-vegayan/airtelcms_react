export const deepSearch = (obj: any, query: string): boolean => {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const visited = new Set();

  const _search = (value: any): boolean => {
    if (value == null) return false;
    if (typeof value === "object") {
      if (visited.has(value)) return false;
      visited.add(value);
      if (Array.isArray(value)) {
        return value.some((v) => _search(v));
      }
      return Object.values(value).some((v) => _search(v));
    }
    try {
      return String(value).toLowerCase().includes(q);
    } catch {
      return false;
    }
  };

  return _search(obj);
};