export const buildQuery = (params: Record<string, any>): string => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value
        .filter(item => item !== null && item !== undefined)
        .forEach(item => query.append(key, String(item).trim()));
      return;
    }

    query.append(key, typeof value === 'string' ? value.trim() : String(value));
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
};
