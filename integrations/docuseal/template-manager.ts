import axios, { AxiosInstance } from 'axios';
import { docusealConfig } from '../../config/integrations';
import { logger } from '../../src/utils/logger';

export class DocuSealTemplateManager {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: docusealConfig.baseUrl,
      headers: {
        'Authorization': `Bearer ${docusealConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Récupérer la liste des templates
   */
  async listTemplates(): Promise<any[]> {
    try {
      const response = await this.client.get('/templates');
      return response.data.data || [];
    } catch (error: any) {
      logger.error('Error fetching DocuSeal templates', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupérer un template par ID
   */
  async getTemplate(templateId: string): Promise<any> {
    try {
      const response = await this.client.get(`/templates/${templateId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching DocuSeal template', { error: error.message, templateId });
      throw error;
    }
  }

  /**
   * Créer un template (si nécessaire)
   */
  async createTemplate(templateData: {
    name: string;
    document: Buffer | string; // PDF file
    fields?: Array<{
      name: string;
      type: string;
      required?: boolean;
      [key: string]: any;
    }>;
  }): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('name', templateData.name);
      
      if (templateData.document instanceof Buffer) {
        formData.append('document', new Blob([templateData.document]), 'template.pdf');
      } else {
        formData.append('document', templateData.document);
      }

      if (templateData.fields) {
        formData.append('fields', JSON.stringify(templateData.fields));
      }

      const response = await this.client.post('/templates', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error creating DocuSeal template', { error: error.message });
      throw error;
    }
  }
}
