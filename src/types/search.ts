/**
 * Search-related type definitions
 */

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'architecture' | 'architect' | 'location' | 'category' | 'recent' | 'popular';
  count: number;
  icon: string;
  highlight?: string;
  relevanceScore?: number;
}

export interface CategorySuggestion {
  name: string;
  count: number;
  subcategories?: string[];
}

export interface RecentSearch {
  query: string;
  timestamp: number;
  resultCount: number;
}

export interface PopularSearch {
  query: string;
  searchCount: number;
  trend: 'rising' | 'stable' | 'declining';
}

export interface SearchResult {
  architectures: any[];
  architects: any[];
  prefectures: any[];
  categories: any[];
}

export interface AutocompleteResult {
  suggestions: SearchSuggestion[];
  categories: CategorySuggestion[];
  recent: RecentSearch[];
  popular: PopularSearch[];
  total: number;
}

export interface SearchFilters {
  query?: string;
  prefecture?: string[];
  architect?: string[];
  category?: string[];
  yearRange?: [number, number];
  style?: string[];
  materials?: string[];
  features?: string[];
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'year' | 'name' | 'architect';
  sortOrder?: 'asc' | 'desc';
  includeImages?: boolean;
  includeDetails?: boolean;
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  pages: number;
  currentPage: number;
  hasMore: boolean;
  searchTime: number;
  facets?: SearchFacets;
}

export interface SearchFacets {
  prefectures: FacetCount[];
  architects: FacetCount[];
  decades: FacetCount[];
  categories: FacetCount[];
  materials: FacetCount[];
  styles: FacetCount[];
  yearRange: RangeFacet;
  popular: FacetCount[];
}

export interface FacetCount {
  value: string;
  label?: string;
  count: number;
  selected: boolean;
}

export interface RangeFacet {
  min: number;
  max: number;
  selectedMin: number;
  selectedMax: number;
  step?: number;
  unit?: string;
}

export interface ActiveFacets {
  [key: string]: string[] | [number, number];
}

export interface SearchState {
  query: string;
  filters: SearchFilters;
  results: any[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  page: number;
}

export interface SearchAnalytics {
  query: string;
  timestamp: number;
  resultCount: number;
  clickedResult?: string;
  searchTime: number;
  userAgent: string;
  location?: {
    country?: string;
    region?: string;
  };
}