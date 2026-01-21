# Guide de Démarrage Rapide - Générateur de CV

## 🚀 Démarrage rapide

### 1. Installer les dépendances

```bash
npm install
```

### 2. Démarrer le serveur

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

### 3. Accéder à l'interface

Ouvrez votre navigateur et allez sur :

```
http://localhost:3000/cv-generator
```

## 📋 Utilisation de l'interface

1. **Cliquez sur "📋 Charger les données de démo"** pour remplir automatiquement le formulaire
2. **Sélectionnez un template** (Modern ou Classic)
3. **Modifiez les données** si nécessaire dans l'éditeur JSON
4. **Cliquez sur "👁️ Prévisualiser"** pour voir le CV dans le panneau de droite
5. **Cliquez sur "📄 Générer PDF"** pour télécharger le CV au format PDF

## 🎨 Templates disponibles

- **Modern** : Design moderne avec mise en page flexible
- **Classic** : Style classique et professionnel

## 📝 Format des données JSON

Voir `docs/CV_GENERATION.md` pour la structure complète des données.

Exemple minimal :
```json
{
  "personalInfo": {
    "firstName": "Marie",
    "lastName": "Dupont",
    "email": "marie.dupont@email.com"
  },
  "summary": "Résumé professionnel...",
  "experience": [
    {
      "company": "Entreprise",
      "position": "Poste",
      "startDate": "2020-01",
      "endDate": "2022-12",
      "current": false
    }
  ]
}
```

## 🔧 Génération via ligne de commande

Vous pouvez aussi générer des CVs directement via le script :

```bash
npm run cv:generate
```

Les fichiers seront générés dans le dossier `output/`.

## 🐛 Dépannage

### Le serveur ne démarre pas
- Vérifiez que le port 3000 n'est pas déjà utilisé
- Vérifiez que toutes les dépendances sont installées (`npm install`)

### Erreur "Template not found"
- Vérifiez que les fichiers `templates/cv/modern.html` et `templates/cv/classic.html` existent

### Erreur lors de la génération PDF
- Vérifiez que Puppeteer est correctement installé
- Sur Linux, vous pourriez avoir besoin d'installer des dépendances système :
  ```bash
  sudo apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2
  ```

## 📚 Documentation complète

Voir `docs/CV_GENERATION.md` pour la documentation complète.
