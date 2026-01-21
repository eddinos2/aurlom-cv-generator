# Gestion des Cas Limites

Ce document décrit comment le système gère les cas limites et problèmes potentiels.

## Cas Limites Gérés Automatiquement

### 1. Noms et Prénoms Très Longs

**Problème :** Un nom comme "Jean-Baptiste-Marie-Philippe de La Rochefoucauld" peut déborder.

**Solution :**
- Troncature automatique à 50 caractères
- Si trop long, formatage avec initiale : "J-B. de La Rochefoucauld"
- Utilisation de `{{personalInfo.fullName}}` pour un formatage optimal

### 2. Textes Très Longs

**Problème :** Des descriptions de 5000 caractères peuvent casser la mise en page.

**Solution :**
- Troncature intelligente avec ellipsis
- Préservation des sauts de ligne avec `<br>`
- Limites par champ :
  - Résumé : 2000 caractères
  - Description expérience : 2000 caractères
  - Réalisations : 500 caractères chacune
  - Nom entreprise/poste : 200 caractères

### 3. Valeurs Manquantes (null, undefined, "")

**Problème :** Des champs vides peuvent créer des espaces vides ou des erreurs.

**Solution :**
- Sections vides automatiquement masquées
- Champs individuels avec IDs supprimés s'ils sont vides
- Valeurs par défaut : chaîne vide au lieu de null/undefined

### 4. URLs Invalides

**Problème :** Des URLs malformées peuvent casser le rendu.

**Solution :**
- Validation automatique des URLs
- Nettoyage des URLs invalides (retour à chaîne vide)
- Support des URLs relatives et absolues

### 5. Dates Mal Formatées

**Problème :** Des dates comme "2020" ou "janvier 2020" peuvent poser problème.

**Solution :**
- Acceptation de formats variés (YYYY-MM, YYYY-MM-DD, texte libre)
- Pas de validation stricte pour permettre la flexibilité
- Formatage préservé tel quel

### 6. Images Manquantes ou Invalides

**Problème :** Une image manquante ou une URL invalide peut casser le layout.

**Solution :**
- Section image automatiquement masquée si absente
- Support des URLs et base64
- Pas d'erreur si l'image ne charge pas (géré par le navigateur)

### 7. Listes Vides

**Problème :** Des tableaux vides peuvent créer des sections vides.

**Solution :**
- Sections répétitives automatiquement masquées si le tableau est vide
- Détection automatique via `<!-- START section -->` et `<!-- END section -->`

### 8. Caractères Spéciaux et HTML

**Problème :** Des caractères comme `<`, `>`, `&` peuvent casser le HTML.

**Solution :**
- Échappement HTML automatique de tous les champs texte
- Préservation des sauts de ligne (`\n` → `<br>`)
- Support des balises HTML dans les descriptions (échappement partiel)

### 9. Espaces Multiples et Formatage

**Problème :** Des espaces multiples ou des retours à la ligne peuvent créer des problèmes.

**Solution :**
- Nettoyage automatique : suppression des espaces multiples
- Trim automatique de tous les champs
- Normalisation des retours à la ligne

### 10. Débordements CSS

**Problème :** Du texte qui dépasse peut casser la mise en page.

**Solution :**
- Troncature côté serveur avant le rendu
- Classes CSS recommandées dans les templates
- Support de `text-overflow: ellipsis` et `word-wrap`

## Exemples de Données Test

Pour tester votre template, utilisez ces cas limites :

```json
{
  "personalInfo": {
    "firstName": "Jean-Baptiste-Marie-Philippe-Alexandre",
    "lastName": "de La Rochefoucauld-Montmorency",
    "email": "very.long.email.address@very-long-domain-name.example.com",
    "phone": "+33 6 12 34 56 78 90 12 34",
    "address": "123 Rue de la République, Appartement 456, Étage 7, Bâtiment B"
  },
  "summary": "Un résumé très très très long qui dépasse largement les limites normales et qui pourrait poser problème si on ne le gère pas correctement. ".repeat(20),
  "experience": [
    {
      "company": "Entreprise avec un nom très très très long qui pourrait déborder",
      "position": "Poste avec un titre très très très long qui pourrait aussi déborder",
      "description": "Description très longue. ".repeat(50),
      "achievements": [
        "Réalisation 1 avec un texte très long",
        "Réalisation 2",
        null,
        "",
        "Réalisation 3 avec encore plus de texte"
      ]
    }
  ]
}
```

## Recommandations pour les Templates

1. **Utilisez `max-width`** pour limiter la largeur des éléments
2. **Utilisez `overflow: hidden`** pour éviter les débordements
3. **Utilisez `word-wrap: break-word`** pour les textes longs
4. **Testez avec des données variées** avant de déployer
5. **Prévoyez des classes CSS** pour gérer les cas limites

## Validation et Erreurs

Le système valide les données avec Zod mais reste permissif :
- Longueurs maximales définies pour éviter les abus
- Valeurs null/undefined acceptées et converties en chaînes vides
- URLs validées mais pas strictement (peuvent être vides)
- Dates acceptées en format libre

Si une erreur survient, elle sera loggée et un message d'erreur clair sera retourné à l'utilisateur.
