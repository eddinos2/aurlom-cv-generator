# API Reference - Admiss-Flow

Documentation complète de l'API REST Admiss-Flow.

## 🔐 Authentification

Toutes les requêtes (sauf webhooks) nécessitent un token JWT dans le header :

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📋 Endpoints

### Candidats

#### GET /api/candidates

Liste des candidats avec filtres optionnels.

**Query Parameters** :
- `status` (string, optional) : Filtrer par statut
- `campus` (string, optional) : Filtrer par campus
- `program` (string, optional) : Filtrer par programme
- `limit` (number, optional) : Limite de résultats (défaut: 100)
- `offset` (number, optional) : Offset pour pagination

**Response** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "first_name": "Emma",
      "last_name": "Martin",
      "email": "emma.martin@email.com",
      "phone": "06 12 34 56 78",
      "program": "BTS MCO",
      "source": "Meta Ad",
      "campus": "Paris 17",
      "status": "Admis",
      "appointment_date": "2024-01-15T16:00:00Z",
      "created_at": "2024-01-10T10:00:00Z"
    }
  ],
  "count": 1
}
```

#### GET /api/candidates/:id

Détails d'un candidat avec historique.

**Response** :
```json
{
  "success": true,
  "data": {
    "id": 1,
    "first_name": "Emma",
    "last_name": "Martin",
    "email": "emma.martin@email.com",
    "status": "Admis",
    "statusHistory": [
      {
        "id": 1,
        "old_status": "Nouveau",
        "new_status": "Contacté",
        "changed_by": "system",
        "change_source": "hubspot",
        "created_at": "2024-01-11T10:00:00Z"
      }
    ]
  }
}
```

#### POST /api/candidates

Créer un nouveau candidat.

**Request Body** :
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "06 12 34 56 78",
  "program": "BTS MCO",
  "source": "LinkedIn",
  "campus": "Paris 17",
  "status": "Nouveau"
}
```

**Response** :
```json
{
  "success": true,
  "data": {
    "id": 2,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "status": "Nouveau",
    "created_at": "2024-01-19T10:00:00Z"
  },
  "message": "Candidate created successfully"
}
```

#### PUT /api/candidates/:id

Mettre à jour un candidat.

**Request Body** :
```json
{
  "phone": "06 98 76 54 32",
  "campus": "Lyon"
}
```

#### PUT /api/candidates/:id/status

Mettre à jour le statut d'un candidat.

**Request Body** :
```json
{
  "status": "Admis",
  "notes": "Candidat admis après entretien"
}
```

**Response** :
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "Admis",
    "updated_at": "2024-01-19T10:00:00Z"
  },
  "message": "Status updated successfully"
}
```

### Webhooks

#### POST /api/webhooks/hubspot

Recevoir les webhooks HubSpot.

**Headers** :
- `X-HubSpot-Signature-v3` : Signature du webhook

**Request Body** : Payload HubSpot standard

**Response** :
```json
{
  "success": true
}
```

#### GET /api/webhooks/meta

Vérification Meta (pour la configuration initiale).

**Query Parameters** :
- `hub.mode` : `subscribe`
- `hub.verify_token` : Token de vérification
- `hub.challenge` : Challenge à retourner

**Response** : Challenge string (200 OK)

#### POST /api/webhooks/meta

Recevoir les webhooks Meta Lead Ads.

**Request Body** :
```json
{
  "object": "leadgen",
  "entry": [
    {
      "changes": [
        {
          "field": "leadgen",
          "value": {
            "leadgen_id": "123456"
          }
        }
      ]
    }
  ]
}
```

#### POST /api/webhooks/docuseal

Recevoir les webhooks DocuSeal.

**Request Body** :
```json
{
  "event": "document.completed",
  "data": {
    "id": "doc_123",
    "status": "completed",
    "signed_at": "2024-01-19T10:00:00Z"
  }
}
```

### Documents

#### POST /api/documents/generate

Générer un document DocuSeal.

**Request Body** :
```json
{
  "candidate_id": 1,
  "document_type": "contrat_alternance",
  "template_id": "optional_template_id",
  "fields": {
    "Date de début": "2024-09-01",
    "Date de fin": "2026-06-30",
    "Entreprise": "Entreprise ABC",
    "Rémunération": "1000€/mois"
  }
}
```

**Response** :
```json
{
  "success": true,
  "data": {
    "id": 1,
    "docuseal_document_id": "doc_123",
    "status": "sent",
    "file_url": "https://docuseal.co/documents/doc_123"
  },
  "docuSeal": {
    "id": "doc_123",
    "submitter_id": "sub_456",
    "file_url": "https://docuseal.co/documents/doc_123",
    "status": "sent"
  },
  "message": "Document generated and sent successfully"
}
```

#### GET /api/documents/candidate/:candidateId

Liste des documents d'un candidat.

**Response** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "document_type": "contrat_alternance",
      "status": "completed",
      "signed_at": "2024-01-19T10:00:00Z",
      "file_url": "https://docuseal.co/documents/doc_123"
    }
  ],
  "count": 1
}
```

#### GET /api/documents/:id

Détails d'un document.

### Synchronisation

#### GET /api/sync/status

Statut de synchronisation (24 dernières heures).

**Response** :
```json
{
  "success": true,
  "data": [
    {
      "sync_type": "hubspot_to_db",
      "direction": "inbound",
      "status": "success",
      "count": 15
    },
    {
      "sync_type": "db_to_hubspot",
      "direction": "outbound",
      "status": "success",
      "count": 8
    }
  ]
}
```

#### POST /api/sync/hubspot-to-db

Synchroniser HubSpot → Base de données.

**Query Parameters** :
- `limit` (number, optional) : Limite de contacts à synchroniser

**Response** :
```json
{
  "success": true,
  "synced": 15,
  "errors": 0
}
```

#### POST /api/sync/db-to-hubspot

Synchroniser Base de données → HubSpot.

**Query Parameters** :
- `limit` (number, optional) : Limite de candidats à synchroniser
- `since` (ISO date, optional) : Synchroniser seulement depuis cette date

**Response** :
```json
{
  "success": true,
  "synced": 8,
  "errors": 0
}
```

### Health Check

#### GET /health

Vérifier l'état du serveur et de la base de données.

**Response** :
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-19T10:00:00Z"
}
```

## 📊 Codes de statut HTTP

- `200` : Succès
- `201` : Créé avec succès
- `400` : Requête invalide
- `401` : Non authentifié
- `403` : Non autorisé
- `404` : Ressource non trouvée
- `500` : Erreur serveur

## 🔒 Sécurité

### Webhooks

Les webhooks doivent être vérifiés avec les secrets configurés :
- HubSpot : Signature dans `X-HubSpot-Signature-v3`
- Meta : Verify token lors de la configuration initiale
- DocuSeal : Signature dans les headers (si configuré)

### Rate Limiting

Les limites par défaut :
- 100 requêtes/minute par IP
- 1000 requêtes/heure par utilisateur authentifié

## 📝 Exemples

### cURL

```bash
# Lister les candidats
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/candidates

# Mettre à jour le statut
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "Admis"}' \
  http://localhost:3000/api/candidates/1/status

# Générer un document
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": 1,
    "document_type": "contrat_alternance"
  }' \
  http://localhost:3000/api/documents/generate
```

### JavaScript

```javascript
const API_BASE_URL = 'https://votre-api.com';
const JWT_TOKEN = 'your_token';

// Lister les candidats
const response = await fetch(`${API_BASE_URL}/api/candidates`, {
  headers: {
    'Authorization': `Bearer ${JWT_TOKEN}`
  }
});
const data = await response.json();

// Mettre à jour le statut
await fetch(`${API_BASE_URL}/api/candidates/1/status`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'Admis',
    notes: 'Candidat admis'
  })
});
```

## 🐛 Gestion des erreurs

Toutes les erreurs suivent ce format :

```json
{
  "success": false,
  "error": "Description de l'erreur",
  "details": {
    "field": "message d'erreur spécifique"
  }
}
```

## 📚 Ressources supplémentaires

- [Guide d'intégration complet](INTEGRATION_GUIDE.md)
- [Configuration HubSpot](HUBSPOT_SETUP.md)
- [Configuration Meta Ads](META_ADS_SETUP.md)
- [Configuration DocuSeal](DOCUSEAL_SETUP.md)
