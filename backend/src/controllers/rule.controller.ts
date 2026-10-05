import { Request, Response } from 'express';
import Rule from '../models/Rule';
import { User } from '../models/User';

export const getRules = async (req: Request, res: Response) => {
  try {
    const rules = await Rule.find().sort({ ruleId: 1 });
    res.json(rules);
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
};

export const updateRuleStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SECURITY_ANALYST')) {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions to modify rules.' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;
    
    if (status !== 'Active' && status !== 'Inactive') {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }
    
    const rule = await Rule.findByIdAndUpdate(id, { status }, { new: true });
    
    if (!rule) {
      res.status(404).json({ error: 'Rule not found' });
      return;
    }
    
    res.json(rule);
  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({ error: 'Failed to update rule' });
  }
};
