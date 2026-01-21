# Prompt d'Intégration DocuSeal

Guide de prompt pour configurer l'intégration DocuSeal avec Admiss-Flow.

## 🎯 Objectif

Configurer DocuSeal pour générer automatiquement les contrats d'alternance et suivre leur signature.

## 📋 Étapes de Configuration

### 1. Créer un Template de Contrat

**Prompt pour DocuSeal** :
```
Je dois créer un template de contrat d'alternance dans DocuSeal pour mon école.

Le contrat doit contenir les champs suivants :
- Prénom de l'étudiant
- Nom de l'étudiant
- Email
- Téléphone
- Programme (BTS MCO, BTS NDRC, etc.)
- Campus
- Date de début de l'alternance
- Date de fin de l'alternance
- Nom de l'entreprise
- Rémunération
- Signature de l'étudiant
- Date de signature

Comment créer ce template dans DocuSeal ?
```

### 2. Configurer les Webhooks

**Prompt pour DocuSeal** :
```
Je dois configurer un webhook DocuSeal pour recevoir les notifications de signature.

URL du webhook : https://mon-domaine.com/api/webhooks/docuseal

Événements à écouter :
- document.viewed
- document.signed
- document.completed
- document.declined

Comment configurer ce webhook dans DocuSeal ?
```

### 3. Obtenir l'API Key

**Instructions** :
1. Se connecter à DocuSeal
2. Aller dans Settings > API
3. Générer une nouvelle API Key
4. Copier la clé

### Ajouter dans .env

```
DOCUSEAL_API_KEY=votre_api_key
DOCUSEAL_BASE_URL=https://api.docuseal.co
DOCUSEAL_TEMPLATE_CONTRAT_ALTERNANCE=template_id
DOCUSEAL_WEBHOOK_SECRET=votre_secret
```

## 🧪 Tests

**Prompt pour tester** :
```
Je veux tester l'intégration DocuSeal :

1. Générer un document de test pour un candidat admis
2. Vérifier que le document est créé dans DocuSeal
3. Vérifier que le document est envoyé au candidat
4. Simuler une signature
5. Vérifier que le webhook est reçu
6. Vérifier que le statut est mis à jour dans Admiss-Flow et HubSpot

Comment procéder pour ces tests ?
```

## 📊 Structure des Données

### Requête de génération

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

### Réponse

```json
{
  "success": true,
  "data": {
    "id": 1,
    "docuseal_document_id": "doc_123",
    "status": "sent",
    "file_url": "https://docuseal.co/documents/doc_123"
  }
}
```

## 🔄 Flux Automatique

**Prompt pour automatisation** :
```
Je veux automatiser la génération de contrats :

1. Quand un candidat passe au statut "Admis" dans HubSpot ou Admiss-Flow
2. Générer automatiquement un contrat DocuSeal avec les données du candidat
3. Envoyer le contrat au candidat pour signature
4. Mettre à jour le statut à "Contrat en cours"
5. Quand le contrat est signé, mettre à jour le statut à "Contrat signé"
6. Notifier l'équipe Admin Alternance

Comment configurer cette automatisation avec Zapier/Make ?
```

## ⚠️ Problèmes Courants

**Si le template n'est pas trouvé** :
1. Vérifier que l'ID du template est correct dans `.env`
2. Vérifier que le template existe dans DocuSeal
3. Vérifier les permissions de l'API Key

**Si les champs ne sont pas remplis** :
1. Vérifier que les noms des champs correspondent exactement
2. Vérifier le mapping dans le code
3. Vérifier que les champs existent dans le template

**Si le webhook n'est pas reçu** :
1. Vérifier que l'URL est accessible publiquement (HTTPS)
2. Vérifier le secret dans `.env`
3. Vérifier les logs DocuSeal

## 🔒 Sécurité

**Bonnes pratiques** :
- Ne jamais exposer l'API Key publiquement
- Utiliser HTTPS pour tous les webhooks
- Valider toutes les données reçues
- Implémenter la vérification de signature des webhooks

## 📈 Bonnes Pratiques

**Recommandations** :
1. Créer un template par type de document
2. Utiliser des noms de champs cohérents
3. Tester avec des données réelles avant la production
4. Surveiller les taux de signature
5. Sauvegarder régulièrement les templates
