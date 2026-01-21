# Déploiement sur Vercel

## ✅ Prêt pour Vercel !

Le projet est maintenant configuré pour être déployé sur Vercel sans modifications majeures.

## 🚀 Déploiement Rapide

### Option 1 : Via Vercel CLI (Recommandé)

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer (première fois)
vercel

# Déployer en production
vercel --prod
```

### Option 2 : Via l'Interface Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Connectez votre compte GitHub
3. Importez le repository `aurlom-cv-generator`
4. Vercel détectera automatiquement la configuration
5. Cliquez sur "Deploy"

## 📋 Configuration

Le fichier `vercel.json` configure :

- **API Routes** : Toutes les routes `/api/*` sont dirigées vers `server-cv-only.js`
- **Fichiers statiques** : `/data/*` et `/templates/*` sont servis directement
- **Frontend** : `/cv-generator` et `/` pointent vers l'interface
- **Timeout** : 60 secondes (suffisant pour Puppeteer)
- **Mémoire** : 3008 MB (maximum Vercel)

## 🔧 Variables d'Environnement

Aucune variable d'environnement requise pour le générateur de CV.

Si vous avez besoin de variables (ex: pour d'autres parties du projet), ajoutez-les dans :
- Interface Vercel : Settings → Environment Variables
- Ou via CLI : `vercel env add VARIABLE_NAME`

## 📡 Endpoints Disponibles

Une fois déployé, vos endpoints seront disponibles sur :
- `https://votre-projet.vercel.app/api/cv/pdf`
- `https://votre-projet.vercel.app/api/cv/preview`
- `https://votre-projet.vercel.app/api/cv/templates`
- `https://votre-projet.vercel.app/cv-generator` (Interface)

## ⚡ Performance Vercel

- **Timeout** : 60 secondes (gratuit)
- **Mémoire** : jusqu'à 3008 MB
- **Bandwidth** : Illimité (gratuit)
- **Cold Start** : ~1-2 secondes
- **Warm** : < 100ms

## 🐛 Dépannage

### Erreur "Module not found"
- Vérifiez que toutes les dépendances sont dans `package.json`
- Exécutez `npm install` localement pour vérifier

### Timeout lors de la génération PDF
- Vérifiez les logs Vercel pour voir où ça bloque
- Le timeout est de 60s, normalement suffisant

### Puppeteer ne fonctionne pas
- Vercel supporte Puppeteer nativement
- Si problème, vérifiez que `puppeteer` est dans `dependencies` (pas `devDependencies`)

## 📝 Notes Importantes

1. **Premier déploiement** : Peut prendre 2-3 minutes (installation des dépendances)
2. **Cold Start** : La première requête après inactivité peut prendre 1-2 secondes
3. **Puppeteer** : Fonctionne nativement sur Vercel, pas besoin de modifications
4. **Fichiers statiques** : Assurez-vous que `data/` et `templates/` sont bien dans le repo

## 🔗 Documentation Vercel

- [Documentation Vercel](https://vercel.com/docs)
- [API Routes](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Configuration](https://vercel.com/docs/concepts/projects/configuration)

## ✅ Avantages Vercel

- ✅ Support natif des serveurs Node.js
- ✅ Timeout 60s (vs 10s Netlify gratuit)
- ✅ Puppeteer fonctionne sans modifications
- ✅ Déploiement automatique depuis GitHub
- ✅ CDN global pour fichiers statiques
- ✅ Logs en temps réel
- ✅ Preview deployments pour chaque PR

## 🎯 Prochaines Étapes

1. Déployez avec `vercel` ou via l'interface
2. Testez l'endpoint `/api/cv/pdf`
3. Configurez un domaine personnalisé si nécessaire
4. Activez les déploiements automatiques depuis GitHub
