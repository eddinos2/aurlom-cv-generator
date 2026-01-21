# Guide de Configuration des Automatisations

Ce guide explique comment configurer les automatisations Zapier et Make pour Admiss-Flow.

## 📋 Prérequis

- Compte Zapier ou Make actif
- Accès aux APIs HubSpot, Meta, DocuSeal
- URLs des webhooks de votre backend API

## 🔧 Configuration Zapier

### 1. Scénario : Lead Meta → HubSpot → Dashboard

1. Créer un nouveau Zap
2. **Trigger** : Webhooks by Zapier > Catch Hook
   - Copier l'URL du webhook généré
   - Configurer cette URL dans Meta Lead Ads comme webhook
3. **Action 1** : HubSpot > Create Contact
   - Mapper les champs du webhook vers HubSpot
4. **Action 2** : Webhooks by Zapier > POST
   - URL : `https://votre-api.com/api/webhooks/meta`
   - Envoyer les données du trigger
5. **Action 3** : Email > Send Outbound Email
   - Notifier l'équipe du nouveau lead

### 2. Scénario : Statut changé → Synchronisation

1. **Trigger** : HubSpot > Contact Property Changed
   - Propriété : `admiss_flow_status`
2. **Action** : Webhooks by Zapier > POST
   - URL : `https://votre-api.com/api/candidates/{contactId}/status`
   - Headers : `Authorization: Bearer {JWT_TOKEN}`
   - Body : `{ "status": "{newValue}", "notes": "Synchronisé depuis HubSpot" }`

### 3. Scénario : Admission → Génération contrat

1. **Trigger** : Webhooks by Zapier > Catch Hook
   - URL : `https://hooks.zapier.com/hooks/catch/{id}/admission`
2. **Action 1** : Webhooks by Zapier > POST
   - URL : `https://votre-api.com/api/documents/generate`
   - Générer le contrat DocuSeal
3. **Action 2** : HubSpot > Update Deal
   - Mettre à jour le statut à "Contrat en cours"

### 4. Scénario : Contrat signé → Finalisation

1. **Trigger** : Webhooks by Zapier > Catch Hook
   - URL configurée dans DocuSeal
2. **Action 1** : HubSpot > Update Deal
   - Statut : "Contrat signé"
   - Deal Stage : "closedwon"
3. **Action 2** : Email > Send Outbound Email
   - Notifier l'équipe Admin Alternance

## 🔧 Configuration Make

### 1. Scénario : Lead Meta → HubSpot → Dashboard

1. Créer un nouveau scénario
2. **Module 1** : Webhooks > Custom webhook
   - Créer un webhook
   - Copier l'URL et la configurer dans Meta
3. **Module 2** : HubSpot > Create a contact
   - Mapper les données du webhook
4. **Module 3** : HTTP > Make a request
   - POST vers votre API `/api/webhooks/meta`
5. **Module 4** : Email > Send an email
   - Notification équipe

### 2. Scénario : Statut changé → Synchronisation

1. **Module 1** : HubSpot > Contact updated
   - Filtrer sur `admiss_flow_status`
2. **Module 2** : HTTP > Make a request
   - PUT vers `/api/candidates/{id}/status`

### 3. Scénario : Admission → Génération contrat

1. **Module 1** : Webhooks > Custom webhook
2. **Module 2** : HTTP > Make a request
   - POST vers `/api/documents/generate`
3. **Module 3** : HubSpot > Update a deal

### 4. Scénario : Contrat signé → Finalisation

1. **Module 1** : Webhooks > Custom webhook (depuis DocuSeal)
2. **Module 2** : HubSpot > Update a deal
3. **Module 3** : Email > Send an email

## 🔐 Variables d'Environnement

Dans Zapier/Make, configurez ces variables :

- `API_BASE_URL` : URL de votre backend API
- `JWT_TOKEN` : Token JWT pour l'authentification API
- `TEAM_EMAIL` : Email de l'équipe pour les notifications
- `ADMIN_ALTERNANCE_EMAIL` : Email de l'équipe Admin Alternance
- `DOCUSEAL_TEMPLATE_CONTRAT_ALTERNANCE` : ID du template DocuSeal

## 🧪 Tests

Pour tester chaque scénario :

1. Utiliser l'outil de test intégré de Zapier/Make
2. Envoyer des données de test via les webhooks
3. Vérifier les logs dans votre API
4. Vérifier les données dans HubSpot et la base de données

## 📊 Monitoring

- Surveiller les exécutions dans Zapier/Make
- Vérifier les logs de synchronisation dans `/api/sync/status`
- Configurer des alertes pour les erreurs

## 🔄 Maintenance

- Vérifier régulièrement les tokens d'authentification
- Mettre à jour les mappings si les structures de données changent
- Monitorer les limites d'API de chaque service
