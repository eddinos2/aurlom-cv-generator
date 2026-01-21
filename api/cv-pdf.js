// Vercel Serverless Function pour générer un CV en PDF
// Ce fichier sera automatiquement détecté par Vercel comme une API Route

// Utiliser tsx pour charger directement le TypeScript
require('tsx/cjs/register');

const path = require('path');

module.exports = async (req, res) => {
  // Seulement POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

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

    // Générer le PDF
    const generator = new CVGenerator();
    const pdfBuffer = await generator.generate({
      cvData: validatedCvData,
      templateName,
      outputFormat: 'pdf',
    });

    const generationTime = Date.now() - startTime;

    // Headers optimisés
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="cv-${cvData.personalInfo.firstName}-${cvData.personalInfo.lastName}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader('X-Generation-Time', `${generationTime}ms`);
    res.setHeader('Cache-Control', 'private, max-age=300');

    return res.send(pdfBuffer);

  } catch (error) {
    const generationTime = Date.now() - startTime;
    console.error('Erreur génération CV PDF:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to generate CV PDF',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      time: `${generationTime}ms`,
    });
  }
};
