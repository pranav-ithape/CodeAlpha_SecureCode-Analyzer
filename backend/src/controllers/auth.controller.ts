import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { logAudit } from '../services/audit.service';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email and password are required' });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'Email is already registered' });
      return;
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
    
    await logAudit({
      userId: user._id.toString(),
      action: 'REGISTRATION',
      resourceType: 'User',
      resourceId: user._id.toString(),
      status: 'SUCCESS'
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error creating user' }); // Hide error details in prod
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      await logAudit({ action: 'LOGIN_FAILURE', resourceType: 'User', status: 'FAILURE', metadata: { email } });
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logAudit({ userId: user._id.toString(), action: 'LOGIN_FAILURE', resourceType: 'User', status: 'FAILURE' });
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
    
    await logAudit({ userId: user._id.toString(), action: 'LOGIN_SUCCESS', resourceType: 'User', status: 'SUCCESS' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error during login' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error: any) {
    res.status(500).json({ error: 'Error fetching user data' });
  }
};
