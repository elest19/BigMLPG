import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const windowMinutes = Number(env.loginRateLimitWindowMinutes) || Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MINUTES) || 15;
const maxAttempts = Number(env.loginRateLimitMax) || Number(process.env.LOGIN_RATE_LIMIT_MAX) || 6;

export const loginLimiter = rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  max: maxAttempts,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: `Too many login attempts, please try again after ${windowMinutes} minutes.`,
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

export default loginLimiter;
