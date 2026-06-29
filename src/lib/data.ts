import { Campaign, Lead, MarketingAnalytics, Worker, ConversionAudit } from '@/types/marketing';

export const getCampaigns = async (): Promise<Campaign[]> => {
  return [
    {
      id: '1',
      name: 'Lanzamiento Verano 2024',
      description: 'Campaña de redes sociales para la nueva colección.',
      budget: 10000,
      spent: 4500,
      startDate: '2024-06-01',
      status: 'active',
      channel: 'social',
      metrics: {
        impressions: 120000,
        clicks: 8500,
        conversions: 420
      }
    },
    {
      id: '2',
      name: 'Newsletter Informativa',
      description: 'Envío semanal a la base de datos fidelizada.',
      budget: 2000,
      spent: 1800,
      startDate: '2024-01-15',
      status: 'active',
      channel: 'email',
      metrics: {
        impressions: 15000,
        clicks: 1200,
        conversions: 85
      }
    }
  ];
};

export const getLeads = async (): Promise<Lead[]> => {
  return [
    {
      id: 'l1',
      email: 'juan.perez@example.com',
      firstName: 'Juan',
      lastName: 'Pérez',
      source: 'Facebook Ads',
      status: 'new',
      createdAt: new Date().toISOString()
    },
    {
      id: 'l2',
      email: 'maria.garcia@example.com',
      firstName: 'María',
      lastName: 'García',
      source: 'Búsqueda Orgánica',
      status: 'qualified',
      createdAt: new Date().toISOString()
    }
  ];
};

export const getAnalytics = async (): Promise<MarketingAnalytics[]> => {
  return [
    { date: '2024-01', revenue: 4000, spend: 2400, leads: 400, roi: 1.66 },
    { date: '2024-02', revenue: 3000, spend: 1398, leads: 300, roi: 2.14 },
    { date: '2024-03', revenue: 2000, spend: 9800, leads: 200, roi: 0.20 }
  ];
};

export const getWorkers = async (): Promise<Worker[]> => {
  return [
    {
      id: 'w1',
      name: 'Carlos Mendoza',
      whatsapp: '+34 600 000 001',
      status: 'active',
      subIds: [
        { id: 's1', code: 'CM-01', trackingLink: 'https://track.link/offer1?subid=CM-01', offerName: 'Oferta CPA Premium' },
        { id: 's2', code: 'CM-FB', trackingLink: 'https://track.link/offer2?subid=CM-FB', offerName: 'Oferta Facebook Invierno' }
      ]
    },
    {
      id: 'w2',
      name: 'Elena Rodríguez',
      whatsapp: '+34 600 000 002',
      status: 'active',
      subIds: [
        { id: 's3', code: 'ER-01', trackingLink: 'https://track.link/offer1?subid=ER-01', offerName: 'Oferta CPA Premium' }
      ]
    },
    {
      id: 'w3',
      name: 'Roberto Sánchez',
      whatsapp: '+34 600 000 003',
      status: 'inactive',
      subIds: []
    }
  ];
};

export const getConversionAudit = async (): Promise<ConversionAudit[]> => {
  return [
    { date: '2024-05-01', approved: 45, rejected: 5, rate: 90 },
    { date: '2024-05-02', approved: 38, rejected: 12, rate: 76 },
    { date: '2024-05-03', approved: 52, rejected: 3, rate: 94 },
    { date: '2024-05-04', approved: 41, rejected: 15, rate: 73 },
    { date: '2024-05-05', approved: 48, rejected: 8, rate: 85 }
  ];
};