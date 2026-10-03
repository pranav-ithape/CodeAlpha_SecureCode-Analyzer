import { Request, Response } from 'express';
import Rule from '../models/Rule';

export const getRules = async (req: Request, res: Response) => {
  try {
    const rules = await Rule.find().sort({ ruleId: 1 });
    res.json(rules);
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
};

export const updateRuleStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (status !== 'Active' && status !== 'Inactive') {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const rule = await Rule.findByIdAndUpdate(id, { status }, { new: true });
    
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    res.json(rule);
  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({ error: 'Failed to update rule' });
  }
};
