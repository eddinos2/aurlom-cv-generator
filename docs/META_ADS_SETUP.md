# Guide de Configuration Meta Ads

Guide détaillé pour configurer Meta Lead Ads avec Admiss-Flow.

## 📋 Prérequis

- Compte Facebook Business
- Page Facebook pour votre école
- Accès à Meta Business Manager

## 🚀 Créer une App Meta

### Étape 1 : Créer l'application

1. Aller sur [Meta for Developers](https://developers.facebook.com/)
2. Cliquer sur "My Apps" > "Create App"
3. Sélectionner "Business" comme type d'app
4. Remplir les informations :
   - **App Name** : Admiss-Flow
   - **App Contact Email** : votre email
   - **Business Account** : sélectionner votre compte business

### Étape 2 : Ajouter le produit Lead Ads

1. Dans le dashboard de l'app, aller dans "Add Products"
2. Rechercher "Lead Ads" et cliquer sur "Set Up"
3. Sélectionner votre Page Facebook

### Étape 3 : Obtenir les identifiants

1. **App ID** : Visible dans le dashboard (Settings > Basic)
2. **App Secret** : Settings > Basic > Show > App Secret
3. Ajouter dans `.env` :
   ```
   META_APP_ID=votre_app_id
   META_APP_SECRET=votre_app_secret
   ```

## 🔐 Obtenir un Access Token

### Méthode 1 : Token utilisateur (développement)

1. Aller dans Tools > Graph API Explorer
2. Sélectionner votre app
3. Cliquer sur "Generate Access Token"
4. Sélectionner les permissions :
   - `leads_retrieval`
   - `pages_read_engagement`
   - `pages_show_list`
5. Copier le token et l'ajouter à `.env` :
   ```
   META_ACCESS_TOKEN=votre_token
   ```

### Méthode 2 : Token système (production)

1. Aller dans Settings > Advanced > Security
2. Activer "Require App Secret"
3. Utiliser l'API pour générer un token système :
   ```bash
   curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?client_id={APP_ID}&client_secret={APP_SECRET}&grant_type=client_credentials"
   ```

## 🔗 Configurer les Webhooks

### Étape 1 : Générer un Verify Token

Générer un token de vérification sécurisé :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ajouter dans `.env` :
```
META_WEBHOOK_VERIFY_TOKEN=votre_token_genere
```

### Étape 2 : Configurer le webhook dans Meta

1. Aller dans l'App Dashboard > Webhooks
2. Cliquer sur "Add Callback URL"
3. Configurer :
   - **Callback URL** : `https://votre-domaine.com/api/webhooks/meta`
   - **Verify Token** : Le token généré à l'étape 1
   - **Subscription Fields** : `leadgen`
4. Cliquer sur "Verify and Save"

### Étape 3 : Vérifier la configuration

Meta enverra une requête GET pour vérifier le webhook. Votre API doit répondre avec le challenge.

## 📝 Créer un Lead Ad

### Étape 1 : Créer la campagne

1. Aller dans Meta Ads Manager
2. Créer une nouvelle campagne
3. Sélectionner "Leads" comme objectif
4. Nommer la campagne (ex: "Admission BTS+")

### Étape 2 : Configurer le formulaire

1. Créer un formulaire de leads
2. Ajouter les champs :
   - Prénom (first_name)
   - Nom (last_name)
   - Email (email)
   - Téléphone (phone)
   - Programme souhaité (custom)
   - Campus (custom)
3. Sauvegarder le formulaire

### Étape 3 : Lier le webhook

Le webhook sera automatiquement appelé quand un lead est soumis.

## 🧪 Tester l'intégration

### Test 1 : Vérifier le webhook

1. Soumettre un formulaire de test dans votre Lead Ad
2. Vérifier les logs de votre API
3. Vérifier que le lead apparaît dans HubSpot et la base de données

### Test 2 : Vérifier les données

```bash
# Vérifier les événements webhooks
curl http://localhost:3000/api/webhooks/events?source=meta

# Vérifier les candidats créés
curl http://localhost:3000/api/candidates?source=Meta%20Ad
```

## 🔍 Structure des données Lead

Un lead Meta contient :

```json
{
  "id": "lead_id",
  "created_time": "2024-01-19T10:00:00+0000",
  "ad_id": "ad_id",
  "ad_name": "Ad Name",
  "form_id": "form_id",
  "field_data": [
    {
      "name": "first_name",
      "values": ["John"]
    },
    {
      "name": "last_name",
      "values": ["Doe"]
    },
    {
      "name": "email",
      "values": ["john@example.com"]
    },
    {
      "name": "phone_number",
      "values": ["+33123456789"]
    }
  ]
}
```

## 🔄 Flux de traitement

1. **Lead soumis** → Meta envoie webhook
2. **Webhook reçu** → API récupère les détails du lead
3. **Données extraites** → Création/mise à jour candidat
4. **Synchronisation HubSpot** → Contact créé dans HubSpot
5. **Notification** → Équipe notifiée du nouveau lead

## ⚠️ Problèmes Courants

### Webhook non reçu

- Vérifier que l'URL est accessible publiquement (HTTPS requis)
- Vérifier le verify token dans `.env`
- Vérifier les logs Meta (App Dashboard > Webhooks > View logs)

### Token expiré

- Les tokens utilisateur expirent après 60 jours
- Utiliser un token système pour la production
- Implémenter le refresh automatique si nécessaire

### Données manquantes

- Vérifier que les champs sont bien nommés dans le formulaire
- Vérifier le mapping dans `integrations/meta/lead-processor.ts`
- Vérifier les permissions du token (leads_retrieval)

### Rate Limiting

- Meta limite à 200 appels/heure par défaut
- Implémenter un système de retry avec backoff exponentiel
- Surveiller les erreurs 429 (Too Many Requests)

## 📊 Monitoring

1. Surveiller les logs webhooks : `GET /api/webhooks/events?source=meta`
2. Surveiller les synchronisations : `GET /api/sync/status`
3. Surveiller les erreurs dans les logs : `logs/combined.log`

## 🔒 Sécurité

- Ne jamais exposer l'App Secret publiquement
- Utiliser HTTPS pour tous les webhooks
- Valider toutes les données reçues
- Implémenter la vérification de signature (optionnel mais recommandé)
