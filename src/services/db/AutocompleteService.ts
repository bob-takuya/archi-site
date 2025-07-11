/**
 * AutocompleteService - Intelligent search suggestions and autocomplete functionality
 * Provides fast, relevant search suggestions across multiple data types
 */

import { executeQuery } from './DatabaseLoader';
import { getCachedQuery, generateCacheKey } from './DatabaseCache';
import type { Architecture } from '../../types/architecture';
import type { Architect } from '../../types/architect';

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

export interface AutocompleteResult {
  suggestions: SearchSuggestion[];
  categories: CategorySuggestion[];
  recent: RecentSearch[];
  popular: PopularSearch[];
  total: number;
}

interface SearchIndex {
  architectures: Map<string, SearchSuggestion>;
  architects: Map<string, SearchSuggestion>;
  locations: Map<string, SearchSuggestion>;
  categories: Map<string, SearchSuggestion>;
  keywords: Map<string, SearchSuggestion[]>;
}

export class AutocompleteService {
  private static instance: AutocompleteService;
  private searchIndex: SearchIndex = {
    architectures: new Map(),
    architects: new Map(),
    locations: new Map(),
    categories: new Map(),
    keywords: new Map()
  };
  private isIndexBuilt = false;
  private recentSearches: RecentSearch[] = [];
  private popularSearches: PopularSearch[] = [];
  private readonly RECENT_SEARCHES_KEY = 'recent-searches';
  private readonly MAX_RECENT_SEARCHES = 20;
  
  constructor() {
    this.loadRecentSearches();
    this.initializePopularSearches();
  }
  
  static getInstance(): AutocompleteService {
    if (!AutocompleteService.instance) {
      AutocompleteService.instance = new AutocompleteService();
    }
    return AutocompleteService.instance;
  }
  
  /**
   * Get autocomplete results for a given query
   */
  async getAutocompleteResults(
    query: string,
    limit = 10
  ): Promise<AutocompleteResult> {
    if (!query || query.trim() === '') {
      return {
        suggestions: [],
        categories: [],
        recent: this.recentSearches.slice(0, 5),
        popular: this.popularSearches.slice(0, 5),
        total: 0
      };
    }
    
    // Ensure search index is built
    if (!this.isIndexBuilt) {
      await this.buildSearchIndex();
    }
    
    const normalizedQuery = this.normalizeQuery(query);
    const cacheKey = `autocomplete:${normalizedQuery}:${limit}`;
    
    return getCachedQuery<AutocompleteResult>(
      cacheKey,
      async () => {
        const suggestions = await this.generateSuggestions(normalizedQuery, limit);
        const categories = await this.getCategorySuggestions(normalizedQuery);
        
        return {
          suggestions,
          categories,
          recent: this.getRecentSuggestions(normalizedQuery),
          popular: this.getPopularSuggestions(normalizedQuery),
          total: suggestions.length
        };
      },
      30000 // Cache for 30 seconds
    );
  }
  
  /**
   * Build comprehensive search index for fast autocomplete
   */
  async buildSearchIndex(): Promise<void> {
    console.log('Building autocomplete search index...');
    
    try {
      // Build architecture index
      await this.indexArchitectures();
      
      // Build architect index
      await this.indexArchitects();
      
      // Build location index
      await this.indexLocations();
      
      // Build category index
      await this.indexCategories();
      
      // Build keyword mappings
      await this.buildKeywordMappings();
      
      this.isIndexBuilt = true;
      console.log('Search index built successfully');
    } catch (error) {
      console.error('Failed to build search index:', error);
      throw error;
    }
  }
  
  /**
   * Index architecture names with readings and variations
   */
  private async indexArchitectures(): Promise<void> {
    const architectures = await executeQuery<{
      id: number;
      name: string;
      architectName: string;
      prefecture: string;
      category: string;
    }>(`
      SELECT 
        Z_PK as id,
        ZAR_TITLE as name,
        ZAR_ARCHITECT as architectName,
        ZAR_PREFECTURE as prefecture,
        ZAR_CATEGORY as category
      FROM ZCDARCHITECTURE
      WHERE ZAR_TITLE IS NOT NULL 
        AND ZAR_TITLE != ''
        AND ZAR_TAG NOT LIKE '%の追加建築%'
      ORDER BY ZAR_TITLE
    `, [], false);
    
    const nameCountMap = new Map<string, number>();
    
    // Count occurrences for relevance scoring
    architectures.forEach(arch => {
      const count = nameCountMap.get(arch.name) || 0;
      nameCountMap.set(arch.name, count + 1);
    });
    
    architectures.forEach(arch => {
      const suggestion: SearchSuggestion = {
        id: `arch-${arch.id}`,
        text: arch.name,
        type: 'architecture',
        count: nameCountMap.get(arch.name) || 1,
        icon: 'architecture',
        relevanceScore: this.calculateRelevanceScore(arch.name, 'architecture')
      };
      
      this.searchIndex.architectures.set(arch.name.toLowerCase(), suggestion);
      
      // Add variations and partial matches
      this.addSearchVariations(arch.name, suggestion);
    });
  }
  
  /**
   * Index architect names
   */
  private async indexArchitects(): Promise<void> {
    const architects = await executeQuery<{
      id: number;
      name: string;
      office: string;
    }>(`
      SELECT DISTINCT
        Z_PK as id,
        ZAT_ARCHITECT as name,
        ZAT_OFFICE as office
      FROM ZCDARCHITECT
      WHERE ZAT_ARCHITECT IS NOT NULL 
        AND ZAT_ARCHITECT != ''
      ORDER BY ZAT_ARCHITECT
    `, [], false);
    
    architects.forEach(architect => {
      const suggestion: SearchSuggestion = {
        id: `architect-${architect.id}`,
        text: architect.name,
        type: 'architect',
        count: 1,
        icon: 'person',
        relevanceScore: this.calculateRelevanceScore(architect.name, 'architect')
      };
      
      this.searchIndex.architects.set(architect.name.toLowerCase(), suggestion);
      
      // Add office name if different
      if (architect.office && architect.office !== architect.name) {
        const officeSuggestion: SearchSuggestion = {
          id: `office-${architect.id}`,
          text: architect.office,
          type: 'architect',
          count: 1,
          icon: 'business',
          relevanceScore: this.calculateRelevanceScore(architect.office, 'architect')
        };
        
        this.searchIndex.architects.set(architect.office.toLowerCase(), officeSuggestion);
        this.addSearchVariations(architect.office, officeSuggestion);
      }
      
      this.addSearchVariations(architect.name, suggestion);
    });
  }
  
  /**
   * Index location names (prefectures and addresses)
   */
  private async indexLocations(): Promise<void> {
    const locations = await executeQuery<{
      prefecture: string;
      count: number;
    }>(`
      SELECT 
        ZAR_PREFECTURE as prefecture,
        COUNT(*) as count
      FROM ZCDARCHITECTURE
      WHERE ZAR_PREFECTURE IS NOT NULL 
        AND ZAR_PREFECTURE != ''
        AND ZAR_TAG NOT LIKE '%の追加建築%'
      GROUP BY ZAR_PREFECTURE
      ORDER BY count DESC
    `, [], false);
    
    locations.forEach(location => {
      const suggestion: SearchSuggestion = {
        id: `location-${location.prefecture}`,
        text: location.prefecture,
        type: 'location',
        count: location.count,
        icon: 'location_on',
        relevanceScore: this.calculateRelevanceScore(location.prefecture, 'location')
      };
      
      this.searchIndex.locations.set(location.prefecture.toLowerCase(), suggestion);
      this.addSearchVariations(location.prefecture, suggestion);
    });
  }
  
  /**
   * Index category names
   */
  private async indexCategories(): Promise<void> {
    const categories = await executeQuery<{
      category: string;
      bigCategory: string;
      count: number;
    }>(`
      SELECT 
        ZAR_CATEGORY as category,
        ZAR_BIGCATEGORY as bigCategory,
        COUNT(*) as count
      FROM ZCDARCHITECTURE
      WHERE ZAR_CATEGORY IS NOT NULL 
        AND ZAR_CATEGORY != ''
        AND ZAR_TAG NOT LIKE '%の追加建築%'
      GROUP BY ZAR_CATEGORY, ZAR_BIGCATEGORY
      ORDER BY count DESC
    `, [], false);
    
    categories.forEach(category => {
      const suggestion: SearchSuggestion = {
        id: `category-${category.category}`,
        text: category.category,
        type: 'category',
        count: category.count,
        icon: 'category',
        relevanceScore: this.calculateRelevanceScore(category.category, 'category')
      };
      
      this.searchIndex.categories.set(category.category.toLowerCase(), suggestion);
      this.addSearchVariations(category.category, suggestion);
      
      // Add big category if different
      if (category.bigCategory && category.bigCategory !== category.category) {
        const bigCategorySuggestion: SearchSuggestion = {
          id: `bigcategory-${category.bigCategory}`,
          text: category.bigCategory,
          type: 'category',
          count: category.count,
          icon: 'category',
          relevanceScore: this.calculateRelevanceScore(category.bigCategory, 'category')
        };
        
        this.searchIndex.categories.set(category.bigCategory.toLowerCase(), bigCategorySuggestion);
        this.addSearchVariations(category.bigCategory, bigCategorySuggestion);
      }
    });
  }
  
  /**
   * Build keyword mappings for partial matching
   */
  private async buildKeywordMappings(): Promise<void> {
    // Combine all suggestions into keyword mappings
    const allSuggestions = [
      ...this.searchIndex.architectures.values(),
      ...this.searchIndex.architects.values(),
      ...this.searchIndex.locations.values(),
      ...this.searchIndex.categories.values()
    ];
    
    allSuggestions.forEach(suggestion => {
      const words = this.extractKeywords(suggestion.text);
      words.forEach(word => {
        const existing = this.searchIndex.keywords.get(word) || [];
        existing.push(suggestion);
        this.searchIndex.keywords.set(word, existing);
      });
    });
  }
  
  /**
   * Generate suggestions based on query
   */
  private async generateSuggestions(
    query: string,
    limit: number
  ): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();
    
    // Exact matches (highest priority)
    const exactMatches = this.findExactMatches(queryLower);
    suggestions.push(...exactMatches);
    
    // Starts with matches
    const startsWithMatches = this.findStartsWithMatches(queryLower);
    suggestions.push(...startsWithMatches.filter(s => 
      !suggestions.some(existing => existing.id === s.id)
    ));
    
    // Contains matches
    const containsMatches = this.findContainsMatches(queryLower);
    suggestions.push(...containsMatches.filter(s => 
      !suggestions.some(existing => existing.id === s.id)
    ));
    
    // Fuzzy matches (for typos and variations)
    const fuzzyMatches = this.findFuzzyMatches(queryLower);
    suggestions.push(...fuzzyMatches.filter(s => 
      !suggestions.some(existing => existing.id === s.id)
    ));
    
    // Sort by relevance score and limit results
    return suggestions
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, limit);
  }
  
  /**
   * Find exact matches across all indices
   */
  private findExactMatches(query: string): SearchSuggestion[] {
    const matches: SearchSuggestion[] = [];
    
    // Check all indices for exact matches
    [
      this.searchIndex.architectures,
      this.searchIndex.architects,
      this.searchIndex.locations,
      this.searchIndex.categories
    ].forEach(index => {
      const match = index.get(query);
      if (match) {
        matches.push({ ...match, relevanceScore: (match.relevanceScore || 0) + 100 });
      }
    });
    
    return matches;
  }
  
  /**
   * Find starts-with matches
   */
  private findStartsWithMatches(query: string): SearchSuggestion[] {
    const matches: SearchSuggestion[] = [];
    
    [
      this.searchIndex.architectures,
      this.searchIndex.architects,
      this.searchIndex.locations,
      this.searchIndex.categories
    ].forEach(index => {
      index.forEach((suggestion, key) => {
        if (key.startsWith(query) && key !== query) {
          matches.push({ ...suggestion, relevanceScore: (suggestion.relevanceScore || 0) + 50 });
        }
      });
    });
    
    return matches;
  }
  
  /**
   * Find contains matches
   */
  private findContainsMatches(query: string): SearchSuggestion[] {
    const matches: SearchSuggestion[] = [];
    
    [
      this.searchIndex.architectures,
      this.searchIndex.architects,
      this.searchIndex.locations,
      this.searchIndex.categories
    ].forEach(index => {
      index.forEach((suggestion, key) => {
        if (key.includes(query) && !key.startsWith(query)) {
          matches.push({ ...suggestion, relevanceScore: (suggestion.relevanceScore || 0) + 25 });
        }
      });
    });
    
    return matches;
  }
  
  /**
   * Find fuzzy matches for typos and variations
   */
  private findFuzzyMatches(query: string): SearchSuggestion[] {
    const matches: SearchSuggestion[] = [];
    const words = this.extractKeywords(query);
    
    words.forEach(word => {
      const keywordMatches = this.searchIndex.keywords.get(word) || [];
      keywordMatches.forEach(suggestion => {
        matches.push({ ...suggestion, relevanceScore: (suggestion.relevanceScore || 0) + 10 });
      });
    });
    
    return matches;
  }
  
  /**
   * Get category suggestions
   */
  private async getCategorySuggestions(query: string): Promise<CategorySuggestion[]> {
    // This could be expanded to show category-specific suggestions
    return [];
  }
  
  /**
   * Get recent search suggestions that match query
   */
  private getRecentSuggestions(query: string): RecentSearch[] {
    return this.recentSearches.filter(search =>
      search.query.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 3);
  }
  
  /**
   * Get popular search suggestions that match query
   */
  private getPopularSuggestions(query: string): PopularSearch[] {
    return this.popularSearches.filter(search =>
      search.query.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 3);
  }
  
  /**
   * Calculate relevance score for a suggestion
   */
  private calculateRelevanceScore(text: string, type: string): number {
    let score = 0;
    
    // Base score by type
    switch (type) {
      case 'architecture':
        score += 50;
        break;
      case 'architect':
        score += 40;
        break;
      case 'location':
        score += 30;
        break;
      case 'category':
        score += 20;
        break;
    }
    
    // Bonus for shorter text (likely more specific)
    score += Math.max(0, 50 - text.length);
    
    return score;
  }
  
  /**
   * Add search variations for better matching
   */
  private addSearchVariations(text: string, suggestion: SearchSuggestion): void {
    const variations = this.generateTextVariations(text);
    variations.forEach(variation => {
      if (!this.searchIndex.keywords.has(variation)) {
        this.searchIndex.keywords.set(variation, []);
      }
      this.searchIndex.keywords.get(variation)!.push(suggestion);
    });
  }
  
  /**
   * Generate text variations for better matching
   */
  private generateTextVariations(text: string): string[] {
    const variations = new Set<string>();
    const normalized = this.normalizeQuery(text);
    
    variations.add(normalized);
    
    // Add individual words
    const words = this.extractKeywords(normalized);
    words.forEach(word => variations.add(word));
    
    // Add partial combinations
    if (words.length > 1) {
      for (let i = 0; i < words.length - 1; i++) {
        variations.add(words.slice(i, i + 2).join(' '));
      }
    }
    
    return Array.from(variations);
  }
  
  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .filter(word => !this.isStopWord(word));
  }
  
  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = ['の', 'に', 'を', 'は', 'が', 'で', 'と', 'から', 'まで', 'より'];
    return stopWords.includes(word);
  }
  
  /**
   * Normalize query for consistent matching
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' '); // Normalize whitespace
  }
  
  /**
   * Add search to recent searches
   */
  addRecentSearch(query: string, resultCount: number): void {
    const search: RecentSearch = {
      query,
      timestamp: Date.now(),
      resultCount
    };
    
    // Remove existing entry for this query
    this.recentSearches = this.recentSearches.filter(s => s.query !== query);
    
    // Add to beginning
    this.recentSearches.unshift(search);
    
    // Limit size
    this.recentSearches = this.recentSearches.slice(0, this.MAX_RECENT_SEARCHES);
    
    // Save to localStorage
    this.saveRecentSearches();
  }
  
  /**
   * Load recent searches from localStorage
   */
  private loadRecentSearches(): void {
    try {
      const stored = localStorage.getItem(this.RECENT_SEARCHES_KEY);
      if (stored) {
        this.recentSearches = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
      this.recentSearches = [];
    }
  }
  
  /**
   * Save recent searches to localStorage
   */
  private saveRecentSearches(): void {
    try {
      localStorage.setItem(this.RECENT_SEARCHES_KEY, JSON.stringify(this.recentSearches));
    } catch (error) {
      console.warn('Failed to save recent searches:', error);
    }
  }
  
  /**
   * Initialize popular searches (could be fetched from analytics)
   */
  private initializePopularSearches(): void {
    this.popularSearches = [
      { query: '東京', searchCount: 1500, trend: 'stable' },
      { query: '安藤忠雄', searchCount: 1200, trend: 'rising' },
      { query: '住宅', searchCount: 1000, trend: 'stable' },
      { query: '大阪', searchCount: 800, trend: 'stable' },
      { query: '隈研吾', searchCount: 750, trend: 'rising' },
    ];
  }
  
  /**
   * Clear all caches and rebuild index
   */
  async refreshIndex(): Promise<void> {
    this.searchIndex = {
      architectures: new Map(),
      architects: new Map(),
      locations: new Map(),
      categories: new Map(),
      keywords: new Map()
    };
    this.isIndexBuilt = false;
    await this.buildSearchIndex();
  }
}

export default AutocompleteService;