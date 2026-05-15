/**
 * MyCodeXvantaOS Auth Connector
 * Provides authentication and authorization capabilities
 */

export interface AuthConfig {
  secret: string;
  tokenExpiry?: number;
  refreshTokenExpiry?: number;
  issuer?: string;
  audience?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  roles: string[];
  permissions: string[];
  metadata?: Record<string, any>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenPayload {
  sub: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
  iss?: string;
  aud?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  tokens?: AuthTokens;
  error?: string;
}

export class AuthConnector {
  private config: Required<Omit<AuthConfig, 'audience'>> & { audience?: string };
  private users: Map<string, User> = new Map();
  private refreshTokenStore: Map<string, { userId: string; expiresAt: number }> = new Map();
  private connected: boolean = false;

  constructor(config: AuthConfig) {
    this.config = {
      secret: config.secret,
      tokenExpiry: config.tokenExpiry || 3600, // 1 hour
      refreshTokenExpiry: config.refreshTokenExpiry || 604800, // 7 days
      issuer: config.issuer || 'mycodexvantaos',
      audience: config.audience,
    };
  }

  /**
   * Connect to auth service
   */
  async connect(): Promise<void> {
    // Simulate connection
    await new Promise((resolve) => setTimeout(resolve, 10));
    this.connected = true;
  }

  /**
   * Disconnect from auth service
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    this.users.clear();
    this.refreshTokenStore.clear();
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Register new user
   */
  async register(userData: {
    username: string;
    email: string;
    password: string;
    roles?: string[];
    permissions?: string[];
  }): Promise<AuthResult> {
    if (!this.connected) {
      return { success: false, error: 'Not connected' };
    }

    // Check if email already exists
    for (const user of this.users.values()) {
      if (user.email === userData.email) {
        return { success: false, error: 'Email already registered' };
      }
      if (user.username === userData.username) {
        return { success: false, error: 'Username already taken' };
      }
    }

    const user: User = {
      id: this.generateId(),
      username: userData.username,
      email: userData.email,
      password: this.hashPassword(userData.password),
      roles: userData.roles || [],
      permissions: userData.permissions || [],
    };

    this.users.set(user.id, user);

    const tokens = await this.generateTokens(user);

    return {
      success: true,
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Authenticate user
   */
  async login(credentials: { email: string; password: string }): Promise<AuthResult> {
    if (!this.connected) {
      return { success: false, error: 'Not connected' };
    }

    const usersArray = Array.from(this.users.values());
    const user = usersArray.find((u) => u.email === credentials.email);

    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    if (!this.verifyPassword(credentials.password, user.password || '')) {
      return { success: false, error: 'Invalid credentials' };
    }

    const tokens = await this.generateTokens(user);

    return {
      success: true,
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refresh(refreshToken: string): Promise<AuthResult> {
    if (!this.connected) {
      return { success: false, error: 'Not connected' };
    }

    const storedToken = this.refreshTokenStore.get(refreshToken);

    if (!storedToken) {
      return { success: false, error: 'Invalid refresh token' };
    }

    if (Date.now() > storedToken.expiresAt) {
      this.refreshTokenStore.delete(refreshToken);
      return { success: false, error: 'Refresh token expired' };
    }

    const user = this.users.get(storedToken.userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const tokens = await this.generateTokens(user);

    // Remove old refresh token
    this.refreshTokenStore.delete(refreshToken);

    return {
      success: true,
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<{ success: boolean; error?: string }> {
    if (!this.connected) {
      return { success: false, error: 'Not connected' };
    }

    this.refreshTokenStore.delete(refreshToken);
    return { success: true };
  }

  /**
   * Verify access token
   */
  async verifyToken(token: string): Promise<TokenPayload | null> {
    if (!this.connected) {
      return null;
    }

    try {
      const payload = this.decodeToken(token);

      if (Date.now() > payload.exp * 1000) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    if (!this.connected) {
      return null;
    }

    const user = this.users.get(userId);
    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    updates: Partial<Omit<User, 'id' | 'password'>>
  ): Promise<User | null> {
    if (!this.connected) {
      return null;
    }

    const user = this.users.get(userId);
    if (!user) {
      return null;
    }

    const updatedUser = {
      ...user,
      ...updates,
    };

    this.users.set(userId, updatedUser);
    return this.sanitizeUser(updatedUser);
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.connected) {
      return { success: false, error: 'Not connected' };
    }

    const user = this.users.get(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (!this.verifyPassword(currentPassword, user.password || '')) {
      return { success: false, error: 'Current password is incorrect' };
    }

    user.password = this.hashPassword(newPassword);
    return { success: true };
  }

  /**
   * Check if user has permission
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    if (!this.connected) {
      return false;
    }

    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    return user.permissions.includes(permission) || user.permissions.includes('*');
  }

  /**
   * Check if user has role
   */
  async hasRole(userId: string, role: string): Promise<boolean> {
    if (!this.connected) {
      return false;
    }

    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    return user.roles.includes(role) || user.roles.includes('admin');
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<boolean> {
    if (!this.connected) {
      return false;
    }

    // Remove refresh tokens
    for (const [token, data] of this.refreshTokenStore.entries()) {
      if (data.userId === userId) {
        this.refreshTokenStore.delete(token);
      }
    }

    return this.users.delete(userId);
  }

  /**
   * List all users
   */
  async listUsers(): Promise<User[]> {
    if (!this.connected) {
      return [];
    }

    return Array.from(this.users.values()).map((user) => this.sanitizeUser(user));
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: User): Promise<AuthTokens> {
    const now = Math.floor(Date.now() / 1000);

    const payload: TokenPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
      iat: now,
      exp: now + this.config.tokenExpiry,
      iss: this.config.issuer,
      aud: this.config.audience,
    };

    const accessToken = this.encodeToken(payload);
    const refreshToken = this.generateRefreshToken();

    // Store refresh token
    this.refreshTokenStore.set(refreshToken, {
      userId: user.id,
      expiresAt: Date.now() + this.config.refreshTokenExpiry * 1000,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.tokenExpiry,
    };
  }

  /**
   * Encode token payload
   */
  private encodeToken(payload: TokenPayload): string {
    // Simple base64 encoding (in production, use JWT)
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
    return `${encoded}.${this.config.secret.slice(0, 16)}`;
  }

  /**
   * Decode token payload
   */
  private decodeToken(token: string): TokenPayload {
    const parts = token.split('.');
    const payload = Buffer.from(parts[0], 'base64').toString('utf-8');
    return JSON.parse(payload);
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(): string {
    return 'rt_' + this.generateId() + '_' + Date.now();
  }

  /**
   * Hash password (simplified)
   */
  private hashPassword(password: string): string {
    // In production, use bcrypt or argon2
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(password + this.config.secret)
      .digest('hex');
  }

  /**
   * Verify password
   */
  private verifyPassword(password: string, hash: string): boolean {
    const crypto = require('crypto');
    const computedHash = crypto
      .createHash('sha256')
      .update(password + this.config.secret)
      .digest('hex');
    return computedHash === hash;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: User): User {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}

export default AuthConnector;
