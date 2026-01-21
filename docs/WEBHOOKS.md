# Documentation Webhooks - Admiss-Flow

Guide complet sur les webhooks et leur configuration.

## 📋 Vue d'ensemble

Les webhooks permettent aux plateformes externes (HubSpot, Meta, DocuSeal) de notifier votre API en temps réel des événements.

## 🔗 Endpoints Webhooks

### HubSpot

**URL** : `POST /api/webhooks/hubspot`

**Configuration** :
1. Aller dans HubSpot Settings > Integrations > Webhooks
2. Créer un webhook avec l'URL de votre API
3. Sélectionner les événements :
   - Contact creation
   - Contact property change
   - Deal creation
   - Deal property change

**Signature** :
HubSpot envoie une signature dans le header `X-HubSpot-Signature-v3` pour vérifier l'authenticité.

**Payload exemple** :
```json
{
  "subscriptionId": 12345,
  "portalId": 12345678,
  "occurredAt": 1642680000000,
  "subscriptionType": "contact.creation",
  "attemptNumber": 1,
  "objectId": 123456,
  "properties": {
    "email": "test@example.com",
    "firstname": "John",
    "lastname": "Doe"
  }
}
```

### Meta Lead Ads

**URL** : `GET /api/webhooks/meta` (vérification)
**URL** : `POST /api/webhooks/meta` (événements)

**Configuration** :
1. Aller dans Meta App Dashboard > Webhooks
2. Ajouter l'URL de callback
3. Configurer le verify token
4. S'abonner à l'événement `leadgen`

**Vérification initiale** :
Meta envoie une requête GET pour vérifier le webhook :
```
GET /api/webhooks/meta?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=CHALLENGE
```

Votre API doit répondre avec le challenge.

**Payload exemple** :
```json
{
  "object": "leadgen",
  "entry": [
    {
      "id": "page_id",
      "time": 1642680000,
      "changes": [
        {
          "field": "leadgen",
          "value": {
            "leadgen_id": "123456",
            "page_id": "page_id",
            "form_id": "form_id",
            "created_time": 1642680000
          }
        }
      ]
    }
  ]
}
```

### DocuSeal

**URL** : `POST /api/webhooks/docuseal`

**Configuration** :
1. Aller dans DocuSeal Settings > Webhooks
2. Ajouter l'URL de votre API
3. Sélectionner les événements :
   - document.viewed
   - document.signed
   - document.completed
   - document.declined

**Payload exemple** :
```json
{
  "event": "document.completed",
  "data": {
    "id": "doc_123",
    "status": "completed",
    "signed_at": "2024-01-19T10:00:00Z",
    "submitter_id": "sub_456"
  }
}
```

## 🔒 Sécurité

### Vérification des signatures

Tous les webhooks doivent être vérifiés pour garantir leur authenticité :

1. **HubSpot** : Vérifier la signature HMAC-SHA256
2. **Meta** : Vérifier le verify token
3. **DocuSeal** : Vérifier la signature HMAC-SHA256 (si configuré)

### HTTPS requis

Tous les webhooks doivent utiliser HTTPS en production. Les URLs HTTP ne sont acceptées qu'en développement local.

## 🧪 Tests

### Test manuel avec cURL

```bash
# Test HubSpot webhook
curl -X POST http://localhost:3000/api/webhooks/hubspot \
  -H "Content-Type: application/json" \
  -H "X-HubSpot-Signature-v3: signature" \
  -d '{
    "subscriptionType": "contact.creation",
    "objectId": 123,
    "properties": {
      "email": "test@example.com"
    }
  }'

# Test Meta webhook (vérification)
curl "http://localhost:3000/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"

# Test DocuSeal webhook
curl -X POST http://localhost:3000/api/webhooks/docuseal \
  -H "Content-Type: application/json" \
  -d '{
    "event": "document.completed",
    "data": {
      "id": "doc_123",
      "status": "completed"
    }
  }'
```

### Vérifier les événements reçus

```bash
# Liste des événements webhooks
curl http://localhost:3000/api/webhooks/events

# Filtrer par source
curl http://localhost:3000/api/webhooks/events?source=hubspot

# Voir les événements non traités
curl http://localhost:3000/api/webhooks/events?processed=false
```

## 📊 Monitoring

### Logs

Tous les webhooks sont enregistrés dans :
- Table `webhook_events` dans la base de données
- Fichier `logs/combined.log`

### Métriques

Vérifier les statistiques :
```bash
GET /api/sync/status
```

## ⚠️ Dépannage

### Webhook non reçu

1. Vérifier que l'URL est accessible publiquement
2. Vérifier les logs de la plateforme source
3. Vérifier les logs de votre API
4. Tester avec un outil comme [webhook.site](https://webhook.site)

### Erreurs de traitement

1. Vérifier les logs : `logs/combined.log`
2. Vérifier la table `webhook_events` pour les erreurs
3. Vérifier les données du payload
4. Vérifier les dépendances (base de données, APIs externes)

### Rate Limiting

Si vous recevez trop de webhooks :
1. Implémenter un système de queue
2. Utiliser un service comme RabbitMQ ou Redis
3. Traiter les webhooks de manière asynchrone

## 🔄 Retry Logic

Les webhooks échoués peuvent être retraités :

1. Vérifier les événements avec `processed = false`
2. Retraiter manuellement via l'API
3. Implémenter un système de retry automatique

## 📝 Bonnes Pratiques

1. **Idempotence** : Les webhooks doivent être idempotents
2. **Validation** : Toujours valider les données reçues
3. **Logging** : Logger tous les webhooks reçus
4. **Error Handling** : Gérer gracieusement les erreurs
5. **Monitoring** : Surveiller les taux d'erreur

## 🔍 Structure des données

### Table webhook_events

```sql
CREATE TABLE webhook_events (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processing_error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);
```

### Requêtes utiles

```sql
-- Événements non traités
SELECT * FROM webhook_events WHERE processed = FALSE;

-- Erreurs récentes
SELECT * FROM webhook_events 
WHERE processing_error IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;

-- Statistiques par source
SELECT source, COUNT(*) as total, 
       SUM(CASE WHEN processed THEN 1 ELSE 0 END) as processed,
       SUM(CASE WHEN processing_error IS NOT NULL THEN 1 ELSE 0 END) as errors
FROM webhook_events
GROUP BY source;
```
