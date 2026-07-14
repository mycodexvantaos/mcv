/**
 * MyCodexVantaOS — Pagination Types
 * Cursor-based and offset-based pagination.
 */

export interface PaginationRequest {
  limit?: number;
  cursor?: string;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
  limit: number;
}

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;
