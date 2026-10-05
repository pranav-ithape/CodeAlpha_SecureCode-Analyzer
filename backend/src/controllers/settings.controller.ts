import { Request, Response } from 'express';
import { UserSettings } from '../models/UserSettings';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

// Get user settings
export const getSettings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    let settings = await UserSettings.findOne({ userId });
    if (!settings) {
      settings = await UserSettings.create({ userId });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.status(200).json({ 
      success: true, 
      user: { name: user.name, email: user.email, role: user.role },
      settings 
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update profile (name only, emails usually require verification in real systems)
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    // Only allow name update
    const user = await User.findByIdAndUpdate(userId, { name: name.trim() }, { new: true }).select('-password');
    
    return res.status(200).json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update password
export const updateSecurity = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    // Update password
    user.password = newPassword;
    await user.save(); // pre-save hook will hash it

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update policies (Admin only)
export const updatePolicies = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;
    
    if (role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Requires ADMIN role' });
    }

    const { policies } = req.body;
    if (!policies) return res.status(400).json({ success: false, message: 'Policies data required' });

    let settings = await UserSettings.findOne({ userId });
    if (!settings) {
      settings = await UserSettings.create({ userId, policies });
    } else {
      // Safe assignment of specific fields
      if (policies.requireComplexPassword !== undefined) settings.policies.requireComplexPassword = Boolean(policies.requireComplexPassword);
      if (policies.sessionTimeoutMinutes !== undefined) settings.policies.sessionTimeoutMinutes = Number(policies.sessionTimeoutMinutes);
      if (policies.allowReportGeneration !== undefined) settings.policies.allowReportGeneration = Boolean(policies.allowReportGeneration);
      await settings.save();
    }

    return res.status(200).json({ success: true, message: 'Policies updated successfully', settings });
  } catch (error) {
    console.error('Error updating policies:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get integrations
export const getIntegrations = async (req: Request, res: Response) => {
  try {
    const provider = process.env.AI_PROVIDER?.toLowerCase() === 'groq' ? 'groq' : 'gemini';
    const isGroq = provider === 'groq';
    const configured = isGroq ? !!process.env.GROQ_API_KEY : !!process.env.GEMINI_API_KEY;
    const model = isGroq 
      ? (process.env.GROQ_MODEL || 'llama3-8b-8192') 
      : (process.env.GEMINI_MODEL || 'gemini-1.5-flash');
    
    return res.status(200).json({
      success: true,
      integrations: {
        ai: {
          provider: isGroq ? 'Groq AI' : 'Google Gemini',
          status: configured ? 'Configured' : 'Not configured',
          model: configured ? model : 'N/A'
        },
        git: {
          status: 'Not configured'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete account
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password required to delete account' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect password' });
    }

    await User.findByIdAndDelete(userId);
    await UserSettings.deleteOne({ userId });
    // In a real app we'd also reassign or delete their projects/scans based on policy.

    return res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
