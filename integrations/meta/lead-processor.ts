import { MetaGraphAPIClient, MetaLead } from './graph-api-client';
import { HubSpotClient } from '../hubspot/api-client';
import { candidateModel } from '../../src/index';
import { db } from '../../src/index';
import { logger } from '../../src/utils/logger';

const metaClient = new MetaGraphAPIClient();
const hubspotClient = new HubSpotClient();

/**
 * Traiter un nouveau lead Meta et le synchroniser avec HubSpot et la base de données
 */
export async function processMetaLead(leadId: string): Promise<void> {
  try {
    logger.info('Processing Meta lead', { leadId });

    // Récupérer les détails du lead depuis Meta
    const lead = await metaClient.getLead(leadId);

    // Extraire les données structurées
    const leadData = metaClient.extractLeadData(lead);

    if (!leadData.email) {
      throw new Error('Email is required but not found in lead data');
    }

    // Vérifier si le candidat existe déjà (par email ou meta_lead_id)
    let candidate = await candidateModel.findByEmail(leadData.email);
    if (!candidate && leadData.meta_lead_id) {
      candidate = await candidateModel.findByMetaLeadId(leadData.meta_lead_id);
    }

    // Préparer les données du candidat
    const candidateData = {
      first_name: leadData.firstName || '',
      last_name: leadData.lastName || '',
      email: leadData.email,
      phone: leadData.phone || null,
      source: leadData.source || 'Meta Ad',
      meta_lead_id: leadData.meta_lead_id,
      status: 'Nouveau' as const,
    };

    if (candidate) {
      // Mettre à jour le candidat existant
      await candidateModel.update(candidate.id!, {
        ...candidateData,
        meta_lead_id: leadData.meta_lead_id,
      } as any);
    } else {
      // Créer un nouveau candidat
      candidate = await candidateModel.create(candidateData);
    }

    // Synchroniser avec HubSpot
    try {
      await hubspotClient.createOrUpdateContact({
        email: candidate.email,
        firstName: candidate.first_name,
        lastName: candidate.last_name,
        phone: candidate.phone || undefined,
        properties: {
          admiss_source: leadData.source,
          admiss_flow_status: candidate.status,
          meta_lead_id: leadData.meta_lead_id,
          meta_campaign_name: leadData.meta_campaign_name,
        },
      });

      // Mettre à jour le contact_id HubSpot
      const hubspotContact = await hubspotClient.getContactByEmail(candidate.email);
      if (hubspotContact) {
        await candidateModel.update(candidate.id!, {
          hubspot_contact_id: hubspotContact.id,
        } as any);
      }

      logger.info('Meta lead synced to HubSpot', {
        candidateId: candidate.id,
        leadId,
      });
    } catch (hubspotError: any) {
      logger.error('Error syncing Meta lead to HubSpot', {
        error: hubspotError.message,
        leadId,
      });
      // Ne pas faire échouer le traitement si HubSpot échoue
    }

    // Enregistrer le log de synchronisation
    await db.getPool().query(
      `INSERT INTO sync_logs (
        candidate_id, sync_type, direction, status, source_system, target_system, data_snapshot
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        candidate.id,
        'meta_to_db',
        'inbound',
        'success',
        'meta',
        'database',
        JSON.stringify(lead),
      ]
    );

    logger.info('Meta lead processed successfully', {
      candidateId: candidate.id,
      leadId,
    });
  } catch (error: any) {
    logger.error('Error processing Meta lead', {
      error: error.message,
      leadId,
    });

    // Enregistrer l'erreur
    await db.getPool().query(
      `INSERT INTO sync_logs (
        sync_type, direction, status, source_system, target_system, error_message, data_snapshot
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'meta_to_db',
        'inbound',
        'error',
        'meta',
        'database',
        error.message,
        JSON.stringify({ leadId }),
      ]
    );

    throw error;
  }
}
