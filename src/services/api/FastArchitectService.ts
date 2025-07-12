/**
 * Fast Architect Service - JSON-based API for architects
 * Simple, reliable service following the same pattern as FastArchitectureService
 */

export interface Architect {
  id: number;
  name: string;
  nameJp?: string;
  nameEn?: string;
  birthYear?: number;
  deathYear?: number;
  nationality?: string;
  category?: string;
  school?: string;
  office?: string;
  bio?: string;
  mainWorks?: string;
  awards?: string;
  imageUrl?: string;
  // Legacy field mapping for compatibility
  ZAT_ID?: number;
  Z_PK?: number;
  ZAT_ARCHITECT?: string;
  ZAT_ARCHITECT_JP?: string;
  ZAT_ARCHITECT_EN?: string;
  ZAT_BIRTHYEAR?: number;
  ZAT_DEATHYEAR?: number;
  ZAT_NATIONALITY?: string;
  ZAT_CATEGORY?: string;
  ZAT_SCHOOL?: string;
  ZAT_OFFICE?: string;
  ZAT_BIO?: string;
  ZAT_MAINWORKS?: string;
  ZAT_AWARDS?: string;
  ZAT_IMAGE?: string;
}

export interface ArchitectResponse {
  results: Architect[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Mock data for architects (in a real app, this would come from an API or JSON file)
const mockArchitects: Architect[] = [
  {
    id: 1,
    name: "安藤忠雄",
    nameJp: "あんどう ただお",
    nameEn: "Tadao Ando",
    birthYear: 1941,
    nationality: "日本",
    category: "建築家",
    school: "独学",
    office: "安藤忠雄建築研究所",
    bio: "コンクリート打ちっ放しの建築で知られる世界的な建築家",
    mainWorks: "住吉の長屋、光の教会、地中美術館",
    awards: "プリツカー賞、日本建築学会賞",
    ZAT_ID: 1,
    Z_PK: 1,
    ZAT_ARCHITECT: "安藤忠雄",
    ZAT_ARCHITECT_JP: "あんどう ただお",
    ZAT_ARCHITECT_EN: "Tadao Ando",
    ZAT_BIRTHYEAR: 1941,
    ZAT_NATIONALITY: "日本",
    ZAT_CATEGORY: "建築家",
    ZAT_SCHOOL: "独学",
    ZAT_OFFICE: "安藤忠雄建築研究所",
    ZAT_BIO: "コンクリート打ちっ放しの建築で知られる世界的な建築家",
    ZAT_MAINWORKS: "住吉の長屋、光の教会、地中美術館",
    ZAT_AWARDS: "プリツカー賞、日本建築学会賞"
  },
  {
    id: 2,
    name: "隈研吾",
    nameJp: "くま けんご",
    nameEn: "Kengo Kuma",
    birthYear: 1954,
    nationality: "日本",
    category: "建築家",
    school: "東京大学",
    office: "隈研吾建築都市設計事務所",
    bio: "木材を使用した温かみのある建築で知られる",
    mainWorks: "根津美術館、新国立競技場、浅草文化観光センター",
    awards: "日本建築学会賞、AIAゴールドメダル",
    ZAT_ID: 2,
    Z_PK: 2,
    ZAT_ARCHITECT: "隈研吾",
    ZAT_ARCHITECT_JP: "くま けんご",
    ZAT_ARCHITECT_EN: "Kengo Kuma",
    ZAT_BIRTHYEAR: 1954,
    ZAT_NATIONALITY: "日本",
    ZAT_CATEGORY: "建築家",
    ZAT_SCHOOL: "東京大学",
    ZAT_OFFICE: "隈研吾建築都市設計事務所",
    ZAT_BIO: "木材を使用した温かみのある建築で知られる",
    ZAT_MAINWORKS: "根津美術館、新国立競技場、浅草文化観光センター",
    ZAT_AWARDS: "日本建築学会賞、AIAゴールドメダル"
  },
  {
    id: 3,
    name: "伊東豊雄",
    nameJp: "いとう とよお",
    nameEn: "Toyo Ito",
    birthYear: 1941,
    nationality: "日本",
    category: "建築家",
    school: "東京大学",
    office: "伊東豊雄建築設計事務所",
    bio: "流動的で軽やかな建築で知られる",
    mainWorks: "せんだいメディアテーク、TOD'S表参道ビル、台中国家歌劇院",
    awards: "プリツカー賞、日本建築学会賞",
    ZAT_ID: 3,
    Z_PK: 3,
    ZAT_ARCHITECT: "伊東豊雄",
    ZAT_ARCHITECT_JP: "いとう とよお",
    ZAT_ARCHITECT_EN: "Toyo Ito",
    ZAT_BIRTHYEAR: 1941,
    ZAT_NATIONALITY: "日本",
    ZAT_CATEGORY: "建築家",
    ZAT_SCHOOL: "東京大学",
    ZAT_OFFICE: "伊東豊雄建築設計事務所",
    ZAT_BIO: "流動的で軽やかな建築で知られる",
    ZAT_MAINWORKS: "せんだいメディアテーク、TOD'S表参道ビル、台中国家歌劇院",
    ZAT_AWARDS: "プリツカー賞、日本建築学会賞"
  },
  {
    id: 4,
    name: "坂茂",
    nameJp: "ばん しげる",
    nameEn: "Shigeru Ban",
    birthYear: 1957,
    nationality: "日本",
    category: "建築家",
    school: "南カリフォルニア建築大学",
    office: "坂茂建築設計",
    bio: "紙管を使った建築や災害復興支援で知られる",
    mainWorks: "ポンピドゥー・センター・メス、紙の教会、カーテンウォールハウス",
    awards: "プリツカー賞、日本建築学会賞",
    ZAT_ID: 4,
    Z_PK: 4,
    ZAT_ARCHITECT: "坂茂",
    ZAT_ARCHITECT_JP: "ばん しげる",
    ZAT_ARCHITECT_EN: "Shigeru Ban",
    ZAT_BIRTHYEAR: 1957,
    ZAT_NATIONALITY: "日本",
    ZAT_CATEGORY: "建築家",
    ZAT_SCHOOL: "南カリフォルニア建築大学",
    ZAT_OFFICE: "坂茂建築設計",
    ZAT_BIO: "紙管を使った建築や災害復興支援で知られる",
    ZAT_MAINWORKS: "ポンピドゥー・センター・メス、紙の教会、カーテンウォールハウス",
    ZAT_AWARDS: "プリツカー賞、日本建築学会賞"
  },
  {
    id: 5,
    name: "妹島和世",
    nameJp: "せじま かずよ",
    nameEn: "Kazuyo Sejima",
    birthYear: 1956,
    nationality: "日本",
    category: "建築家",
    school: "日本女子大学",
    office: "SANAA",
    bio: "透明感のある軽やかな建築で知られる",
    mainWorks: "金沢21世紀美術館、ルーヴル・ランス、日立駅",
    awards: "プリツカー賞、日本建築学会賞",
    ZAT_ID: 5,
    Z_PK: 5,
    ZAT_ARCHITECT: "妹島和世",
    ZAT_ARCHITECT_JP: "せじま かずよ",
    ZAT_ARCHITECT_EN: "Kazuyo Sejima",
    ZAT_BIRTHYEAR: 1956,
    ZAT_NATIONALITY: "日本",
    ZAT_CATEGORY: "建築家",
    ZAT_SCHOOL: "日本女子大学",
    ZAT_OFFICE: "SANAA",
    ZAT_BIO: "透明感のある軽やかな建築で知られる",
    ZAT_MAINWORKS: "金沢21世紀美術館、ルーヴル・ランス、日立駅",
    ZAT_AWARDS: "プリツカー賞、日本建築学会賞"
  },
  {
    id: 6,
    name: "西沢立衛",
    nameJp: "にしざわ りゅうえ",
    nameEn: "Ryue Nishizawa",
    birthYear: 1966,
    nationality: "日本",
    category: "建築家",
    school: "横浜国立大学",
    office: "SANAA / 西沢立衛建築設計事務所",
    bio: "軽やかで詩的な建築を創造する",
    mainWorks: "森山邸、豊島美術館、十和田市現代美術館",
    awards: "プリツカー賞、日本建築学会賞",
    ZAT_ID: 6,
    Z_PK: 6,
    ZAT_ARCHITECT: "西沢立衛",
    ZAT_ARCHITECT_JP: "にしざわ りゅうえ",
    ZAT_ARCHITECT_EN: "Ryue Nishizawa",
    ZAT_BIRTHYEAR: 1966,
    ZAT_NATIONALITY: "日本",
    ZAT_CATEGORY: "建築家",
    ZAT_SCHOOL: "横浜国立大学",
    ZAT_OFFICE: "SANAA / 西沢立衛建築設計事務所",
    ZAT_BIO: "軽やかで詩的な建築を創造する",
    ZAT_MAINWORKS: "森山邸、豊島美術館、十和田市現代美術館",
    ZAT_AWARDS: "プリツカー賞、日本建築学会賞"
  }
];

/**
 * Get all architects with pagination and search
 */
export const getAllArchitects = async (
  page: number = 1,
  limit: number = 12,
  searchTerm: string = '',
  sortBy: string = 'name_asc'
): Promise<ArchitectResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  let filteredArchitects = [...mockArchitects];

  // Search filtering
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredArchitects = filteredArchitects.filter(architect => 
      architect.name?.toLowerCase().includes(term) ||
      architect.nameEn?.toLowerCase().includes(term) ||
      architect.nationality?.toLowerCase().includes(term) ||
      architect.category?.toLowerCase().includes(term) ||
      architect.school?.toLowerCase().includes(term) ||
      architect.mainWorks?.toLowerCase().includes(term)
    );
  }

  // Sorting
  filteredArchitects.sort((a, b) => {
    switch (sortBy) {
      case 'name_asc':
        return (a.name || '').localeCompare(b.name || '');
      case 'name_desc':
        return (b.name || '').localeCompare(a.name || '');
      case 'birth_year_asc':
        return (a.birthYear || 0) - (b.birthYear || 0);
      case 'birth_year_desc':
        return (b.birthYear || 0) - (a.birthYear || 0);
      default:
        return (a.name || '').localeCompare(b.name || '');
    }
  });

  // Pagination
  const total = filteredArchitects.length;
  const offset = (page - 1) * limit;
  const paginatedArchitects = filteredArchitects.slice(offset, offset + limit);

  return {
    results: paginatedArchitects,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Search architects with additional filters
 */
export const searchArchitects = async (
  searchTerm: string = '',
  filters: {
    nationality?: string;
    category?: string;
    school?: string;
    birthYearFrom?: number;
    birthYearTo?: number;
  } = {},
  page: number = 1,
  limit: number = 12
): Promise<ArchitectResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 150));

  let filteredArchitects = [...mockArchitects];

  // Text search
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredArchitects = filteredArchitects.filter(architect => 
      architect.name?.toLowerCase().includes(term) ||
      architect.nameEn?.toLowerCase().includes(term) ||
      architect.nationality?.toLowerCase().includes(term) ||
      architect.category?.toLowerCase().includes(term) ||
      architect.school?.toLowerCase().includes(term) ||
      architect.mainWorks?.toLowerCase().includes(term) ||
      architect.awards?.toLowerCase().includes(term)
    );
  }

  // Apply filters
  if (filters.nationality) {
    filteredArchitects = filteredArchitects.filter(
      architect => architect.nationality === filters.nationality
    );
  }

  if (filters.category) {
    filteredArchitects = filteredArchitects.filter(
      architect => architect.category === filters.category
    );
  }

  if (filters.school) {
    filteredArchitects = filteredArchitects.filter(
      architect => architect.school?.includes(filters.school!)
    );
  }

  if (filters.birthYearFrom) {
    filteredArchitects = filteredArchitects.filter(
      architect => (architect.birthYear || 0) >= filters.birthYearFrom!
    );
  }

  if (filters.birthYearTo) {
    filteredArchitects = filteredArchitects.filter(
      architect => (architect.birthYear || 0) <= filters.birthYearTo!
    );
  }

  // Pagination
  const total = filteredArchitects.length;
  const offset = (page - 1) * limit;
  const paginatedArchitects = filteredArchitects.slice(offset, offset + limit);

  return {
    results: paginatedArchitects,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Get architect by ID
 */
export const getArchitectById = async (id: number): Promise<Architect | null> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));

  const architect = mockArchitects.find(a => a.id === id || a.ZAT_ID === id || a.Z_PK === id);
  return architect || null;
};

/**
 * Get unique nationalities for filter options
 */
export const getArchitectNationalities = async (): Promise<string[]> => {
  const nationalities = [...new Set(mockArchitects.map(a => a.nationality).filter(Boolean))];
  return nationalities.sort();
};

/**
 * Get unique categories for filter options
 */
export const getArchitectCategories = async (): Promise<string[]> => {
  const categories = [...new Set(mockArchitects.map(a => a.category).filter(Boolean))];
  return categories.sort();
};

/**
 * Get unique schools for filter options
 */
export const getArchitectSchools = async (): Promise<string[]> => {
  const schools = [...new Set(mockArchitects.map(a => a.school).filter(Boolean))];
  return schools.sort();
};