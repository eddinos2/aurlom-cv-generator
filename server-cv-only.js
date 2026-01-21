// Serveur minimal pour le générateur de CV uniquement
const express = require('express');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;

const execAsync = promisify(exec);
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('frontend'));
app.use('/data', express.static('data'));
app.use('/templates', express.static('templates'));

// Route pour l'interface CV
app.get('/cv-generator', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/cv-generator.html'));
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'ok', cvGenerator: 'available', timestamp: new Date().toISOString() });
});

// Route pour prévisualiser (sans authentification pour les tests)
app.post('/api/cv/preview', async (req, res) => {
  try {
    const { cvData, templateName = 'modern' } = req.body;
    
    if (!cvData) {
      return res.status(400).json({ 
        success: false,
        error: 'cvData is required' 
      });
    }
    
    // Écrire les données dans un fichier temporaire
    const tempFile = path.join(__dirname, 'temp-cv-data.json');
    await fs.writeFile(tempFile, JSON.stringify({ cvData, templateName, outputFormat: 'html' }, null, 2));
    
    // Appeler le script de génération TypeScript
    const scriptPath = path.join(__dirname, 'src/cv/generate-preview.ts');
    const { stdout, stderr } = await execAsync(`npx tsx "${scriptPath}" "${tempFile}"`, {
      cwd: __dirname,
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });
    
    if (stderr && !stderr.includes('Warning') && !stderr.includes('DeprecationWarning')) {
      console.error('Stderr:', stderr);
      // Ne pas throw si c'est juste un warning
      if (stderr.includes('Error') || stderr.includes('ZodError')) {
        throw new Error(stderr);
      }
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.send(stdout);
    
    // Nettoyer le fichier temporaire
    fs.unlink(tempFile).catch(() => {});
  } catch (error) {
    console.error('Erreur génération CV:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate CV', 
      message: error.message,
      details: error.stderr || error.stdout
    });
  }
});

// Route pour générer le PDF
app.post('/api/cv/generate', async (req, res) => {
  try {
    const { cvData, templateName = 'modern', outputFormat = 'pdf' } = req.body;
    
    if (!cvData) {
      return res.status(400).json({ 
        success: false,
        error: 'cvData is required' 
      });
    }
    
    // Écrire les données dans un fichier temporaire
    const tempFile = path.join(__dirname, 'temp-cv-data.json');
    await fs.writeFile(tempFile, JSON.stringify({ cvData, templateName, outputFormat }, null, 2));
    
    // Appeler le script de génération TypeScript
    const scriptPath = path.join(__dirname, 'src/cv/generate-preview.ts');
    const { stdout, stderr } = await execAsync(`npx tsx "${scriptPath}" "${tempFile}"`, {
      cwd: __dirname,
      timeout: 60000, // 60s pour PDF
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });
    
    if (stderr && !stderr.includes('Warning') && !stderr.includes('DeprecationWarning')) {
      console.error('Stderr:', stderr);
      if (stderr.includes('Error') || stderr.includes('ZodError')) {
        throw new Error(stderr);
      }
    }
    
    if (outputFormat === 'pdf') {
      // Le script génère un fichier PDF
      const pdfPath = path.join(__dirname, 'temp-cv-output.pdf');
      try {
        const pdfBuffer = await fs.readFile(pdfPath);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="cv-${cvData.personalInfo.firstName}-${cvData.personalInfo.lastName}.pdf"`);
        res.send(pdfBuffer);
        
        // Nettoyer
        fs.unlink(pdfPath).catch(() => {});
      } catch (fileError) {
        throw new Error(`PDF file not generated: ${fileError.message}`);
      }
    } else {
      res.setHeader('Content-Type', 'text/html');
      res.send(stdout);
    }
    
    // Nettoyer le fichier temporaire
    fs.unlink(tempFile).catch(() => {});
  } catch (error) {
    console.error('Erreur génération CV:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate CV', 
      message: error.message,
      details: error.stderr || error.stdout
    });
  }
});

// Route pour lister les templates
app.get('/api/cv/templates', async (req, res) => {
  try {
    // Lister les fichiers HTML dans templates/cv
    const templatesDir = path.join(__dirname, 'templates/cv');
    const files = await fs.readdir(templatesDir);
    const templates = files
      .filter(file => file.endsWith('.html'))
      .map(file => file.replace('.html', ''));
    
    res.json({
      success: true,
      data: templates.length > 0 ? templates : ['montemplate-v2']
    });
  } catch (error) {
    // Fallback sur les templates par défaut
    res.json({
      success: true,
      data: ['montemplate-v2']
    });
  }
});

// Route API optimisée pour génération PDF directe
app.post('/api/cv/pdf', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { cvData, templateName = 'montemplate-v2' } = req.body;
    
    if (!cvData) {
      return res.status(400).json({ 
        success: false,
        error: 'cvData is required' 
      });
    }
    
    // Écrire les données dans un fichier temporaire
    const tempFile = path.join(__dirname, 'temp-cv-data.json');
    await fs.writeFile(tempFile, JSON.stringify({ cvData, templateName, outputFormat: 'pdf' }, null, 2));
    
    // Appeler le script de génération TypeScript
    const scriptPath = path.join(__dirname, 'src/cv/generate-preview.ts');
    const { stdout, stderr } = await execAsync(`npx tsx "${scriptPath}" "${tempFile}"`, {
      cwd: __dirname,
      timeout: 60000, // 60s pour PDF
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });
    
    if (stderr && !stderr.includes('Warning') && !stderr.includes('DeprecationWarning')) {
      console.error('Stderr:', stderr);
      if (stderr.includes('Error') || stderr.includes('ZodError')) {
        throw new Error(stderr);
      }
    }
    
    // Le script génère un fichier PDF
    const pdfPath = path.join(__dirname, 'temp-cv-output.pdf');
    try {
      const pdfBuffer = await fs.readFile(pdfPath);
      const generationTime = Date.now() - startTime;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="cv-${cvData.personalInfo.firstName}-${cvData.personalInfo.lastName}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      res.setHeader('X-Generation-Time', `${generationTime}ms`);
      res.setHeader('Cache-Control', 'private, max-age=300');
      
      res.send(pdfBuffer);
      
      // Nettoyer
      fs.unlink(pdfPath).catch(() => {});
    } catch (fileError) {
      throw new Error(`PDF file not generated: ${fileError.message}`);
    }
    
    // Nettoyer le fichier temporaire
    fs.unlink(tempFile).catch(() => {});
  } catch (error) {
    const generationTime = Date.now() - startTime;
    console.error('Erreur génération CV PDF:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate CV PDF', 
      message: error.message,
      time: `${generationTime}ms`
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur CV démarré sur http://localhost:${PORT}`);
  console.log(`📄 Interface: http://localhost:${PORT}/cv-generator`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
});
