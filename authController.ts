import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { User, Role, Permission } from './models';
import { generateToken } from './authMiddleware';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { username, email, password, roleName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Find or create default role
      let role = await Role.findOne({ name: roleName || 'User' });
      if (!role) {
        // Create default role with basic permissions
        const basicPermissions = await Permission.create([
          { name: 'read:profile', description: 'Can read own profile' },
          { name: 'update:profile', description: 'Can update own profile' }
        ]);

        role = await Role.create({
          name: roleName || 'User',
          permissions: basicPermissions.map(p => p._id)
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        role: role._id
      });

      // Generate JWT token
      const token = generateToken(user._id.toString());

      res.status(201).json({ 
        message: 'User registered successfully', 
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: role.name
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error during registration' });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user and populate role
      const user = await User.findOne({ email }).populate('role');

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = generateToken(user._id.toString());

      res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role.name
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error during login' });
    }
  },

  async getUserProfile(req: Request, res: Response) {
    try {
      const user = req.user;
      await user.populate('role.permissions');

      res.json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role.name,
          permissions: user.role.permissions.map((p: any) => p.name)
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error fetching user profile' });
    }
  }
};
