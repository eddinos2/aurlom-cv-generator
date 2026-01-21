# Guide Zapier/Make - Admiss-Flow

Guide complet pour configurer les automatisations Zapier et Make.

## 📋 Vue d'ensemble

Zapier et Make permettent d'orchestrer les flux entre Meta Ads, HubSpot, DocuSeal et votre API Admiss-Flow.

## 🔧 Configuration Zapier

### Scénario 1 : Lead Meta → HubSpot → Dashboard

#### Étape 1 : Créer le Zap

1. Aller sur [Zapier](https://zapier.com) et créer un compte
2. Cliquer sur "Create Zap"
3. Nommer : "Lead Meta → HubSpot → Dashboard"

#### Étape 2 : Configurer le Trigger

1. **App** : Webhooks by Zapier
2. **Event** : Catch Hook
3. **Action** : Cliquer sur "Continue"
4. **Webhook URL** : Copier l'URL générée (ex: `https://hooks.zapier.com/hooks/catch/123456/abc123`)
5. **Méthode** : POST
6. **Test** : Envoyer un exemple de données

#### Étape 3 : Configurer Meta Lead Ads

1. Dans Meta Lead Ads, configurer le webhook avec l'URL Zapier
2. Ou utiliser l'intégration Meta Lead Ads de Zapier directement

#### Étape 4 : Action 1 - Créer dans HubSpot

1. **App** : HubSpot
2. **Event** : Create Contact
3. **Action** : Mapper les champs :
   - Email : `{{trigger.email}}`
   - First Name : `{{trigger.firstName}}`
   - Last Name : `{{trigger.lastName}}`
   - Phone : `{{trigger.phone}}`
   - Admiss Source : `Meta Ad`
   - Admiss Flow Status : `Nouveau`

#### Étape 5 : Action 2 - Notifier l'API

1. **App** : Webhooks by Zapier
2. **Event** : POST
3. **URL** : `https://votre-api.com/api/webhooks/meta`
4. **Method** : POST
5. **Data** : `{{trigger}}`

#### Étape 6 : Action 3 - Notification Email

1. **App** : Email by Zapier
2. **Event** : Send Outbound Email
3. **To** : `{{TEAM_EMAIL}}`
4. **Subject** : `Nouveau lead Meta Ads`
5. **Body** : Template avec les données du lead

### Scénario 2 : Statut changé → Synchronisation

#### Configuration

1. **Trigger** : HubSpot > Contact Property Changed
   - Property : `admiss_flow_status`
2. **Action** : Webhooks by Zapier > POST
   - URL : `https://votre-api.com/api/candidates/{{trigger.contactId}}/status`
   - Headers : `Authorization: Bearer {{JWT_TOKEN}}`
   - Body : 
     ```json
     {
       "status": "{{trigger.newValue}}",
       "notes": "Synchronisé depuis HubSpot"
     }
     ```

### Scénario 3 : Admission → Génération contrat

#### Configuration

1. **Trigger** : Webhooks by Zapier > Catch Hook
   - URL : `https://hooks.zapier.com/hooks/catch/{id}/admission`
2. **Action 1** : Webhooks by Zapier > POST
   - URL : `https://votre-api.com/api/documents/generate`
   - Body :
     ```json
     {
       "candidate_id": "{{trigger.candidateId}}",
       "document_type": "contrat_alternance",
       "template_id": "{{DOCUSEAL_TEMPLATE_ID}}"
     }
     ```
3. **Action 2** : HubSpot > Update Deal
   - Deal ID : `{{trigger.dealId}}`
   - Status : `Contrat en cours`

### Scénario 4 : Contrat signé → Finalisation

#### Configuration

1. **Trigger** : Webhooks by Zapier > Catch Hook
   - URL configurée dans DocuSeal
2. **Action 1** : HubSpot > Update Deal
   - Deal ID : `{{trigger.dealId}}`
   - Status : `Contrat signé`
   - Deal Stage : `closedwon`
3. **Action 2** : Email > Send Email
   - To : `{{ADMIN_ALTERNANCE_EMAIL}}`
   - Subject : `Contrat signé - {{trigger.candidateName}}`

## 🔧 Configuration Make

### Scénario 1 : Lead Meta → HubSpot → Dashboard

#### Étape 1 : Créer le scénario

1. Aller sur [Make](https://www.make.com) et créer un compte
2. Cliquer sur "Create a new scenario"
3. Nommer : "Lead Meta → HubSpot → Dashboard"

#### Étape 2 : Module 1 - Webhook

1. **App** : Webhooks
2. **Module** : Custom webhook
3. **Event** : Receive a webhook
4. **Webhook URL** : Copier l'URL générée
5. **Data structure** : Définir la structure attendue

#### Étape 3 : Module 2 - HubSpot

1. **App** : HubSpot
2. **Module** : Create a contact
3. **Mappings** :
   - email : `{{1.email}}`
   - firstname : `{{1.firstName}}`
   - lastname : `{{1.lastName}}`
   - phone : `{{1.phone}}`
   - admiss_source : `Meta Ad`
   - admiss_flow_status : `Nouveau`

#### Étape 4 : Module 3 - API Call

1. **App** : HTTP
2. **Module** : Make a request
3. **URL** : `https://votre-api.com/api/webhooks/meta`
4. **Method** : POST
5. **Body** : `{{1}}`

#### Étape 5 : Module 4 - Email

1. **App** : Email
2. **Module** : Send an email
3. **To** : `{{TEAM_EMAIL}}`
4. **Subject** : `Nouveau lead Meta Ads`
5. **Body** : Template avec `{{1}}`

### Scénario 2 : Statut changé → Synchronisation

#### Configuration

1. **Module 1** : HubSpot > Contact updated
   - Filter : `admiss_flow_status` changed
2. **Module 2** : HTTP > Make a request
   - URL : `https://votre-api.com/api/candidates/{{1.contactId}}/status`
   - Method : PUT
   - Headers : `Authorization: Bearer {{JWT_TOKEN}}`
   - Body :
     ```json
     {
       "status": "{{1.newValue}}",
       "notes": "Synchronisé depuis HubSpot"
     }
     ```

## 🔐 Variables d'Environnement

Dans Zapier/Make, créer ces variables :

- `API_BASE_URL` : `https://votre-api.com`
- `JWT_TOKEN` : Token JWT pour l'authentification
- `TEAM_EMAIL` : Email de l'équipe
- `ADMIN_ALTERNANCE_EMAIL` : Email Admin Alternance
- `DOCUSEAL_TEMPLATE_CONTRAT_ALTERNANCE` : ID template DocuSeal

## 🧪 Tests

### Test Zapier

1. Utiliser "Test trigger" pour simuler un événement
2. Vérifier chaque action individuellement
3. Activer le Zap et tester avec des données réelles

### Test Make

1. Exécuter le scénario en mode "Run once"
2. Vérifier les données à chaque module
3. Activer le scénario et surveiller les exécutions

## 📊 Monitoring

### Zapier

- Dashboard > My Zaps : Voir tous les Zaps
- History : Voir les exécutions et erreurs
- Settings > Task History : Historique détaillé

### Make

- Scenarios : Voir tous les scénarios
- Execution history : Historique des exécutions
- Error log : Logs d'erreurs

## ⚠️ Problèmes Courants

### Webhook non déclenché

- Vérifier que l'URL est correcte
- Vérifier que les données sont bien formatées
- Vérifier les logs Zapier/Make

### Erreurs d'authentification

- Vérifier que le JWT_TOKEN est valide
- Vérifier les permissions de l'API Key HubSpot
- Vérifier les headers HTTP

### Rate Limiting

- Zapier : 100 tasks/mois (gratuit), plus avec les plans payants
- Make : Limites selon le plan
- Implémenter un système de retry

## 🔄 Maintenance

1. Vérifier régulièrement les tokens d'authentification
2. Mettre à jour les mappings si les structures changent
3. Surveiller les erreurs et les corriger rapidement
4. Optimiser les scénarios pour réduire les coûts

## 📈 Optimisation

1. **Batching** : Grouper plusieurs actions quand possible
2. **Filtres** : Utiliser des filtres pour éviter les exécutions inutiles
3. **Error handling** : Configurer des actions de fallback
4. **Monitoring** : Configurer des alertes pour les erreurs critiques
