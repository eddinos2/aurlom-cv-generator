import { processMetaLead } from '../../../integrations/meta/lead-processor';
import { MetaGraphAPIClient } from '../../../integrations/meta/graph-api-client';
import { logger } from '../../utils/logger';

const metaClient = new MetaGraphAPIClient();

export async function metaWebhookHandler(payload: any): Promise<void> {
  try {
    const object = payload.object;

    // Vérifier que c'est un événement Lead Ads
    if (object !== 'leadgen') {
      logger.warn('Unsupported Meta webhook object type', { object });
      return;
    }

    const entries = payload.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        if (change.field === 'leadgen') {
          const leadId = change.value.leadgen_id;

          if (leadId) {
            logger.info('Processing Meta lead webhook', { leadId });

            // Traiter le lead
            await processMetaLead(leadId);
          }
        }
      }
    }
  } catch (error: any) {
    logger.error('Error in Meta webhook handler', { error: error.message });
    throw error;
  }
}
