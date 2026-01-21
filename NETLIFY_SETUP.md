# Configuration Netlify - Guide Complet

## ⚠️ État Actuel

**Le projet nécessite des modifications pour fonctionner sur Netlify.**

## 🔧 Modifications Nécessaires

### 1. Créer les Netlify Functions

Les fichiers suivants ont été créés :
- `netlify/functions/cv-pdf.js` - Function pour générer le PDF
- `netlify.toml` - Configuration Netlify

### 2. Problèmes à Résoudre

#### A. Puppeteer sur Netlify

Netlify Functions nécessite une version spéciale de Puppeteer avec Chromium inclus.

**Solution :** Utiliser `@sparticuz/chromium` au lieu de `puppeteer` standard.

**Modification nécessaire dans `src/cv/generator.ts` :**

```typescript
// Détecter si on est sur Netlify
const isNetlify = process.env.NETLIFY === 'true' || process.env.AWS_LAMBDA_FUNCTION_NAME;

let puppeteer;
if (isNetlify) {
  // Sur Netlify, utiliser chromium depuis @sparticuz/chromium
  const chromium = require('@sparticuz/chromium');
  puppeteer = require('puppeteer-core');
  
  chromium.setGraphicsMode(false); // Pas besoin de GPU
} else {
  puppeteer = require('puppeteer');
}

// Dans generatePDF:
const browser = await puppeteer.launch({
  headless: true,
  args: isNetlify 
    ? chromium.args 
    : ['--no-sandbox', '--disable-setuid-sandbox', ...],
  executablePath: isNetlify 
    ? await chromium.executablePath() 
    : undefined,
});
```

#### B. TypeScript dans Netlify Functions

Netlify Functions supporte TypeScript, mais il faut compiler ou utiliser `tsx`.

**Option 1 : Compiler TypeScript**
```bash
npm run build
```

**Option 2 : Utiliser tsx dans la Function**
- Nécessite que `tsx` soit dans `node_modules`
- Plus lent mais plus simple

#### C. Fichiers Statiques

Les fichiers statiques (`data/`, `templates/`) doivent être accessibles.

**Solution :** Les inclure dans le build ou utiliser Netlify Assets.

### 3. Installation des Dépendances Netlify

```bash
npm install --save-dev @sparticuz/chromium puppeteer-core
```

### 4. Modifier package.json

Ajouter un script de build pour Netlify :

```json
{
  "scripts": {
    "build": "tsc",
    "netlify:build": "npm install && npm run build"
  }
}
```

## 🚀 Déploiement sur Netlify

### Option 1 : Via l'Interface Netlify

1. Connectez votre repo GitHub à Netlify
2. Configuration :
   - **Build command:** `npm install`
   - **Publish directory:** `frontend`
   - **Functions directory:** `netlify/functions`

### Option 2 : Via Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

## ⚡ Limitations Netlify

### Gratuit (Hobby)
- **Timeout:** 10 secondes max
- **Mémoire:** 1024 MB
- **Bandwidth:** 100 GB/mois
- ⚠️ **Problème:** 10s peut être insuffisant pour Puppeteer

### Pro ($19/mois)
- **Timeout:** 26 secondes max
- **Mémoire:** jusqu'à 3008 MB
- **Bandwidth:** 1 TB/mois
- ✅ **Recommandé** pour Puppeteer

## 🔄 Alternative Recommandée : Vercel

Vercel supporte mieux cette architecture :

### Avantages Vercel
- ✅ Support natif des API Routes Node.js
- ✅ Timeout 60s (gratuit)
- ✅ Meilleur support de Puppeteer
- ✅ Pas de refactoring majeur nécessaire

### Configuration Vercel

Créer `vercel.json` :

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server-cv-only.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server-cv-only.js"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/$1"
    }
  ]
}
```

Puis déployer :
```bash
npm install -g vercel
vercel
```

## 📋 Checklist Netlify

- [ ] Installer `@sparticuz/chromium` et `puppeteer-core`
- [ ] Modifier `src/cv/generator.ts` pour détecter Netlify
- [ ] Adapter le code Puppeteer pour utiliser Chromium Netlify
- [ ] Tester avec timeout 10s (gratuit) ou 26s (Pro)
- [ ] Vérifier que les fichiers statiques sont accessibles
- [ ] Configurer les variables d'environnement si nécessaire
- [ ] Tester le déploiement

## 🎯 Recommandation Finale

**Pour un déploiement rapide et optimal :**

1. **Vercel** (recommandé) - Supporte l'architecture actuelle sans modifications majeures
2. **Netlify Pro** - Si vous voulez vraiment Netlify, nécessite refactoring (2-3h)
3. **Render/Railway** - Alternative avec serveurs Node.js complets

## 📝 Prochaines Étapes

Si vous choisissez Netlify :
1. Je peux adapter le code pour utiliser `@sparticuz/chromium`
2. Modifier `generatePDF` pour détecter Netlify
3. Tester avec les limitations Netlify

Si vous choisissez Vercel :
1. Créer `vercel.json`
2. Déployer directement (fonctionne presque tel quel)
