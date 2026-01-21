import puppeteer from 'puppeteer';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import QRCode from 'qrcode';
import { CV } from './types';
import { logger } from '../utils/logger';
import {
  cleanText,
  formatName,
  formatAddress,
  formatDate,
  formatList,
  escapeHtmlPreserveNewlines,
  cleanUrl,
  safeValue,
  truncateText,
} from './utils';

export interface CVGenerationOptions {
  cvData: CV;
  templateName: string;
  outputFormat: 'pdf' | 'html';
  outputPath?: string;
}

export class CVGenerator {
  private templatesDir: string;

  constructor(templatesDir?: string) {
    // Utiliser process.cwd() pour être compatible avec tsx et node compilé
    const baseDir = process.cwd();
    this.templatesDir = templatesDir || join(baseDir, 'templates/cv');
  }

  /**
   * Charge un template personnalisé depuis un chemin
   */
  async loadCustomTemplate(templatePath: string): Promise<string> {
    if (!existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }
    return readFileSync(templatePath, 'utf-8');
  }

  /**
   * Génère un CV à partir des données JSON et d'un template
   */
  async generate(options: CVGenerationOptions): Promise<Buffer | string> {
    const { cvData, templateName, outputFormat, outputPath } = options;

    try {
      // Charger le template (support des templates personnalisés)
      let template: string;
      if (templateName.includes('/') || templateName.includes('\\')) {
        // Chemin absolu ou relatif vers un template personnalisé
        template = await this.loadCustomTemplate(templateName);
      } else {
        // Template standard depuis le dossier templates/cv
        const templatePath = join(this.templatesDir, `${templateName}.html`);
        if (!existsSync(templatePath)) {
          throw new Error(`Template "${templateName}" not found in ${this.templatesDir}`);
        }
        template = readFileSync(templatePath, 'utf-8');
      }

      // Remplir le template avec les données
      const html = await this.fillTemplate(template, cvData);

      if (outputFormat === 'html') {
        if (outputPath) {
          const fs = await import('fs/promises');
          await fs.writeFile(outputPath, html, 'utf-8');
        }
        return html;
      }

      // Générer le PDF avec Puppeteer
      return await this.generatePDF(html, outputPath);
    } catch (error: any) {
      logger.error('Error generating CV', { error: error.message, templateName });
      throw new Error(`Failed to generate CV: ${error.message}`);
    }
  }

  /**
   * Remplit le template HTML avec les données du CV
   */
  private async fillTemplate(template: string, cvData: CV): Promise<string> {
    let html = template;

    // Informations personnelles - remplacer tous les champs avec gestion des cas limites
    const firstName = cleanText(cvData.personalInfo.firstName);
    const lastName = cleanText(cvData.personalInfo.lastName);
    const fullName = formatName(firstName, lastName, 50);
    const fullNameLength = firstName.length + lastName.length + 1;
    
    // Adapter la classe CSS selon la longueur du nom pour réduire automatiquement la taille
    // IMPORTANT: Ne pas tronquer les noms, juste réduire la taille de police
    if (fullNameLength > 60) {
      html = html.replace(/class="h-name"/g, 'class="h-name extremely-long-name"');
    } else if (fullNameLength > 45) {
      html = html.replace(/class="h-name"/g, 'class="h-name very-long-name"');
    } else if (fullNameLength > 35) {
      html = html.replace(/class="h-name"/g, 'class="h-name long-name"');
    }
    
    // Ne JAMAIS tronquer les noms - ils sont importants et doivent s'afficher en entier
    html = html.replace(/\{\{personalInfo\.firstName\}\}/g, this.escapeHtml(firstName));
    html = html.replace(/\{\{personalInfo\.lastName\}\}/g, this.escapeHtml(lastName));
    html = html.replace(/\{\{personalInfo\.fullName\}\}/g, this.escapeHtml(fullName)); // Nouveau champ
    html = html.replace(/\{\{personalInfo\.email\}\}/g, this.escapeHtml(cleanText(cvData.personalInfo.email)));
    html = html.replace(/\{\{personalInfo\.phone\}\}/g, this.escapeHtml(cleanText(cvData.personalInfo.phone)));
    html = html.replace(/\{\{personalInfo\.address\}\}/g, this.escapeHtml(cleanText(cvData.personalInfo.address)));
    html = html.replace(/\{\{personalInfo\.city\}\}/g, this.escapeHtml(cleanText(cvData.personalInfo.city)));
    html = html.replace(/\{\{personalInfo\.postalCode\}\}/g, this.escapeHtml(cleanText(cvData.personalInfo.postalCode)));
    html = html.replace(/\{\{personalInfo\.country\}\}/g, this.escapeHtml(cleanText(cvData.personalInfo.country)));
    html = html.replace(/\{\{personalInfo\.linkedin\}\}/g, cleanUrl(cvData.personalInfo.linkedin));
    html = html.replace(/\{\{personalInfo\.website\}\}/g, cleanUrl(cvData.personalInfo.website));
    
    // Date de naissance
    if (cvData.personalInfo.dateOfBirth) {
      html = html.replace(/\{\{personalInfo\.dateOfBirth\}\}/g, this.escapeHtml(cleanText(cvData.personalInfo.dateOfBirth)));
    } else {
      html = html.replace(/\{\{personalInfo\.dateOfBirth\}\}/g, '');
      // Masquer aussi les lignes avec "Né le" si pas de date
      html = html.replace(/Né le \{\{personalInfo\.dateOfBirth\}\}/g, '');
      html = html.replace(/<span class="line"><span class="hl">Né le \{\{personalInfo\.dateOfBirth\}\}.*?<\/span><\/span>/g, '');
    }
    
    // Adresse complète formatée
    const fullAddress = formatAddress([
      cvData.personalInfo.address,
      cvData.personalInfo.city,
      cvData.personalInfo.postalCode,
      cvData.personalInfo.country
    ]);
    html = html.replace(/\{\{personalInfo\.fullAddress\}\}/g, this.escapeHtml(fullAddress));
    
    // Image de profil - gérer conditionnellement (plusieurs formats possibles)
    if (cvData.personalInfo.image) {
      const imgTag = `<img src="${cvData.personalInfo.image}" alt="" class="cv-photo" id="profile-photo">`;
      // Remplacer différents formats de conteneurs d'image
      html = html.replace(/<div id="profile-image-container"><\/div>/g, imgTag);
      html = html.replace(/<div id="photo-container">[\s\S]*?<\/div>/g, `<div id="photo-container">${imgTag}</div>`);
      html = html.replace(/\{\{personalInfo\.image\}\}/g, cvData.personalInfo.image);
      // Si l'image est dans un src vide, la remplacer
      html = html.replace(/src="\{\{personalInfo\.image\}\}"/g, `src="${cvData.personalInfo.image}"`);
      // Remplacer aussi les balises img avec placeholder
      html = html.replace(/<img[^>]*src="\{\{personalInfo\.image\}\}"[^>]*>/g, imgTag);
      // Remplacer alt="Photo de profil" par alt=""
      html = html.replace(/alt="Photo de profil"/g, 'alt=""');
    } else {
      html = html.replace(/<div id="profile-image-container"><\/div>/g, '');
      html = html.replace(/<div class="h-photo" id="photo-container">[\s\S]*?<\/div>/g, '');
      html = html.replace(/<div id="photo-container">[\s\S]*?<\/div>/g, '');
      html = html.replace(/<img[^>]*id="profile-photo"[^>]*>/g, '');
      html = html.replace(/\{\{personalInfo\.image\}\}/g, '');
      // Masquer le conteneur photo s'il est vide
      html = html.replace(/<div id="photo-container">\s*<\/div>/g, '');
      html = html.replace(/<div class="h-photo" id="photo-container">\s*<\/div>/g, '');
    }

    // Contact info conditionnel
    html = this.fillConditionalField(html, 'email-item', cvData.personalInfo.email, `📧 ${cvData.personalInfo.email}`);
    html = this.fillConditionalField(html, 'phone-item', cvData.personalInfo.phone, `📱 ${cvData.personalInfo.phone}`);
    if (cvData.personalInfo.address || cvData.personalInfo.city) {
      const address = [cvData.personalInfo.address, cvData.personalInfo.city, cvData.personalInfo.postalCode].filter(Boolean).join(', ');
      html = this.fillConditionalField(html, 'address-item', address, `📍 ${address}`);
    } else {
      html = this.fillConditionalField(html, 'address-item', '', '');
    }
    html = this.fillConditionalField(html, 'linkedin-item', cvData.personalInfo.linkedin, `💼 <a href="${cvData.personalInfo.linkedin}">LinkedIn</a>`);
    html = this.fillConditionalField(html, 'website-item', cvData.personalInfo.website, `🌐 <a href="${cvData.personalInfo.website}">Site web</a>`);
    
    // Champs spécifiques pour montemplate
    html = this.fillConditionalField(html, 'birth-date', cvData.personalInfo.dateOfBirth, `Né le ${cvData.personalInfo.dateOfBirth}`);
    html = this.fillConditionalField(html, 'phone-display', cvData.personalInfo.phone, `Tel. ${cvData.personalInfo.phone}`);
    html = this.fillConditionalField(html, 'email-display', cvData.personalInfo.email, ` • Mail. ${cvData.personalInfo.email}`);
    
    // Génération du QR code pour le lien "Découvrez-moi en 30 sec."
    // Utiliser le website s'il existe, sinon utiliser un placeholder (Google) pour avoir un QR code de test
    const linkUrl = cvData.personalInfo.website || 'https://www.google.com';
    
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(linkUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      html = html.replace(
        /<span class="qr-container" id="qr-container"><\/span>/g,
        `<span class="qr-container" id="qr-container"><img src="${qrCodeDataUrl}" alt="QR Code" /></span>`
      );
    } catch (error) {
      logger.error('Erreur lors de la génération du QR code:', error);
      html = html.replace(/<span class="qr-container" id="qr-container"><\/span>/g, '');
    }
    
    // S'assurer que le lien reste cliquable même en PDF
    if (cvData.personalInfo.website) {
      html = html.replace(/href="\{\{personalInfo\.website\}\}"/g, `href="${cvData.personalInfo.website}"`);
    } else {
      // Si pas de website, utiliser le placeholder mais masquer le lien
      html = html.replace(/<a class="fake-link" href="\{\{personalInfo\.website\}\}"[^>]*>/g, '<a class="fake-link" href="https://www.google.com" style="pointer-events: none; color: inherit;">');
    }
    
    // Permis de conduire et véhicule
    if (cvData.personalInfo.drivingLicense) {
      html = html.replace(/<span id="license-display"[^>]*>.*?<\/span>/g, '<span id="license-display" class="dot">•</span>');
      html = html.replace(/<span id="license-text"[^>]*>.*?<\/span>/g, `<span id="license-text" class="hl">${this.escapeHtml(cleanText(cvData.personalInfo.drivingLicense))}</span>`);
    } else {
      html = html.replace(/<span id="license-display"[^>]*>.*?<\/span>/g, '');
      html = html.replace(/<span id="license-text"[^>]*>.*?<\/span>/g, '');
    }
    
    if (cvData.personalInfo.hasVehicle) {
      html = html.replace(/<span id="vehicle-display"[^>]*>.*?<\/span>/g, '<span id="vehicle-display" class="dot">•</span>');
      html = html.replace(/<span id="vehicle-text"[^>]*>.*?<\/span>/g, '<span id="vehicle-text" class="hl">Motorisé</span>');
    } else {
      html = html.replace(/<span id="vehicle-display"[^>]*>.*?<\/span>/g, '');
      html = html.replace(/<span id="vehicle-text"[^>]*>.*?<\/span>/g, '');
    }

    // Résumé avec gestion des textes longs
    // Si btsProgram est présent, générer automatiquement le summary standardisé Aurlom
    let finalSummary = cvData.summary;
    if (cvData.personalInfo.btsProgram && cvData.personalInfo.startYear) {
      finalSummary = this.generateAurlomSummary(cvData);
    }
    
    if (finalSummary) {
      const summary = escapeHtmlPreserveNewlines(cleanText(finalSummary));
      html = html.replace(/\{\{summary\}\}/g, summary);
    } else {
      html = html.replace(/<div class="section" id="summary-section">[\s\S]*?<\/div>/g, '');
    }

    // Expérience professionnelle avec gestion des cas limites
    html = this.fillSection(html, 'experience', cvData.experience || [], (exp) => {
      // Extraire seulement l'année pour les dates
      const getYear = (dateStr: string): string => {
        if (!dateStr) return '';
        const match = dateStr.match(/^(\d{4})/);
        return match ? match[1] : dateStr;
      };
      
      // Calculer la durée en mois
      let duration = '';
      if (exp.startDate && exp.endDate && !exp.current) {
        try {
          const start = new Date(exp.startDate);
          const end = new Date(exp.endDate);
          const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
          if (months === 1) {
            duration = '1 mois';
          } else if (months > 1) {
            duration = `${months} mois`;
          }
        } catch (e) {
          // Ignorer les erreurs de parsing
        }
      }
      
      const startYear = getYear(exp.startDate);
      // Pour les expériences en cours : format "2025 - auj."
      const dateRange = exp.current && startYear ? `${startYear} - auj.` : startYear;
      
      return {
        company: truncateText(cleanText(exp.company), 50),
        position: truncateText(cleanText(exp.position), 50),
        location: truncateText(cleanText(exp.location), 30),
        startDate: dateRange,
        endDate: duration,
        duration: duration,
        description: exp.description ? escapeHtmlPreserveNewlines(cleanText(exp.description)) : '',
        achievements: exp.achievements 
          ? exp.achievements
              .filter(Boolean)
              .map(a => `• ${truncateText(cleanText(a), 150)}`)
              .join('<br>')
          : '',
      };
    });
    
    // Nettoyer les séparateurs en trop dans les expériences (contract vide)
    html = html.replace(/<span id="experience-contract"[^>]*>•<\/span>\s*<span id="experience-contract-text"[^>]*><\/span>\s*<span class="thin">•<\/span>/g, '');
    html = html.replace(/<span id="experience-contract-text"[^>]*><\/span>\s*<span class="thin">•<\/span>/g, '');
    html = html.replace(/•\s*•/g, '•');
    html = html.replace(/<span class="thin">•<\/span>\s*<span class="thin">•<\/span>/g, '<span class="thin">•</span>');

    // Éducation avec gestion des cas limites
    // Si btsProgram est présent, ajouter automatiquement la formation Aurlom
    let educationList = [...(cvData.education || [])];
    if (cvData.personalInfo.btsProgram && cvData.personalInfo.startYear) {
      // Vérifier si la formation Aurlom n'existe pas déjà
      const hasAurlomEducation = educationList.some(edu => 
        edu.institution && edu.institution.toLowerCase().includes('aurlom')
      );
      
      if (!hasAurlomEducation) {
        // Calculer les dates automatiquement (startYear - startYear+2)
        const startYear = cvData.personalInfo.startYear;
        const endYear = startYear + 2;
        const btsName = `BTS ${cvData.personalInfo.btsProgram}`;
        
        educationList.unshift({
          institution: 'Aurlom BTS+',
          degree: btsName,
          location: 'Paris (75)',
          startDate: `${startYear}-09`,
          endDate: `${endYear}-06`,
          current: true,
        });
      }
    }
    
    html = this.fillSection(html, 'education', educationList, (edu) => {
      // Forcer Aurlom BTS+ pour les formations Aurlom
      let institution = truncateText(cleanText(edu.institution), 60);
      let location = cleanText(edu.location);
      
      // Si c'est une formation Aurlom, forcer le format standardisé
      if (edu.institution && edu.institution.toLowerCase().includes('aurlom')) {
        institution = 'Aurlom BTS+';
        location = 'Paris (75)';
      }
      
      // Extraire seulement l'année pour les dates (comme pour les expériences)
      const getYear = (dateStr: string): string => {
        if (!dateStr) return '';
        const match = dateStr.match(/^(\d{4})/);
        return match ? match[1] : dateStr;
      };
      
      // Format de date pour montemplate : YYYY ou YYYY - YYYY
      let dateRange = '';
      if (edu.startDate && edu.endDate) {
        const startYear = getYear(edu.startDate);
        const endYear = edu.current ? 'En cours' : getYear(edu.endDate);
        dateRange = `${startYear} - ${endYear}`;
      } else if (edu.endDate) {
        dateRange = getYear(edu.endDate);
      } else if (edu.startDate) {
        dateRange = getYear(edu.startDate);
      }
      
      // Formater le champ spécialités si présent
      let specialties = '';
      if (edu.field) {
        const fieldText = cleanText(edu.field);
        // Si le champ commence déjà par "Spécialités:", ne pas le répéter
        if (fieldText.toLowerCase().startsWith('spécialités:')) {
          specialties = fieldText;
        } else {
          specialties = `Spécialités: ${fieldText}`;
        }
      }
      
      // Formater le GPA - éviter le double "Mention"
      let gpaText = '';
      if (edu.gpa) {
        const gpa = cleanText(edu.gpa);
        if (gpa.toLowerCase().startsWith('mention')) {
          gpaText = gpa; // Déjà formaté avec "Mention"
        } else {
          gpaText = `Mention ${gpa}`;
        }
      }
      
      return {
        institution: institution,
        degree: truncateText(cleanText(edu.degree), 60),
        field: specialties,
        location: location,
        startDate: formatDate(edu.startDate),
        endDate: edu.current ? 'En cours' : formatDate(edu.endDate),
        dateRange: dateRange,
        description: edu.description ? escapeHtmlPreserveNewlines(cleanText(edu.description)) : '',
        gpa: gpaText,
      };
    });
    
    // Nettoyer et formater les champs education-field et education-gpa pour éviter les chevauchements
    html = html.replace(/<span id="education-field">([^<]*)<\/span>/g, (match, content) => {
      return content.trim() ? `<div id="education-field">${content.trim()}</div>` : '';
    });
    html = html.replace(/<span id="education-gpa">([^<]*)<\/span>/g, (match, content) => {
      return content.trim() ? `<div id="education-gpa">${content.trim()}</div>` : '';
    });
    // Nettoyer les divs vides
    html = html.replace(/<div id="education-field"><\/div>/g, '');
    html = html.replace(/<div id="education-gpa"><\/div>/g, '');
    // S'assurer qu'il y a un espace entre field et gpa s'ils sont tous les deux présents
    html = html.replace(/<div id="education-field">([^<]+)<\/div>\s*<div id="education-gpa">/g, '<div id="education-field">$1</div><div id="education-gpa">');

    // Compétences avec gestion des cas limites
    html = this.fillSection(html, 'skills', cvData.skills || [], (skill) => {
      return {
        name: truncateText(cleanText(skill.name), 40),
        level: skill.level ? skill.level : '',
        category: cleanText(skill.category),
      };
    });
    
    // Compétences en ligne pour montemplate (format spécial)
    if (cvData.skills && cvData.skills.length > 0) {
      const allSkills = cvData.skills.map(s => `${cleanText(s.name)} : ${s.level || ''}`).join('\t');
      html = html.replace(/<span id="competences-list"><\/span>/g, allSkills);
    }

    // Langues avec gestion des cas limites
    html = this.fillSection(html, 'languages', cvData.languages || [], (lang) => {
      return {
        name: lang.name,
        level: lang.level ? lang.level : '',
      };
    });
    
    // Formatage spécial pour montemplate-v2 : remplir les 3 colonnes de compétences/langues
    if (html.includes('id="skills-container"')) {
      const languages = cvData.languages || [];
      const skills = cvData.skills || [];
      const software = (cvData as any).software || [];
      
      // Séparer les compétences par catégorie
      const competences = skills.filter(s => s.category === 'Compétences' || !s.category || s.category === '');
      const qualites = skills.filter(s => s.category === 'Qualités');
      const valeurs = skills.filter(s => s.category === 'Valeurs');
      
      // Fonction pour formater le niveau
      const formatLevel = (level: string | undefined): string => {
        if (!level) return '';
        const levelMap: Record<string, string> = {
          'beginner': 'débutant',
          'intermediate': 'intermédiaire',
          'advanced': 'avancé',
          'expert': 'expert',
          'A1': 'débutant',
          'A2': 'débutant',
          'B1': 'intermédiaire',
          'B2': 'intermédiaire',
          'C1': 'avancé',
          'C2': 'avancé',
          'native': 'natif',
          'scolaire': 'scolaire',
          'professionnel': 'professionnel'
        };
        return levelMap[level] || level;
      };
      
      // Colonne 1 : Langues uniquement
      let col1 = '';
      if (languages.length > 0) {
        col1 = languages.map(lang => {
          const level = formatLevel(lang.level);
          return `<b>${this.escapeHtml(cleanText(lang.name))}</b> : ${this.escapeHtml(level)}`;
        }).join('<br/>');
      }
      html = html.replace(/<div id="skills-col1">[\s\S]*?<\/div>/g, `<div id="skills-col1">${col1}</div>`);
      
      // Colonne 2 : Logiciels + Compétences
      let col2 = '';
      if (software.length > 0) {
        col2 = software.map((soft: any) => {
          const level = formatLevel(soft.level);
          return `<b>${this.escapeHtml(cleanText(soft.name))}</b> : ${this.escapeHtml(level)}`;
        }).join('<br/>');
      }
      if (competences.length > 0) {
        if (col2) col2 += '<br/>';
        col2 += `Compétences : ${competences.map(c => this.escapeHtml(cleanText(c.name))).join(', ')}`;
      }
      html = html.replace(/<div id="skills-col2">[\s\S]*?<\/div>/g, `<div id="skills-col2">${col2}</div>`);
      
      // Colonne 3 : Qualités + Valeurs avec hashtag
      let col3 = '';
      if (qualites.length > 0) {
        col3 = `# ${qualites.map(q => this.escapeHtml(cleanText(q.name))).join(', ')}`;
      }
      if (valeurs.length > 0) {
        if (col3) col3 += '<br/>';
        col3 += `# ${valeurs.map(v => this.escapeHtml(cleanText(v.name))).join(', ')}`;
      }
      html = html.replace(/<div id="skills-col3">[\s\S]*?<\/div>/g, `<div id="skills-col3">${col3}</div>`);
      
    // Supprimer la ligne "Compétences :" qui fait doublon avec les compétences déjà affichées individuellement
    html = html.replace(/<b>Compétences<\/b> : <span id="competences-list"><\/span>/g, '');
    html = html.replace(/<span id="competences-list"><\/span>/g, '');
    
    // Logo Aurlom dans le footer - chercher dans plusieurs emplacements possibles
    const logoPath1 = join(this.templatesDir, 'aurlom-logo.png');
    const logoPath2 = join(process.cwd(), 'logo.png');
    const logoPath3 = join(process.cwd(), 'templates', 'cv', 'aurlom-logo.png');
    let logoFound = false;
    let logoRelativePath = '';
    
    if (existsSync(logoPath1)) {
      logoRelativePath = 'aurlom-logo.png';
      logoFound = true;
    } else if (existsSync(logoPath2)) {
      // Logo à la racine - utiliser chemin absolu ou base64
      logoRelativePath = join(process.cwd(), 'logo.png');
      logoFound = true;
    } else if (existsSync(logoPath3)) {
      logoRelativePath = 'aurlom-logo.png';
      logoFound = true;
    }
    
    if (logoFound && logoRelativePath) {
      // Si le logo est à la racine, convertir en base64 pour l'inclure directement
      if (logoRelativePath.includes(process.cwd())) {
        try {
          const fs = await import('fs');
          const logoBuffer = fs.readFileSync(logoRelativePath);
          const logoBase64 = logoBuffer.toString('base64');
          const ext = logoRelativePath.split('.').pop()?.toLowerCase() || 'png';
          const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
          html = html.replace(/\{\{aurlomLogo\}\}/g, `data:${mimeType};base64,${logoBase64}`);
        } catch (e) {
          logger.error('Erreur lors de la lecture du logo:', e);
          html = html.replace(/<img[^>]*id="aurlom-logo"[^>]*>/g, '<strong>aurlom</strong>');
          html = html.replace(/\{\{aurlomLogo\}\}/g, '');
        }
      } else {
        html = html.replace(/\{\{aurlomLogo\}\}/g, logoRelativePath);
      }
    } else {
      // Si le logo n'existe pas, masquer l'image et afficher le texte
      html = html.replace(/<img[^>]*id="aurlom-logo"[^>]*>/g, '<strong>aurlom</strong>');
      html = html.replace(/\{\{aurlomLogo\}\}/g, '');
    }
    
    // Nettoyer les placeholders restants dans les blocs START/END et les remplacer par vide
      html = html.replace(/<!-- START languages -->[\s\S]*?<!-- END languages -->/g, '');
      html = html.replace(/<!-- START skills -->[\s\S]*?<!-- END skills -->/g, '');
      // Nettoyer aussi les placeholders individuels restants
      html = html.replace(/\{\{languages\.name\}\}/g, '');
      html = html.replace(/\{\{languages\.level\}\}/g, '');
      html = html.replace(/\{\{skills\.name\}\}/g, '');
      html = html.replace(/\{\{skills\.level\}\}/g, '');
    }

    // Certifications - masquer la section complète si vide
    if (cvData.certifications && cvData.certifications.length > 0) {
      html = this.fillSection(html, 'certifications', cvData.certifications, (cert) => {
        return {
          name: cert.name,
          issuer: cert.issuer || '',
          date: cert.date || '',
          credentialId: cert.credentialId || '',
          url: cert.url || '',
        };
      });
    } else {
      // Supprimer complètement la section certifications si vide
      html = html.replace(/<!-- START certifications -->[\s\S]*?<!-- END certifications -->/g, '');
      html = html.replace(/<section class="section">[\s\S]*?<div class="section-title" id="certifications-title">Certifications<\/div>[\s\S]*?<\/section>/g, '');
    }

    // Projets - masquer la section complète si vide
    if (cvData.projects && cvData.projects.length > 0) {
      html = this.fillSection(html, 'projects', cvData.projects, (project) => {
        return {
          name: truncateText(cleanText(project.name), 50),
          description: project.description ? escapeHtmlPreserveNewlines(truncateText(cleanText(project.description), 200)) : '',
          technologies: project.technologies ? formatList(project.technologies, ', ') : '',
          url: cleanUrl(project.url),
          startDate: formatDate(project.startDate),
          endDate: formatDate(project.endDate),
        };
      });
    } else {
      // Supprimer complètement la section projets si vide
      html = html.replace(/<!-- START projects -->[\s\S]*?<!-- END projects -->/g, '');
      html = html.replace(/<section class="section">[\s\S]*?<div class="section-title" id="projects-title">Projets<\/div>[\s\S]*?<\/section>/g, '');
    }

    // Hobbies avec gestion des cas limites (format spécial pour montemplate)
    if (cvData.hobbies && cvData.hobbies.length > 0) {
      // Format avec séparateurs "•" comme dans l'exemple
      const hobbiesFormatted = cvData.hobbies
        .map((h) => {
          const hobby = cleanText(h);
          // Si le hobby contient ":", formater comme "Football : pratique en club depuis 5 ans"
          if (hobby.includes(':')) {
            const parts = hobby.split(':');
            return `<em>${parts[0]}</em> : ${parts.slice(1).join(':').trim()}`;
          }
          return `<em>${hobby}</em>`;
        })
        .join(' • ');
      
      // Remplacer dans le conteneur hobbies
      html = html.replace(/<em id="hobbies-list">\{\{hobbies\}\}<\/em>/g, hobbiesFormatted);
      html = html.replace(/\{\{hobbies\}\}/g, formatList(cvData.hobbies, ', '));
    } else {
      html = html.replace(/<em id="hobbies-list">\{\{hobbies\}\}<\/em>/g, '');
      html = html.replace(/<div class="activities-section"[^>]*id="hobbies-section"[^>]*>[\s\S]*?<\/div>/g, '');
      html = html.replace(/<p class="section-title">Activités extra-scolaires<\/p>/g, '');
    }

    // Références
    html = this.fillSection(html, 'references', cvData.references || [], (ref) => {
      const positionText = ref.position 
        ? `${ref.position}${ref.company ? ` chez ${ref.company}` : ''}`
        : '';
      return {
        name: ref.name,
        position: positionText,
        company: ref.company || '',
        email: ref.email || '',
        phone: ref.phone || '',
      };
    });

    // Nettoyer les sections vides et les champs vides
    html = this.cleanEmptySections(html);

    return html;
  }

  /**
   * Génère automatiquement le mini bio standardisé Aurlom
   */
  private generateAurlomSummary(cvData: CV): string {
    const btsProgram = cvData.personalInfo.btsProgram || '';
    const startYear = cvData.personalInfo.startYear;
    const alternance = cvData.personalInfo.alternanceDetails;
    
    if (!btsProgram || !startYear) {
      return cvData.summary || '';
    }
    
    // Construction du texte standardisé
    let summary = `Pour la rentrée de septembre ${startYear}, j'intègre le BTS ${btsProgram} à Aurlom BTS+`;
    
    if (alternance) {
      if (alternance.domaine) {
        summary += ` et je recherche une alternance en ${alternance.domaine}`;
      } else {
        summary += ` et je recherche une alternance`;
      }
      
      if (alternance.activites) {
        summary += ` : ${alternance.activites}`;
      }
      
      if (alternance.disponibilite) {
        summary += `. ${alternance.disponibilite}`;
      } else {
        summary += `. Disponible 3 jours en structure, 2 jours à l'école et à temps plein pendant les vacances`;
      }
      
      if (alternance.qualites) {
        summary += `, je m'appuie sur ${alternance.qualites}.`;
      } else {
        summary += `, je m'appuie sur la rigueur, la fiabilité, l'implication et le sens des responsabilités.`;
      }
    } else {
      // Valeurs par défaut si alternanceDetails n'est pas fourni
      summary += ` et je recherche une alternance. Disponible 3 jours en structure, 2 jours à l'école et à temps plein pendant les vacances, je m'appuie sur la rigueur, la fiabilité, l'implication et le sens des responsabilités.`;
    }
    
    return summary;
  }

  /**
   * Remplit un champ conditionnel
   */
  private fillConditionalField(html: string, elementId: string, value: string, content: string): string {
    const regex = new RegExp(`<div[^>]*id="${elementId}"[^>]*></div>`, 'g');
    if (value) {
      return html.replace(regex, `<div class="contact-item">${content}</div>`);
    } else {
      return html.replace(regex, '');
    }
  }

  /**
   * Nettoie les sections vides
   */
  private cleanEmptySections(html: string): string {
    // Supprimer les sections avec seulement des IDs vides
    const sectionsToCheck = [
      'summary-section', 'experience-section', 'education-section',
      'skills-section', 'languages-section', 'certifications-section',
      'projects-section', 'hobbies-section', 'references-section'
    ];

    sectionsToCheck.forEach(sectionId => {
      const regex = new RegExp(
        `<div class="section" id="${sectionId}">[\\s\\S]*?<h2[^>]*>.*?</h2>[\\s\\S]*?</div>`,
        'g'
      );
      // On garde les sections qui ont du contenu réel
    });

    // Supprimer les éléments avec des IDs vides
    html = html.replace(/<div[^>]*id="[^"]*-item"[^>]*>\s*<\/div>/g, '');
    html = html.replace(/<div[^>]*id="[^"]*-container"[^>]*>\s*<\/div>/g, '');
    
    return html;
  }

  /**
   * Remplit une section répétitive du template
   */
  private fillSection<T>(
    html: string,
    sectionName: string,
    items: T[],
    mapper: (item: T) => Record<string, string>
  ): string {
    const sectionRegex = new RegExp(
      `<!--\\s*START\\s+${sectionName}\\s*-->([\\s\\S]*?)<!--\\s*END\\s+${sectionName}\\s*-->`,
      'g'
    );

    if (items.length === 0) {
      // Supprimer la section complète si elle est vide (y compris le titre)
      // Pattern 1: Section avec START/END comments
      html = html.replace(sectionRegex, '');
      
      // Pattern 2: Section avec section-title et section class
      const sectionWithTitlePattern = new RegExp(
        `<section class="section">[\\s\\S]*?<div class="section-title"[^>]*id="${sectionName}-title"[^>]*>[^<]*</div>[\\s\\S]*?<!--\\s*START\\s+${sectionName}\\s*-->[\\s\\S]*?<!--\\s*END\\s+${sectionName}\\s*-->[\\s\\S]*?</section>`,
        'g'
      );
      html = html.replace(sectionWithTitlePattern, '');
      
      // Pattern 3: Section avec div class="section" et id
      const sectionDivPattern = new RegExp(
        `<div class="section"[^>]*id="${sectionName}-section"[^>]*>[\\s\\S]*?<!--\\s*START\\s+${sectionName}\\s*-->[\\s\\S]*?<!--\\s*END\\s+${sectionName}\\s*-->[\\s\\S]*?</div>`,
        'g'
      );
      html = html.replace(sectionDivPattern, '');
      
      // Nettoyer aussi les placeholders restants
      const placeholderPattern = new RegExp(`\\{\\{${sectionName}\\.[^}]+\\}\\}`, 'g');
      html = html.replace(placeholderPattern, '');
      
      return html;
    }

    const match = sectionRegex.exec(html);
    if (!match) {
      return html;
    }

    const itemTemplate = match[1];
    const itemsHtml = items.map((item) => {
      const mapped = mapper(item);
      let itemHtml = itemTemplate;
      Object.entries(mapped).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${sectionName}\\.${key}\\}\\}`, 'g');
        if (value) {
          // Ne pas échapper HTML pour les balises <br> et autres balises HTML valides
          itemHtml = itemHtml.replace(regex, value);
        } else {
          // Supprimer les éléments avec cet ID si la valeur est vide
          const idRegex = new RegExp(`<[^>]*id="${sectionName}-${key}"[^>]*>.*?</[^>]*>`, 'gs');
          itemHtml = itemHtml.replace(idRegex, '');
          // Remplacer aussi les placeholders vides
          itemHtml = itemHtml.replace(regex, '');
        }
      });
      return itemHtml;
    }).join('');

    return html.replace(sectionRegex, itemsHtml);
  }

  /**
   * Échappe les caractères HTML
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Génère un PDF à partir du HTML (optimisé)
   */
  private async generatePDF(html: string, outputPath?: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Réduit l'utilisation mémoire
        '--disable-gpu', // Pas besoin de GPU pour PDF
        '--disable-extensions', // Pas besoin d'extensions
        '--disable-software-rasterizer',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    });

    try {
      const page = await browser.newPage();
      
      // Optimisations de performance
      await page.setViewport({ width: 794, height: 1123 }); // A4 en pixels (96 DPI)
      await page.setContent(html, { 
        waitUntil: 'domcontentloaded', // Plus rapide que networkidle0
        timeout: 10000 
      });
      
      // Attendre que les images soient chargées si nécessaire
      await page.evaluate(() => {
        return Promise.all(
          Array.from(document.images)
            .filter(img => !img.complete)
            .map(img => new Promise((resolve) => {
              img.onload = img.onerror = resolve;
            }))
        );
      });
      
      // S'assurer que les liens restent cliquables dans le PDF
      await page.evaluate(() => {
        const links = document.querySelectorAll('a');
        links.forEach(link => {
          link.style.pointerEvents = 'auto';
        });
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5cm',
          right: '0.5cm',
          bottom: '0.5cm',
          left: '0.5cm',
        },
      });

      if (outputPath) {
        const fs = await import('fs/promises');
        await fs.writeFile(outputPath, pdfBuffer);
      }

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Liste les templates disponibles
   */
  async listTemplates(): Promise<string[]> {
    try {
      const fs = await import('fs/promises');
      const files = await fs.readdir(this.templatesDir);
      return files
        .filter((file) => file.endsWith('.html'))
        .map((file) => file.replace('.html', ''));
    } catch (error) {
      logger.error('Error listing templates', { error });
      return [];
    }
  }
}
