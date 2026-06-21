/**
 * Advanced Security Implementation
 * JWT Authentication, RBAC, Encryption
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  permissions: string[];
}

export class AuthService {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  generateToken(user: User): string {
    return jwt.sign({ id: user.id, email: user.email, role: user.role }, this.secret, {
      expiresIn: '24h',
    });
  }

  verifyToken(token: string): User | null {
    try {
      const decoded = jwt.verify(token, this.secret) as any;
      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        permissions: this.getPermissions(decoded.role),
      };
    } catch {
      return null;
    }
  }

  private getPermissions(role: string): string[] {
    const permissions: Record<string, string[]> = {
      admin: ['read', 'write', 'delete', 'manage'],
      user: ['read', 'write'],
      viewer: ['read'],
    };
    return permissions[role] || [];
  }

  encryptData(data: string, key: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
  }

  decryptData(encrypted: string, key: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
  }
}

export const authService = new AuthService(process.env.JWT_SECRET || 'secret');
