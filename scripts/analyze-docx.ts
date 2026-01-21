// Script pour analyser en détail le contenu du DOCX
import mammoth from 'mammoth';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

async function analyzeDocx() {
  const docxPath = join(process.cwd(), 'templates/cv/montempalte.docx');

  try {
    console.log('📄 Analyse détaillée du DOCX...\n');
    
    // Convertir en HTML pour voir la structure
    const htmlResult = await mammoth.convertToHtml({ path: docxPath });
    console.log('=== CONTENU HTML ===');
    console.log(htmlResult.value);
    console.log('\n=== MESSAGES ===');
    htmlResult.messages.forEach(msg => console.log(msg));
    
    // Convertir en texte brut pour voir la structure
    const textResult = await mammoth.extractRawText({ path: docxPath });
    console.log('\n=== CONTENU TEXTE BRUT ===');
    console.log(textResult.value);
    
    // Sauvegarder pour analyse
    writeFileSync(join(process.cwd(), 'templates/cv/montemplate-raw.html'), htmlResult.value, 'utf-8');
    writeFileSync(join(process.cwd(), 'templates/cv/montemplate-raw.txt'), textResult.value, 'utf-8');
    
    console.log('\n✅ Fichiers de debug créés');
    
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

analyzeDocx();
