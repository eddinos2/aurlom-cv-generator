# Admiss-Flow Backend API

Backend API pour l'application Admiss-Flow - Système de gestion des admissions avec intégrations HubSpot, Meta Ads, et DocuSeal.

## 🚀 Fonctionnalités

- **API REST** complète pour la gestion des candidats
- **Intégration HubSpot** : Synchronisation bidirectionnelle des contacts et deals
- **Intégration Meta Lead Ads** : Capture automatique des leads depuis Facebook/Instagram
- **Intégration DocuSeal** : Génération automatique de contrats d'alternance
- **Webhooks** : Réception et traitement des événements depuis les plateformes externes
- **Synchronisation automatique** : Mise à jour en temps réel entre tous les systèmes

## 📋 Prérequis

- Node.js 18+ 
- PostgreSQL 12+
- Comptes API pour :
  - HubSpot
  - Meta Developer (Facebook/Instagram)
  - DocuSeal

## 🔧 Installation

1. Cloner le repository
```bash
git clone <repository-url>
cd admiss-flow-backend
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env
# Éditer .env avec vos clés API
```

4. Configurer la base de données
```bash
# Créer la base de données PostgreSQL
createdb admiss_flow

# Les migrations s'exécutent automatiquement au démarrage
```

5. Démarrer le serveur
```bash
# Mode développement
npm run dev

# Mode production
npm run build
npm start
```

## 📚 Documentation API

### Candidats

- `GET /api/candidates` - Liste des candidats
- `GET /api/candidates/:id` - Détails d'un candidat
- `POST /api/candidates` - Créer un candidat
- `PUT /api/candidates/:id` - Mettre à jour un candidat
- `PUT /api/candidates/:id/status` - Mettre à jour le statut

### Webhooks

- `POST /api/webhooks/hubspot` - Webhook HubSpot
- `GET /api/webhooks/meta` - Vérification Meta (setup)
- `POST /api/webhooks/meta` - Webhook Meta Lead Ads
- `POST /api/webhooks/docuseal` - Webhook DocuSeal

### Documents

- `POST /api/documents/generate` - Générer un document DocuSeal
- `GET /api/documents/candidate/:candidateId` - Liste des documents d'un candidat
- `GET /api/documents/:id` - Détails d'un document

### Synchronisation

- `GET /api/sync/status` - Statut de synchronisation

## 🔗 Configuration des Webhooks

### HubSpot

1. Aller dans Settings > Integrations > Webhooks
2. Créer un nouveau webhook avec l'URL : `https://votre-domaine.com/api/webhooks/hubspot`
3. Sélectionner les événements :
   - Contact creation
   - Contact property change
   - Deal creation
   - Deal property change
4. Configurer le secret dans `.env` : `HUBSPOT_WEBHOOK_SECRET`

### Meta Lead Ads

1. Aller dans Meta App Dashboard > Webhooks
2. Ajouter l'URL : `https://votre-domaine.com/api/webhooks/meta`
3. S'abonner à l'événement : `leadgen`
4. Configurer le verify token dans `.env` : `META_WEBHOOK_VERIFY_TOKEN`

### DocuSeal

1. Aller dans DocuSeal Settings > Webhooks
2. Ajouter l'URL : `https://votre-domaine.com/api/webhooks/docuseal`
3. Sélectionner les événements :
   - document.viewed
   - document.signed
   - document.completed
   - document.declined

## 🗄️ Structure de la Base de Données

- `candidates` - Candidats synchronisés
- `status_history` - Historique des changements de statut
- `documents` - Documents DocuSeal générés
- `sync_logs` - Logs de synchronisation
- `webhook_events` - Événements webhooks reçus
- `field_mappings` - Mappings de champs entre systèmes
- `automation_configs` - Configuration des automatisations
- `automation_executions` - Exécutions des automatisations

## 🔄 Flux de Synchronisation

```
Meta Lead Ads → HubSpot → Database → Dashboard
                      ↓
                  DocuSeal (contrats)
                      ↓
              HubSpot (mise à jour)
```

## 📝 Variables d'Environnement

Voir `.env.example` pour la liste complète des variables nécessaires.

## 🧪 Tests

```bash
npm test
```

## 📖 Documentation Complète

Voir le dossier `docs/` pour :
- Guide d'intégration complet
- Configuration HubSpot
- Configuration Meta Ads
- Configuration DocuSeal
- Guide Zapier/Make
- Référence API

## 🤝 Contribution

Les contributions sont les bienvenues ! Merci de créer une issue avant de soumettre une PR.

## 📄 Licence

MIT
