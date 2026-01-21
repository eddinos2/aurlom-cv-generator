# Guide de Configuration HubSpot

Guide détaillé pour configurer HubSpot avec Admiss-Flow.

## 📋 Prérequis

- Compte HubSpot (Free, Starter, Professional ou Enterprise)
- Accès aux paramètres d'administration
- API Key HubSpot

## 🔑 Obtenir l'API Key

1. Aller dans HubSpot Settings > Integrations > Private Apps
2. Créer une nouvelle Private App
3. Accorder les permissions suivantes :
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
   - `crm.objects.deals.read`
   - `crm.objects.deals.write`
   - `crm.schemas.contacts.read`
   - `crm.schemas.deals.read`
4. Copier l'API Key (commence par `pat-na1-`)

## 🏷️ Créer les Propriétés Personnalisées

### Propriétés de Contact

1. Aller dans Settings > Properties > Contact properties
2. Créer les propriétés suivantes :

#### admiss_flow_status (Select)
- **Label** : Admiss Flow Status
- **Type** : Select
- **Options** :
  - Nouveau
  - Contacté
  - RDV fixé
  - Admis
  - No-show
  - Contrat en cours
  - Contrat signé
- **Internal name** : `admiss_flow_status`
- **Field type** : Single-select

#### admiss_program (Text)
- **Label** : Programme Admission
- **Type** : Text
- **Internal name** : `admiss_program`

#### admiss_source (Text)
- **Label** : Source Admission
- **Type** : Text
- **Internal name** : `admiss_source`

#### admiss_campus (Text)
- **Label** : Campus Admission
- **Type** : Text
- **Internal name** : `admiss_campus`

### Propriétés de Deal

1. Aller dans Settings > Properties > Deal properties
2. Créer la propriété `admiss_flow_status` (identique aux contacts)

## 📊 Créer le Pipeline d'Admission

1. Aller dans Settings > Pipelines > Deals
2. Créer un nouveau pipeline "Admission"
3. Créer les stages suivants :
   - Nouveau (appointmentscheduled)
   - Contacté (qualifiedtobuy)
   - RDV fixé (appointmentscheduled)
   - Contrat en cours (presentationscheduled)
   - Admis (closedwon)
   - No-show (closedlost)

## 🔗 Configurer les Webhooks

### Étape 1 : Créer le webhook

1. Aller dans Settings > Integrations > Webhooks
2. Cliquer sur "Create webhook"
3. Configurer :
   - **Subscription type** : Contact and Deal events
   - **URL** : `https://votre-domaine.com/api/webhooks/hubspot`
   - **Events** :
     - Contact creation
     - Contact property change (admiss_flow_status)
     - Deal creation
     - Deal property change (dealstage, admiss_flow_status)

### Étape 2 : Configurer le secret

1. Dans les paramètres du webhook, générer un secret
2. Copier le secret et l'ajouter à `.env` :
   ```
   HUBSPOT_WEBHOOK_SECRET=votre_secret_ici
   ```

### Étape 3 : Tester le webhook

1. Créer un contact de test dans HubSpot
2. Vérifier les logs de votre API
3. Vérifier que le contact apparaît dans la base de données

## 🔄 Mapping des Statuts

| Statut Dashboard | Stage HubSpot Deal | Propriété Contact |
|------------------|-------------------|-------------------|
| Nouveau | appointmentscheduled | Nouveau |
| Contacté | qualifiedtobuy | Contacté |
| RDV fixé | appointmentscheduled | RDV fixé |
| Admis | closedwon | Admis |
| No-show | closedlost | No-show |
| Contrat en cours | presentationscheduled | Contrat en cours |
| Contrat signé | closedwon | Contrat signé |

## 🧪 Tests

### Test 1 : Créer un contact

1. Créer un contact dans HubSpot avec :
   - Email : `test@example.com`
   - First Name : `Test`
   - Last Name : `User`
   - Admiss Flow Status : `Nouveau`
2. Vérifier que le contact apparaît dans `/api/candidates`

### Test 2 : Mettre à jour le statut

1. Modifier le statut d'un contact à `Admis`
2. Vérifier que le statut est synchronisé dans la base de données

### Test 3 : Synchronisation manuelle

```bash
# HubSpot → Database
curl -X POST http://localhost:3000/api/sync/hubspot-to-db

# Database → HubSpot
curl -X POST http://localhost:3000/api/sync/db-to-hubspot
```

## 🔍 Vérification

1. Vérifier les logs de synchronisation : `GET /api/sync/status`
2. Vérifier les événements webhooks : `GET /api/webhooks/events?source=hubspot`
3. Vérifier les contacts dans HubSpot

## ⚠️ Problèmes Courants

### Webhook non reçu

- Vérifier que l'URL est accessible publiquement
- Vérifier le secret dans `.env`
- Vérifier les logs HubSpot (Settings > Integrations > Webhooks > View logs)

### Propriétés non synchronisées

- Vérifier que les propriétés existent dans HubSpot
- Vérifier les permissions de l'API Key
- Vérifier les mappings dans `integrations/hubspot/mappers.ts`

### Erreurs de synchronisation

- Vérifier les logs : `logs/combined.log`
- Vérifier la connexion à la base de données
- Vérifier les limites d'API HubSpot (rate limiting)
