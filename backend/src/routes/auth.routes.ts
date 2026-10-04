import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { signup, login, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

router.post('/signup', [
  body('name').isString().notEmpty().trim(),
  body('email').isEmail().trim(),
  body('password').isString().isLength({ min: 6 }),
  validate
], signup);

router.post('/login', [
  body('email').isEmail().trim(),
  body('password').isString().notEmpty(),
  validate
], login);

router.get('/me', authenticate, getMe);

export default router;
