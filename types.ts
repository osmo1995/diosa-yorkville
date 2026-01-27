
export interface Service {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  price: string;
  duration: string;
  longevity: string;
  imageUrl: string;
}

export type ImageAsset = {
  /** Pexels photo id for stable curation/debugging */
  photoId?: number;
  /** Primary src used when srcSet is not supported */
  src: string;
  /** Responsive candidates, e.g. "... 400w, ... 700w" */
  srcSet: string;
  photographer: string;
  photographerUrl: string;
  pexelsUrl: string;
  avgColor: string;
};

export type PexelsImageMap = {
  hero: ImageAsset;
  cta: ImageAsset;
  quiz: ImageAsset;
  services: Record<string, ImageAsset>;
  transformations: Record<string, ImageAsset>;
  gallery: Record<'Blonde' | 'Volume' | 'Length', ImageAsset[]>;
};

export interface Transformation {
  id: string;
  before: string;
  after: string;
  /** Display label such as "Hand-Tied Wefts • Champagne Blonde" */
  method: string;
  /** Optional richer title for UI overlays */
  title?: string;
  /** Category used for ordering/filters */
  category?: 'extensions' | 'color';
  tags?: string[];
}

export interface GalleryItem {
  id: string;
  /** Fallback/simple URL for older code paths */
  url: string;
  category: 'Blonde' | 'Volume' | 'Length';
  title: string;
  /** Optional full responsive asset */
  asset?: ImageAsset;
}

export interface FAQ {
  question: string;
  answer: string;
}

export type TrustBadge = {
  title: string;
  subtitle: string;
};

export type ProcessStep = {
  title: string;
  description: string;
};

export type AftercareTip = {
  title: string;
  description: string;
};

export interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
}
