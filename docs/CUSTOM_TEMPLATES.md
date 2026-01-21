# Guide pour Créer des Templates Personnalisés

## Structure d'un Template

Un template CV est un fichier HTML avec des placeholders qui seront remplacés par les données JSON.

### Placeholders Disponibles

#### Informations Personnelles
- `{{personalInfo.firstName}}` - Prénom
- `{{personalInfo.lastName}}` - Nom
- `{{personalInfo.fullName}}` - Nom complet (formaté automatiquement)
- `{{personalInfo.email}}` - Email
- `{{personalInfo.phone}}` - Téléphone
- `{{personalInfo.address}}` - Adresse
- `{{personalInfo.city}}` - Ville
- `{{personalInfo.postalCode}}` - Code postal
- `{{personalInfo.country}}` - Pays
- `{{personalInfo.fullAddress}}` - Adresse complète formatée
- `{{personalInfo.linkedin}}` - URL LinkedIn
- `{{personalInfo.website}}` - Site web
- `{{personalInfo.image}}` - Image de profil (URL ou base64)

#### Sections
- `{{summary}}` - Résumé professionnel (avec sauts de ligne préservés)

#### Sections Répétitives

Pour les sections répétitives (expérience, éducation, etc.), utilisez cette structure :

```html
<!-- START sectionName -->
<div class="item">
  <h3>{{sectionName.field1}}</h3>
  <p>{{sectionName.field2}}</p>
  <div id="sectionName-field3">{{sectionName.field3}}</div>
</div>
<!-- END sectionName -->
```

**Sections disponibles :**
- `experience` - Expérience professionnelle
- `education` - Formation
- `skills` - Compétences
- `languages` - Langues
- `certifications` - Certifications
- `projects` - Projets
- `references` - Références

**Champs pour chaque section :**

**Experience :**
- `{{experience.company}}` - Entreprise
- `{{experience.position}}` - Poste
- `{{experience.location}}` - Lieu
- `{{experience.startDate}}` - Date de début
- `{{experience.endDate}}` - Date de fin
- `{{experience.description}}` - Description
- `{{experience.achievements}}` - Réalisations (avec `<br>`)

**Education :**
- `{{education.institution}}` - Établissement
- `{{education.degree}}` - Diplôme
- `{{education.field}}` - Domaine
- `{{education.location}}` - Lieu
- `{{education.startDate}}` - Date de début
- `{{education.endDate}}` - Date de fin
- `{{education.dateRange}}` - Plage de dates formatée
- `{{education.description}}` - Description
- `{{education.gpa}}` - Moyenne

**Skills :**
- `{{skills.name}}` - Nom de la compétence
- `{{skills.level}}` - Niveau (beginner, intermediate, advanced, expert)
- `{{skills.category}}` - Catégorie

**Languages :**
- `{{languages.name}}` - Nom de la langue
- `{{languages.level}}` - Niveau (A1, A2, B1, B2, C1, C2, native)

**Certifications :**
- `{{certifications.name}}` - Nom
- `{{certifications.issuer}}` - Organisme
- `{{certifications.date}}` - Date
- `{{certifications.credentialId}}` - ID de certification

**Projects :**
- `{{projects.name}}` - Nom du projet
- `{{projects.description}}` - Description
- `{{projects.technologies}}` - Technologies (séparées par virgule)
- `{{projects.url}}` - URL
- `{{projects.startDate}}` - Date de début
- `{{projects.endDate}}` - Date de fin

**References :**
- `{{references.name}}` - Nom
- `{{references.position}}` - Poste
- `{{references.company}}` - Entreprise
- `{{references.email}}` - Email
- `{{references.phone}}` - Téléphone

**Hobbies :**
- `{{hobbies}}` - Liste des hobbies (séparés par virgule)

## Gestion Automatique des Cas Limites

Le système gère automatiquement :

1. **Textes très longs** : Troncature intelligente avec ellipsis
2. **Valeurs manquantes** : Sections masquées automatiquement si vides
3. **Noms/prénoms longs** : Formatage automatique (initiale si nécessaire)
4. **Adresses** : Formatage automatique avec séparateurs
5. **Dates** : Validation et formatage
6. **URLs** : Validation et nettoyage
7. **Espaces multiples** : Nettoyage automatique
8. **Caractères spéciaux** : Échappement HTML automatique

## Exemple de Template Minimal

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>CV - {{personalInfo.fullName}}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .name { font-size: 24px; font-weight: bold; }
        .section { margin-bottom: 20px; }
        .section-title { font-weight: bold; border-bottom: 2px solid #000; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="name">{{personalInfo.fullName}}</h1>
        <p>{{personalInfo.email}} | {{personalInfo.phone}}</p>
        <p>{{personalInfo.fullAddress}}</p>
    </div>

    <div class="section">
        <h2 class="section-title">Profil</h2>
        <p>{{summary}}</p>
    </div>

    <!-- START experience -->
    <div class="section">
        <h2 class="section-title">Expérience</h2>
        <div>
            <h3>{{experience.position}} - {{experience.company}}</h3>
            <p>{{experience.startDate}} - {{experience.endDate}}</p>
            <p>{{experience.description}}</p>
            <div>{{experience.achievements}}</div>
        </div>
    </div>
    <!-- END experience -->

    <!-- START education -->
    <div class="section">
        <h2 class="section-title">Formation</h2>
        <div>
            <h3>{{education.degree}} - {{education.institution}}</h3>
            <p>{{education.dateRange}}</p>
        </div>
    </div>
    <!-- END education -->
</body>
</html>
```

## Utiliser un Template Personnalisé

### Méthode 1 : Via l'API

```bash
curl -X POST http://localhost:3000/api/cv/generate \
  -H "Content-Type: application/json" \
  -d '{
    "cvData": { ... },
    "templateName": "/chemin/vers/mon-template.html",
    "outputFormat": "pdf"
  }'
```

### Méthode 2 : Ajouter dans templates/cv/

1. Créez votre template dans `templates/cv/mon-template.html`
2. Utilisez-le avec `templateName: "mon-template"`

## Conseils pour les Templates

1. **Utilisez des classes CSS** pour le style, pas de styles inline complexes
2. **Prévoyez les débordements** : utilisez `overflow: hidden` et `text-overflow: ellipsis`
3. **Gérez les sections vides** : elles seront automatiquement masquées
4. **Testez avec des données variées** : noms longs, textes longs, valeurs manquantes
5. **Optimisez pour le PDF** : évitez les éléments qui ne s'impriment pas bien (vidéos, animations)

## CSS Recommandé pour Gérer les Cas Limites

```css
/* Gérer les textes longs */
.long-text {
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
}

/* Limiter le nombre de lignes */
.text-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Gérer les noms longs */
.name {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Responsive */
@media print {
    .no-print { display: none; }
}
```
