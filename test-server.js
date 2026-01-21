// Test minimal du serveur
console.log('Test démarrage serveur...');

try {
  require('dotenv').config();
  console.log('✓ dotenv chargé');
  
  const express = require('express');
  console.log('✓ express chargé');
  
  const app = express();
  app.get('/test', (req, res) => res.json({ ok: true }));
  
  app.listen(3000, () => {
    console.log('✅ Serveur démarré sur port 3000');
    console.log('Test: http://localhost:3000/test');
  });
} catch (error) {
  console.error('❌ Erreur:', error.message);
  console.error(error.stack);
}
