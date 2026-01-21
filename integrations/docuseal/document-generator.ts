import axios, { AxiosInstance } from 'axios';
import { docusealConfig } from '../../config/integrations';
import { logger } from '../../src/utils/logger';
import { Candidate } from '../../backend/db/models/candidate';

export interface DocuSealDocumentRequest {
  templateId: string;
  candidate: Candidate;
  fields: Record<string, any>;
  submitterEmail: string;
  submitterName?: string;
}

export class DocuSealDocumentGenerator {
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
   * Générer un document DocuSeal à partir d'un template
   */
  async generateDocument(request: DocuSealDocumentRequest): Promise<any> {
    try {
      const payload = {
        template_id: request.templateId,
        submitter: {
          email: request.submitterEmail,
          name: request.submitterName || `${request.candidate.first_name} ${request.candidate.last_name}`,
        },
        fields: this.mapFieldsToDocuSeal(request.fields, request.candidate),
      };

      logger.info('Generating DocuSeal document', {
        templateId: request.templateId,
        candidateId: request.candidate.id,
      });

      const response = await this.client.post('/documents', payload);

      return {
        id: response.data.id,
        submitter_id: response.data.submitter_id,
        file_url: response.data.file_url,
        status: response.data.status,
      };
    } catch (error: any) {
      logger.error('Error generating DocuSeal document', {
        error: error.message,
        templateId: request.templateId,
      });
      throw error;
    }
  }

  /**
   * Mapper les champs candidat vers le format DocuSeal
   */
  private mapFieldsToDocuSeal(fields: Record<string, any>, candidate: Candidate): Record<string, any> {
    const mappedFields: Record<string, any> = {};

    // Mapper les champs standards
    const standardMappings: Record<string, string> = {
      'first_name': 'Prénom',
      'last_name': 'Nom',
      'email': 'Email',
      'phone': 'Téléphone',
      'program': 'Programme',
      'campus': 'Campus',
    };

    // Ajouter les champs du candidat
    Object.entries(standardMappings).forEach(([key, label]) => {
      const value = (candidate as any)[key];
      if (value) {
        mappedFields[label] = value;
      }
    });

    // Ajouter les champs personnalisés
    Object.entries(fields).forEach(([key, value]) => {
      mappedFields[key] = value;
    });

    return mappedFields;
  }

  /**
   * Récupérer le statut d'un document
   */
  async getDocumentStatus(documentId: string): Promise<any> {
    try {
      const response = await this.client.get(`/documents/${documentId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching DocuSeal document status', {
        error: error.message,
        documentId,
      });
      throw error;
    }
  }

  /**
   * Envoyer un rappel pour signer un document
   */
  async sendReminder(documentId: string): Promise<void> {
    try {
      await this.client.post(`/documents/${documentId}/remind`);
      logger.info('DocuSeal reminder sent', { documentId });
    } catch (error: any) {
      logger.error('Error sending DocuSeal reminder', {
        error: error.message,
        documentId,
      });
      throw error;
    }
  }
}
