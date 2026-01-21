import dotenv from 'dotenv';

dotenv.config();

export const hubspotConfig = {
  apiKey: process.env.HUBSPOT_API_KEY || '',
  webhookSecret: process.env.HUBSPOT_WEBHOOK_SECRET || '',
  portalId: process.env.HUBSPOT_PORTAL_ID || '',
  baseUrl: 'https://api.hubapi.com',
};

export const metaConfig = {
  appId: process.env.META_APP_ID || '',
  appSecret: process.env.META_APP_SECRET || '',
  webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || '',
  accessToken: process.env.META_ACCESS_TOKEN || '',
  graphApiVersion: 'v18.0',
  baseUrl: 'https://graph.facebook.com',
};

export const docusealConfig = {
  apiKey: process.env.DOCUSEAL_API_KEY || '',
  baseUrl: process.env.DOCUSEAL_BASE_URL || 'https://api.docuseal.co',
  webhookSecret: process.env.DOCUSEAL_WEBHOOK_SECRET || '',
};

export const zapierConfig = {
  webhookUrl: process.env.ZAPIER_WEBHOOK_URL || '',
};

export const makeConfig = {
  webhookUrl: process.env.MAKE_WEBHOOK_URL || '',
};

export const serverConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

export const databaseConfig = {
  url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/admiss_flow',
};
