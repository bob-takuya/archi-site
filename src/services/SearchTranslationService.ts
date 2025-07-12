/**
 * Search Translation Service
 * 
 * Provides English-Japanese translation for search terms to improve
 * international accessibility of the architecture database.
 */

// English to Japanese architectural term mappings
const ENGLISH_TO_JAPANESE: Record<string, string[]> = {
  // Building types
  'museum': ['博物館', 'ミュージアム'],
  'library': ['図書館', 'ライブラリー'],
  'hospital': ['病院'],
  'school': ['学校', '大学', '高校', '中学校', '小学校'],
  'university': ['大学'],
  'hotel': ['ホテル'],
  'station': ['駅', 'ステーション'],
  'airport': ['空港', 'エアポート'],
  'temple': ['寺', '寺院', 'お寺'],
  'shrine': ['神社', '神宮'],
  'church': ['教会', 'チャーチ'],
  'tower': ['タワー', '塔'],
  'bridge': ['橋', 'ブリッジ'],
  'park': ['公園', 'パーク'],
  'theater': ['劇場', 'シアター'],
  'cinema': ['映画館', 'シネマ'],
  'office': ['オフィス', '事務所', 'ビル'],
  'building': ['ビル', '建物', '建築物'],
  'house': ['住宅', '家', 'ハウス'],
  'apartment': ['アパート', 'マンション'],
  'shop': ['店', 'ショップ'],
  'mall': ['モール', 'ショッピングセンター'],
  'factory': ['工場', 'ファクトリー'],
  'warehouse': ['倉庫'],
  'stadium': ['スタジアム', '競技場'],
  'gym': ['体育館', 'ジム'],
  'restaurant': ['レストラン', '飲食店'],
  'cafe': ['カフェ', '喫茶店'],
  'gallery': ['ギャラリー', '画廊'],
  'studio': ['スタジオ', '工房'],
  'center': ['センター', '中心'],
  'hall': ['ホール', '会館'],
  'pavilion': ['パビリオン'],
  'residence': ['住宅', '邸宅', 'レジデンス'],
  
  // Locations
  'tokyo': ['東京', '東京都'],
  'osaka': ['大阪', '大阪府'],
  'kyoto': ['京都', '京都府'],
  'yokohama': ['横浜'],
  'kobe': ['神戸'],
  'nagoya': ['名古屋'],
  'sapporo': ['札幌'],
  'fukuoka': ['福岡'],
  'sendai': ['仙台'],
  'hiroshima': ['広島'],
  'kanagawa': ['神奈川', '神奈川県'],
  'chiba': ['千葉', '千葉県'],
  'saitama': ['埼玉', '埼玉県'],
  'hokkaido': ['北海道'],
  'aichi': ['愛知', '愛知県'],
  'hyogo': ['兵庫', '兵庫県'],
  'shizuoka': ['静岡', '静岡県'],
  'nara': ['奈良', '奈良県'],
  'gifu': ['岐阜', '岐阜県'],
  'ibaraki': ['茨城', '茨城県'],
  'tochigi': ['栃木', '栃木県'],
  'gunma': ['群馬', '群馬県'],
  'niigata': ['新潟', '新潟県'],
  'nagano': ['長野', '長野県'],
  'yamanashi': ['山梨', '山梨県'],
  'shiga': ['滋賀', '滋賀県'],
  'mie': ['三重', '三重県'],
  'wakayama': ['和歌山', '和歌山県'],
  'okayama': ['岡山', '岡山県'],
  'yamaguchi': ['山口', '山口県'],
  'shimane': ['島根', '島根県'],
  'tottori': ['鳥取', '鳥取県'],
  'kagawa': ['香川', '香川県'],
  'tokushima': ['徳島', '徳島県'],
  'ehime': ['愛媛', '愛媛県'],
  'kochi': ['高知', '高知県'],
  'saga': ['佐賀', '佐賀県'],
  'nagasaki': ['長崎', '長崎県'],
  'kumamoto': ['熊本', '熊本県'],
  'oita': ['大分', '大分県'],
  'miyazaki': ['宮崎', '宮崎県'],
  'kagoshima': ['鹿児島', '鹿児島県'],
  'okinawa': ['沖縄', '沖縄県'],
  
  // Architect names (romanized)
  'ando': ['安藤忠雄', '安藤'],
  'tadao ando': ['安藤忠雄'],
  'kuma': ['隈研吾', '隈'],
  'kengo kuma': ['隈研吾'],
  'ito': ['伊東豊雄', '伊東'],
  'toyo ito': ['伊東豊雄'],
  'sejima': ['妹島和世', '妹島'],
  'kazuyo sejima': ['妹島和世'],
  'nishizawa': ['西沢立衛', '西沢'],
  'ryue nishizawa': ['西沢立衛'],
  'sanaa': ['SANAA', 'サナー'],
  'fujimoto': ['藤本壮介', '藤本'],
  'sou fujimoto': ['藤本壮介'],
  'ban': ['坂茂', '坂'],
  'shigeru ban': ['坂茂'],
  'yamamoto': ['山本理顕', '山本'],
  'riken yamamoto': ['山本理顕'],
  'ishigami': ['石上純也', '石上'],
  'junya ishigami': ['石上純也'],
  'hasegawa': ['長谷川逸子', '長谷川'],
  'itsuko hasegawa': ['長谷川逸子'],
  'kikutake': ['菊竹清訓', '菊竹'],
  'kiyonori kikutake': ['菊竹清訓'],
  'tange': ['丹下健三', '丹下'],
  'kenzo tange': ['丹下健三'],
  'maki': ['槇文彦', '槇'],
  'fumihiko maki': ['槇文彦'],
  'isozaki': ['磯崎新', '磯崎'],
  'arata isozaki': ['磯崎新'],
  
  // Architectural styles and terms
  'modern': ['モダン', '現代'],
  'contemporary': ['現代的', 'コンテンポラリー'],
  'traditional': ['伝統的', '和風'],
  'minimalist': ['ミニマル', 'シンプル'],
  'brutalist': ['ブルータリスト'],
  'metabolist': ['メタボリスト'],
  'wooden': ['木造', '木製'],
  'concrete': ['コンクリート', 'RC'],
  'steel': ['鉄骨', 'スチール'],
  'glass': ['ガラス'],
  'sustainable': ['持続可能', 'サステナブル'],
  'green': ['グリーン', '環境'],
  'ecological': ['エコロジカル', '生態'],
  'design': ['デザイン', '設計'],
  'architecture': ['建築', 'アーキテクチャー'],
  'construction': ['建設', '建造'],
  'renovation': ['改修', 'リノベーション'],
  'restoration': ['修復', '復元'],
};

// Japanese to English mappings (reverse lookup)
const JAPANESE_TO_ENGLISH: Record<string, string[]> = {};

// Build reverse mappings
Object.entries(ENGLISH_TO_JAPANESE).forEach(([english, japaneseTerms]) => {
  japaneseTerms.forEach(japanese => {
    if (!JAPANESE_TO_ENGLISH[japanese]) {
      JAPANESE_TO_ENGLISH[japanese] = [];
    }
    JAPANESE_TO_ENGLISH[japanese].push(english);
  });
});

/**
 * Translate English search terms to Japanese equivalents
 * @param searchTerm The English search term
 * @returns Array of Japanese translations
 */
export function translateEnglishToJapanese(searchTerm: string): string[] {
  const lowerTerm = searchTerm.toLowerCase().trim();
  
  // Direct lookup
  if (ENGLISH_TO_JAPANESE[lowerTerm]) {
    return ENGLISH_TO_JAPANESE[lowerTerm];
  }
  
  // Partial matches for compound terms
  const matches: string[] = [];
  Object.entries(ENGLISH_TO_JAPANESE).forEach(([english, japanese]) => {
    if (lowerTerm.includes(english) || english.includes(lowerTerm)) {
      matches.push(...japanese);
    }
  });
  
  return [...new Set(matches)]; // Remove duplicates
}

/**
 * Translate Japanese search terms to English equivalents
 * @param searchTerm The Japanese search term
 * @returns Array of English translations
 */
export function translateJapaneseToEnglish(searchTerm: string): string[] {
  const trimmedTerm = searchTerm.trim();
  
  // Direct lookup
  if (JAPANESE_TO_ENGLISH[trimmedTerm]) {
    return JAPANESE_TO_ENGLISH[trimmedTerm];
  }
  
  // Partial matches
  const matches: string[] = [];
  Object.entries(JAPANESE_TO_ENGLISH).forEach(([japanese, english]) => {
    if (trimmedTerm.includes(japanese) || japanese.includes(trimmedTerm)) {
      matches.push(...english);
    }
  });
  
  return [...new Set(matches)]; // Remove duplicates
}

/**
 * Enhance search terms with translations
 * @param searchTerm Original search term
 * @returns Enhanced search terms including translations
 */
export function enhanceSearchTerms(searchTerm: string): string[] {
  const terms = [searchTerm]; // Always include original term
  
  // Detect if term is likely English or Japanese
  const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(searchTerm);
  
  if (hasJapanese) {
    // Add English translations
    terms.push(...translateJapaneseToEnglish(searchTerm));
  } else {
    // Add Japanese translations
    terms.push(...translateEnglishToJapanese(searchTerm));
  }
  
  return [...new Set(terms)]; // Remove duplicates
}

/**
 * Create a comprehensive search pattern for SQL LIKE queries
 * @param searchTerm Original search term
 * @returns SQL search patterns for both original and translated terms
 */
export function createSearchPatterns(searchTerm: string): string[] {
  const enhancedTerms = enhanceSearchTerms(searchTerm);
  const patterns: string[] = [];
  
  enhancedTerms.forEach(term => {
    patterns.push(`%${term}%`);
    // Also add patterns for partial matches
    if (term.length > 2) {
      patterns.push(`${term}%`); // Starts with
      patterns.push(`%${term}`);  // Ends with
    }
  });
  
  return [...new Set(patterns)]; // Remove duplicates
}

/**
 * Check if a search term is likely English
 * @param searchTerm The search term to check
 * @returns True if term appears to be English
 */
export function isEnglishTerm(searchTerm: string): boolean {
  return !/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(searchTerm);
}

/**
 * Check if a search term is likely Japanese
 * @param searchTerm The search term to check
 * @returns True if term appears to be Japanese
 */
export function isJapaneseTerm(searchTerm: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(searchTerm);
}

/**
 * Get all available translation mappings (for debugging/admin)
 * @returns Object containing all translation mappings
 */
export function getAllTranslations() {
  return {
    englishToJapanese: ENGLISH_TO_JAPANESE,
    japaneseToEnglish: JAPANESE_TO_ENGLISH,
    totalEnglishTerms: Object.keys(ENGLISH_TO_JAPANESE).length,
    totalJapaneseTerms: Object.keys(JAPANESE_TO_ENGLISH).length
  };
}