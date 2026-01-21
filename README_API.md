# API CV Generator - Guide Rapide

API optimisée pour générer des CVs en PDF à partir de données JSON.

## 🚀 Démarrage Rapide

### Installation

```bash
npm install
```

### Lancer le serveur

```bash
npm run dev:cv
# ou
node server-cv-only.js
```

Le serveur démarre sur `http://localhost:3000`

## 📡 Endpoint Principal

### `POST /api/cv/pdf`

Génère un CV en PDF à partir d'un JSON.

**Requête:**
```bash
curl -X POST http://localhost:3000/api/cv/pdf \
  -H "Content-Type: application/json" \
  -d @data/demo-cv.json \
  --output cv.pdf
```

**Body JSON:**
```json
{
  "cvData": {
    "personalInfo": {
      "firstName": "Houssam",
      "lastName": "SAYAD",
      "email": "houssam@aurlom.com",
      "btsProgram": "Biologie Médicale",
      "startYear": 2026
    }
  },
  "templateName": "montemplate-v2"
}
```

**Réponse:** Fichier PDF binaire

## ⚡ Performance

- **Première génération:** 2-5 secondes
- **Depuis le cache:** < 50ms
- **Taille PDF typique:** 100-300 KB

## 📚 Documentation Complète

- [API PDF détaillée](docs/API_PDF.md)
- [Exemples JSON](docs/JSON_EXAMPLES.md)

## 🔧 Endpoints Utilitaires

- `GET /api/cv/pdf/health` - État de l'API et cache
- `POST /api/cv/pdf/clear-cache` - Vider le cache
- `GET /api/cv/templates` - Liste des templates disponibles

## 🌐 Interface Web

Accédez à l'interface de test: `http://localhost:3000/cv-generator`
