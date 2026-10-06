import { Request, Response } from 'express';
import { User } from '../models/User';
import { logAudit } from '../services/audit.service';
import bcrypt from 'bcryptjs';

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(200).json({ user });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { 
      firstName, lastName, username, email, displayName, 
      phone, jobTitle, company, location, bio, 
      website, linkedin, github 
    } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      res.status(400).json({ error: 'Email is already in use by another account' });
      return;
    }

    const updateData: any = {
      firstName, lastName, username, email, displayName, 
      phone, jobTitle, company, location, bio, 
      website, linkedin, github
    };
    
    // name is required by schema, fallback to firstName + lastName or username if empty
    let newName = `${firstName || ''} ${lastName || ''}`.trim();
    if (!newName) newName = username || email.split('@')[0];
    updateData.name = newName;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await logAudit({ userId, action: 'UPDATE_PROFILE', resourceType: 'User', resourceId: userId, status: 'SUCCESS' });
    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new passwords are required' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({ error: 'Incorrect current password' });
      return;
    }

    user.password = newPassword; // Pre-save hook will hash it
    await user.save();

    await logAudit({ userId, action: 'CHANGE_PASSWORD', resourceType: 'User', resourceId: userId, status: 'SUCCESS' });
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update password' });
  }
};

export const updatePhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { profileImage } = req.body;

    if (!profileImage) {
      res.status(400).json({ error: 'Image data is required' });
      return;
    }

    // Basic validation to ensure it's a base64 image
    if (!profileImage.startsWith('data:image/')) {
      res.status(400).json({ error: 'Invalid image format' });
      return;
    }

    const user = await User.findByIdAndUpdate(userId, { profileImage }, { new: true }).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await logAudit({ userId, action: 'UPDATE_PROFILE_PHOTO', resourceType: 'User', resourceId: userId, status: 'SUCCESS' });
    res.status(200).json({ message: 'Profile photo updated successfully', user });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update profile photo' });
  }
};

export const deletePhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const user = await User.findByIdAndUpdate(userId, { $unset: { profileImage: 1 } }, { new: true }).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    await logAudit({ userId, action: 'DELETE_PROFILE_PHOTO', resourceType: 'User', resourceId: userId, status: 'SUCCESS' });
    res.status(200).json({ message: 'Profile photo removed successfully', user });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to remove profile photo' });
  }
};
