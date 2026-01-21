# Prompt d'Intégration Meta Lead Ads

Guide de prompt pour configurer l'intégration Meta Lead Ads avec Admiss-Flow.

## 🎯 Objectif

Configurer Meta Lead Ads pour capturer automatiquement les leads et les synchroniser avec HubSpot et Admiss-Flow.

## 📋 Étapes de Configuration

### 1. Créer une App Meta

**Prompt pour Meta** :
```
Je dois créer une application Meta pour intégrer les Lead Ads avec mon système Admiss-Flow.

Objectif : Capturer automatiquement les leads depuis les publicités Facebook/Instagram et les synchroniser avec mon CRM.

Quelles sont les étapes pour créer cette application et configurer les Lead Ads ?
```

### 2. Configurer les Webhooks

**Prompt pour Meta** :
```
Je dois configurer un webhook Meta pour recevoir les événements Lead Ads.

URL du webhook : https://mon-domaine.com/api/webhooks/meta
Événement : leadgen

Comment configurer ce webhook dans l'App Dashboard Meta ?
```

### 3. Obtenir un Access Token

**Prompt pour Meta** :
```
Je dois obtenir un access token Meta pour récupérer les détails des leads.

Permissions nécessaires :
- leads_retrieval
- pages_read_engagement

Comment obtenir ce token et quelles sont les meilleures pratiques pour le gérer ?
```

## 🔧 Configuration Technique

### Variables d'environnement

```
META_APP_ID=votre_app_id
META_APP_SECRET=votre_app_secret
META_WEBHOOK_VERIFY_TOKEN=votre_verify_token
META_ACCESS_TOKEN=votre_access_token
```

### Structure des données Lead

**Champs standard** :
- `first_name` : Prénom
- `last_name` : Nom
- `email` : Email
- `phone_number` : Téléphone

**Champs personnalisés** :
- `program` : Programme souhaité
- `campus` : Campus préféré

## 🧪 Tests

**Prompt pour tester** :
```
Je veux tester l'intégration Meta Lead Ads :

1. Créer un Lead Ad de test dans Meta Ads Manager
2. Soumettre un formulaire de test
3. Vérifier que le webhook est reçu par mon API
4. Vérifier que le lead apparaît dans HubSpot
5. Vérifier que le candidat est créé dans Admiss-Flow

Comment procéder pour ces tests ?
```

## 📊 Mapping des Données

**Structure de mapping** :
- Meta `first_name` → Admiss-Flow `first_name`
- Meta `last_name` → Admiss-Flow `last_name`
- Meta `email` → Admiss-Flow `email`
- Meta `phone_number` → Admiss-Flow `phone`
- Meta `source` → Admiss-Flow `source` (toujours "Meta Ad")
- Meta `campaign_name` → HubSpot `admiss_source`

## ⚠️ Problèmes Courants

**Si le webhook n'est pas reçu** :
1. Vérifier que l'URL est accessible publiquement (HTTPS requis)
2. Vérifier le verify token dans `.env`
3. Vérifier les logs Meta (App Dashboard > Webhooks > View logs)

**Si le token expire** :
1. Les tokens utilisateur expirent après 60 jours
2. Utiliser un token système pour la production
3. Implémenter le refresh automatique si nécessaire

**Si les données sont incomplètes** :
1. Vérifier que les champs sont bien nommés dans le formulaire Meta
2. Vérifier le mapping dans le code
3. Vérifier les permissions du token

## 🔒 Sécurité

**Bonnes pratiques** :
- Ne jamais exposer l'App Secret publiquement
- Utiliser HTTPS pour tous les webhooks
- Valider toutes les données reçues
- Implémenter la vérification de signature (optionnel)

## 📈 Optimisation

**Recommandations** :
- Implémenter un système de retry pour les appels API
- Surveiller les limites de rate (200 appels/heure par défaut)
- Logger tous les leads reçus pour audit
- Implémenter un système de déduplication par email
