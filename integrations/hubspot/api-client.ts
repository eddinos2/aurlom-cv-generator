import { Client } from '@hubspot/api-client';
import { hubspotConfig } from '../../config/integrations';
import { logger } from '../../src/utils/logger';

export class HubSpotClient {
  private client: Client;

  constructor() {
    this.client = new Client({ accessToken: hubspotConfig.apiKey });
  }

  /**
   * Créer ou mettre à jour un contact HubSpot
   */
  async createOrUpdateContact(contactData: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    [key: string]: any;
  }): Promise<any> {
    try {
      const properties = {
        email: contactData.email,
        firstname: contactData.firstName || '',
        lastname: contactData.lastName || '',
        phone: contactData.phone || '',
        ...contactData.properties,
      };

      const response = await this.client.crm.contacts.basicApi.create({
        properties,
        associations: [],
      });

      logger.info('HubSpot contact created/updated', { contactId: response.id });
      return response;
    } catch (error: any) {
      // Si le contact existe déjà, le mettre à jour
      if (error.code === 409) {
        return this.updateContactByEmail(contactData.email, contactData);
      }
      logger.error('Error creating HubSpot contact', { error: error.message });
      throw error;
    }
  }

  /**
   * Mettre à jour un contact par email
   */
  async updateContactByEmail(email: string, updates: any): Promise<any> {
    try {
      const contact = await this.getContactByEmail(email);
      if (!contact) {
        throw new Error('Contact not found');
      }

      const response = await this.client.crm.contacts.basicApi.update(
        contact.id,
        {
          properties: {
            ...updates.properties,
          },
        }
      );

      logger.info('HubSpot contact updated', { contactId: contact.id });
      return response;
    } catch (error: any) {
      logger.error('Error updating HubSpot contact', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupérer un contact par email
   */
  async getContactByEmail(email: string): Promise<any | null> {
    try {
      const response = await this.client.crm.contacts.basicApi.getByEmail(email);
      return response;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      logger.error('Error fetching HubSpot contact', { error: error.message });
      throw error;
    }
  }

  /**
   * Créer ou mettre à jour un Deal
   */
  async createOrUpdateDeal(dealData: {
    dealName: string;
    pipeline: string;
    dealStage: string;
    amount?: number;
    associatedContactId?: string;
    [key: string]: any;
  }): Promise<any> {
    try {
      const properties = {
        dealname: dealData.dealName,
        pipeline: dealData.pipeline,
        dealstage: dealData.dealStage,
        amount: dealData.amount?.toString() || '',
        ...dealData.properties,
      };

      const response = await this.client.crm.deals.basicApi.create({
        properties,
        associations: dealData.associatedContactId
          ? [
              {
                to: { id: dealData.associatedContactId },
                types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }],
              },
            ]
          : [],
      });

      logger.info('HubSpot deal created/updated', { dealId: response.id });
      return response;
    } catch (error: any) {
      logger.error('Error creating HubSpot deal', { error: error.message });
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'un Deal
   */
  async updateDealStatus(dealId: string, status: string, dealStage?: string): Promise<any> {
    try {
      const properties: any = {
        admiss_flow_status: status,
      };

      if (dealStage) {
        properties.dealstage = dealStage;
      }

      const response = await this.client.crm.deals.basicApi.update(dealId, {
        properties,
      });

      logger.info('HubSpot deal status updated', { dealId, status });
      return response;
    } catch (error: any) {
      logger.error('Error updating HubSpot deal status', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupérer un Deal par ID
   */
  async getDeal(dealId: string): Promise<any> {
    try {
      const response = await this.client.crm.deals.basicApi.getById(dealId);
      return response;
    } catch (error: any) {
      logger.error('Error fetching HubSpot deal', { error: error.message });
      throw error;
    }
  }

  /**
   * Rechercher des contacts avec filtres
   */
  async searchContacts(filters: {
    email?: string;
    status?: string;
    limit?: number;
  }): Promise<any[]> {
    try {
      const searchRequest: any = {
        filterGroups: [],
        properties: ['email', 'firstname', 'lastname', 'phone', 'admiss_flow_status'],
        limit: filters.limit || 10,
      };

      if (filters.email) {
        searchRequest.filterGroups.push({
          filters: [
            {
              propertyName: 'email',
              operator: 'EQ',
              value: filters.email,
            },
          ],
        });
      }

      if (filters.status) {
        searchRequest.filterGroups.push({
          filters: [
            {
              propertyName: 'admiss_flow_status',
              operator: 'EQ',
              value: filters.status,
            },
          ],
        });
      }

      const response = await this.client.crm.contacts.searchApi.doSearch(searchRequest);
      return response.results || [];
    } catch (error: any) {
      logger.error('Error searching HubSpot contacts', { error: error.message });
      throw error;
    }
  }
}
