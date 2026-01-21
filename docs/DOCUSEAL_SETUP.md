# Guide de Configuration DocuSeal

Guide détaillé pour configurer DocuSeal avec Admiss-Flow.

## 📋 Prérequis

- Compte DocuSeal (gratuit ou payant)
- Document PDF de contrat d'alternance
- Accès à l'API DocuSeal

## 🔑 Obtenir l'API Key

1. Se connecter à [DocuSeal](https://docuseal.co)
2. Aller dans Settings > API
3. Générer une nouvelle API Key
4. Copier la clé et l'ajouter à `.env` :
   ```
   DOCUSEAL_API_KEY=votre_api_key
   DOCUSEAL_BASE_URL=https://api.docuseal.co
   ```

## 📄 Créer un Template de Contrat

### Étape 1 : Préparer le PDF

1. Préparer un PDF de contrat d'alternance
2. Identifier les champs à remplir dynamiquement :
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

### Étape 2 : Uploader le template

1. Aller dans DocuSeal > Templates
2. Cliquer sur "Create Template"
3. Uploader le PDF
4. Nommer le template : "Contrat d'Alternance Aurlom BTS+"

### Étape 3 : Ajouter les champs

1. Pour chaque champ à remplir :
   - Cliquer sur "Add Field"
   - Sélectionner le type (Text, Date, Signature, etc.)
   - Positionner le champ sur le PDF
   - Nommer le champ (ex: "Prénom", "Nom", etc.)

2. Champs recommandés :
   - **Prénom** : Text field
   - **Nom** : Text field
   - **Email** : Text field
   - **Téléphone** : Text field
   - **Programme** : Text field
   - **Campus** : Text field
   - **Date de début** : Date field
   - **Date de fin** : Date field
   - **Entreprise** : Text field
   - **Rémunération** : Text field
   - **Signature étudiant** : Signature field
   - **Date signature** : Date field

### Étape 4 : Noter l'ID du template

1. Une fois le template créé, noter son ID
2. Ajouter dans `.env` :
   ```
   DOCUSEAL_TEMPLATE_CONTRAT_ALTERNANCE=template_id_ici
   ```

## 🔗 Configurer les Webhooks

### Étape 1 : Créer le webhook

1. Aller dans DocuSeal Settings > Webhooks
2. Cliquer sur "Add Webhook"
3. Configurer :
   - **URL** : `https://votre-domaine.com/api/webhooks/docuseal`
   - **Events** :
     - document.viewed
     - document.signed
     - document.completed
     - document.declined

### Étape 2 : Configurer le secret

1. Générer un secret pour le webhook
2. Ajouter dans `.env` :
   ```
   DOCUSEAL_WEBHOOK_SECRET=votre_secret
   ```

### Étape 3 : Tester le webhook

1. Générer un document de test
2. Vérifier que le webhook est reçu
3. Vérifier les logs de votre API

## 🧪 Tester la génération

### Test 1 : Générer un document

```bash
curl -X POST http://localhost:3000/api/documents/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": 1,
    "document_type": "contrat_alternance",
    "template_id": "your_template_id",
    "fields": {
      "Date de début": "2024-09-01",
      "Date de fin": "2026-06-30",
      "Entreprise": "Nom de l'\''entreprise",
      "Rémunération": "1000€/mois"
    }
  }'
```

### Test 2 : Vérifier le statut

```bash
# Vérifier les documents d'un candidat
curl http://localhost:3000/api/documents/candidate/1

# Vérifier les événements webhooks
curl http://localhost:3000/api/webhooks/events?source=docuseal
```

## 🔄 Flux de génération automatique

1. **Trigger** : Statut candidat = "Admis"
2. **Génération** : API génère le document DocuSeal
3. **Envoi** : Document envoyé au candidat pour signature
4. **Suivi** : Webhooks DocuSeal mettent à jour le statut
5. **Finalisation** : Quand signé, statut candidat = "Contrat signé"

## 📊 Structure des données

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
  },
  "docuSeal": {
    "id": "doc_123",
    "submitter_id": "sub_456",
    "file_url": "https://docuseal.co/documents/doc_123",
    "status": "sent"
  }
}
```

### Webhook DocuSeal

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

## ⚠️ Problèmes Courants

### Template non trouvé

- Vérifier que l'ID du template est correct dans `.env`
- Vérifier que le template existe dans DocuSeal
- Vérifier les permissions de l'API Key

### Champs non remplis

- Vérifier que les noms des champs correspondent exactement
- Vérifier le mapping dans `integrations/docuseal/document-generator.ts`
- Vérifier que les champs existent dans le template

### Webhook non reçu

- Vérifier que l'URL est accessible publiquement (HTTPS)
- Vérifier le secret dans `.env`
- Vérifier les logs DocuSeal (Settings > Webhooks > View logs)

### Document non envoyé

- Vérifier que l'email du candidat est valide
- Vérifier les paramètres d'envoi dans DocuSeal
- Vérifier les logs d'erreur dans votre API

## 🔍 Vérification

1. Vérifier les documents générés : `GET /api/documents/candidate/:id`
2. Vérifier les événements webhooks : `GET /api/webhooks/events?source=docuseal`
3. Vérifier les logs : `logs/combined.log`

## 🔒 Sécurité

- Ne jamais exposer l'API Key publiquement
- Utiliser HTTPS pour tous les webhooks
- Valider toutes les données reçues
- Implémenter la vérification de signature des webhooks

## 📈 Bonnes Pratiques

1. **Templates** : Créer un template par type de document
2. **Champs** : Utiliser des noms de champs cohérents
3. **Tests** : Toujours tester avec des données réelles avant la production
4. **Monitoring** : Surveiller les taux de signature et les erreurs
5. **Backup** : Sauvegarder régulièrement les templates
