import { Router, Request, Response } from 'express';
import { hubspotWebhookHandler } from '../../api/webhooks/hubspot';
import { metaWebhookHandler } from '../../api/webhooks/meta';
import { docusealWebhookHandler } from '../../api/webhooks/docuseal';
import { logger } from '../../utils/logger';
import { getDb } from '../../index';

const router = Router();

// POST /api/webhooks/hubspot - Webhook HubSpot
router.post('/hubspot', async (req: Request, res: Response) => {
  try {
    // Enregistrer l'événement webhook
    await getDb().getPool().query(
      `INSERT INTO webhook_events (source, event_type, payload)
       VALUES ($1, $2, $3)`,
      ['hubspot', req.body.subscriptionType || 'unknown', JSON.stringify(req.body)]
    );

    // Traiter le webhook
    await hubspotWebhookHandler(req.body);

    // Marquer comme traité
    await getDb().getPool().query(
      `UPDATE webhook_events 
       SET processed = TRUE, processed_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM webhook_events ORDER BY id DESC LIMIT 1)`
    );

    res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error('Error processing HubSpot webhook', { error: error.message });
    
    // Marquer comme erreur
    await getDb().getPool().query(
      `UPDATE webhook_events 
       SET processed = TRUE, processing_error = $1, processed_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM webhook_events ORDER BY id DESC LIMIT 1)`,
      [error.message]
    );

    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
    });
  }
});

// GET /api/webhooks/meta - Vérification Meta (pour la configuration initiale)
router.get('/meta', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    logger.info('Meta webhook verified');
    res.status(200).send(challenge);
  } else {
    logger.warn('Meta webhook verification failed', { mode, token });
    res.status(403).send('Verification failed');
  }
});

// POST /api/webhooks/meta - Webhook Meta Lead Ads
router.post('/meta', async (req: Request, res: Response) => {
  try {
    // Enregistrer l'événement webhook
    await getDb().getPool().query(
      `INSERT INTO webhook_events (source, event_type, payload)
       VALUES ($1, $2, $3)`,
      ['meta', req.body.object || 'leadgen', JSON.stringify(req.body)]
    );

    // Traiter le webhook
    await metaWebhookHandler(req.body);

    // Marquer comme traité
    await getDb().getPool().query(
      `UPDATE webhook_events 
       SET processed = TRUE, processed_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM webhook_events ORDER BY id DESC LIMIT 1)`
    );

    res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error('Error processing Meta webhook', { error: error.message });
    
    // Marquer comme erreur
    await getDb().getPool().query(
      `UPDATE webhook_events 
       SET processed = TRUE, processing_error = $1, processed_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM webhook_events ORDER BY id DESC LIMIT 1)`,
      [error.message]
    );

    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
    });
  }
});

// POST /api/webhooks/docuseal - Webhook DocuSeal
router.post('/docuseal', async (req: Request, res: Response) => {
  try {
    // Enregistrer l'événement webhook
    await getDb().getPool().query(
      `INSERT INTO webhook_events (source, event_type, payload)
       VALUES ($1, $2, $3)`,
      ['docuseal', req.body.event || 'unknown', JSON.stringify(req.body)]
    );

    // Traiter le webhook
    await docusealWebhookHandler(req.body);

    // Marquer comme traité
    await getDb().getPool().query(
      `UPDATE webhook_events 
       SET processed = TRUE, processed_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM webhook_events ORDER BY id DESC LIMIT 1)`
    );

    res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error('Error processing DocuSeal webhook', { error: error.message });
    
    // Marquer comme erreur
    await getDb().getPool().query(
      `UPDATE webhook_events 
       SET processed = TRUE, processing_error = $1, processed_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM webhook_events ORDER BY id DESC LIMIT 1)`,
      [error.message]
    );

    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
    });
  }
});

export default router;
