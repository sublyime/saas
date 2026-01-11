import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { JwtPayload } from '../types';
import { logger } from '../config/logger';

/**
 * Hash password securely
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcryptjs.hash(password, config.security.bcryptRounds);
};

/**
 * Verify password
 */
export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcryptjs.compare(password, hash);
};

/**
 * Generate JWT token
 */
export const generateToken = (payload: JwtPayload): string => {
  const secret = config.security.jwtSecret;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(payload, secret, {
    expiresIn: config.security.jwtExpiresIn,
    algorithm: 'HS256',
  } as jwt.SignOptions);
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const payload = jwt.verify(token, config.security.jwtSecret) as JwtPayload;
    return payload;
  } catch (error) {
    logger.debug('Token verification failed:', error);
    return null;
  }
};

/**
 * Generate API key
 */
export const generateApiKey = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash API key for storage
 */
export const hashApiKey = (apiKey: string): string => {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
};

/**
 * Verify API key
 */
export const verifyApiKey = (apiKey: string, hash: string): boolean => {
  return hashApiKey(apiKey) === hash;
};

/**
 * Generate UUID
 */
export const generateId = (): string => {
  return uuidv4();
};

/**
 * Encrypt data
 */
export const encrypt = (data: string): string => {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(config.security.encryptionKey, 'hex');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt data
 */
export const decrypt = (encryptedData: string): string => {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const key = Buffer.from(config.security.encryptionKey, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

/**
 * Generate CSRF token
 */
export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
