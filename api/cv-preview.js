// Vercel Serverless Function pour prévisualiser un CV (HTML)
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
    const tempFile = path.join(tempDir, `cv-preview-${Date.now()}-${Math.random().toString(36).substring(7)}.json`);

    // Écrire les données dans un fichier temporaire
    await fs.writeFile(tempFile, JSON.stringify({ 
      cvData, 
      templateName, 
      outputFormat: 'html' 
    }, null, 2));

    // Appeler le script de génération TypeScript
    const scriptPath = path.join(process.cwd(), 'src/cv/generate-preview.ts');
    const { stdout, stderr } = await execAsync(
      `npx tsx "${scriptPath}" "${tempFile}"`,
      {
        cwd: process.cwd(),
        timeout: 30000, // 30s pour HTML
        maxBuffer: 10 * 1024 * 1024, // 10MB
      }
    );

    if (stderr && !stderr.includes('Warning') && !stderr.includes('DeprecationWarning')) {
      if (stderr.includes('Error') || stderr.includes('ZodError')) {
        throw new Error(stderr);
      }
    }

    // Nettoyer le fichier temporaire
    await fs.unlink(tempFile).catch(() => {});

    res.setHeader('Content-Type', 'text/html');
    return res.send(stdout);

  } catch (error) {
    console.error('Erreur génération CV preview:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate CV preview',
      message: error.message,
    });
  }
};
