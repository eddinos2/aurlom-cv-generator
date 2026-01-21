# Guide d'Intégration Complet - Admiss-Flow

Ce guide détaille l'intégration complète de toutes les plateformes avec Admiss-Flow.

## 📋 Table des matières

1. [Architecture globale](#architecture-globale)
2. [Configuration initiale](#configuration-initiale)
3. [Intégration HubSpot](#intégration-hubspot)
4. [Intégration Meta Ads](#intégration-meta-ads)
5. [Intégration DocuSeal](#intégration-docuseal)
6. [Automatisations Zapier/Make](#automatisations-zapiermake)
7. [API Reference](#api-reference)
8. [Dépannage](#dépannage)

## 🏗️ Architecture globale

```
┌─────────────┐
│  Meta Ads   │
│  (Leads)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   HubSpot   │◄────►│   Database    │◄────►│  Dashboard  │
│    CRM      │      │  PostgreSQL  │      │   Lovable   │
└──────┬──────┘      └──────────────┘      └─────────────┘
       │
       ▼
┌─────────────┐
│  DocuSeal   │
│ (Contrats)  │
└─────────────┘

     ▲
     │
┌─────────────┐
│ Zapier/Make │
│(Orchestration)
└─────────────┘
```

## ⚙️ Configuration initiale

### 1. Variables d'environnement

Copier `.env.example` vers `.env` et remplir toutes les variables :

```bash
# HubSpot
HUBSPOT_API_KEY=pat-na1-xxxxx
HUBSPOT_WEBHOOK_SECRET=your_secret
HUBSPOT_PORTAL_ID=12345678

# Meta
META_APP_ID=123456789
META_APP_SECRET=xxxxx
META_WEBHOOK_VERIFY_TOKEN=your_verify_token
META_ACCESS_TOKEN=xxxxx

# DocuSeal
DOCUSEAL_API_KEY=xxxxx
DOCUSEAL_BASE_URL=https://api.docuseal.co
DOCUSEAL_TEMPLATE_CONTRAT_ALTERNANCE=template_id

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/admiss_flow
```

### 2. Base de données

Les migrations s'exécutent automatiquement au démarrage. Vérifier la connexion :

```bash
npm run dev
# Vérifier les logs pour "Database connected successfully"
```

## 🔗 Intégration HubSpot

### Étape 1 : Créer les propriétés personnalisées

Dans HubSpot Settings > Properties :

1. **Contact Properties** :
   - `admiss_flow_status` (Select) : Nouveau, Contacté, RDV fixé, Admis, No-show, Contrat en cours, Contrat signé
   - `admiss_program` (Text) : Programme BTS
   - `admiss_source` (Text) : Source du lead
   - `admiss_campus` (Text) : Campus

2. **Deal Properties** :
   - `admiss_flow_status` (Select) : Même liste que pour les contacts
   - Pipeline : Créer un pipeline "Admission" avec les stages appropriés

### Étape 2 : Configurer les webhooks

1. Aller dans Settings > Integrations > Webhooks
2. Créer un nouveau webhook :
   - **URL** : `https://votre-domaine.com/api/webhooks/hubspot`
   - **Événements** :
     - Contact creation
     - Contact property change (admiss_flow_status)
     - Deal creation
     - Deal property change (dealstage, admiss_flow_status)
3. Copier le secret et l'ajouter à `.env` : `HUBSPOT_WEBHOOK_SECRET`

### Étape 3 : Tester la synchronisation

```bash
# Synchroniser HubSpot → Database
curl -X POST http://localhost:3000/api/sync/hubspot-to-db

# Synchroniser Database → HubSpot
curl -X POST http://localhost:3000/api/sync/db-to-hubspot
```

## 📱 Intégration Meta Ads

### Étape 1 : Créer une App Meta

1. Aller sur [Meta for Developers](https://developers.facebook.com/)
2. Créer une nouvelle app de type "Business"
3. Ajouter le produit "Lead Ads"
4. Noter l'App ID et App Secret

### Étape 2 : Configurer les webhooks

1. Dans l'App Dashboard > Webhooks
2. Ajouter un webhook :
   - **URL Callback** : `https://votre-domaine.com/api/webhooks/meta`
   - **Verify Token** : Générer un token (ex: `crypto.randomBytes(32).toString('hex')`)
   - **Subscription Fields** : `leadgen`
3. Ajouter le verify token dans `.env` : `META_WEBHOOK_VERIFY_TOKEN`

### Étape 3 : Obtenir un Access Token

1. Dans l'App Dashboard > Tools > Graph API Explorer
2. Sélectionner votre app
3. Générer un token avec les permissions :
   - `leads_retrieval`
   - `pages_read_engagement`
4. Ajouter le token dans `.env` : `META_ACCESS_TOKEN`

### Étape 4 : Tester

Créer un Lead Ad de test et vérifier que le webhook est reçu.

## 📄 Intégration DocuSeal

### Étape 1 : Créer un compte DocuSeal

1. S'inscrire sur [DocuSeal](https://docuseal.co)
2. Obtenir l'API Key dans Settings > API

### Étape 2 : Créer un template de contrat

1. Uploader un PDF de contrat d'alternance
2. Ajouter les champs dynamiques :
   - Prénom
   - Nom
   - Email
   - Téléphone
   - Programme
   - Campus
   - Date de début
   - Date de fin
   - Entreprise
   - Rémunération
3. Noter l'ID du template et l'ajouter à `.env` : `DOCUSEAL_TEMPLATE_CONTRAT_ALTERNANCE`

### Étape 3 : Configurer les webhooks

1. Dans DocuSeal Settings > Webhooks
2. Ajouter un webhook :
   - **URL** : `https://votre-domaine.com/api/webhooks/docuseal`
   - **Événements** :
     - document.viewed
     - document.signed
     - document.completed
     - document.declined
3. Configurer le secret dans `.env` : `DOCUSEAL_WEBHOOK_SECRET`

### Étape 4 : Tester la génération

```bash
curl -X POST http://localhost:3000/api/documents/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": 1,
    "document_type": "contrat_alternance",
    "template_id": "your_template_id"
  }'
```

## 🔄 Automatisations Zapier/Make

Voir le guide détaillé dans `automations/guides/README.md`

### Scénarios principaux

1. **Lead Meta → HubSpot → Dashboard**
2. **Statut changé → Synchronisation**
3. **Admission → Génération contrat**
4. **Contrat signé → Finalisation**

## 📚 API Reference

### Endpoints Candidats

#### GET /api/candidates
Liste des candidats avec filtres optionnels.

**Query Parameters** :
- `status` : Filtrer par statut
- `campus` : Filtrer par campus
- `program` : Filtrer par programme
- `limit` : Limite de résultats
- `offset` : Offset pour pagination

**Response** :
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

#### GET /api/candidates/:id
Détails d'un candidat avec historique.

#### PUT /api/candidates/:id/status
Mettre à jour le statut d'un candidat.

**Body** :
```json
{
  "status": "Admis",
  "notes": "Candidat admis après entretien"
}
```

### Endpoints Webhooks

#### POST /api/webhooks/hubspot
Recevoir les webhooks HubSpot.

#### POST /api/webhooks/meta
Recevoir les webhooks Meta Lead Ads.

#### POST /api/webhooks/docuseal
Recevoir les webhooks DocuSeal.

### Endpoints Documents

#### POST /api/documents/generate
Générer un document DocuSeal.

**Body** :
```json
{
  "candidate_id": 1,
  "document_type": "contrat_alternance",
  "template_id": "optional_template_id"
}
```

## 🔧 Dépannage

### Problèmes de synchronisation HubSpot

1. Vérifier les clés API dans `.env`
2. Vérifier les logs : `logs/combined.log`
3. Vérifier le statut : `GET /api/sync/status`

### Webhooks non reçus

1. Vérifier que l'URL est accessible publiquement
2. Vérifier les logs webhooks : `GET /api/webhooks/events`
3. Tester manuellement : `POST /api/webhooks/test/{source}`

### Erreurs DocuSeal

1. Vérifier l'API Key
2. Vérifier que le template existe
3. Vérifier les champs requis dans le template

### Base de données

1. Vérifier la connexion : `GET /health`
2. Vérifier les migrations : Logs au démarrage
3. Vérifier les permissions PostgreSQL

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs dans `logs/`
2. Consulter la documentation API : `docs/API_REFERENCE.md`
3. Vérifier les guides spécifiques dans `docs/`
