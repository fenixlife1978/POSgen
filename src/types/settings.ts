
export type DatabaseProvider = 'mongodb' | 'turso' | 'firebase';

export interface DatabaseConfig {
  provider: DatabaseProvider;
  mongodb?: {
    connectionString: string;
  };
  turso?: {
    url: string;
    authToken: string;
  };
  firebase?: {
    serviceAccountJson: string;
  };
}

export interface AgencyIntegration {
  id: string;
  name: string;
  apiKey: string;
}

export interface WhatsAppConfig {
  apiUrl: string;
  authToken: string;
}

export interface SystemSettings {
  database: DatabaseConfig;
  agencies: AgencyIntegration[];
  whatsapp: WhatsAppConfig;
}
