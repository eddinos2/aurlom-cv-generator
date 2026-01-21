import { HubSpotClient } from '../../../integrations/hubspot/api-client';
import { mapHubSpotToCandidate } from '../../../integrations/hubspot/mappers';
import { candidateModel } from '../../index';
import { db } from '../../index';
import { logger } from '../../utils/logger';

const hubspotClient = new HubSpotClient();

/**
 * Synchroniser tous les contacts HubSpot vers la base de données
 */
export async function syncHubSpotToDatabase(options?: {
  limit?: number;
  status?: string;
}): Promise<{ synced: number; errors: number }> {
  let synced = 0;
  let errors = 0;

  try {
    logger.info('Starting HubSpot to database sync', options);

    // Rechercher les contacts HubSpot
    const contacts = await hubspotClient.searchContacts({
      status: options?.status,
      limit: options?.limit || 100,
    });

    logger.info(`Found ${contacts.length} contacts to sync`);

    for (const contact of contacts) {
      try {
        // Récupérer le deal associé si disponible
        let deal = null;
        if (contact.associations?.deals?.results?.length > 0) {
          const dealId = contact.associations.deals.results[0].id;
          deal = await hubspotClient.getDeal(dealId);
        }

        const candidateData = mapHubSpotToCandidate(contact, deal || undefined);

        // Vérifier si le candidat existe déjà
        let candidate = await candidateModel.findByHubSpotContactId(contact.id);

        if (candidate) {
          // Mettre à jour
          await candidateModel.update(candidate.id, {
            ...candidateData,
            synced_with_hubspot_at: new Date(),
          } as any);
        } else {
          // Créer
          candidate = await candidateModel.create({
            ...candidateData,
            synced_with_hubspot_at: new Date(),
          } as any);
        }

        // Enregistrer le log
        await db.getPool().query(
          `INSERT INTO sync_logs (
            candidate_id, sync_type, direction, status, source_system, target_system, data_snapshot
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            candidate.id,
            'hubspot_to_db',
            'inbound',
            'success',
            'hubspot',
            'database',
            JSON.stringify(contact),
          ]
        );

        synced++;
      } catch (error: any) {
        logger.error('Error syncing contact', {
          error: error.message,
          contactId: contact.id,
        });

        await db.getPool().query(
          `INSERT INTO sync_logs (
            sync_type, direction, status, source_system, target_system, error_message
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            'hubspot_to_db',
            'inbound',
            'error',
            'hubspot',
            'database',
            error.message,
          ]
        );

        errors++;
      }
    }

    logger.info('HubSpot to database sync completed', { synced, errors });
    return { synced, errors };
  } catch (error: any) {
    logger.error('Error in HubSpot to database sync', { error: error.message });
    throw error;
  }
}
