import express from 'express';
import { User } from '../models/index.js';

const router = express.Router();

// Public statistics endpoint
router.get('/stats', async (req, res) => {
  try {
    // Basic site info
    const siteInfo = {
      name: 'Queen de Q',
      description: 'Interactive chat and journaling experience for interior queens',
      version: '1.0.0'
    };

  // Counts
  const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const premiumUsers = await User.countDocuments({ role: { $in: ['Diademe', 'Couronne'] } });
    const subscriptionsActive = await User.countDocuments({ subscriptionStatus: 'active' });

  // Unique emails (in case there are duplicates or external records)
  const uniqueEmails = await User.distinct('email').then(arr => arr.length);

  // First and last signup timestamps
  const firstUser = await User.findOne().sort({ createdAt: 1 }).select('createdAt').lean();
  const lastUser = await User.findOne().sort({ createdAt: -1 }).select('createdAt').lean();

    // Gather simple breakdown by role
    const rolesAgg = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $project: { role: '$_id', count: 1, _id: 0 } }
    ]);

    res.json({
      success: true,
      siteInfo,
      counts: {
  totalUsers,
  uniqueEmails,
  activeUsers,
  premiumUsers,
  subscriptionsActive,
  roles: rolesAgg,
  firstSignupAt: firstUser?.createdAt || null,
  lastSignupAt: lastUser?.createdAt || null
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

export default router;
