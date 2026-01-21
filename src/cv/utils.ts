/**
 * Utilitaires pour gérer les cas limites dans la génération de CV
 */

/**
 * Tronque un texte si trop long, avec ellipsis
 */
export function truncateText(text: string, maxLength: number = 100, suffix: string = '...'): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Nettoie et normalise un texte (supprime espaces multiples, trim)
 */
export function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text.toString().trim().replace(/\s+/g, ' ');
}

/**
 * Formate un nom/prénom pour éviter les débordements
 */
export function formatName(firstName: string, lastName: string, maxLength: number = 50): string {
  const fullName = `${cleanText(firstName)} ${cleanText(lastName)}`.trim();
  if (fullName.length <= maxLength) return fullName;
  
  // Si trop long, tronquer le prénom en gardant l'initiale
  const firstInitial = cleanText(firstName).charAt(0).toUpperCase();
  const shortName = `${firstInitial}. ${cleanText(lastName)}`;
  return shortName.length <= maxLength ? shortName : truncateText(shortName, maxLength);
}

/**
 * Adapte dynamiquement la taille du texte selon sa longueur
 */
export function getAdaptiveFontSize(text: string, baseSize: number = 14): number {
  const length = text.length;
  if (length > 100) return Math.max(baseSize - 4, 10);
  if (length > 60) return Math.max(baseSize - 2, 11);
  if (length > 40) return Math.max(baseSize - 1, 12);
  return baseSize;
}

/**
 * Formate un texte avec gestion intelligente des coupures
 */
export function smartTruncate(text: string, maxLength: number = 100, preserveWords: boolean = true): string {
  if (!text || text.length <= maxLength) return text;
  
  if (preserveWords) {
    // Tronquer à la fin d'un mot
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.7) {
      return truncated.substring(0, lastSpace) + '...';
    }
  }
  
  return truncateText(text, maxLength);
}

/**
 * Formate une adresse complète
 */
export function formatAddress(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).map(cleanText).join(', ').trim();
}

/**
 * Formate une date de manière sécurisée
 */
export function formatDate(date: string | null | undefined): string {
  if (!date) return '';
  return cleanText(date);
}

/**
 * Formate une liste d'éléments avec séparateur
 */
export function formatList(items: (string | null | undefined)[], separator: string = ', '): string {
  return items.filter(Boolean).map(cleanText).join(separator);
}

/**
 * Échappe HTML mais préserve les sauts de ligne
 */
export function escapeHtmlPreserveNewlines(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}

/**
 * Valide et nettoie une URL
 */
export function cleanUrl(url: string | null | undefined): string {
  if (!url) return '';
  const cleaned = cleanText(url);
  // Si ce n'est pas une URL valide, retourner vide
  try {
    new URL(cleaned);
    return cleaned;
  } catch {
    return '';
  }
}

/**
 * Gère les valeurs nulles/undefined de manière sécurisée
 */
export function safeValue<T>(value: T | null | undefined, defaultValue: T): T {
  return value ?? defaultValue;
}

/**
 * Formate un texte long avec word-wrap CSS
 */
export function formatLongText(text: string | null | undefined, maxWords: number = 50): string {
  if (!text) return '';
  const words = cleanText(text).split(' ');
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
}

/**
 * Génère des classes CSS pour gérer les débordements
 */
export function getTextOverflowClasses(maxLines: number = 3): string {
  return `overflow-hidden text-overflow-ellipsis display-webkit-box -webkit-line-clamp-${maxLines} -webkit-box-orient-vertical`;
}
