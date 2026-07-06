export interface ListingComment {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface ListingEngagement {
  views: number;
  likes: number;
  comments: ListingComment[];
}

export interface PublicListingPosition {
  title: string;
  salary?: string | null;
  workingHours?: string | null;
  description?: string | null;
  sortOrder: number;
}

export interface PublicListingSummary {
  id: string;
  title: string | null;
  businessType?: string | null;
  address?: string | null;
  contactPhone?: string | null;
  citySlug?: string | null;
  cityName?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  imageUrl?: string | null;
  vacancyCount: number;
  firstVacancyTitle?: string | null;
  firstSalary?: string | null;
  positionTitles?: string[];
  publishedAt?: string | null;
  isPinned?: boolean;
  isFeatured?: boolean;
}

export interface BrowseCategory {
  slug: string;
  name: string;
}

export interface BrowseTelegramChannel {
  name: string;
  url: string;
  channelId: string;
}

export interface ProjectBrowseMeta {
  categories: BrowseCategory[];
  telegramChannels: BrowseTelegramChannel[];
  botUsername: string | null;
}

export interface PublicListingDetail extends PublicListingSummary {
  projectId: string;
  description?: string | null;
  price?: number | null;
  currency?: string;
  projectSlug: string;
  projectName: string;
  categoryName: string;
  city?: { name: string; slug: string } | null;
  district?: { name: string } | null;
  media: { url: string; sortOrder: number }[];
  positions: PublicListingPosition[];
}
