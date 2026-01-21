import axios, { AxiosInstance } from 'axios';
import { metaConfig } from '../../config/integrations';
import { logger } from '../../src/utils/logger';

export interface MetaLead {
  id: string;
  created_time: string;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
}

export class MetaGraphAPIClient {
  private client: AxiosInstance;
  private accessToken: string;

  constructor() {
    this.accessToken = metaConfig.accessToken;
    this.client = axios.create({
      baseURL: `${metaConfig.baseUrl}/${metaConfig.graphApiVersion}`,
      timeout: 10000,
    });
  }

  /**
   * Récupérer les détails d'un lead depuis Meta Lead Ads
   */
  async getLead(leadId: string): Promise<MetaLead> {
    try {
      const response = await this.client.get(`/${leadId}`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,field_data',
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error fetching Meta lead', { error: error.message, leadId });
      throw error;
    }
  }

  /**
   * Récupérer les données d'un formulaire Meta
   */
  async getFormData(formId: string): Promise<any> {
    try {
      const response = await this.client.get(`/${formId}`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,questions',
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error fetching Meta form data', { error: error.message, formId });
      throw error;
    }
  }

  /**
   * Extraire les données structurées d'un lead Meta
   */
  extractLeadData(lead: MetaLead): {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    [key: string]: any;
  } {
    const data: Record<string, any> = {
      meta_lead_id: lead.id,
      source: 'Meta Ad',
      meta_ad_id: lead.ad_id,
      meta_ad_name: lead.ad_name,
      meta_campaign_id: lead.campaign_id,
      meta_campaign_name: lead.campaign_name,
      meta_form_id: lead.form_id,
    };

    // Extraire les données des champs du formulaire
    if (lead.field_data) {
      lead.field_data.forEach((field) => {
        const value = field.values?.[0] || '';
        const fieldName = field.name.toLowerCase();

        if (fieldName.includes('email') || fieldName === 'email') {
          data.email = value;
        } else if (fieldName.includes('first') || fieldName.includes('prénom')) {
          data.firstName = value;
        } else if (fieldName.includes('last') || fieldName.includes('nom')) {
          data.lastName = value;
        } else if (fieldName.includes('phone') || fieldName.includes('téléphone')) {
          data.phone = value;
        } else {
          // Stocker les autres champs
          data[fieldName] = value;
        }
      });
    }

    return data;
  }

  /**
   * Vérifier le token de webhook (pour la configuration initiale)
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === metaConfig.webhookVerifyToken) {
      return challenge;
    }
    return null;
  }
}
