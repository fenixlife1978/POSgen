
import { 
  Campaign, 
  Lead, 
  MarketingAnalytics, 
  Worker, 
  ConversionAudit, 
  PayrollSummary 
} from '@/types/marketing';

/**
 * Funciones de obtención de datos para el Dashboard de Marketing.
 * Estas funciones proporcionan datos mock para permitir que el proceso de build de NextJS sea exitoso.
 */

export const getCampaigns = async (): Promise<Campaign[]> => {
  return [
    { 
      id: '1', 
      externalOfferId: '15420', 
      name: 'Oferta CPA Premium', 
      agencyName: 'Cpamerchant', 
      status: 'active',
      description: 'Campaña de seguros de hogar',
      payoutPerLead: 2.50,
      trackingUrl: 'https://tracking.link/1',
      budget: 1000,
      spent: 450,
      startDate: new Date().toISOString(),
      channel: 'social',
      metrics: { impressions: 10000, clicks: 500, conversions: 48 }
    },
    { 
      id: '2', 
      externalOfferId: '20100', 
      name: 'Finanzas Invierno', 
      agencyName: 'Alpha Leads', 
      status: 'paused',
      description: 'Inversiones y cripto',
      payoutPerLead: 5.00,
      trackingUrl: 'https://tracking.link/2',
      budget: 2000,
      spent: 1200,
      startDate: new Date().toISOString(),
      channel: 'search',
      metrics: { impressions: 5000, clicks: 200, conversions: 12 }
    }
  ];
};

export const getLeads = async (): Promise<Lead[]> => {
  return [
    { 
      id: '1', 
      conversionId: 'CPA-98231', 
      subId: 'CM-01', 
      campaignName: 'Seguros Hogar 2024', 
      campaignId: '1',
      amount: 2.50, 
      status: 'approved', 
      createdAt: new Date().toISOString(), 
      source: 'Cpamerchant' 
    },
    { 
      id: '2', 
      conversionId: 'CPA-98232', 
      subId: 'ER-FB', 
      campaignName: 'Inversiones Cripto', 
      campaignId: '2',
      amount: 5.00, 
      status: 'pending', 
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), 
      source: 'Alpha Leads' 
    }
  ];
};

export const getAnalytics = async (): Promise<MarketingAnalytics[]> => {
  return [
    { date: '2024-01-01', revenue: 1200, spend: 800, leads: 50, roi: 1.5 },
    { date: '2024-01-02', revenue: 1500, spend: 900, leads: 65, roi: 1.67 }
  ];
};

export const getWorkers = async (): Promise<Worker[]> => {
  return [
    { 
      id: 'w1', 
      name: 'Carlos Mendoza', 
      whatsapp: '+584120000001', 
      status: 'active', 
      subIds: [{ id: 's1', code: 'CM-01', trackingLink: 'https://tk.co/cm01', offerName: 'Oferta A' }] 
    },
    { 
      id: 'w2', 
      name: 'Elena Rodríguez', 
      whatsapp: '+584120000002', 
      status: 'active', 
      subIds: [{ id: 's2', code: 'ER-FB', trackingLink: 'https://tk.co/erfb', offerName: 'Oferta B' }] 
    }
  ];
};

export const getConversionAudit = async (): Promise<ConversionAudit[]> => {
  return [
    { date: '2024-05-01', approved: 45, rejected: 5, rate: 90 },
    { date: '2024-05-02', approved: 38, rejected: 12, rate: 76 }
  ];
};

export const getPayrollSummary = async (): Promise<PayrollSummary[]> => {
  return [
    { id: '1', workerId: 'w1', workerName: 'Carlos Mendoza', leadsCount: 45, amount: 112.50, agencyName: 'Cpamerchant', status: 'pending', period: 'Q1 Mayo' },
    { id: '2', workerId: 'w2', workerName: 'Elena Rodríguez', leadsCount: 12, amount: 60.00, agencyName: 'Alpha Leads', status: 'paid', period: 'Q1 Mayo' }
  ];
};

export const getExampleData = async () => {
  return [];
};
