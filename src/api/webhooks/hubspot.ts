import { HubSpotClient } from '../../../integrations/hubspot/api-client';
import { mapHubSpotToCandidate } from '../../../integrations/hubspot/mappers';
import { candidateModel } from '../../index';
import { db } from '../../index';
import { logger } from '../../utils/logger';

const hubspotClient = new HubSpotClient();

export async function hubspotWebhookHandler(payload: any): Promise<void> {
  try {
    const subscriptionType = payload.subscriptionType;
    const eventType = payload.eventType;

    logger.info('Processing HubSpot webhook', { subscriptionType, eventType });

    // Contact créé ou mis à jour
    if (subscriptionType === 'contact.creation' || subscriptionType === 'contact.propertyChange') {
      await handleContactWebhook(payload);
    }

    // Deal créé ou mis à jour
    if (subscriptionType === 'deal.creation' || subscriptionType === 'deal.propertyChange') {
      await handleDealWebhook(payload);
    }
  } catch (error: any) {
    logger.error('Error in HubSpot webhook handler', { error: error.message });
    throw error;
  }
}

async function handleContactWebhook(payload: any): Promise<void> {
  const contactId = payload.objectId;
  const properties = payload.properties || {};

  try {
    // Récupérer le contact complet depuis HubSpot
    const contact = await hubspotClient.getContactByEmail(properties.email || '');

    if (!contact) {
      logger.warn('Contact not found in HubSpot', { contactId });
      return;
    }

    // Vérifier si le candidat existe déjà
    let candidate = await candidateModel.findByHubSpotContactId(contactId);

    const candidateData = mapHubSpotToCandidate(contact);

    if (candidate) {
      // Mettre à jour le candidat existant
      await candidateModel.update(candidate.id, {
        ...candidateData,
        synced_with_hubspot_at: new Date(),
      } as any);

      // Mettre à jour le statut si nécessaire
      if (properties.admiss_flow_status && properties.admiss_flow_status !== candidate.status) {
        await candidateModel.updateStatus(
          candidate.id,
          properties.admiss_flow_status,
          'hubspot',
          'hubspot'
        );
      }
    } else {
      // Créer un nouveau candidat
      candidate = await candidateModel.create({
        ...candidateData,
        synced_with_hubspot_at: new Date(),
      } as any);
    }

    // Enregistrer le log de synchronisation
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

    logger.info('HubSpot contact synced to database', {
      candidateId: candidate.id,
      contactId,
    });
  } catch (error: any) {
    logger.error('Error handling HubSpot contact webhook', { error: error.message, contactId });

    // Enregistrer l'erreur dans les logs de synchronisation
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

    throw error;
  }
}

async function handleDealWebhook(payload: any): Promise<void> {
  const dealId = payload.objectId;
  const properties = payload.properties || {};

  try {
    // Récupérer le deal complet depuis HubSpot
    const deal = await hubspotClient.getDeal(dealId);

    // Trouver le contact associé
    const associations = deal.associations || {};
    const contactAssociations = associations.contacts?.results || [];

    if (contactAssociations.length === 0) {
      logger.warn('No contact associated with deal', { dealId });
      return;
    }

    const contactId = contactAssociations[0].id;

    // Trouver le candidat correspondant
    const candidate = await candidateModel.findByHubSpotContactId(contactId);

    if (!candidate) {
      logger.warn('Candidate not found for deal', { dealId, contactId });
      return;
    }

    // Mettre à jour le deal_id si nécessaire
    if (candidate.hubspot_deal_id !== dealId) {
      await candidateModel.update(candidate.id, {
        hubspot_deal_id: dealId,
      } as any);
    }

    // Mettre à jour le statut si le deal a changé
    if (properties.dealstage) {
      const { mapDealStageToStatus } = await import('../../../integrations/hubspot/mappers');
      const newStatus = mapDealStageToStatus(properties.dealstage);

      if (newStatus !== candidate.status) {
        await candidateModel.updateStatus(
          candidate.id,
          newStatus,
          'hubspot',
          'hubspot',
          `Deal stage changed to ${properties.dealstage}`
        );
      }
    }

    logger.info('HubSpot deal synced to database', {
      candidateId: candidate.id,
      dealId,
    });
  } catch (error: any) {
    logger.error('Error handling HubSpot deal webhook', { error: error.message, dealId });
    throw error;
  }
}
