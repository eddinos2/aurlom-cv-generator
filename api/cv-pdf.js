// Vercel Serverless Function pour générer un CV en PDF
// Ce fichier sera automatiquement détecté par Vercel comme une API Route

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

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

    // Utiliser /tmp pour les fichiers temporaires (Vercel)
    const tempDir = '/tmp';
    const tempFile = path.join(tempDir, `cv-${Date.now()}-${Math.random().toString(36).substring(7)}.json`);
    const pdfPath = path.join(tempDir, `cv-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`);

    // Écrire les données dans un fichier temporaire
    await fs.writeFile(tempFile, JSON.stringify({ 
      cvData, 
      templateName, 
      outputFormat: 'pdf' 
    }, null, 2));

    // Appeler le script de génération TypeScript
    const scriptPath = path.join(process.cwd(), 'src/cv/generate-preview.ts');
    const { stdout, stderr } = await execAsync(
      `npx tsx "${scriptPath}" "${tempFile}"`,
      {
        cwd: process.cwd(),
        timeout: 55000, // 55s max (laisser une marge pour Vercel)
        maxBuffer: 10 * 1024 * 1024, // 10MB
      }
    );

    if (stderr && !stderr.includes('Warning') && !stderr.includes('DeprecationWarning')) {
      if (stderr.includes('Error') || stderr.includes('ZodError')) {
        throw new Error(stderr);
      }
    }

    // Lire le PDF généré
    const pdfBuffer = await fs.readFile(pdfPath);
    const generationTime = Date.now() - startTime;

    // Nettoyer les fichiers temporaires
    await fs.unlink(tempFile).catch(() => {});
    await fs.unlink(pdfPath).catch(() => {});

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
      time: `${generationTime}ms`,
    });
  }
};
