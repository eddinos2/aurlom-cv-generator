import { CVGenerator } from './generator';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CVSchema } from './types';

/**
 * Script de test pour générer un CV avec les données de démo
 */
async function testCVGeneration() {
  try {
    // Créer le dossier output s'il n'existe pas
    const { mkdir } = await import('fs/promises');
    const outputDir = join(process.cwd(), 'output');
    try {
      await mkdir(outputDir, { recursive: true });
    } catch (e) {
      // Le dossier existe déjà, c'est OK
    }

    // Charger les données de démo
    const demoDataPath = join(process.cwd(), 'data/demo-cv.json');
    const demoData = JSON.parse(readFileSync(demoDataPath, 'utf-8'));
    
    // Valider les données
    const cvData = CVSchema.parse(demoData);
    
    // Créer le générateur
    const generator = new CVGenerator();
    
    // Lister les templates disponibles
    const templates = await generator.listTemplates();
    console.log('Templates disponibles:', templates);
    
    if (templates.length === 0) {
      console.error('❌ Aucun template trouvé dans templates/cv/');
      process.exit(1);
    }
    
    // Générer le CV en HTML pour chaque template
    for (const templateName of templates) {
      console.log(`\nGénération du CV avec le template: ${templateName}`);
      
      // Générer en HTML
      const htmlOutputPath = join(outputDir, `cv-${templateName}.html`);
      await generator.generate({
        cvData,
        templateName,
        outputFormat: 'html',
        outputPath: htmlOutputPath,
      });
      console.log(`✓ HTML généré: ${htmlOutputPath}`);
      
      // Générer en PDF
      const pdfOutputPath = join(outputDir, `cv-${templateName}.pdf`);
      await generator.generate({
        cvData,
        templateName,
        outputFormat: 'pdf',
        outputPath: pdfOutputPath,
      });
      console.log(`✓ PDF généré: ${pdfOutputPath}`);
    }
    
    console.log('\n✅ Génération terminée avec succès!');
    console.log(`📁 Fichiers générés dans: ${outputDir}`);
  } catch (error: any) {
    console.error('❌ Erreur lors de la génération:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter le test
if (require.main === module) {
  testCVGeneration();
}

export { testCVGeneration };
