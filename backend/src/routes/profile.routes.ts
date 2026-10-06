import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { getProfile, updateProfile, updatePassword, updatePhoto, deletePhoto } from '../controllers/profile.controller';

const router = Router();

const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

router.get('/', getProfile);

router.put('/', [
  body('email').isEmail().withMessage('Valid email is required').trim(),
  body('firstName').optional().isString().trim(),
  body('lastName').optional().isString().trim(),
  body('username').optional().isString().trim(),
  body('website').optional({ checkFalsy: true }).isURL().withMessage('Invalid URL'),
  body('linkedin').optional({ checkFalsy: true }).isURL().withMessage('Invalid URL'),
  body('github').optional({ checkFalsy: true }).isURL().withMessage('Invalid URL'),
  validate
], updateProfile);

router.put('/password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validate
], updatePassword);

router.post('/photo', [
  body('profileImage').notEmpty().withMessage('Image data is required'),
  validate
], updatePhoto);

router.delete('/photo', deletePhoto);

export default router;
