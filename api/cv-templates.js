// Vercel Serverless Function pour lister les templates disponibles

const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
  // Seulement GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Lister les fichiers HTML dans templates/cv
    const templatesDir = path.join(process.cwd(), 'templates/cv');
    const files = await fs.readdir(templatesDir);
    const templates = files
      .filter(file => file.endsWith('.html'))
      .map(file => file.replace('.html', ''));
    
    return res.json({
      success: true,
      data: templates.length > 0 ? templates : ['montemplate-v2']
    });
  } catch (error) {
    // Fallback sur les templates par défaut
    return res.json({
      success: true,
      data: ['montemplate-v2']
    });
  }
};
