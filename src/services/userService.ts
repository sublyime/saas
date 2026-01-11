import { query, transaction, queryWithClient } from '../database/connection';
import { User } from '../types';
import { generateId, hashPassword, verifyPassword } from '../utils/security';
import { logger } from '../config/logger';
import { PoolClient } from 'pg';

/**
 * Create a new user
 */
export const createUser = async (
  email: string,
  password: string,
  fullName: string,
  organizationId: string,
  role: 'admin' | 'analyst' | 'viewer' = 'viewer'
): Promise<User> => {
  const userId = generateId();
  const passwordHash = await hashPassword(password);

  const result = await query(
    `INSERT INTO users (
      id, email, password_hash, full_name, role, organization_id, is_active, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
    RETURNING *`,
    [userId, email, passwordHash, fullName, role, organizationId]
  );

  logger.info(`User created: ${email}`);
  return result.rows[0];
};

/**
 * Find user by email
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await query(
    'SELECT * FROM users WHERE email = $1 AND is_active = true',
    [email]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Find user by ID
 */
export const findUserById = async (userId: string): Promise<User | null> => {
  const result = await query(
    'SELECT * FROM users WHERE id = $1 AND is_active = true',
    [userId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Verify user credentials
 */
export const verifyUserCredentials = async (
  email: string,
  password: string
): Promise<User | null> => {
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  const passwordValid = await verifyPassword(password, user.password_hash);

  if (!passwordValid) {
    return null;
  }

  // Update last login
  await query(
    'UPDATE users SET last_login_at = NOW() WHERE id = $1',
    [user.id]
  );

  return user;
};

/**
 * Update user
 */
export const updateUser = async (
  userId: string,
  updates: Partial<User>
): Promise<User> => {
  const allowedFields = ['full_name', 'role', 'is_active'];
  const updateFields = Object.keys(updates).filter(
    (key) => allowedFields.includes(key) && updates[key as keyof User] !== undefined
  );

  if (updateFields.length === 0) {
    return findUserById(userId) as Promise<User>;
  }

  const setClauses = updateFields
    .map((field, index) => `${field} = $${index + 1}`)
    .join(', ');

  const values = updateFields.map((field) => updates[field as keyof User]);
  values.push(userId);

  const result = await query(
    `UPDATE users SET ${setClauses}, updated_at = NOW() 
    WHERE id = $${updateFields.length + 1} AND is_active = true
    RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  logger.info(`User updated: ${userId}`);
  return result.rows[0];
};

/**
 * Get users by organization
 */
export const getUsersByOrganization = async (
  organizationId: string,
  limit = 50,
  offset = 0
): Promise<{ users: User[]; total: number }> => {
  const usersResult = await query(
    `SELECT * FROM users WHERE organization_id = $1 AND is_active = true 
    ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [organizationId, limit, offset]
  );

  const countResult = await query(
    'SELECT COUNT(*) as total FROM users WHERE organization_id = $1 AND is_active = true',
    [organizationId]
  );

  return {
    users: usersResult.rows,
    total: parseInt(countResult.rows[0].total, 10),
  };
};
