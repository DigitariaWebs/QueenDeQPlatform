import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export default async function authenticate(req, res, next) {
  try {
    // Accept token from header, query, or body
    let token = null;
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.query.token) {
      token = req.query.token;
    } else if (req.body && req.body.token) {
      token = req.body.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required. Please provide a valid token in the Authorization header, query, or body.' });
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


