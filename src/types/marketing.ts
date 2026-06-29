export type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft';

export interface Campaign {
  id: string;
  externalOfferId: string;
  name: string;
  description: string;
  agencyName: string;
  payoutPerLead: number;
  trackingUrl: string;
  budget: number;
  spent: number;
  startDate: string;
  status: CampaignStatus;
  channel: 'social' | 'email' | 'search' | 'display' | 'other';
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
  };
}

export type LeadStatus = 'approved' | 'pending' | 'rejected' | 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

export interface Lead {
  id: string;
  conversionId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  source: string;
  subId: string;
  workerId?: string;
  campaignId: string;
  campaignName: string;
  amount: number;
  status: LeadStatus;
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

export interface PayrollSummary {
  id: string;
  workerId: string;
  workerName: string;
  leadsCount: number;
  amount: number;
  agencyName: string;
  status: 'pending' | 'paid';
  period: string;
}

export interface PaymentDetails {
  workerId: string;
  amount: number;
  method: 'binance' | 'pago_movil' | 'paypal' | 'zelle' | 'other';
  reference: string;
  receiptUrl?: string;
  date: string;
}
