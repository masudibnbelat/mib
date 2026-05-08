// utility/constants.ts
export const ITEMS_PER_PAGE = 6;
export const STALE_TIME = 1000 * 60 * 5; // 5 minutes
export const MAX_COMMENT_LENGTH = 1000;
export const DEBOUNCE_DELAY = 300;

export const QUERY_KEYS = {
  ARTICLES: (category: string) => ["articles", category] as const,
  ARTICLE: (identifier: string) => ["article", identifier] as const,
  COMMENTS: (identifier: string) => ["comments", identifier] as const,
  CATEGORIES: ["categories"] as const, // ✅ Add this
} as const;
