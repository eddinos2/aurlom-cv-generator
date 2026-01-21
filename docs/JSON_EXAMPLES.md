# Exemples JSON pour le Générateur de CV

Ce document fournit des exemples complets et minimaux de JSON pour générer un CV avec le template Aurlom BTS+.

## 📋 Table des matières

1. [JSON Complet (Exemple Full)](#json-complet-exemple-full)
2. [JSON Minimal (Variables Requises)](#json-minimal-variables-requises)
3. [Structure des Données](#structure-des-données)

---

## 📄 JSON Complet (Exemple Full)

Voici un exemple complet avec toutes les options disponibles :

```json
{
  "personalInfo": {
    "firstName": "Houssam",
    "lastName": "SAYAD",
    "email": "houssam@aurlom.com",
    "phone": "+33 7 77 77 77 77",
    "address": "45 Avenue des Champs-Élysées",
    "city": "Paris",
    "postalCode": "75008",
    "country": "France",
    "dateOfBirth": "18 juin 2006",
    "linkedin": "https://linkedin.com/in/aurlom",
    "website": "https://www.example.com",
    "image": "https://example.com/photo.jpg",
    "drivingLicense": "Permis B",
    "hasVehicle": true,
    "btsProgram": "Biologie Médicale",
    "startYear": 2026,
    "alternanceDetails": {
      "domaine": "laboratoire",
      "activites": "préparation et traitement des échantillons, prélèvements selon protocole, participation aux analyses, traçabilité, hygiène-sécurité et contrôle qualité",
      "disponibilite": "Disponible 3 jours en structure, 2 jours à l'école et à temps plein pendant les vacances",
      "qualites": "la rigueur, la fiabilité, l'implication et le sens des responsabilités"
    }
  },
  "experience": [
    {
      "company": "McDonald's",
      "position": "Équipier polyvalent",
      "location": "Bonneuil-sur-Marne (93)",
      "startDate": "2026-01",
      "endDate": "2026-02",
      "current": false,
      "description": "Accueil clientèle, préparation en cuisine, gestion des commandes et maintien d'un service rapide dans un environnement à forte affluence.",
      "achievements": []
    },
    {
      "company": "Aide aux devoirs",
      "position": "Tuteur scolaire",
      "location": "Paris (75)",
      "startDate": "2025-09",
      "endDate": "2025-12",
      "current": true,
      "description": "Accompagnement d'élèves du primaire et du collège : explication des leçons, aide aux exercices et suivi méthodologique.",
      "achievements": []
    }
  ],
  "education": [
    {
      "institution": "Lycée Pasteur",
      "degree": "Baccalauréat Général",
      "field": "Sciences de la Vie et de la Terre",
      "location": "Paris, France",
      "startDate": "2021-09",
      "endDate": "2024-06",
      "current": false,
      "gpa": "Mention Bien"
    }
  ],
  "skills": [
    {
      "name": "vente",
      "level": "intermediate",
      "category": "Compétences"
    },
    {
      "name": "relation client",
      "level": "intermediate",
      "category": "Compétences"
    },
    {
      "name": "Rigoureux",
      "level": "advanced",
      "category": "Qualités"
    },
    {
      "name": "ponctuel",
      "level": "advanced",
      "category": "Qualités"
    },
    {
      "name": "Amitié",
      "level": "advanced",
      "category": "Valeurs"
    }
  ],
  "languages": [
    {
      "name": "Anglais",
      "level": "intermediate"
    },
    {
      "name": "Espagnol",
      "level": "beginner"
    },
    {
      "name": "Allemand",
      "level": "scolaire"
    }
  ],
  "software": [
    {
      "name": "Canva",
      "level": "professionnel"
    },
    {
      "name": "Suite Google",
      "level": "beginner"
    }
  ],
  "certifications": [],
  "projects": [],
  "hobbies": [
    "Sciences : lecture d'articles scientifiques",
    "Sport : natation",
    "Bénévolat : aide aux devoirs"
  ]
}
```

---

## ⚡ JSON Minimal (Variables Requises)

Voici le JSON minimal avec uniquement les champs obligatoires :

```json
{
  "personalInfo": {
    "firstName": "Prénom",
    "lastName": "Nom",
    "email": "email@example.com",
    "btsProgram": "Nom du BTS",
    "startYear": 2026
  }
}
```

### Version avec quelques champs optionnels recommandés :

```json
{
  "personalInfo": {
    "firstName": "Prénom",
    "lastName": "Nom",
    "email": "email@example.com",
    "phone": "+33 6 12 34 56 78",
    "city": "Paris",
    "postalCode": "75008",
    "dateOfBirth": "18 juin 2006",
    "drivingLicense": "Permis B",
    "hasVehicle": true,
    "btsProgram": "Biologie Médicale",
    "startYear": 2026,
    "alternanceDetails": {
      "domaine": "laboratoire",
      "activites": "description des activités",
      "disponibilite": "disponibilité",
      "qualites": "qualités personnelles"
    }
  },
  "experience": [
    {
      "company": "Nom de l'entreprise",
      "position": "Poste occupé",
      "location": "Ville (code postal)",
      "startDate": "2024-01",
      "endDate": "2024-12",
      "current": false,
      "description": "Description de l'expérience"
    }
  ],
  "education": [
    {
      "institution": "Nom de l'établissement",
      "degree": "Diplôme obtenu",
      "location": "Ville, Pays",
      "startDate": "2021-09",
      "endDate": "2024-06",
      "current": false
    }
  ],
  "languages": [
    {
      "name": "Français",
      "level": "native"
    }
  ],
  "skills": [
    {
      "name": "Compétence",
      "level": "intermediate",
      "category": "Compétences"
    }
  ]
}
```

---

## 📊 Structure des Données

### `personalInfo` (Obligatoire)

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `firstName` | string | ✅ | Prénom de l'étudiant |
| `lastName` | string | ✅ | Nom de famille |
| `email` | string | ✅ | Adresse email |
| `phone` | string | ❌ | Numéro de téléphone |
| `address` | string | ❌ | Adresse postale |
| `city` | string | ❌ | Ville |
| `postalCode` | string | ❌ | Code postal |
| `country` | string | ❌ | Pays |
| `dateOfBirth` | string | ❌ | Date de naissance (format libre) |
| `linkedin` | string | ❌ | URL LinkedIn |
| `website` | string | ❌ | Site web personnel |
| `image` | string | ❌ | URL de la photo de profil |
| `drivingLicense` | string | ❌ | Permis de conduire (ex: "Permis B") |
| `hasVehicle` | boolean | ❌ | Possession d'un véhicule |
| `btsProgram` | string | ✅ | Nom du BTS (ex: "Biologie Médicale") |
| `startYear` | number | ✅ | Année de rentrée scolaire (2020-2030) |
| `alternanceDetails` | object | ❌ | Détails de l'alternance |

#### `alternanceDetails` (Optionnel)

| Champ | Type | Description |
|-------|------|-------------|
| `domaine` | string | Domaine d'activité |
| `activites` | string | Activités principales |
| `disponibilite` | string | Disponibilité (jours en entreprise/école) |
| `qualites` | string | Qualités personnelles |

### `experience` (Optionnel - Array)

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `company` | string | ✅ | Nom de l'entreprise |
| `position` | string | ✅ | Poste occupé |
| `location` | string | ❌ | Lieu (ville, code postal) |
| `startDate` | string | ✅ | Date de début (format: "YYYY-MM") |
| `endDate` | string | ❌ | Date de fin (format: "YYYY-MM") |
| `current` | boolean | ❌ | Poste actuel (true/false) |
| `description` | string | ❌ | Description de l'expérience |
| `achievements` | string[] | ❌ | Liste des réalisations |

### `education` (Optionnel - Array)

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `institution` | string | ✅ | Nom de l'établissement |
| `degree` | string | ✅ | Diplôme obtenu |
| `field` | string | ❌ | Spécialité/Domaine |
| `location` | string | ❌ | Lieu (ville, pays) |
| `startDate` | string | ❌ | Date de début (format: "YYYY-MM") |
| `endDate` | string | ❌ | Date de fin (format: "YYYY-MM") |
| `current` | boolean | ❌ | Formation en cours |
| `gpa` | string | ❌ | Mention ou note (ex: "Mention Bien") |

### `skills` (Optionnel - Array)

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `name` | string | ✅ | Nom de la compétence |
| `level` | string | ❌ | Niveau: "beginner", "intermediate", "advanced", "expert", "débutant", "intermédiaire", "scolaire", "professionnel" |
| `category` | string | ❌ | Catégorie: "Compétences", "Qualités", "Valeurs" |

### `languages` (Optionnel - Array)

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `name` | string | ✅ | Nom de la langue |
| `level` | string | ❌ | Niveau: "A1", "A2", "B1", "B2", "C1", "C2", "native", "beginner", "intermediate", "scolaire", etc. |

### `software` (Optionnel - Array)

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `name` | string | ✅ | Nom du logiciel |
| `level` | string | ❌ | Niveau: "beginner", "intermediate", "advanced", "expert", "débutant", "intermédiaire", "scolaire", "professionnel" |

### `certifications` (Optionnel - Array)

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `name` | string | ✅ | Nom de la certification |
| `issuer` | string | ❌ | Organisme émetteur |
| `date` | string | ❌ | Date d'obtention |

### `projects` (Optionnel - Array)

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `name` | string | ✅ | Nom du projet |
| `description` | string | ❌ | Description |
| `technologies` | string[] | ❌ | Technologies utilisées |
| `url` | string | ❌ | URL du projet |

### `hobbies` (Optionnel - Array)

| Champ | Type | Description |
|-------|------|-------------|
| - | string | Activité extra-scolaire (format libre) |

---

## 📝 Notes Importantes

1. **Format des dates** : Utilisez le format `"YYYY-MM"` pour les dates (ex: `"2024-01"` pour janvier 2024)

2. **Niveaux de langue** : Vous pouvez utiliser soit les niveaux CECRL (`A1`, `A2`, `B1`, `B2`, `C1`, `C2`, `native`) soit des niveaux génériques (`beginner`, `intermediate`, `advanced`, `expert`, `scolaire`, `professionnel`)

3. **Catégories de compétences** :
   - `"Compétences"` : Compétences techniques/professionnelles
   - `"Qualités"` : Qualités personnelles (affichées avec `#`)
   - `"Valeurs"` : Valeurs personnelles (affichées avec `#`)

4. **Génération automatique** :
   - Si `btsProgram` et `startYear` sont présents, le système génère automatiquement :
     - Un mini-bio standardisé Aurlom
     - Une entrée de formation académique Aurlom BTS+ (2026-2028)

5. **Champs optionnels** : Tous les champs marqués ❌ sont optionnels et peuvent être omis ou laissés vides (`null` ou `""`)

---

## 🔗 Fichiers de Référence

- **Exemple complet** : `data/demo-cv.json`
- **Schéma TypeScript** : `src/cv/types.ts`
- **Générateur** : `src/cv/generator.ts`
