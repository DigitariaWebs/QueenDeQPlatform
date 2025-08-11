import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export default async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    const isJwt = error?.name === 'TokenExpiredError' || error?.name === 'JsonWebTokenError';
    return res.status(401).json({ success: false, error: isJwt ? 'Invalid token' : 'Unauthorized' });
  }
}


