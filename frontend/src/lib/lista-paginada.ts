export type ListaPaginada<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export function extrairListaPaginada<T>(json: unknown): ListaPaginada<T> {
  if (Array.isArray(json)) {
    return { items: json as T[], total: json.length, page: 1, limit: json.length || 20 };
  }
  if (json && typeof json === 'object') {
    const raw = json as Partial<ListaPaginada<T>>;
    if (Array.isArray(raw.items)) {
      return {
        items: raw.items,
        total: typeof raw.total === 'number' ? raw.total : raw.items.length,
        page: typeof raw.page === 'number' ? raw.page : 1,
        limit: typeof raw.limit === 'number' ? raw.limit : 20,
      };
    }
  }
  return { items: [], total: 0, page: 1, limit: 20 };
}
