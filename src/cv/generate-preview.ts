// Script pour générer un CV en HTML (appelé depuis le serveur JS)
import { CVGenerator } from './generator';
import { CVSchema } from './types';
import { readFileSync } from 'fs';
import { join } from 'path';

const dataFile = process.argv[2];
if (!dataFile) {
  console.error('Usage: tsx generate-preview.ts <data-file.json>');
  process.exit(1);
}

try {
  const fileContent = readFileSync(dataFile, 'utf-8');
  const data = JSON.parse(fileContent);
  
  // Le serveur envoie { cvData, templateName, outputFormat }
  // ou juste les données directement
  const cvData = data.cvData || data;
  const templateName = data.templateName || 'modern';
  const outputFormat = data.outputFormat || 'html';
  
  // Valider les données
  const validatedCvData = CVSchema.parse(cvData);
  
  const generator = new CVGenerator();
  
  generator.generate({
    cvData: validatedCvData,
    templateName,
    outputFormat: outputFormat as 'html' | 'pdf',
  }).then(result => {
    if (outputFormat === 'pdf' && Buffer.isBuffer(result)) {
      // Pour PDF, sauvegarder dans un fichier temporaire
      const fs = require('fs');
      const pdfPath = join(process.cwd(), 'temp-cv-output.pdf');
      fs.writeFileSync(pdfPath, result);
      console.log('PDF généré:', pdfPath);
    } else {
      // Pour HTML, afficher directement
      console.log(result);
    }
  }).catch(error => {
    console.error('Erreur génération:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
} catch (error: any) {
  console.error('Erreur lecture/validation:', error.message);
  if (error.issues) {
    console.error('Erreurs de validation:', JSON.stringify(error.issues, null, 2));
  }
  process.exit(1);
}
