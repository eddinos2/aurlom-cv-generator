# Système de Génération de CV

Ce système permet de générer des CV professionnels à partir de données JSON en utilisant des templates HTML/CSS prédéfinis.

## Fonctionnalités

- ✅ Génération de CV à partir de données JSON
- ✅ Templates HTML/CSS personnalisables
- ✅ Export en PDF et HTML
- ✅ Support des images de profil
- ✅ Sections conditionnelles (masquées si vides)
- ✅ Validation des données avec Zod

## Structure des Données

Le format JSON du CV suit cette structure :

```json
{
  "personalInfo": {
    "firstName": "Prénom",
    "lastName": "Nom",
    "email": "email@example.com",
    "phone": "+33 6 12 34 56 78",
    "address": "123 Rue Example",
    "city": "Paris",
    "postalCode": "75001",
    "country": "France",
    "linkedin": "https://linkedin.com/in/...",
    "website": "https://example.com",
    "image": "https://example.com/photo.jpg" // URL ou base64
  },
  "summary": "Résumé professionnel...",
  "experience": [
    {
      "company": "Entreprise",
      "position": "Poste",
      "location": "Ville, Pays",
      "startDate": "2020-01",
      "endDate": "2022-12",
      "current": false,
      "description": "Description...",
      "achievements": ["Réalisation 1", "Réalisation 2"]
    }
  ],
  "education": [
    {
      "institution": "École",
      "degree": "Diplôme",
      "field": "Domaine",
      "location": "Ville",
      "startDate": "2016-09",
      "endDate": "2020-06",
      "current": false,
      "description": "Description...",
      "gpa": "15.5/20"
    }
  ],
  "skills": [
    {
      "name": "JavaScript",
      "level": "expert", // beginner, intermediate, advanced, expert
      "category": "Langages"
    }
  ],
  "languages": [
    {
      "name": "Français",
      "level": "native" // A1, A2, B1, B2, C1, C2, native
    }
  ],
  "certifications": [
    {
      "name": "Certification",
      "issuer": "Organisme",
      "date": "2023-05",
      "credentialId": "ID-12345",
      "url": "https://..."
    }
  ],
  "projects": [
    {
      "name": "Projet",
      "description": "Description...",
      "technologies": ["React", "Node.js"],
      "url": "https://...",
      "startDate": "2023-01",
      "endDate": "2023-06"
    }
  ],
  "hobbies": ["Hobby 1", "Hobby 2"],
  "references": [
    {
      "name": "Nom",
      "position": "Poste",
      "company": "Entreprise",
      "email": "email@example.com",
      "phone": "+33..."
    }
  ]
}
```

## Templates Disponibles

### Modern
Template moderne avec design épuré, mise en page flexible et couleurs vives.

### Classic
Template classique avec style traditionnel, adapté aux secteurs conservateurs.

## API Endpoints

### POST /api/cv/generate

Génère un CV en PDF ou HTML.

**Body:**
```json
{
  "cvData": { /* données CV */ },
  "templateName": "modern", // ou "classic"
  "outputFormat": "pdf" // ou "html"
}
```

**Response:**
- PDF: Fichier PDF en binaire
- HTML: Contenu HTML

### POST /api/cv/preview

Prévisualise un CV en HTML (sans authentification pour faciliter les tests).

**Body:**
```json
{
  "cvData": { /* données CV */ },
  "templateName": "modern"
}
```

**Response:** Contenu HTML

### GET /api/cv/templates

Liste tous les templates disponibles.

**Response:**
```json
{
  "success": true,
  "data": ["modern", "classic"]
}
```

## Utilisation

### Via l'API

```bash
# Générer un CV en PDF
curl -X POST http://localhost:3000/api/cv/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @data/demo-cv.json \
  --output cv.pdf

# Prévisualiser en HTML
curl -X POST http://localhost:3000/api/cv/preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @data/demo-cv.json > preview.html
```

### Via le script de test

```bash
# Installer les dépendances
npm install

# Générer les CVs de démo
tsx src/cv/test-generator.ts
```

Les fichiers seront générés dans le dossier `output/`.

## Créer un Nouveau Template

1. Créer un fichier HTML dans `templates/cv/` (ex: `mon-template.html`)
2. Utiliser les placeholders suivants :
   - `{{personalInfo.firstName}}` - Prénom
   - `{{personalInfo.lastName}}` - Nom
   - `{{personalInfo.email}}` - Email
   - `{{summary}}` - Résumé
   - `{{experience.position}}`, `{{experience.company}}`, etc. dans une section `<!-- START experience -->...<!-- END experience -->`
   - Même principe pour `education`, `skills`, `languages`, `certifications`, `projects`, `references`

3. Les sections répétitives doivent être encadrées par :
```html
<!-- START sectionName -->
<div class="item">
  {{sectionName.field1}}
  {{sectionName.field2}}
</div>
<!-- END sectionName -->
```

4. Les champs conditionnels peuvent utiliser des IDs pour être masqués automatiquement :
```html
<div id="sectionName-field">{{sectionName.field}}</div>
```

## Données de Démo

Un fichier `data/demo-cv.json` est fourni avec des données complètes pour tester le système.

## Notes Techniques

- Les images peuvent être des URLs ou des données base64
- Les dates doivent être au format `YYYY-MM` ou `YYYY-MM-DD`
- Les sections vides sont automatiquement masquées
- Le PDF est généré avec Puppeteer (format A4)
- Les templates utilisent du CSS moderne compatible avec Puppeteer
