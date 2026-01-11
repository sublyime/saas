import { Request, Response } from 'express';
import * as userService from '../services/userService';
import { generateToken } from '../utils/security';
import { logger } from '../config/logger';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character'
  ),
  full_name: z.string().min(2),
  organization_id: z.string().uuid(),
});

/**
 * Login controller
 */
export const login = async (req: Request, res: Response) => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await userService.verifyUserCredentials(
      validated.email,
      validated.password
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      sub: user.id,
      org: user.organization_id,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        organization_id: user.organization_id,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Signup controller
 */
export const signup = async (req: Request, res: Response) => {
  try {
    const validated = signupSchema.parse(req.body);

    // Check if user already exists
    const existing = await userService.findUserByEmail(validated.email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await userService.createUser(
      validated.email,
      validated.password,
      validated.full_name,
      validated.organization_id,
      'analyst'
    );

    const token = generateToken({
      sub: user.id,
      org: user.organization_id,
      role: user.role,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        organization_id: user.organization_id,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    logger.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await userService.findUserById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      organization_id: user.organization_id,
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const updateSchema = z.object({
      full_name: z.string().min(2).optional(),
    });

    const validated = updateSchema.parse(req.body);

    const user = await userService.updateUser(req.userId, validated);

    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      organization_id: user.organization_id,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
