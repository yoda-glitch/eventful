export interface EventAnalytics {
  eventId: string;
  eventTitle: string;
  totalRevenue: number;
  totalTicketsSold: number;
  totalTickets: number;
  capacityUtilization: number;
  attendance: {
    totalTickets: number;
    scannedTickets: number;
    attendanceRate: number;
  };
  tiers: TierAnalytics[];
}

export interface TierAnalytics {
  tierId: string;
  name: string;
  price: number;
  totalQuantity: number;
  soldQuantity: number;
  revenue: number;
  utilization: number;
}

export interface PlatformAnalytics {
  totalEvents: number;
  totalRevenue: number;
  totalTicketsSold: number;
  totalUsers: number;
  topEvents: TopEvent[];
}

export interface TopEvent {
  eventId: string;
  eventTitle: string;
  totalRevenue: number;
  totalTicketsSold: number;
}
