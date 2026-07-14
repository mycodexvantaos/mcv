/**
 * MyCodexVantaOS SSL Manager
 * Provides SSL certificate management and renewal
 */

export interface Certificate {
  id: string;
  domain: string;
  cert: string;
  key: string;
  expiresAt: number;
  autoRenew: boolean;
}

export class SSLManager {
  private certificates: Map<string, Certificate> = new Map();

  async requestCertificate(domain: string, email: string): Promise<Certificate> {
    const cert: Certificate = {
      id: `cert_${Date.now()}`,
      domain,
      cert: 'mock-certificate',
      key: 'mock-private-key',
      expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days
      autoRenew: true,
    };

    this.certificates.set(cert.id, cert);
    return cert;
  }

  async renewCertificate(certId: string): Promise<boolean> {
    const cert = this.certificates.get(certId);
    if (!cert) return false;

    cert.expiresAt = Date.now() + 90 * 24 * 60 * 60 * 1000;
    return true;
  }

  async checkExpiry(): Promise<Certificate[]> {
    const now = Date.now();
    const expiringSoon: Certificate[] = [];

    for (const cert of this.certificates.values()) {
      if (cert.expiresAt - now < 7 * 24 * 60 * 60 * 1000) {
        // 7 days
        expiringSoon.push(cert);
      }
    }

    return expiringSoon;
  }

  getCerificate(domain: string): Certificate | undefined {
    return Array.from(this.certificates.values()).find((c) => c.domain === domain);
  }
}

export default SSLManager;
