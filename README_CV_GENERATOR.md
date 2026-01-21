# Interface de Génération de CV

## Accès à l'interface

Une fois le serveur démarré, accédez à l'interface via :

```
http://localhost:3000/cv-generator
```

## Utilisation

1. **Charger les données de démo** : Cliquez sur "📋 Charger les données de démo" pour remplir automatiquement le formulaire avec un exemple complet.

2. **Sélectionner un template** : Choisissez entre "Modern" (design moderne) ou "Classic" (style classique).

3. **Modifier les données** : Vous pouvez modifier directement le JSON dans la zone de texte pour personnaliser le CV.

4. **Valider le JSON** : Cliquez sur "✓ Valider JSON" pour vérifier que votre JSON est correct.

5. **Prévisualiser** : Cliquez sur "👁️ Prévisualiser" pour voir le CV généré dans le panneau de droite.

6. **Générer le PDF** : Cliquez sur "📄 Générer PDF" pour télécharger le CV au format PDF.

## Fonctionnalités

- ✅ Éditeur JSON avec validation en temps réel
- ✅ Prévisualisation instantanée dans un iframe
- ✅ Génération PDF avec téléchargement automatique
- ✅ Support de deux templates (Modern et Classic)
- ✅ Chargement automatique des données de démo
- ✅ Interface responsive (s'adapte aux petits écrans)

## Structure des données JSON

Le format attendu est le même que décrit dans `docs/CV_GENERATION.md`. Voici un exemple minimal :

```json
{
  "personalInfo": {
    "firstName": "Prénom",
    "lastName": "Nom",
    "email": "email@example.com",
    "phone": "+33 6 12 34 56 78",
    "image": "https://example.com/photo.jpg"
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

## Notes

- L'authentification est optionnelle pour faciliter les tests locaux
- Les images peuvent être des URLs ou des données base64
- Le PDF est généré au format A4, optimisé pour l'impression
- Les sections vides sont automatiquement masquées dans le CV généré
