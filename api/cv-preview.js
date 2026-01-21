// Vercel Serverless Function pour prévisualiser un CV (HTML)
// Ce fichier sera automatiquement détecté par Vercel comme une API Route

// Utiliser tsx pour charger directement le TypeScript
require('tsx/cjs/register');

const path = require('path');

module.exports = async (req, res) => {
  // Seulement POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cvData, templateName = 'montemplate-v2' } = req.body;

    if (!cvData) {
      return res.status(400).json({ 
        success: false,
        error: 'cvData is required' 
      });
    }

    // Importer le générateur directement
    const { CVGenerator } = require(path.join(process.cwd(), 'src/cv/generator.ts'));
    const { CVSchema } = require(path.join(process.cwd(), 'src/cv/types.ts'));

    // Valider les données
    const validatedCvData = CVSchema.parse(cvData);

    // Générer le HTML
    const generator = new CVGenerator();
    const html = await generator.generate({
      cvData: validatedCvData,
      templateName,
      outputFormat: 'html',
    });

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);

  } catch (error) {
    console.error('Erreur génération CV preview:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate CV preview',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};
