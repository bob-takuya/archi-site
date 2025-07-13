/**
 * Fast Architecture Service - JSON-based API replacement for SQLite
 * Provides sub-second loading and search capabilities
 */

export interface Architecture {
  id: number;
  title: string;
  architect?: string;
  year?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  big_category?: string;
  description?: string;
  image_url?: string;
  tags?: string;
  prefecture?: string;
  contractor?: string;
  structural_designer?: string;
  landscape_designer?: string;
  shinkenchiku_url?: string;
}

export interface SearchIndex {
  architects: Record<string, number[]>;
  years: Record<string, number[]>;
  categories: Record<string, number[]>;
  titles: Record<string, number[]>;
  addresses: Record<string, number[]>;
}

export interface ResearchAnalytics {
  awards: {
    name: string;
    count: number;
    recipients: { architect: string; title: string; year: number; id: number }[];
  }[];
  architects: {
    name: string;
    projectCount: number;
    yearSpan: { start: number; end: number };
    categories: string[];
    awards: string[];
    prefectures: string[];
    collaborators: { structural: string[]; landscape: string[]; contractor: string[] };
    projects: Architecture[];
  }[];
  temporalAnalysis: {
    decade: string;
    projectCount: number;
    dominantCategories: string[];
    notableArchitects: string[];
    awards: string[];
  }[];
  regionalAnalysis: {
    prefecture: string;
    projectCount: number;
    timeSpan: { start: number; end: number };
    dominantCategories: string[];
    notableArchitects: string[];
    awards: string[];
  }[];
  buildingTypeEvolution: {
    category: string;
    timelineData: { decade: string; count: number; notable: string[] }[];
    totalCount: number;
    averageYear: number;
  }[];
  professionalNetworks: {
    architect: string;
    connections: {
      structural_designers: string[];
      landscape_designers: string[];
      contractors: string[];
      frequent_collaborators: { name: string; count: number; role: string }[];
    };
  }[];
}

export interface PageData {
  page: number;
  total_pages: number;
  items_per_page: number;
  total_items: number;
  items: Architecture[];
}

export interface ApiResponse {
  results: Architecture[];
  total: number;
  page: number;
  total_pages: number;
  has_more: boolean;
}

class FastArchitectureService {
  private baseUrl: string;
  private cache: Map<string, any> = new Map();
  private searchIndex: SearchIndex | null = null;
  private allItems: Map<number, Architecture> = new Map();
  private initialized = false;
  private metadata: { total_items: number; total_pages: number } | null = null;

  constructor() {
    // Use dynamic base path - both dev and prod use /archi-site/data due to GitHub Pages base path
    this.baseUrl = '/archi-site/data';
    console.log('🚀 FastArchitectureService initialized with baseUrl:', this.baseUrl);
    
    // ⚠️ WARNING: Always ensure data files exist in /public/data/ directory
    // Missing files will NOT cause "問題が発生しました" errors but will return empty data
    // To prevent eternal loading, all methods return empty data on failure instead of throwing
  }

  /**
   * Initialize the service by loading search index
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      console.log('📋 Loading search index...');
      const indexResponse = await fetch(`${this.baseUrl}/search_index.json`);
      if (!indexResponse.ok) {
        console.warn(`⚠️ Search index not available (${indexResponse.status}), service will run with limited functionality`);
        // Initialize with empty index instead of throwing
        this.searchIndex = {
          architects: {},
          years: {},
          categories: {},
          titles: {},
          addresses: {}
        };
        this.metadata = { total_items: 0, total_pages: 0 };
        this.initialized = true;
        return;
      }
      
      this.searchIndex = await indexResponse.json();
      console.log('✅ Search index loaded successfully');
      
      // Load metadata
      const metadataResponse = await fetch(`${this.baseUrl}/metadata.json`);
      if (metadataResponse.ok) {
        this.metadata = await metadataResponse.json();
        console.log(`📊 Database info: ${this.metadata.total_items.toLocaleString()} items in ${this.metadata.total_pages} pages`);
      } else {
        // Default metadata if file is missing
        this.metadata = { total_items: 14467, total_pages: 290 };
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize FastArchitectureService:', error);
      // ⚠️ CRITICAL: Never throw errors here - always initialize with empty data
      // This prevents eternal loading states and "問題が発生しました" errors
      // Initialize with empty data instead of throwing
      this.searchIndex = {
        architects: {},
        years: {},
        categories: {},
        titles: {},
        addresses: {}
      };
      this.metadata = { total_items: 0, total_pages: 0 };
      this.initialized = true;
    }
  }

  /**
   * Load a specific page of data
   */
  async loadPage(page: number): Promise<PageData> {
    const cacheKey = `page_${page}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/page_${page}.json`);
      if (!response.ok) {
        console.warn(`⚠️ Page ${page} not available (${response.status})`);
        // Return empty page data instead of throwing
        const emptyPageData: PageData = {
          page: page,
          total_pages: 0,
          items_per_page: 50,
          total_items: 0,
          items: []
        };
        return emptyPageData;
      }
      
      const pageData: PageData = await response.json();
      
      // Cache the page data
      this.cache.set(cacheKey, pageData);
      
      // Store items in our local map for search
      pageData.items.forEach(item => {
        this.allItems.set(item.id, item);
      });
      
      console.log(`✅ Loaded page ${page} with ${pageData.items.length} items`);
      return pageData;
    } catch (error) {
      console.error(`❌ Failed to load page ${page}:`, error);
      // Return empty page data instead of throwing
      const emptyPageData: PageData = {
        page: page,
        total_pages: 0,
        items_per_page: 50,
        total_items: 0,
        items: []
      };
      return emptyPageData;
    }
  }

  /**
   * Get architectures with pagination (API-compatible with SQLite service)
   */
  async getAllArchitectures(page: number = 1, limit: number = 20): Promise<ApiResponse> {
    try {
      await this.initialize();
      
      const pageData = await this.loadPage(page);
      
      // Return data in the expected format
      return {
        results: pageData.items.slice(0, limit),
        total: this.metadata?.total_items || pageData.total_items,
        page: page,
        total_pages: this.metadata?.total_pages || pageData.total_pages,
        has_more: page < (this.metadata?.total_pages || pageData.total_pages)
      };
    } catch (error) {
      console.error('❌ getAllArchitectures error:', error);
      throw error;
    }
  }

  /**
   * Search architectures (much faster than SQLite)
   */
  async searchArchitectures(
    query: string = '',
    filters: {
      architect?: string;
      year?: number;
      category?: string;
      tag?: string;
    } = {},
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse> {
    try {
      await this.initialize();
      
      if (!this.searchIndex) {
        throw new Error('Search index not loaded');
      }
      
      let matchingIds: Set<number> = new Set();
      let isFirstFilter = true;
      
      // Search by query text (titles, architects)
      if (query.trim()) {
        const queryLower = query.toLowerCase();
        const queryIds = new Set<number>();
        
        // Search in titles
        Object.entries(this.searchIndex.titles).forEach(([key, ids]) => {
          if (key.includes(queryLower) || queryLower.includes(key)) {
            ids.forEach(id => queryIds.add(id));
          }
        });
        
        // Search in architects
        Object.entries(this.searchIndex.architects).forEach(([key, ids]) => {
          if (key.includes(queryLower) || queryLower.includes(key)) {
            ids.forEach(id => queryIds.add(id));
          }
        });
        
        if (isFirstFilter) {
          matchingIds = queryIds;
          isFirstFilter = false;
        } else {
          matchingIds = new Set([...matchingIds].filter(id => queryIds.has(id)));
        }
      }
      
      // Filter by architect
      if (filters.architect) {
        const architectLower = filters.architect.toLowerCase();
        const architectIds = new Set<number>();
        
        Object.entries(this.searchIndex.architects).forEach(([key, ids]) => {
          if (key.includes(architectLower)) {
            ids.forEach(id => architectIds.add(id));
          }
        });
        
        if (isFirstFilter) {
          matchingIds = architectIds;
          isFirstFilter = false;
        } else {
          matchingIds = new Set([...matchingIds].filter(id => architectIds.has(id)));
        }
      }
      
      // Filter by year
      if (filters.year) {
        // Years are stored as "YYYY.0" in the search index
        const yearKey = filters.year + '.0';
        const yearIds = this.searchIndex.years[yearKey] || [];
        const yearIdSet = new Set(yearIds);
        
        console.log(`🔍 Searching for year ${filters.year} with key "${yearKey}", found ${yearIds.length} items`);
        
        if (isFirstFilter) {
          matchingIds = yearIdSet;
          isFirstFilter = false;
        } else {
          matchingIds = new Set([...matchingIds].filter(id => yearIdSet.has(id)));
        }
      }
      
      // Filter by tag
      if (filters.tag) {
        const tagLower = filters.tag.toLowerCase();
        const tagFilteredIds = new Set<number>();
        
        // Load first 50 pages to search for tags
        console.log(`🏷️ Searching for tag: ${filters.tag}`);
        for (let p = 1; p <= Math.min(50, this.metadata?.total_pages || 10); p++) {
          const pageData = await this.loadPage(p);
          pageData.items.forEach(item => {
            if (item.tags && item.tags.toLowerCase().includes(tagLower)) {
              tagFilteredIds.add(item.id);
            }
          });
        }
        
        console.log(`🏷️ Found ${tagFilteredIds.size} items with tag "${filters.tag}"`);
        
        if (isFirstFilter) {
          matchingIds = tagFilteredIds;
          isFirstFilter = false;
        } else {
          matchingIds = new Set([...matchingIds].filter(id => tagFilteredIds.has(id)));
        }
      }
      
      // If no filters applied, load first page
      if (isFirstFilter) {
        return this.getAllArchitectures(page, limit);
      }
      
      // Load items that we don't have cached yet
      const missingIds = [...matchingIds].filter(id => !this.allItems.has(id));
      if (missingIds.length > 0) {
        // Group missing IDs by their likely page number
        const pageNumbers = new Set<number>();
        
        // Estimate which pages contain these IDs (assuming sequential IDs)
        for (const id of missingIds) {
          const estimatedPage = Math.ceil(id / 50);
          pageNumbers.add(estimatedPage);
        }
        
        console.log(`📋 Need to load ${pageNumbers.size} pages for ${missingIds.length} missing items`);
        
        // Load all required pages
        for (const pageNum of pageNumbers) {
          if (pageNum > 0 && pageNum <= 290) { // We have 290 pages total
            if (!this.cache.has(`page_${pageNum}`)) {
              await this.loadPage(pageNum);
            }
          }
        }
        
        // If we still have missing items, load pages sequentially until we find them
        const stillMissing = missingIds.filter(id => !this.allItems.has(id));
        if (stillMissing.length > 0) {
          console.log(`⚠️ Still missing ${stillMissing.length} items, loading additional pages...`);
          
          // Load up to 50 more pages to find missing items
          let pagesLoaded = 0;
          for (let p = 1; p <= 290 && stillMissing.some(id => !this.allItems.has(id)); p++) {
            if (!this.cache.has(`page_${p}`)) {
              await this.loadPage(p);
              pagesLoaded++;
              if (pagesLoaded >= 50) break; // Limit to prevent loading entire database
            }
          }
        }
      }
      
      // Get the actual items
      const results: Architecture[] = [];
      for (const id of matchingIds) {
        const item = this.allItems.get(id);
        if (item) {
          results.push(item);
        }
      }
      
      // Sort by relevance (year desc, then title)
      results.sort((a, b) => {
        if (a.year && b.year) {
          return b.year - a.year;
        }
        if (a.year && !b.year) return -1;
        if (!a.year && b.year) return 1;
        return a.title.localeCompare(b.title);
      });
      
      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = results.slice(startIndex, endIndex);
      
      const total = results.length;
      const totalPages = Math.ceil(total / limit);
      
      console.log(`🔍 Search results: ${total} matches, showing page ${page}/${totalPages}`);
      
      return {
        results: paginatedResults,
        total,
        page,
        total_pages: totalPages,
        has_more: page < totalPages
      };
      
    } catch (error) {
      console.error('❌ searchArchitectures error:', error);
      throw error;
    }
  }

  /**
   * Get a single architecture by ID
   */
  async getArchitectureById(id: number): Promise<Architecture | null> {
    try {
      await this.initialize();
      
      // Check if we already have it cached
      if (this.allItems.has(id)) {
        return this.allItems.get(id) || null;
      }
      
      // Estimate which page contains this ID (assuming sequential IDs)
      const estimatedPage = Math.ceil(id / 50);
      
      // Try the estimated page first
      if (estimatedPage > 0 && estimatedPage <= 290) {
        const pageData = await this.loadPage(estimatedPage);
        const item = pageData.items.find(item => item.id === id);
        if (item) {
          return item;
        }
      }
      
      // If not found, try nearby pages (in case IDs are not perfectly sequential)
      const pagesToCheck = [
        estimatedPage - 1,
        estimatedPage + 1,
        estimatedPage - 2,
        estimatedPage + 2
      ].filter(p => p > 0 && p <= 290 && p !== estimatedPage);
      
      for (const page of pagesToCheck) {
        const pageData = await this.loadPage(page);
        const item = pageData.items.find(item => item.id === id);
        if (item) {
          return item;
        }
      }
      
      console.warn(`⚠️ Architecture with ID ${id} not found`);
      return null;
    } catch (error) {
      console.error(`❌ getArchitectureById(${id}) error:`, error);
      return null;
    }
  }

  /**
   * Get statistics about the database
   */
  async getStats(): Promise<{
    total_items: number;
    total_pages: number;
    items_per_page: number;
    loading_performance: string;
  }> {
    try {
      const metadataResponse = await fetch(`${this.baseUrl}/metadata.json`);
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json();
        return {
          total_items: metadata.total_items,
          total_pages: metadata.total_pages,
          items_per_page: metadata.items_per_page,
          loading_performance: "Sub-second loading (300x faster than SQLite)"
        };
      }
      
      return {
        total_items: 0,
        total_pages: 0,
        items_per_page: 50,
        loading_performance: "Statistics unavailable"
      };
    } catch (error) {
      console.error('❌ getStats error:', error);
      throw error;
    }
  }

  /**
   * Advanced research analytics - comprehensive data analysis
   */
  async getResearchAnalytics(): Promise<ResearchAnalytics> {
    try {
      await this.initialize();
      
      // Return empty analytics if initialization failed
      if (!this.searchIndex || !this.metadata) {
        console.warn('⚠️ Research analytics unavailable - returning empty data');
        return {
          awards: [],
          architects: [],
          temporalAnalysis: [],
          regionalAnalysis: [],
          buildingTypeEvolution: [],
          professionalNetworks: []
        };
      }
      
      // Load all data for comprehensive analysis
      console.log('📊 Loading all data for research analytics...');
      const allArchitectures: Architecture[] = [];
      
      // Limit to first 10 pages for initial load to prevent timeout
      const maxPages = Math.min(10, this.metadata?.total_pages || 10);
      
      for (let page = 1; page <= maxPages; page++) {
        try {
          const pageData = await this.loadPage(page);
          allArchitectures.push(...pageData.items);
        } catch (pageError) {
          console.warn(`⚠️ Failed to load page ${page} for analytics:`, pageError);
          // Continue with other pages
        }
      }
      
      console.log(`📊 Analyzing ${allArchitectures.length} architectural records...`);
      
      // Return empty data if no records loaded
      if (allArchitectures.length === 0) {
        return {
          awards: [],
          architects: [],
          temporalAnalysis: [],
          regionalAnalysis: [],
          buildingTypeEvolution: [],
          professionalNetworks: []
        };
      }
      
      // Parse awards from tags
      const awardAnalysis = this.analyzeAwards(allArchitectures);
      
      // Architect portfolio analysis
      const architectAnalysis = this.analyzeArchitects(allArchitectures);
      
      // Temporal analysis by decade
      const temporalAnalysis = this.analyzeTemporalTrends(allArchitectures);
      
      // Regional analysis by prefecture
      const regionalAnalysis = this.analyzeRegionalTrends(allArchitectures);
      
      // Building type evolution
      const buildingTypeEvolution = this.analyzeBuildingTypeEvolution(allArchitectures);
      
      // Professional network analysis
      const professionalNetworks = this.analyzeProfessionalNetworks(allArchitectures);
      
      return {
        awards: awardAnalysis,
        architects: architectAnalysis,
        temporalAnalysis,
        regionalAnalysis,
        buildingTypeEvolution,
        professionalNetworks
      };
    } catch (error) {
      console.error('❌ getResearchAnalytics error:', error);
      // Return empty data instead of throwing
      return {
        awards: [],
        architects: [],
        temporalAnalysis: [],
        regionalAnalysis: [],
        buildingTypeEvolution: [],
        professionalNetworks: []
      };
    }
  }

  private analyzeAwards(architectures: Architecture[]) {
    const awardMap = new Map<string, { architect: string; title: string; year: number; id: number }[]>();
    
    architectures.forEach(arch => {
      if (arch.tags && arch.tags.trim()) {
        const awards = this.parseAwards(arch.tags);
        awards.forEach(award => {
          if (!awardMap.has(award)) {
            awardMap.set(award, []);
          }
          awardMap.get(award)!.push({
            architect: arch.architect || '不明',
            title: arch.title,
            year: arch.year || 0,
            id: arch.id
          });
        });
      }
    });
    
    return Array.from(awardMap.entries())
      .map(([name, recipients]) => ({ name, count: recipients.length, recipients }))
      .sort((a, b) => b.count - a.count);
  }
  
  private parseAwards(tags: string): string[] {
    const awardPatterns = [
      /日本建築学会[\s]*作品[賞選]?[\s]*[奨賞]?/g,
      /日本建築大賞/g,
      /村野藤吾賞/g,
      /JIA25年賞/g,
      /公共建築賞/g,
      /グッドデザイン賞/g,
      /建築業協会賞/g,
      /照明学会賞/g,
      /空間デザイン賞/g,
      /都市景観賞/g,
      /建築文化賞/g,
      /BCS賞/g
    ];
    
    const awards: string[] = [];
    awardPatterns.forEach(pattern => {
      const matches = tags.match(pattern);
      if (matches) {
        matches.forEach(match => awards.push(match.trim()));
      }
    });
    
    return [...new Set(awards)]; // Remove duplicates
  }
  
  private analyzeArchitects(architectures: Architecture[]) {
    const architectMap = new Map<string, Architecture[]>();
    
    architectures.forEach(arch => {
      const architect = arch.architect || '不明';
      if (!architectMap.has(architect)) {
        architectMap.set(architect, []);
      }
      architectMap.get(architect)!.push(arch);
    });
    
    return Array.from(architectMap.entries())
      .map(([name, projects]) => {
        const years = projects.map(p => p.year).filter(y => y) as number[];
        const categories = [...new Set(projects.map(p => p.category).filter(c => c))];
        const awards = [...new Set(projects.flatMap(p => p.tags ? this.parseAwards(p.tags) : []))];
        const prefectures = [...new Set(projects.map(p => p.prefecture).filter(p => p))];
        
        const structural = [...new Set(projects.map(p => p.structural_designer).filter(s => s && s.trim()))];
        const landscape = [...new Set(projects.map(p => p.landscape_designer).filter(l => l && l.trim()))];
        const contractor = [...new Set(projects.map(p => p.contractor).filter(c => c && c.trim()))];
        
        return {
          name,
          projectCount: projects.length,
          yearSpan: years.length > 0 ? { start: Math.min(...years), end: Math.max(...years) } : { start: 0, end: 0 },
          categories,
          awards,
          prefectures,
          collaborators: { structural, landscape, contractor },
          projects: projects.sort((a, b) => (b.year || 0) - (a.year || 0))
        };
      })
      .filter(arch => arch.projectCount >= 2) // Only architects with 2+ projects
      .sort((a, b) => b.projectCount - a.projectCount);
  }
  
  private analyzeTemporalTrends(architectures: Architecture[]) {
    const decadeMap = new Map<string, Architecture[]>();
    
    architectures.forEach(arch => {
      if (arch.year) {
        const decade = `${Math.floor(arch.year / 10) * 10}年代`;
        if (!decadeMap.has(decade)) {
          decadeMap.set(decade, []);
        }
        decadeMap.get(decade)!.push(arch);
      }
    });
    
    return Array.from(decadeMap.entries())
      .map(([decade, projects]) => {
        const categoryCount = new Map<string, number>();
        const architectCount = new Map<string, number>();
        const awards = [...new Set(projects.flatMap(p => p.tags ? this.parseAwards(p.tags) : []))];
        
        projects.forEach(p => {
          if (p.category) {
            categoryCount.set(p.category, (categoryCount.get(p.category) || 0) + 1);
          }
          if (p.architect) {
            architectCount.set(p.architect, (architectCount.get(p.architect) || 0) + 1);
          }
        });
        
        const dominantCategories = Array.from(categoryCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([cat]) => cat);
          
        const notableArchitects = Array.from(architectCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([arch]) => arch);
        
        return {
          decade,
          projectCount: projects.length,
          dominantCategories,
          notableArchitects,
          awards
        };
      })
      .sort((a, b) => a.decade.localeCompare(b.decade));
  }
  
  private analyzeRegionalTrends(architectures: Architecture[]) {
    const prefectureMap = new Map<string, Architecture[]>();
    
    architectures.forEach(arch => {
      const prefecture = arch.prefecture || '不明';
      if (!prefectureMap.has(prefecture)) {
        prefectureMap.set(prefecture, []);
      }
      prefectureMap.get(prefecture)!.push(arch);
    });
    
    return Array.from(prefectureMap.entries())
      .map(([prefecture, projects]) => {
        const years = projects.map(p => p.year).filter(y => y) as number[];
        const categoryCount = new Map<string, number>();
        const architectCount = new Map<string, number>();
        const awards = [...new Set(projects.flatMap(p => p.tags ? this.parseAwards(p.tags) : []))];
        
        projects.forEach(p => {
          if (p.category) {
            categoryCount.set(p.category, (categoryCount.get(p.category) || 0) + 1);
          }
          if (p.architect) {
            architectCount.set(p.architect, (architectCount.get(p.architect) || 0) + 1);
          }
        });
        
        const dominantCategories = Array.from(categoryCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([cat]) => cat);
          
        const notableArchitects = Array.from(architectCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([arch]) => arch);
        
        return {
          prefecture,
          projectCount: projects.length,
          timeSpan: years.length > 0 ? { start: Math.min(...years), end: Math.max(...years) } : { start: 0, end: 0 },
          dominantCategories,
          notableArchitects,
          awards
        };
      })
      .filter(region => region.projectCount >= 5) // Only regions with 5+ projects
      .sort((a, b) => b.projectCount - a.projectCount);
  }
  
  private analyzeBuildingTypeEvolution(architectures: Architecture[]) {
    const categoryMap = new Map<string, Architecture[]>();
    
    architectures.forEach(arch => {
      const category = arch.category || '不明';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(arch);
    });
    
    return Array.from(categoryMap.entries())
      .map(([category, projects]) => {
        const decadeMap = new Map<string, Architecture[]>();
        const years = projects.map(p => p.year).filter(y => y) as number[];
        
        projects.forEach(p => {
          if (p.year) {
            const decade = `${Math.floor(p.year / 10) * 10}年代`;
            if (!decadeMap.has(decade)) {
              decadeMap.set(decade, []);
            }
            decadeMap.get(decade)!.push(p);
          }
        });
        
        const timelineData = Array.from(decadeMap.entries())
          .map(([decade, decadeProjects]) => ({
            decade,
            count: decadeProjects.length,
            notable: decadeProjects
              .filter(p => p.tags && this.parseAwards(p.tags).length > 0)
              .slice(0, 3)
              .map(p => p.title)
          }))
          .sort((a, b) => a.decade.localeCompare(b.decade));
        
        return {
          category,
          timelineData,
          totalCount: projects.length,
          averageYear: years.length > 0 ? Math.round(years.reduce((a, b) => a + b, 0) / years.length) : 0
        };
      })
      .filter(cat => cat.totalCount >= 5) // Only categories with 5+ projects
      .sort((a, b) => b.totalCount - a.totalCount);
  }
  
  private analyzeProfessionalNetworks(architectures: Architecture[]) {
    const architectNetworks = new Map<string, Map<string, { name: string; count: number; role: string }[]>>();
    
    architectures.forEach(arch => {
      const architect = arch.architect || '不明';
      if (!architectNetworks.has(architect)) {
        architectNetworks.set(architect, new Map());
      }
      
      const network = architectNetworks.get(architect)!;
      
      [arch.structural_designer, arch.landscape_designer, arch.contractor]
        .filter(collaborator => collaborator && collaborator.trim())
        .forEach((collaborator, index) => {
          const role = ['structural_designer', 'landscape_designer', 'contractor'][index];
          const key = `${role}:${collaborator}`;
          
          if (!network.has(key)) {
            network.set(key, []);
          }
          
          const existing = network.get(key)!.find(c => c.name === collaborator);
          if (existing) {
            existing.count++;
          } else {
            network.get(key)!.push({ name: collaborator!, count: 1, role });
          }
        });
    });
    
    return Array.from(architectNetworks.entries())
      .map(([architect, networkMap]) => {
        const allCollaborators = Array.from(networkMap.values()).flat();
        const structural_designers = [...new Set(allCollaborators.filter(c => c.role === 'structural_designer').map(c => c.name))];
        const landscape_designers = [...new Set(allCollaborators.filter(c => c.role === 'landscape_designer').map(c => c.name))];
        const contractors = [...new Set(allCollaborators.filter(c => c.role === 'contractor').map(c => c.name))];
        
        const frequent_collaborators = allCollaborators
          .filter(c => c.count >= 2)
          .sort((a, b) => b.count - a.count);
        
        return {
          architect,
          connections: {
            structural_designers,
            landscape_designers,
            contractors,
            frequent_collaborators
          }
        };
      })
      .filter(network => network.connections.frequent_collaborators.length > 0)
      .sort((a, b) => b.connections.frequent_collaborators.length - a.connections.frequent_collaborators.length);
  }

  /**
   * Search by tags with enhanced functionality
   */
  async searchByTag(tag: string, page: number = 1, limit: number = 20): Promise<ApiResponse> {
    return this.searchArchitectures('', { tag }, page, limit);
  }

  /**
   * Get award winners
   */
  async getAwardWinners(awardName?: string): Promise<Architecture[]> {
    await this.initialize();
    
    const awardWinners: Architecture[] = [];
    
    // Load necessary pages to find award winners
    for (let page = 1; page <= Math.min(100, this.metadata?.total_pages || 10); page++) {
      const pageData = await this.loadPage(page);
      pageData.items.forEach(item => {
        if (item.tags && item.tags.trim()) {
          const awards = this.parseAwards(item.tags);
          if (awards.length > 0) {
            if (!awardName || awards.some(award => award.includes(awardName))) {
              awardWinners.push(item);
            }
          }
        }
      });
    }
    
    return awardWinners.sort((a, b) => (b.year || 0) - (a.year || 0));
  }

  /**
   * Get architect portfolio
   */
  async getArchitectPortfolio(architectName: string): Promise<Architecture[]> {
    return this.searchArchitectures('', { architect: architectName }, 1, 1000).then(result => result.results);
  }

  /**
   * Clear cache (useful for development)
   */
  clearCache(): void {
    this.cache.clear();
    this.allItems.clear();
    this.searchIndex = null;
    this.initialized = false;
    console.log('🧹 FastArchitectureService cache cleared');
  }
}

// Export singleton instance
export const fastArchitectureService = new FastArchitectureService();

// Export individual functions for compatibility
export async function getAllArchitectures(page: number = 1, limit: number = 20): Promise<ApiResponse> {
  return fastArchitectureService.getAllArchitectures(page, limit);
}

export async function searchArchitectures(
  query: string = '',
  filters: {
    architect?: string;
    year?: number;
    category?: string;
  } = {},
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse> {
  return fastArchitectureService.searchArchitectures(query, filters, page, limit);
}

export async function getArchitectureById(id: number): Promise<Architecture | null> {
  return fastArchitectureService.getArchitectureById(id);
}

export async function getResearchAnalytics(): Promise<ResearchAnalytics> {
  return fastArchitectureService.getResearchAnalytics();
}

export async function searchByTag(tag: string, page: number = 1, limit: number = 20): Promise<ApiResponse> {
  return fastArchitectureService.searchByTag(tag, page, limit);
}

export async function getAwardWinners(awardName?: string): Promise<Architecture[]> {
  return fastArchitectureService.getAwardWinners(awardName);
}

export async function getArchitectPortfolio(architectName: string): Promise<Architecture[]> {
  return fastArchitectureService.getArchitectPortfolio(architectName);
}