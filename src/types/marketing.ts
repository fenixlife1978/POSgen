export type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate?: string;
  status: CampaignStatus;
  channel: 'social' | 'email' | 'search' | 'display' | 'other';
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
  };
}

export interface Lead {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  source: string;
  campaignId?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  createdAt: string;
}

export interface MarketingAnalytics {
  date: string;
  revenue: number;
  spend: number;
  leads: number;
  roi: number;
}