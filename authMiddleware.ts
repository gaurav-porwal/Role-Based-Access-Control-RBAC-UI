import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from './models';

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Authentication Middleware
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId).populate('role');

    if (!user) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Authorization Middleware
export const checkPermission = (requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Populate user's role permissions
    await user.populate('role.permissions');

    // Check if user has required permissions
    const hasPermission = requiredPermissions.every(permission => 
      user.role.permissions.some((p: any) => p.name === permission)
    );

    if (!hasPermission) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};

// Token Generation
export const generateToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
};
