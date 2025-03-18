export interface Building {
  id: string;
  name: string;
  architect: string;
  year: number;
  prefecture: string;
  city: string;
  address?: string;
  latitude: number;
  longitude: number;
  description?: string;
  images?: string[];
  references?: Reference[];
  visits?: Visit[];
  socialMedia?: SocialMedia[];
}

export interface Reference {
  id: string;
  type: 'book' | 'article' | 'video' | 'website';
  title: string;
  author?: string;
  url?: string;
  publisher?: string;
  year?: number;
  description?: string;
}

export interface Visit {
  id: string;
  source: 'note' | 'blog' | 'other';
  title: string;
  author: string;
  url: string;
  date?: string;
  excerpt?: string;
}

export interface SocialMedia {
  id: string;
  platform: 'twitter' | 'instagram' | 'facebook' | 'other';
  url: string;
  author?: string;
  date?: string;
  content?: string;
}
