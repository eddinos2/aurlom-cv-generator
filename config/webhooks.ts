import crypto from 'crypto';

export interface WebhookVerificationResult {
  isValid: boolean;
  error?: string;
}

export class WebhookVerifier {
  /**
   * Vérifie la signature HubSpot
   */
  static verifyHubSpotSignature(
    signature: string,
    requestBody: string,
    secret: string
  ): WebhookVerificationResult {
    if (!signature || !secret) {
      return { isValid: false, error: 'Missing signature or secret' };
    }

    const hash = crypto
      .createHmac('sha256', secret)
      .update(requestBody)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(hash)
    );

    return { isValid, error: isValid ? undefined : 'Invalid signature' };
  }

  /**
   * Vérifie le token Meta (pour la vérification initiale du webhook)
   */
  static verifyMetaToken(token: string, expectedToken: string): boolean {
    return token === expectedToken;
  }

  /**
   * Vérifie la signature DocuSeal
   */
  static verifyDocuSealSignature(
    signature: string,
    requestBody: string,
    secret: string
  ): WebhookVerificationResult {
    if (!signature || !secret) {
      return { isValid: false, error: 'Missing signature or secret' };
    }

    const hash = crypto
      .createHmac('sha256', secret)
      .update(requestBody)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(hash)
    );

    return { isValid, error: isValid ? undefined : 'Invalid signature' };
  }

  /**
   * Génère un token de vérification pour Meta
   */
  static generateMetaVerifyToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
