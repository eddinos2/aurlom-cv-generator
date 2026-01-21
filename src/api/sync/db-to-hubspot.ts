import { HubSpotClient } from '../../../integrations/hubspot/api-client';
import { mapCandidateToHubSpot } from '../../../integrations/hubspot/mappers';
import { candidateModel } from '../../index';
import { db } from '../../index';
import { logger } from '../../utils/logger';

const hubspotClient = new HubSpotClient();

/**
 * Synchroniser un candidat de la base de données vers HubSpot
 */
export async function syncCandidateToHubSpot(candidateId: number): Promise<void> {
  try {
    const candidate = await candidateModel.findById(candidateId);
    if (!candidate) {
      throw new Error('Candidate not found');
    }

    logger.info('Syncing candidate to HubSpot', { candidateId });

    const hubspotData = mapCandidateToHubSpot(candidate);

    // Créer ou mettre à jour le contact
    let contact = await hubspotClient.createOrUpdateContact({
      email: candidate.email,
      firstName: candidate.first_name,
      lastName: candidate.last_name,
      phone: candidate.phone || undefined,
      properties: hubspotData.properties,
    });

    // Mettre à jour le contact_id si nécessaire
    if (candidate.hubspot_contact_id !== contact.id) {
      await candidateModel.update(candidate.id, {
        hubspot_contact_id: contact.id,
      } as any);
    }

    // Créer ou mettre à jour le deal
    if (hubspotData.dealProperties) {
      let deal = null;

      if (candidate.hubspot_deal_id) {
        // Mettre à jour le deal existant
        deal = await hubspotClient.updateDealStatus(
          candidate.hubspot_deal_id,
          candidate.status,
          hubspotData.dealProperties.dealstage
        );
      } else {
        // Créer un nouveau deal
        deal = await hubspotClient.createOrUpdateDeal({
          dealName: hubspotData.dealProperties.dealname,
          pipeline: hubspotData.dealProperties.pipeline,
          dealStage: hubspotData.dealProperties.dealstage,
          associatedContactId: contact.id,
          properties: hubspotData.dealProperties,
        });

        // Mettre à jour le deal_id
        await candidateModel.update(candidate.id, {
          hubspot_deal_id: deal.id,
        } as any);
      }
    }

    // Mettre à jour la date de synchronisation
    await candidateModel.update(candidate.id, {
      synced_with_hubspot_at: new Date(),
    } as any);

    // Enregistrer le log
    await db.getPool().query(
      `INSERT INTO sync_logs (
        candidate_id, sync_type, direction, status, source_system, target_system, data_snapshot
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        candidate.id,
        'db_to_hubspot',
        'outbound',
        'success',
        'database',
        'hubspot',
        JSON.stringify({ contactId: contact.id, dealId: deal?.id }),
      ]
    );

    logger.info('Candidate synced to HubSpot successfully', {
      candidateId,
      contactId: contact.id,
    });
  } catch (error: any) {
    logger.error('Error syncing candidate to HubSpot', {
      error: error.message,
      candidateId,
    });

    // Enregistrer l'erreur
    await db.getPool().query(
      `INSERT INTO sync_logs (
        candidate_id, sync_type, direction, status, source_system, target_system, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        candidateId,
        'db_to_hubspot',
        'outbound',
        'error',
        'database',
        'hubspot',
        error.message,
      ]
    );

    throw error;
  }
}

/**
 * Synchroniser tous les candidats modifiés récemment vers HubSpot
 */
export async function syncAllToHubSpot(options?: {
  limit?: number;
  since?: Date;
}): Promise<{ synced: number; errors: number }> {
  let synced = 0;
  let errors = 0;

  try {
    logger.info('Starting database to HubSpot sync', options);

    // Récupérer les candidats à synchroniser
    const candidates = await candidateModel.findAll({
      limit: options?.limit || 100,
    });

    // Filtrer par date si spécifié
    const candidatesToSync = options?.since
      ? candidates.filter(
          (c) => !c.synced_with_hubspot_at || c.synced_with_hubspot_at < options.since!
        )
      : candidates;

    logger.info(`Found ${candidatesToSync.length} candidates to sync`);

    for (const candidate of candidatesToSync) {
      try {
        await syncCandidateToHubSpot(candidate.id!);
        synced++;
      } catch (error: any) {
        logger.error('Error syncing candidate', {
          error: error.message,
          candidateId: candidate.id,
        });
        errors++;
      }
    }

    logger.info('Database to HubSpot sync completed', { synced, errors });
    return { synced, errors };
  } catch (error: any) {
    logger.error('Error in database to HubSpot sync', { error: error.message });
    throw error;
  }
}
