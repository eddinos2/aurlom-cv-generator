# Prompt d'Intégration HubSpot

Guide de prompt pour configurer l'intégration HubSpot avec Admiss-Flow.

## 🎯 Objectif

Configurer HubSpot pour synchroniser automatiquement les contacts et deals avec Admiss-Flow.

## 📋 Étapes de Configuration

### 1. Créer les Propriétés Personnalisées

**Prompt pour HubSpot** :
```
Je dois créer des propriétés personnalisées dans HubSpot pour gérer le processus d'admission :

1. Propriété de contact "admiss_flow_status" (Select) avec les options :
   - Nouveau
   - Contacté
   - RDV fixé
   - Admis
   - No-show
   - Contrat en cours
   - Contrat signé

2. Propriété de contact "admiss_program" (Text) pour le programme BTS

3. Propriété de contact "admiss_source" (Text) pour la source du lead

4. Propriété de contact "admiss_campus" (Text) pour le campus

5. Propriété de deal "admiss_flow_status" (Select) identique à celle des contacts

Pouvez-vous me guider pour créer ces propriétés dans HubSpot ?
```

### 2. Configurer les Webhooks

**Prompt pour HubSpot** :
```
Je dois configurer un webhook HubSpot pour synchroniser automatiquement les contacts et deals avec mon système Admiss-Flow.

URL du webhook : https://mon-domaine.com/api/webhooks/hubspot

Événements à écouter :
- Contact creation
- Contact property change (admiss_flow_status)
- Deal creation
- Deal property change (dealstage, admiss_flow_status)

Comment configurer ce webhook dans HubSpot ?
```

### 3. Créer le Pipeline d'Admission

**Prompt pour HubSpot** :
```
Je dois créer un pipeline de deals "Admission" avec les stages suivants :
- Nouveau (appointmentscheduled)
- Contacté (qualifiedtobuy)
- RDV fixé (appointmentscheduled)
- Contrat en cours (presentationscheduled)
- Admis (closedwon)
- No-show (closedlost)

Comment créer ce pipeline dans HubSpot ?
```

## 🔧 Configuration API

### Obtenir l'API Key

**Instructions** :
1. Aller dans HubSpot Settings > Integrations > Private Apps
2. Créer une nouvelle Private App
3. Accorder les permissions :
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
   - `crm.objects.deals.read`
   - `crm.objects.deals.write`
4. Copier l'API Key (commence par `pat-na1-`)

### Ajouter dans .env

```
HUBSPOT_API_KEY=pat-na1-votre_cle_ici
HUBSPOT_WEBHOOK_SECRET=votre_secret_webhook
HUBSPOT_PORTAL_ID=votre_portal_id
```

## 🧪 Tests

**Prompt pour tester** :
```
Je veux tester l'intégration HubSpot :

1. Créer un contact de test dans HubSpot avec :
   - Email : test@example.com
   - First Name : Test
   - Last Name : User
   - Admiss Flow Status : Nouveau

2. Vérifier que le contact apparaît dans mon API Admiss-Flow

3. Modifier le statut à "Admis" dans HubSpot

4. Vérifier que le statut est synchronisé dans Admiss-Flow

Comment procéder pour ces tests ?
```

## 📊 Mapping des Données

**Structure de mapping** :
- HubSpot `email` → Admiss-Flow `email`
- HubSpot `firstname` → Admiss-Flow `first_name`
- HubSpot `lastname` → Admiss-Flow `last_name`
- HubSpot `phone` → Admiss-Flow `phone`
- HubSpot `admiss_program` → Admiss-Flow `program`
- HubSpot `admiss_source` → Admiss-Flow `source`
- HubSpot `admiss_campus` → Admiss-Flow `campus`
- HubSpot `admiss_flow_status` → Admiss-Flow `status`

## ⚠️ Problèmes Courants

**Si le webhook n'est pas reçu** :
1. Vérifier que l'URL est accessible publiquement
2. Vérifier le secret dans `.env`
3. Vérifier les logs HubSpot (Settings > Integrations > Webhooks > View logs)

**Si les propriétés ne sont pas synchronisées** :
1. Vérifier que les propriétés existent dans HubSpot
2. Vérifier les permissions de l'API Key
3. Vérifier les mappings dans le code
