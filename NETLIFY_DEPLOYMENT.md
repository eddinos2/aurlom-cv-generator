# Déploiement sur Netlify

## ⚠️ État Actuel

**Le projet n'est PAS encore prêt pour Netlify** dans sa forme actuelle.

## 🔍 Problèmes Identifiés

### 1. **Architecture Serveur Express**
- Le projet utilise un serveur Express (`server-cv-only.js`) qui tourne en continu
- Netlify ne supporte pas les serveurs Node.js persistants
- **Solution** : Convertir les routes API en Netlify Functions

### 2. **Puppeteer pour PDF**
- La génération de PDF utilise Puppeteer qui nécessite Chrome/Chromium
- Netlify Functions supporte Puppeteer mais avec limitations :
  - Timeout max : 10s (gratuit) ou 26s (Pro)
  - Taille max : 50MB (gratuit) ou 1GB (Pro)
  - Chrome doit être inclus dans le bundle

### 3. **Dépendances Système**
- `tsx` pour exécuter TypeScript
- `puppeteer` nécessite des dépendances système Chrome

## ✅ Ce qui Fonctionne Déjà

- ✅ Frontend statique (`frontend/cv-generator.html`)
- ✅ Templates HTML (`templates/cv/`)
- ✅ Données JSON (`data/`)
- ✅ Structure du code TypeScript

## 🛠️ Modifications Nécessaires

### Option 1 : Netlify Functions (Recommandé)

1. **Créer `netlify/functions/cv-preview.ts`**
   - Convertir `/api/cv/preview` en Function
   - Timeout : 10s (gratuit) ou 26s (Pro)

2. **Créer `netlify/functions/cv-generate.ts`**
   - Convertir `/api/cv/generate` en Function
   - Utiliser `@sparticuz/chromium` pour Puppeteer sur Netlify

3. **Créer `netlify.toml`**
```toml
[build]
  command = "npm install"
  functions = "netlify/functions"
  publish = "frontend"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/cv-generator.html"
  status = 200
```

### Option 2 : Vercel (Alternative)

Vercel supporte mieux les serveurs Node.js et Puppeteer :
- Support natif des API Routes
- Timeout plus long (60s)
- Meilleur support de Puppeteer

### Option 3 : Render / Railway (Alternative)

Services qui supportent les serveurs Node.js :
- Render : Gratuit avec limitations
- Railway : Payant mais flexible

## 📋 Checklist pour Netlify

- [ ] Convertir routes API en Netlify Functions
- [ ] Adapter Puppeteer pour Netlify (`@sparticuz/chromium`)
- [ ] Créer `netlify.toml`
- [ ] Tester génération PDF avec timeout
- [ ] Configurer variables d'environnement si nécessaire
- [ ] Optimiser taille du bundle (< 50MB)

## 🚀 Déploiement Rapide (Option Simple)

Pour un déploiement rapide sans modifications majeures :

1. **Utiliser Vercel** :
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Ou utiliser Render** :
   - Connecter le repo GitHub
   - Build command : `npm install`
   - Start command : `node server-cv-only.js`

## 📝 Recommandation

**Pour Netlify** : Il faut refactoriser en Netlify Functions (2-3h de travail)

**Pour déploiement rapide** : Utiliser Vercel ou Render qui supportent mieux l'architecture actuelle
