# API PDF - Documentation

API optimisée pour générer un CV en PDF à partir d'un JSON.

## 🚀 Endpoint Principal

### `POST /api/cv/pdf`

Génère un CV en PDF à partir des données JSON fournies.

#### Requête

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "cvData": {
    "personalInfo": {
      "firstName": "Houssam",
      "lastName": "SAYAD",
      "email": "houssam@aurlom.com",
      "btsProgram": "Biologie Médicale",
      "startYear": 2026
      // ... voir docs/JSON_EXAMPLES.md pour la structure complète
    },
    "experience": [...],
    "education": [...],
    "skills": [...],
    "languages": [...]
  },
  "templateName": "montemplate-v2" // Optionnel, défaut: "montemplate-v2"
}
```

#### Réponse

**Succès (200 OK):**
- **Content-Type:** `application/pdf`
- **Headers:**
  - `Content-Disposition: attachment; filename="cv-Prénom-Nom.pdf"`
  - `X-Generation-Time: 1234ms` (temps de génération)
  - `X-Cache: HIT` ou `MISS` (si cache activé)
- **Body:** Fichier PDF binaire

**Erreur (400/500):**
```json
{
  "success": false,
  "error": "Validation error" | "Failed to generate CV PDF",
  "details": [...], // Si erreur de validation
  "message": "Description de l'erreur",
  "time": "1234ms"
}
```

#### Exemple avec cURL

```bash
curl -X POST http://localhost:3000/api/cv/pdf \
  -H "Content-Type: application/json" \
  -d @data/demo-cv.json \
  --output cv.pdf
```

#### Exemple avec JavaScript (Fetch)

```javascript
const response = await fetch('http://localhost:3000/api/cv/pdf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    cvData: {
      personalInfo: {
        firstName: "Houssam",
        lastName: "SAYAD",
        email: "houssam@aurlom.com",
        btsProgram: "Biologie Médicale",
        startYear: 2026
      }
    },
    templateName: "montemplate-v2"
  })
});

if (response.ok) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cv.pdf';
  a.click();
} else {
  const error = await response.json();
  console.error('Erreur:', error);
}
```

#### Exemple avec Python

```python
import requests

url = "http://localhost:3000/api/cv/pdf"
data = {
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

response = requests.post(url, json=data)

if response.status_code == 200:
    with open('cv.pdf', 'wb') as f:
        f.write(response.content)
    print("PDF généré avec succès!")
else:
    print("Erreur:", response.json())
```

---

## 📊 Endpoints Utilitaires

### `GET /api/cv/pdf/health`

Vérifie l'état de l'API et du cache.

**Réponse:**
```json
{
  "status": "ok",
  "cache": {
    "size": 5,
    "maxSize": 50,
    "ttl": 300
  },
  "timestamp": "2026-01-16T10:30:00.000Z"
}
```

### `POST /api/cv/pdf/clear-cache`

Vide le cache (utile pour le développement).

**Réponse:**
```json
{
  "success": true,
  "message": "Cache cleared",
  "cleared": 5
}
```

---

## ⚡ Optimisations Implémentées

### 1. **Cache en Mémoire**
- Cache des PDFs générés pendant 5 minutes
- Évite les régénérations identiques
- Maximum 50 CVs en cache
- Nettoyage automatique des entrées expirées

### 2. **Optimisations Puppeteer**
- `domcontentloaded` au lieu de `networkidle0` (plus rapide)
- Désactivation des fonctionnalités inutiles (GPU, extensions)
- Viewport optimisé pour A4
- Chargement intelligent des images

### 3. **Headers de Performance**
- `X-Generation-Time`: Temps de génération en millisecondes
- `X-Cache`: Indique si le résultat vient du cache
- `Cache-Control`: Cache côté client (5 minutes)

### 4. **Gestion d'Erreurs**
- Validation Zod avant génération
- Messages d'erreur détaillés
- Timeout de 60s pour la génération PDF

---

## 📈 Performance

### Temps de Génération Typiques

- **Première génération:** 2-5 secondes
- **Depuis le cache:** < 50ms
- **Génération similaire:** 1-3 secondes (cache partiel)

### Taille des PDFs

- **Typique:** 100-300 KB
- **Avec images:** 500 KB - 2 MB
- **Maximum recommandé:** 5 MB

---

## 🔒 Sécurité

- Validation stricte des données avec Zod
- Limite de taille de requête: 10MB
- Timeout de 60s pour éviter les blocages
- Pas d'authentification requise (ajoutable si nécessaire)

---

## 📝 Notes

1. **Template par défaut:** `montemplate-v2` (seul template disponible)
2. **Format PDF:** A4, portrait, sans marges
3. **Timeout:** 60 secondes maximum
4. **Cache:** Activé par défaut, peut être vidé via `/clear-cache`

---

## 🔗 Voir Aussi

- [Exemples JSON complets](JSON_EXAMPLES.md)
- [Structure des données](../src/cv/types.ts)
- [Générateur de CV](../src/cv/generator.ts)
