export interface CreateEventDto {
  title: string;
  description?: string;
  venue: string;
  timezone?: string;
  startDate: string;
  endDate: string;
  category?: string;
  coverImageUrl?: string;
  galleryImages?: string[];
  isFree?: boolean;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  venue?: string;
  timezone?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  coverImageUrl?: string;
  galleryImages?: string[];
  isFree?: boolean;
}

export interface CreateTicketTierDto {
  name: string;
  description?: string;
  price: number;
  totalQuantity: number;
  features?: string[];
}

export interface UpdateTicketTierDto {
  name?: string;
  description?: string;
  price?: number;
  totalQuantity?: number;
  features?: string[];
}

export interface EventQuery {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
}
