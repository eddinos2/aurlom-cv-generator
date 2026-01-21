// Script pour convertir un DOCX en template HTML dynamique
import mammoth from 'mammoth';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

async function convertDocxToTemplate() {
  const docxPath = join(process.cwd(), 'templates/cv/montempalte.docx');
  const outputPath = join(process.cwd(), 'templates/cv/montemplate.html');

  try {
    console.log('📄 Lecture du fichier DOCX...');
    const result = await mammoth.convertToHtml({ path: docxPath });
    const html = result.value;
    
    console.log('✅ Conversion réussie');
    console.log('🔍 Analyse de la structure...');
    
    // Analyser le HTML pour identifier les éléments à remplacer
    let templateHtml = html;
    
    // Détecter et remplacer les patterns communs dans les CVs
    // Noms, prénoms
    templateHtml = templateHtml.replace(/\b(?:Prénom|First Name|Prenom)\b/gi, '{{personalInfo.firstName}}');
    templateHtml = templateHtml.replace(/\b(?:Nom|Last Name|Name)\b/gi, '{{personalInfo.lastName}}');
    templateHtml = templateHtml.replace(/\b(?:Nom complet|Full Name)\b/gi, '{{personalInfo.fullName}}');
    
    // Contact
    templateHtml = templateHtml.replace(/\b(?:Email|E-mail|Mail)\b/gi, '{{personalInfo.email}}');
    templateHtml = templateHtml.replace(/\b(?:Téléphone|Phone|Tel)\b/gi, '{{personalInfo.phone}}');
    templateHtml = templateHtml.replace(/\b(?:Adresse|Address)\b/gi, '{{personalInfo.fullAddress}}');
    templateHtml = templateHtml.replace(/\b(?:Ville|City)\b/gi, '{{personalInfo.city}}');
    templateHtml = templateHtml.replace(/\b(?:Code postal|Postal Code|CP)\b/gi, '{{personalInfo.postalCode}}');
    templateHtml = templateHtml.replace(/\b(?:Pays|Country)\b/gi, '{{personalInfo.country}}');
    templateHtml = templateHtml.replace(/\b(?:LinkedIn|Linkedin)\b/gi, '{{personalInfo.linkedin}}');
    templateHtml = templateHtml.replace(/\b(?:Site web|Website|Web)\b/gi, '{{personalInfo.website}}');
    
    // Sections communes
    templateHtml = templateHtml.replace(/\b(?:Résumé|Summary|Profil|Profile)\b/gi, '{{summary}}');
    templateHtml = templateHtml.replace(/\b(?:Expérience|Experience|Expériences)\b/gi, 'EXPÉRIENCE');
    templateHtml = templateHtml.replace(/\b(?:Formation|Education|Éducation)\b/gi, 'FORMATION');
    templateHtml = templateHtml.replace(/\b(?:Compétences|Skills|Competences)\b/gi, 'COMPÉTENCES');
    templateHtml = templateHtml.replace(/\b(?:Langues|Languages)\b/gi, 'LANGUES');
    templateHtml = templateHtml.replace(/\b(?:Certifications|Certification)\b/gi, 'CERTIFICATIONS');
    templateHtml = templateHtml.replace(/\b(?:Projets|Projects)\b/gi, 'PROJETS');
    templateHtml = templateHtml.replace(/\b(?:Références|References)\b/gi, 'RÉFÉRENCES');
    
    // Créer un wrapper HTML complet
    const fullHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV - {{personalInfo.fullName}}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', Arial, sans-serif;
            color: #000;
            line-height: 1.6;
            background: #fff;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        
        /* Styles préservés du DOCX */
        ${extractStyles(html)}
        
        /* Styles pour gérer les cas limites */
        .long-text {
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        
        .text-clamp {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        @media print {
            .container {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        ${templateHtml}
        
        <!-- Sections dynamiques -->
        
        <!-- START experience -->
        <div class="experience-item">
            <h3>{{experience.position}} - {{experience.company}}</h3>
            <p class="date">{{experience.startDate}} - {{experience.endDate}}</p>
            <p class="location">{{experience.location}}</p>
            <p class="description">{{experience.description}}</p>
            <div class="achievements">{{experience.achievements}}</div>
        </div>
        <!-- END experience -->
        
        <!-- START education -->
        <div class="education-item">
            <h3>{{education.degree}} - {{education.institution}}</h3>
            <p class="date">{{education.dateRange}}</p>
            <p class="location">{{education.location}}</p>
            <p class="description">{{education.description}}</p>
            <p class="gpa">{{education.gpa}}</p>
        </div>
        <!-- END education -->
        
        <!-- START skills -->
        <div class="skill-item">
            <span>{{skills.name}}</span>
            <span class="level">{{skills.level}}</span>
        </div>
        <!-- END skills -->
        
        <!-- START languages -->
        <div class="language-item">
            {{languages.name}} ({{languages.level}})
        </div>
        <!-- END languages -->
        
        <!-- START certifications -->
        <div class="certification-item">
            <h4>{{certifications.name}}</h4>
            <p>{{certifications.issuer}} - {{certifications.date}}</p>
        </div>
        <!-- END certifications -->
        
        <!-- START projects -->
        <div class="project-item">
            <h4>{{projects.name}}</h4>
            <p>{{projects.description}}</p>
            <p class="technologies">{{projects.technologies}}</p>
        </div>
        <!-- END projects -->
        
        <!-- START references -->
        <div class="reference-item">
            <p><strong>{{references.name}}</strong></p>
            <p>{{references.position}} - {{references.company}}</p>
            <p>{{references.email}} - {{references.phone}}</p>
        </div>
        <!-- END references -->
    </div>
</body>
</html>`;

    // Sauvegarder le template
    writeFileSync(outputPath, fullHtml, 'utf-8');
    console.log(`✅ Template créé: ${outputPath}`);
    console.log('\n📝 Note: Vérifiez et ajustez les placeholders dans le fichier généré');
    
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

function extractStyles(html: string): string {
  // Extraire les styles inline et les convertir en CSS
  // Pour l'instant, retourner des styles de base
  return `
        p { margin: 5px 0; }
        h1, h2, h3, h4 { margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 5px; border: 1px solid #ddd; }
    `;
}

convertDocxToTemplate();
