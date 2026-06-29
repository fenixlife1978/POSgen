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

export interface Worker {
  id: string;
  name: string;
  avatar?: string;
  whatsapp: string;
  status: 'active' | 'inactive';
  subIds: SubId[];
}

export interface SubId {
  id: string;
  code: string;
  trackingLink: string;
  offerName: string;
}

export interface ConversionAudit {
  date: string;
  approved: number;
  rejected: number;
  rate: number;
}