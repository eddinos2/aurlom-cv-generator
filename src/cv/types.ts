import { z } from 'zod';

// Schéma pour les informations personnelles (plus permissif pour gérer les cas limites)
export const PersonalInfoSchema = z.object({
  firstName: z.string().min(1).max(100), // Limite de longueur
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  dateOfBirth: z.string().max(50).optional().nullable(),
  linkedin: z.string().url().max(500).optional().or(z.literal('')).nullable(),
  website: z.string().url().max(500).optional().or(z.literal('')).nullable(),
  image: z.string().max(10000).optional().nullable(), // URL ou base64 de l'image (base64 peut être long)
  // Champs spécifiques pour le header
  drivingLicense: z.string().max(50).optional().nullable(), // Ex: "Permis B"
  hasVehicle: z.boolean().optional().nullable(), // Motorisé ou non
  // Champs spécifiques Aurlom BTS+
  btsProgram: z.string().max(200).optional().nullable(), // Ex: "Biologie Médicale"
  startYear: z.number().int().min(2020).max(2030).optional().nullable(), // Année de rentrée scolaire (ex: 2026)
  alternanceDetails: z.object({
    domaine: z.string().max(200).optional().nullable(), // Ex: "laboratoire"
    activites: z.string().max(500).optional().nullable(), // Ex: "préparation et traitement des échantillons, prélèvements selon protocole..."
    disponibilite: z.string().max(200).optional().nullable(), // Ex: "3 jours en structure, 2 jours à l'école et à temps plein pendant les vacances"
    qualites: z.string().max(300).optional().nullable(), // Ex: "la rigueur, la fiabilité, l'implication et le sens des responsabilités"
  }).optional().nullable(),
});

// Schéma pour l'expérience professionnelle (avec limites pour éviter les débordements)
export const ExperienceSchema = z.object({
  company: z.string().min(1).max(200),
  position: z.string().min(1).max(200),
  location: z.string().max(200).optional().nullable(),
  startDate: z.string().min(1).max(50),
  endDate: z.string().max(50).optional().nullable(), // Optionnel pour les postes actuels
  current: z.boolean().default(false),
  description: z.string().max(2000).optional().nullable(), // Limite pour éviter les textes trop longs
  achievements: z.array(z.string().max(500)).optional().nullable(), // Limite chaque réalisation
});

// Schéma pour l'éducation
export const EducationSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  field: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  description: z.string().optional(),
  gpa: z.string().optional(),
});

// Schéma pour les compétences
export const SkillSchema = z.object({
  name: z.string().min(1),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert', 'débutant', 'intermédiaire', 'scolaire', 'professionnel']).optional(),
  category: z.string().optional(), // 'Qualités', 'Valeurs', 'Compétences', etc.
});

// Schéma pour les logiciels
export const SoftwareSchema = z.object({
  name: z.string().min(1),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert', 'débutant', 'intermédiaire', 'scolaire', 'professionnel']).optional(),
});

// Schéma pour les langues
export const LanguageSchema = z.object({
  name: z.string().min(1),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native', 'beginner', 'intermediate', 'advanced', 'expert', 'débutant', 'intermédiaire', 'scolaire', 'professionnel']).optional(),
});

// Schéma pour les certifications
export const CertificationSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().optional(),
  date: z.string().optional(),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
});

// Schéma pour les projets
export const ProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  url: z.string().url().optional().or(z.literal('')),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Schéma complet du CV
export const CVSchema = z.object({
  personalInfo: PersonalInfoSchema,
  summary: z.string().max(2000).optional().nullable(), // Limite pour éviter les résumés trop longs (sera généré automatiquement si btsProgram présent)
  experience: z.array(ExperienceSchema).optional(),
  education: z.array(EducationSchema).optional(),
  skills: z.array(SkillSchema).optional(),
  languages: z.array(LanguageSchema).optional(),
  software: z.array(SoftwareSchema).optional(), // Logiciels (Canva, Suite Google, etc.)
  certifications: z.array(CertificationSchema).optional(),
  projects: z.array(ProjectSchema).optional(),
  hobbies: z.array(z.string()).optional(),
  references: z.array(z.object({
    name: z.string(),
    position: z.string().optional(),
    company: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  })).optional(),
});

export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type Software = z.infer<typeof SoftwareSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type CV = z.infer<typeof CVSchema>;
