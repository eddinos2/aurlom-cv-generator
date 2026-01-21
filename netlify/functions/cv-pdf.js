// Netlify Function pour générer un CV en PDF
// Compatible avec l'architecture serverless de Netlify

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

exports.handler = async (event, context) => {
  // Netlify Functions timeout: 10s (gratuit) ou 26s (Pro)
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Seulement POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const startTime = Date.now();

  try {
    // Parser le body JSON
    const body = JSON.parse(event.body);
    const { cvData, templateName = 'montemplate-v2' } = body;

    if (!cvData) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false,
          error: 'cvData is required' 
        }),
      };
    }

    // Créer un répertoire temporaire pour cette requête
    const tempDir = '/tmp';
    const tempFile = path.join(tempDir, `cv-${Date.now()}.json`);
    const pdfPath = path.join(tempDir, `cv-${Date.now()}.pdf`);

    // Écrire les données dans un fichier temporaire
    await fs.writeFile(tempFile, JSON.stringify({ 
      cvData, 
      templateName, 
      outputFormat: 'pdf' 
    }, null, 2));

    // Appeler le script de génération
    // Note: Il faut que tsx et puppeteer soient dans node_modules
    const scriptPath = path.join(process.cwd(), 'src/cv/generate-preview.ts');
    const { stdout, stderr } = await execAsync(
      `npx tsx "${scriptPath}" "${tempFile}"`,
      {
        cwd: process.cwd(),
        timeout: 25000, // 25s max pour Netlify Pro
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'false',
          // Pour Netlify, utiliser chromium depuis node_modules
        },
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cv-${cvData.personalInfo.firstName}-${cvData.personalInfo.lastName}.pdf"`,
        'X-Generation-Time': `${generationTime}ms`,
        'Cache-Control': 'private, max-age=300',
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true, // Important pour Netlify
    };

  } catch (error) {
    const generationTime = Date.now() - startTime;
    console.error('Erreur génération CV PDF:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Failed to generate CV PDF',
        message: error.message,
        time: `${generationTime}ms`,
      }),
    };
  }
};
