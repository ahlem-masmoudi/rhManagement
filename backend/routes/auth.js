const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { register, login, verifyRisk, forgotPassword, resetPassword, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const loginLimiter = rateLimit({
	windowMs: 5 * 60 * 1000, // 5 minutes
	max: 20, // limit each IP
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res) => {
		return res.status(429).json({
			success: false,
			code: 'RATE_LIMITED',
			message: 'Trop de tentatives. Réessayez plus tard.'
		});
	}
});

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/risk/verify', loginLimiter, verifyRisk);
router.post('/forgot-password', loginLimiter, forgotPassword);
router.post('/reset-password', loginLimiter, resetPassword);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
