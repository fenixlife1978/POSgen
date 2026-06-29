import 'server-only';
import { Campaign, Lead, MarketingAnalytics } from '@/types/marketing';

// Mock data para el desarrollo inicial
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
    },
    {
      id: '3',
      name: 'Black Friday Prep',
      description: 'Preparación para ventas masivas de noviembre.',
      budget: 25000,
      spent: 0,
      startDate: '2024-11-01',
      status: 'draft',
      channel: 'display',
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0
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
    { date: '2024-03', revenue: 2000, spend: 9800, leads: 200, roi: 0.20 },
    { date: '2024-04', revenue: 2780, spend: 3908, leads: 278, roi: 0.71 },
    { date: '2024-05', revenue: 1890, spend: 4800, leads: 189, roi: 0.39 },
    { date: '2024-06', revenue: 2390, spend: 3800, leads: 239, roi: 0.62 },
  ];
};
