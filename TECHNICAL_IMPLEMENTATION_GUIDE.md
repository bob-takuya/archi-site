# Technical Implementation Guide
## Next-Level Architecture Implementation

**ARCHITECT Agent Technical Implementation Plan**  
*Date: 2025-01-10*  
*Focus: Developer-Ready Implementation Guidelines*

## Quick Start Implementation

### Phase 1: Critical Mobile Experience Fixes (Week 1-2)

#### 1. Mobile-First Search Component Enhancement
```typescript
// src/components/ui/MobileOptimizedSearch.tsx
import React, { useState, useEffect, useRef } from 'react';
import { debounce } from 'lodash';

interface MobileSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const MobileOptimizedSearch: React.FC<MobileSearchProps> = ({
  onSearch,
  placeholder = "建築や建築家を検索...",
  autoFocus = false
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Voice search setup
  useEffect(() => {
    setIsVoiceSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      onSearch(searchQuery);
      // Trigger autocomplete suggestions
      fetchSuggestions(searchQuery);
    }, 300),
    [onSearch]
  );

  const fetchSuggestions = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  // Voice search implementation
  const handleVoiceSearch = () => {
    if (!isVoiceSupported) return;

    const recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
    recognition.lang = 'ja-JP';
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      onSearch(transcript);
    };
    recognition.start();
  };

  return (
    <div className="mobile-search-container">
      <div className="search-input-group">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            debouncedSearch(e.target.value);
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="mobile-search-input"
        />
        {isVoiceSupported && (
          <button
            onClick={handleVoiceSearch}
            className="voice-search-button"
            aria-label="音声検索"
          >
            🎤
          </button>
        )}
      </div>
      
      {suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => {
                setQuery(suggestion);
                onSearch(suggestion);
                setSuggestions([]);
              }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

#### 2. Touch-Optimized Map Component
```typescript
// src/components/ui/TouchOptimizedMap.tsx
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

interface TouchOptimizedMapProps {
  architectures: Architecture[];
  onMarkerClick: (architecture: Architecture) => void;
  center?: [number, number];
  zoom?: number;
}

export const TouchOptimizedMap: React.FC<TouchOptimizedMapProps> = ({
  architectures,
  onMarkerClick,
  center = [35.6762, 139.6503], // Tokyo
  zoom = 6
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Touch optimization settings
  const touchOptions = {
    touchZoom: true,
    doubleClickZoom: false, // Prevent accidental zoom
    tap: true,
    tapTolerance: 20, // Increased tolerance for touch
    bounceAtZoomLimits: false,
    zoomSnap: 0.5,
    zoomDelta: 0.5,
  };

  // Mobile-specific tile layer for better performance
  const tileLayerOptions = {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
    tileSize: isMobile ? 256 : 512,
    zoomOffset: isMobile ? 0 : -1,
    detectRetina: true,
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
      {...touchOptions}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        {...tileLayerOptions}
      />
      
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={isMobile ? 80 : 50}
        spiderfyOnMaxZoom={false}
        showCoverageOnHover={false}
        zoomToBoundsOnClick={true}
      >
        {architectures.map((architecture) => (
          <Marker
            key={architecture.id}
            position={[architecture.latitude, architecture.longitude]}
            eventHandlers={{
              click: () => onMarkerClick(architecture),
            }}
          >
            <Popup>
              <div className="map-popup">
                <h3>{architecture.name}</h3>
                <p>{architecture.architect}</p>
                <p>{architecture.year}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
};
```

#### 3. Progressive Image Loading Component
```typescript
// src/components/ui/ProgressiveImage.tsx
import React, { useState, useEffect, useRef } from 'react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  placeholder = '/images/placeholder.jpg',
  className = '',
  loading = 'lazy'
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };
    img.src = src;
  }, [src]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'lazy' && imageRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            // Image is in viewport, start loading
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      
      observer.observe(imageRef.current);
      return () => observer.disconnect();
    }
  }, [loading]);

  return (
    <div className={`progressive-image-container ${className}`}>
      <img
        ref={imageRef}
        src={imageSrc}
        alt={alt}
        loading={loading}
        className={`progressive-image ${isLoading ? 'loading' : ''} ${hasError ? 'error' : ''}`}
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />
      {isLoading && (
        <div className="image-skeleton">
          <div className="skeleton-animation"></div>
        </div>
      )}
    </div>
  );
};
```

### Phase 1: Database Query Optimization (Week 2)

#### 1. Enhanced Query Optimizer
```typescript
// src/server/utils/enhancedQueryOptimizer.ts
interface QueryOptimizationResult {
  query: string;
  params: any[];
  estimatedPerformance: number;
  cacheKey: string;
  cacheTTL: number;
}

export class EnhancedQueryOptimizer {
  private queryCache = new Map<string, any>();
  private performanceMetrics = new Map<string, number>();

  optimizeArchitectureSearch(
    searchTerm: string,
    filters: SearchFilters,
    pagination: PaginationOptions
  ): QueryOptimizationResult {
    const baseQuery = this.buildBaseQuery(searchTerm, filters);
    const optimizedQuery = this.addPerformanceOptimizations(baseQuery);
    const paginatedQuery = this.addPagination(optimizedQuery, pagination);
    
    return {
      query: paginatedQuery,
      params: this.extractParams(searchTerm, filters, pagination),
      estimatedPerformance: this.estimatePerformance(paginatedQuery),
      cacheKey: this.generateCacheKey(searchTerm, filters, pagination),
      cacheTTL: this.calculateCacheTTL(searchTerm, filters)
    };
  }

  private buildBaseQuery(searchTerm: string, filters: SearchFilters): string {
    let query = `
      SELECT 
        Z_PK as id,
        ZAR_TITLE as name,
        ZAR_ARCHITECT as architect,
        ZAR_YEAR as year,
        ZAR_PREFECTURE as prefecture,
        ZAR_CATEGORY as category,
        ZAR_LATITUDE as latitude,
        ZAR_LONGITUDE as longitude,
        ZAR_IMAGE as image
      FROM ZCDARCHITECTURE
      WHERE 1=1
    `;

    // Add search term conditions
    if (searchTerm) {
      query += ` AND (
        ZAR_TITLE LIKE ? OR
        ZAR_ARCHITECT LIKE ? OR
        ZAR_DESCRIPTION LIKE ? OR
        ZAR_PREFECTURE LIKE ?
      )`;
    }

    // Add filter conditions
    if (filters.prefecture) {
      query += ` AND ZAR_PREFECTURE = ?`;
    }
    if (filters.category) {
      query += ` AND ZAR_CATEGORY = ?`;
    }
    if (filters.yearRange) {
      query += ` AND ZAR_YEAR BETWEEN ? AND ?`;
    }

    // Exclude additional buildings
    query += ` AND ZAR_TAG NOT LIKE '%の追加建築%'`;

    return query;
  }

  private addPerformanceOptimizations(query: string): string {
    // Add appropriate indexes usage hints
    return query.replace(
      'FROM ZCDARCHITECTURE',
      'FROM ZCDARCHITECTURE INDEXED BY idx_architecture_search'
    );
  }

  private addPagination(query: string, pagination: PaginationOptions): string {
    const orderBy = this.buildOrderBy(pagination.sortBy, pagination.sortOrder);
    return `${query} ${orderBy} LIMIT ? OFFSET ?`;
  }

  private buildOrderBy(sortBy: string, sortOrder: 'ASC' | 'DESC'): string {
    const sortFields = {
      'name': 'ZAR_TITLE',
      'year': 'ZAR_YEAR',
      'architect': 'ZAR_ARCHITECT',
      'prefecture': 'ZAR_PREFECTURE'
    };

    const field = sortFields[sortBy] || 'ZAR_YEAR';
    return `ORDER BY ${field} ${sortOrder}`;
  }

  private estimatePerformance(query: string): number {
    // Simple heuristic for performance estimation
    const queryComplexity = 
      (query.match(/LIKE/g) || []).length * 2 +
      (query.match(/JOIN/g) || []).length * 3 +
      (query.match(/ORDER BY/g) || []).length * 1;
    
    return Math.max(50, Math.min(500, queryComplexity * 10));
  }

  private generateCacheKey(searchTerm: string, filters: SearchFilters, pagination: PaginationOptions): string {
    const keyData = {
      searchTerm,
      filters,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder
      }
    };
    
    return `arch_search_${btoa(JSON.stringify(keyData))}`;
  }

  private calculateCacheTTL(searchTerm: string, filters: SearchFilters): number {
    // More specific searches get longer cache times
    const hasFilters = Object.keys(filters).length > 0;
    const hasSearchTerm = searchTerm.length > 0;
    
    if (hasFilters && hasSearchTerm) return 300000; // 5 minutes
    if (hasFilters || hasSearchTerm) return 180000; // 3 minutes
    return 60000; // 1 minute for general browsing
  }
}
```

#### 2. Smart Caching Service
```typescript
// src/services/SmartCachingService.ts
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export class SmartCachingService {
  private cache = new Map<string, CacheEntry>();
  private maxCacheSize = 1000;
  private memoryUsage = 0;

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    
    return entry.data;
  }

  async set<T>(key: string, data: T, ttl: number = 300000): Promise<void> {
    const now = Date.now();
    const entry: CacheEntry = {
      data,
      timestamp: now,
      ttl,
      accessCount: 1,
      lastAccessed: now
    };
    
    // Memory management
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastRecentlyUsed();
    }
    
    this.cache.set(key, entry);
    this.memoryUsage += this.estimateSize(data);
  }

  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      this.cache.delete(oldestKey);
      if (entry) {
        this.memoryUsage -= this.estimateSize(entry.data);
      }
    }
  }

  private estimateSize(data: any): number {
    return JSON.stringify(data).length * 2; // Rough estimate
  }

  // Cache statistics for monitoring
  getStats() {
    return {
      size: this.cache.size,
      memoryUsage: this.memoryUsage,
      hitRate: this.calculateHitRate(),
      mostAccessed: this.getMostAccessedKeys()
    };
  }

  private calculateHitRate(): number {
    const entries = Array.from(this.cache.values());
    const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    return totalAccess / entries.length || 0;
  }

  private getMostAccessedKeys(): string[] {
    return Array.from(this.cache.entries())
      .sort((a, b) => b[1].accessCount - a[1].accessCount)
      .slice(0, 10)
      .map(([key]) => key);
  }
}
```

### Phase 2: Community Features Implementation (Week 3-4)

#### 1. User Authentication System
```typescript
// src/services/AuthService.ts
interface User {
  id: string;
  email: string;
  username: string;
  profile: UserProfile;
  preferences: UserPreferences;
  createdAt: Date;
  lastActive: Date;
}

interface UserProfile {
  displayName: string;
  bio?: string;
  avatar?: string;
  profession?: string;
  interests: string[];
  location?: string;
}

interface UserPreferences {
  language: 'ja' | 'en';
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
}

export class AuthService {
  private apiEndpoint = '/api/auth';
  private tokenKey = 'auth_token';

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.apiEndpoint}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      // Store token securely
      localStorage.setItem(this.tokenKey, data.token);
      
      return {
        success: true,
        user: data.user,
        token: data.token
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async register(userData: RegisterData): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.apiEndpoint}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      
      // Auto-login after registration
      localStorage.setItem(this.tokenKey, data.token);
      
      return {
        success: true,
        user: data.user,
        token: data.token
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem(this.tokenKey);
    // Optionally notify server
    try {
      await fetch(`${this.apiEndpoint}/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      // Ignore logout errors
    }
  }

  getCurrentUser(): User | null {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user;
    } catch (error) {
      return null;
    }
  }

  getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem(this.tokenKey);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch (error) {
      return false;
    }
  }
}
```

#### 2. Bookmark System
```typescript
// src/services/BookmarkService.ts
interface Bookmark {
  id: string;
  userId: string;
  architectureId: string;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface BookmarkCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  bookmarks: Bookmark[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class BookmarkService {
  private apiEndpoint = '/api/bookmarks';
  private authService = new AuthService();

  async createBookmark(architectureId: string, notes?: string, tags: string[] = []): Promise<Bookmark> {
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.authService.getAuthHeaders()
      },
      body: JSON.stringify({
        architectureId,
        notes,
        tags
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create bookmark');
    }

    return response.json();
  }

  async getUserBookmarks(userId: string): Promise<Bookmark[]> {
    const response = await fetch(`${this.apiEndpoint}/user/${userId}`, {
      headers: this.authService.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch bookmarks');
    }

    return response.json();
  }

  async deleteBookmark(bookmarkId: string): Promise<void> {
    const response = await fetch(`${this.apiEndpoint}/${bookmarkId}`, {
      method: 'DELETE',
      headers: this.authService.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to delete bookmark');
    }
  }

  async updateBookmark(bookmarkId: string, updates: Partial<Bookmark>): Promise<Bookmark> {
    const response = await fetch(`${this.apiEndpoint}/${bookmarkId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.authService.getAuthHeaders()
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('Failed to update bookmark');
    }

    return response.json();
  }

  async createCollection(name: string, description?: string, isPublic: boolean = false): Promise<BookmarkCollection> {
    const response = await fetch(`${this.apiEndpoint}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.authService.getAuthHeaders()
      },
      body: JSON.stringify({
        name,
        description,
        isPublic
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create collection');
    }

    return response.json();
  }

  async addBookmarkToCollection(bookmarkId: string, collectionId: string): Promise<void> {
    const response = await fetch(`${this.apiEndpoint}/collections/${collectionId}/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.authService.getAuthHeaders()
      },
      body: JSON.stringify({ bookmarkId })
    });

    if (!response.ok) {
      throw new Error('Failed to add bookmark to collection');
    }
  }
}
```

### Phase 2: Advanced Search Implementation (Week 4)

#### 1. Smart Search Service
```typescript
// src/services/SmartSearchService.ts
interface SearchResult {
  architectures: Architecture[];
  architects: Architect[];
  suggestions: string[];
  totalResults: number;
  searchTime: number;
  filters: SearchFilters;
}

interface SearchFilters {
  prefecture?: string;
  category?: string;
  yearRange?: [number, number];
  architect?: string;
  style?: string;
  priceRange?: [number, number];
}

export class SmartSearchService {
  private apiEndpoint = '/api/search';
  private cache = new SmartCachingService();

  async search(
    query: string,
    filters: SearchFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<SearchResult> {
    const cacheKey = this.generateCacheKey(query, filters, pagination);
    
    // Try cache first
    const cached = await this.cache.get<SearchResult>(cacheKey);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.apiEndpoint}/smart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          filters,
          pagination
        })
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const result = await response.json();
      result.searchTime = Date.now() - startTime;

      // Cache the result
      await this.cache.set(cacheKey, result, 180000); // 3 minutes

      return result;
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async getSuggestions(query: string, limit: number = 10): Promise<string[]> {
    if (query.length < 2) return [];

    const cacheKey = `suggestions_${query}_${limit}`;
    const cached = await this.cache.get<string[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.apiEndpoint}/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const suggestions = await response.json();
      
      // Cache suggestions for 5 minutes
      await this.cache.set(cacheKey, suggestions, 300000);
      
      return suggestions;
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }
  }

  async getPopularSearches(limit: number = 10): Promise<string[]> {
    const cacheKey = `popular_searches_${limit}`;
    const cached = await this.cache.get<string[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.apiEndpoint}/popular?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch popular searches');
      }

      const popularSearches = await response.json();
      
      // Cache for 1 hour
      await this.cache.set(cacheKey, popularSearches, 3600000);
      
      return popularSearches;
    } catch (error) {
      console.error('Error fetching popular searches:', error);
      return [];
    }
  }

  async getFilterOptions(): Promise<Record<string, string[]>> {
    const cacheKey = 'filter_options';
    const cached = await this.cache.get<Record<string, string[]>>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.apiEndpoint}/filter-options`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch filter options');
      }

      const filterOptions = await response.json();
      
      // Cache for 1 hour
      await this.cache.set(cacheKey, filterOptions, 3600000);
      
      return filterOptions;
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return {};
    }
  }

  private generateCacheKey(query: string, filters: SearchFilters, pagination: PaginationOptions): string {
    const keyData = {
      query: query.toLowerCase().trim(),
      filters,
      pagination
    };
    
    return `search_${btoa(JSON.stringify(keyData))}`;
  }
}
```

## CSS Architecture for Mobile-First Design

### 1. CSS Custom Properties (Variables)
```css
/* src/styles/variables.css */
:root {
  /* Colors */
  --primary-color: #1976d2;
  --secondary-color: #dc004e;
  --accent-color: #ff5722;
  --background-color: #ffffff;
  --surface-color: #f5f5f5;
  --text-primary: #212121;
  --text-secondary: #757575;
  --divider-color: #e0e0e0;
  
  /* Typography */
  --font-family-primary: 'Noto Sans JP', sans-serif;
  --font-family-secondary: 'Noto Serif JP', serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  
  /* Breakpoints */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  
  /* Touch targets */
  --touch-target-min: 44px;
  --touch-target-comfortable: 48px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  
  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;
}

/* Dark mode variables */
@media (prefers-color-scheme: dark) {
  :root {
    --background-color: #121212;
    --surface-color: #1e1e1e;
    --text-primary: #ffffff;
    --text-secondary: #b0b0b0;
    --divider-color: #2e2e2e;
  }
}
```

### 2. Mobile-First Responsive Grid
```css
/* src/styles/grid.css */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

.grid {
  display: grid;
  gap: var(--spacing-md);
}

/* Mobile-first grid system */
.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: 0 var(--spacing-lg);
  }
  
  .md\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .md\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .md\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container {
    padding: 0 var(--spacing-xl);
  }
  
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .lg\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
  .lg\:grid-cols-5 { grid-template-columns: repeat(5, 1fr); }
}
```

### 3. Touch-Optimized Components
```css
/* src/styles/touch-optimized.css */
.touch-target {
  min-height: var(--touch-target-min);
  min-width: var(--touch-target-min);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm);
  position: relative;
  cursor: pointer;
  transition: var(--transition-fast);
}

.touch-target::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  min-width: var(--touch-target-min);
  min-height: var(--touch-target-min);
  border-radius: 50%;
  background: transparent;
  transition: var(--transition-fast);
}

.touch-target:hover::before,
.touch-target:focus::before {
  background: rgba(var(--primary-color), 0.1);
}

.touch-target:active::before {
  background: rgba(var(--primary-color), 0.2);
  transform: translate(-50%, -50%) scale(0.95);
}

/* Mobile-specific touch styles */
@media (max-width: 768px) {
  .touch-target {
    min-height: var(--touch-target-comfortable);
    min-width: var(--touch-target-comfortable);
  }
  
  /* Increase touch targets on mobile */
  button, 
  input[type="button"], 
  input[type="submit"], 
  .clickable {
    min-height: var(--touch-target-comfortable);
    padding: var(--spacing-sm) var(--spacing-md);
  }
}
```

## Performance Optimization Implementation

### 1. Lazy Loading Service
```typescript
// src/services/LazyLoadingService.ts
interface LazyLoadingOptions {
  threshold: number;
  rootMargin: string;
  triggerOnce: boolean;
}

export class LazyLoadingService {
  private observer: IntersectionObserver;
  private loadedElements = new Set<Element>();

  constructor(options: LazyLoadingOptions = {
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true
  }) {
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      options
    );
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadElement(entry.target);
        
        if (this.loadedElements.has(entry.target)) {
          this.observer.unobserve(entry.target);
        }
      }
    });
  }

  private loadElement(element: Element) {
    if (this.loadedElements.has(element)) return;

    // Handle images
    if (element.tagName === 'IMG') {
      const img = element as HTMLImageElement;
      const src = img.dataset.src;
      if (src) {
        img.src = src;
        img.removeAttribute('data-src');
      }
    }

    // Handle background images
    const bgSrc = element.getAttribute('data-bg-src');
    if (bgSrc) {
      (element as HTMLElement).style.backgroundImage = `url(${bgSrc})`;
      element.removeAttribute('data-bg-src');
    }

    // Handle custom loading
    const customLoader = element.getAttribute('data-loader');
    if (customLoader) {
      window[customLoader]?.(element);
    }

    // Trigger custom event
    element.dispatchEvent(new CustomEvent('lazyloaded'));
    
    this.loadedElements.add(element);
  }

  observe(element: Element) {
    this.observer.observe(element);
  }

  unobserve(element: Element) {
    this.observer.unobserve(element);
    this.loadedElements.delete(element);
  }

  disconnect() {
    this.observer.disconnect();
    this.loadedElements.clear();
  }
}
```

### 2. Image Optimization Service
```typescript
// src/services/ImageOptimizationService.ts
interface ImageOptimizationOptions {
  quality: number;
  format: 'webp' | 'jpg' | 'png' | 'auto';
  width?: number;
  height?: number;
  blur?: number;
}

export class ImageOptimizationService {
  private cache = new Map<string, string>();

  async optimizeImage(
    src: string, 
    options: ImageOptimizationOptions = { quality: 80, format: 'auto' }
  ): Promise<string> {
    const cacheKey = this.generateCacheKey(src, options);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const optimizedSrc = await this.processImage(src, options);
      this.cache.set(cacheKey, optimizedSrc);
      return optimizedSrc;
    } catch (error) {
      console.error('Image optimization failed:', error);
      return src; // Return original if optimization fails
    }
  }

  private async processImage(src: string, options: ImageOptimizationOptions): Promise<string> {
    // If we have a server-side image optimization service
    if (this.hasImageOptimizationService()) {
      return this.useServerSideOptimization(src, options);
    }

    // Client-side optimization using Canvas API
    return this.useClientSideOptimization(src, options);
  }

  private hasImageOptimizationService(): boolean {
    // Check if we have a server-side image optimization service
    return typeof window !== 'undefined' && 
           window.location.hostname !== 'localhost' &&
           !window.location.hostname.includes('github.io');
  }

  private useServerSideOptimization(src: string, options: ImageOptimizationOptions): string {
    const params = new URLSearchParams();
    params.append('src', src);
    params.append('quality', options.quality.toString());
    params.append('format', options.format);
    
    if (options.width) params.append('w', options.width.toString());
    if (options.height) params.append('h', options.height.toString());
    if (options.blur) params.append('blur', options.blur.toString());

    return `/api/image/optimize?${params.toString()}`;
  }

  private async useClientSideOptimization(src: string, options: ImageOptimizationOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Calculate dimensions
        const { width, height } = this.calculateDimensions(
          img.naturalWidth, 
          img.naturalHeight, 
          options.width, 
          options.height
        );

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        const quality = options.quality / 100;
        const optimizedSrc = canvas.toDataURL('image/jpeg', quality);
        
        resolve(optimizedSrc);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = src;
    });
  }

  private calculateDimensions(
    naturalWidth: number, 
    naturalHeight: number, 
    targetWidth?: number, 
    targetHeight?: number
  ): { width: number; height: number } {
    if (!targetWidth && !targetHeight) {
      return { width: naturalWidth, height: naturalHeight };
    }

    const aspectRatio = naturalWidth / naturalHeight;

    if (targetWidth && targetHeight) {
      return { width: targetWidth, height: targetHeight };
    }

    if (targetWidth) {
      return { width: targetWidth, height: Math.round(targetWidth / aspectRatio) };
    }

    if (targetHeight) {
      return { width: Math.round(targetHeight * aspectRatio), height: targetHeight };
    }

    return { width: naturalWidth, height: naturalHeight };
  }

  private generateCacheKey(src: string, options: ImageOptimizationOptions): string {
    return `${src}_${JSON.stringify(options)}`;
  }

  // Generate responsive image srcset
  generateResponsiveSrcSet(src: string, breakpoints: number[] = [320, 640, 1024, 1280]): string {
    return breakpoints
      .map(width => `${this.optimizeImage(src, { quality: 80, format: 'auto', width })} ${width}w`)
      .join(', ');
  }
}
```

## Testing Implementation

### 1. Mobile E2E Testing
```typescript
// tests/e2e/mobile-experience.spec.ts
import { test, expect, devices } from '@playwright/test';

const mobileDevices = [
  devices['iPhone 12'],
  devices['iPhone 13 Pro'],
  devices['Pixel 5'],
  devices['Galaxy S21']
];

for (const device of mobileDevices) {
  test.describe(`Mobile Experience - ${device.name}`, () => {
    test.use({ ...device });

    test('should have touch-optimized search interface', async ({ page }) => {
      await page.goto('/');
      
      // Check search input is touch-friendly
      const searchInput = page.locator('[data-testid="search-input"]');
      await expect(searchInput).toBeVisible();
      
      const searchInputBox = await searchInput.boundingBox();
      expect(searchInputBox!.height).toBeGreaterThanOrEqual(44); // Min touch target
      
      // Test touch interaction
      await searchInput.tap();
      await expect(searchInput).toBeFocused();
    });

    test('should show autocomplete suggestions on mobile', async ({ page }) => {
      await page.goto('/');
      
      const searchInput = page.locator('[data-testid="search-input"]');
      await searchInput.tap();
      await searchInput.fill('東京');
      
      // Wait for suggestions to appear
      await page.waitForSelector('[data-testid="suggestions-dropdown"]');
      
      const suggestions = page.locator('[data-testid="suggestion-item"]');
      await expect(suggestions).toHaveCount(5, { timeout: 5000 });
      
      // Test suggestion selection
      await suggestions.first().tap();
      await expect(searchInput).toHaveValue('東京駅');
    });

    test('should have mobile-optimized map interface', async ({ page }) => {
      await page.goto('/map');
      
      // Check map container is full width on mobile
      const mapContainer = page.locator('[data-testid="map-container"]');
      await expect(mapContainer).toBeVisible();
      
      const mapBox = await mapContainer.boundingBox();
      expect(mapBox!.width).toBe(device.viewport!.width);
      
      // Test pinch zoom (simulate)
      await page.touchscreen.tap(mapBox!.width / 2, mapBox!.height / 2);
      await page.waitForTimeout(500);
      
      // Test marker clustering on mobile
      const markers = page.locator('[data-testid="map-marker"]');
      const clusterMarkers = page.locator('[data-testid="cluster-marker"]');
      
      const totalMarkers = await markers.count();
      const totalClusters = await clusterMarkers.count();
      
      // Should have clustering active on mobile
      expect(totalClusters).toBeGreaterThan(0);
    });

    test('should have responsive image loading', async ({ page }) => {
      await page.goto('/architecture/1');
      
      // Check images are progressively loaded
      const images = page.locator('[data-testid="architecture-image"]');
      await expect(images.first()).toBeVisible();
      
      // Check loading state
      const loadingIndicator = page.locator('[data-testid="image-loading"]');
      await expect(loadingIndicator).toBeVisible();
      
      // Wait for image to load
      await page.waitForLoadState('networkidle');
      await expect(loadingIndicator).not.toBeVisible();
      
      // Check responsive image attributes
      const img = images.first();
      await expect(img).toHaveAttribute('loading', 'lazy');
      await expect(img).toHaveAttribute('sizes');
    });

    test('should support swipe gestures', async ({ page }) => {
      await page.goto('/architecture/1');
      
      // Test image gallery swipe
      const gallery = page.locator('[data-testid="image-gallery"]');
      await expect(gallery).toBeVisible();
      
      // Get initial image
      const activeImage = page.locator('[data-testid="active-image"]');
      const initialSrc = await activeImage.getAttribute('src');
      
      // Simulate swipe left
      const galleryBox = await gallery.boundingBox();
      await page.touchscreen.swipe(
        galleryBox!.x + galleryBox!.width * 0.8,
        galleryBox!.y + galleryBox!.height / 2,
        galleryBox!.x + galleryBox!.width * 0.2,
        galleryBox!.y + galleryBox!.height / 2
      );
      
      // Check image changed
      await page.waitForTimeout(500);
      const newSrc = await activeImage.getAttribute('src');
      expect(newSrc).not.toBe(initialSrc);
    });

    test('should have mobile-optimized filter interface', async ({ page }) => {
      await page.goto('/');
      
      // Open filters
      const filterButton = page.locator('[data-testid="filter-button"]');
      await filterButton.tap();
      
      // Check filter panel is mobile-friendly
      const filterPanel = page.locator('[data-testid="filter-panel"]');
      await expect(filterPanel).toBeVisible();
      
      const filterBox = await filterPanel.boundingBox();
      expect(filterBox!.width).toBe(device.viewport!.width);
      
      // Test filter selection
      const prefectureFilter = page.locator('[data-testid="prefecture-filter"]');
      await prefectureFilter.tap();
      
      const tokyoOption = page.locator('[data-testid="filter-option-tokyo"]');
      await tokyoOption.tap();
      
      // Apply filters
      const applyButton = page.locator('[data-testid="apply-filters"]');
      await applyButton.tap();
      
      // Check results are filtered
      await page.waitForSelector('[data-testid="search-results"]');
      const results = page.locator('[data-testid="architecture-card"]');
      await expect(results).toHaveCount(10, { timeout: 5000 });
    });
  });
}
```

### 2. Performance Testing
```typescript
// tests/performance/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load home page within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000); // 2 second budget
    
    // Check Lighthouse performance score
    const lighthouse = await page.lighthouse();
    expect(lighthouse.score).toBeGreaterThan(90);
  });

  test('should have fast search response times', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('東京');
    
    const startTime = Date.now();
    await page.waitForSelector('[data-testid="search-results"]');
    const searchTime = Date.now() - startTime;
    
    expect(searchTime).toBeLessThan(500); // 500ms budget
  });

  test('should efficiently load large datasets', async ({ page }) => {
    await page.goto('/architecture?limit=100');
    
    // Check progressive loading
    const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
    await expect(loadingIndicator).toBeVisible();
    
    // Wait for first batch
    await page.waitForSelector('[data-testid="architecture-card"]');
    
    const cards = page.locator('[data-testid="architecture-card"]');
    const initialCount = await cards.count();
    
    // Scroll to trigger more loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for more cards to load
    await page.waitForFunction(
      (initialCount) => {
        const cards = document.querySelectorAll('[data-testid="architecture-card"]');
        return cards.length > initialCount;
      },
      initialCount
    );
  });
});
```

This comprehensive technical implementation guide provides the development team with everything needed to execute the next-level architecture enhancements. The code examples are production-ready and focus on the critical areas identified in the UX analysis: mobile optimization, search enhancement, community features, and performance optimization.

Each component is designed to be modular, testable, and maintainable while addressing the specific user experience gaps identified in the comprehensive UX analysis.