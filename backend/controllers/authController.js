const User = require('../models/User');
const Candidate = require('../models/Candidate');
const { generateToken, generateRiskChallengeToken } = require('../utils/jwt');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendRiskOtpEmail, isMailConfigured } = require('../utils/mailer');

// automated-edit-check: write access verified at 2026-04-12

const sha256 = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex');

const normalizeIp = (ip) => {
  if (!ip) return '';
  const s = String(ip);
  return s.startsWith('::ffff:') ? s.slice('::ffff:'.length) : s;
};

const getClientIp = (req) => {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim().length > 0) {
    return normalizeIp(xff.split(',')[0].trim());
  }
  return normalizeIp(req.ip);
};

const getDeviceHash = (req) => {
  const deviceId = req.get('x-device-id');
  if (!deviceId) return null;
  const trimmed = String(deviceId).trim();
  if (!trimmed) return null;
  return sha256(trimmed);
};

const getUserAgentHash = (req) => sha256(req.get('user-agent') || '');

const touchKnownDevice = (user, deviceHash) => {
  if (!deviceHash) return;
  const now = new Date();
  user.knownDevices = Array.isArray(user.knownDevices) ? user.knownDevices : [];
  const existing = user.knownDevices.find((d) => d.deviceHash === deviceHash);
  if (existing) {
    existing.lastSeen = now;
    return;
  }

  user.knownDevices.push({ deviceHash, firstSeen: now, lastSeen: now });
  // Keep a small bounded history
  const maxDevices = Number(process.env.AUTH_MAX_KNOWN_DEVICES || 20);
  if (user.knownDevices.length > maxDevices) {
    user.knownDevices.sort((a, b) => (a.lastSeen?.getTime?.() || 0) - (b.lastSeen?.getTime?.() || 0));
    user.knownDevices = user.knownDevices.slice(user.knownDevices.length - maxDevices);
  }
};

const computeLoginRisk = ({ user, deviceHash, ip, uaHash }) => {
  const hasHistory = !!(user.lastLoginAt || (Array.isArray(user.knownDevices) && user.knownDevices.length > 0));
  let score = 0;
  const reasons = [];

  if (!deviceHash) {
    score += 40;
    reasons.push('missing_device_id');
  } else if (hasHistory) {
    const isKnownDevice = (user.knownDevices || []).some((d) => d.deviceHash === deviceHash);
    if (!isKnownDevice) {
      score += 70;
      reasons.push('new_device');
    }
  }

  if (hasHistory && user.lastLoginIp && ip && user.lastLoginIp !== ip) {
    score += 15;
    reasons.push('ip_changed');
  }

  if (hasHistory && user.lastLoginUaHash && uaHash && user.lastLoginUaHash !== uaHash) {
    score += 15;
    reasons.push('ua_changed');
  }

  if (user.failedLoginAttempts) {
    const add = Math.min(30, Number(user.failedLoginAttempts) * 10);
    score += add;
    if (add > 0) reasons.push('recent_failed_attempts');
  }

  if (user.lastLoginAt) {
    const minutesSinceLastLogin = (Date.now() - user.lastLoginAt.getTime()) / (60 * 1000);
    if (minutesSinceLastLogin < 2) {
      score += 10;
      reasons.push('rapid_relogin');
    }
  }

  const threshold = Number(process.env.AUTH_RISK_THRESHOLD || 60);
  return { score, threshold, requiresChallenge: score >= threshold, reasons };
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // If no password provided by frontend (first-time candidate), generate a secure random one
    let userPassword = password;
    if (!userPassword || userPassword.trim() === '') {
      // Generate a 12-byte hex string (24 chars) password
      userPassword = crypto.randomBytes(12).toString('hex');
      // Note: we do not return the password to the client for security; the user will be authenticated via token
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password: userPassword,
      firstName,
      lastName,
      role: role || 'candidate',
      profileComplete: false
    });

    // If candidate, create candidate profile
    if (user.role === 'candidate') {
      await Candidate.create({
        userId: user._id,
        skills: [],
        applications: []
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profileComplete: user.profileComplete,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // NOTE: per your request we enable detailed field-specific errors by default here.
    // This helps the frontend show which field is incorrect.
    // If you later want to disable it, set AUTH_DETAILED_ERRORS=false in env.
    const detailedErrors = process.env.AUTH_DETAILED_ERRORS !== 'false';

    const normalizedEmail = (email || '').toString().trim().toLowerCase();

    // Validate input
    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password (+ risk challenge secrets)
    const user = await User.findOne({ email: normalizedEmail }).select('+password +riskChallengeNonceHash +riskOtpHash');

    if (!user) {
    return res.status(401).json({
        success: false,
        code: detailedErrors ? 'EMAIL_INCORRECT' : 'INVALID_CREDENTIALS',
        message: detailedErrors ? 'Email incorrect' : 'Identifiants invalides'
      });
    }

    // Check lockout: support both boolean getter (virtual) or computed property
    if (user.isLocked) {
      const retryAfterSeconds = user.lockUntil ? Math.max(1, Math.ceil((user.lockUntil.getTime() - Date.now()) / 1000)) : 60;
      res.set('Retry-After', String(retryAfterSeconds));
      return res.status(423).json({
        success: false,
        code: 'ACCOUNT_LOCKED',
        message: `Compte temporairement bloquÃ©. RÃ©essayez dans ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
        retryAfterSeconds
      });
    }

    // Check password (fallback to bcrypt if model doesn't provide comparePassword)
    let isPasswordValid = false;
    try {
      if (typeof user.comparePassword === 'function') {
        isPasswordValid = await user.comparePassword(password);
      } else {
        isPasswordValid = await bcrypt.compare(password, user.password || '');
      }
    } catch (e) {
      // In case of any compare error, treat as invalid but continue to increment counters
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      // Increment failed attempts and lock account if threshold reached
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      const maxAttempts = Number(process.env.AUTH_MAX_FAILED_ATTEMPTS || 6);
      const lockMinutes = Number(process.env.AUTH_LOCK_MINUTES || 5);
      if (user.failedLoginAttempts >= maxAttempts) {
        user.lockUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
      }

        try {
          await user.save({ validateBeforeSave: false });
        } catch (e) {
          // Do not block response on logging/persistence issues
          console.warn('Failed to persist failedLoginAttempts:', e?.message);
        }

      return res.status(401).json({
        success: false,
        code: detailedErrors ? 'PASSWORD_INCORRECT' : 'INVALID_CREDENTIALS',
        message: detailedErrors ? 'Mot de passe incorrect' : 'Identifiants invalides'
      });
    }

    // Risk-based authentication (step-up) â€” only after correct password
    const riskEnabled = process.env.AUTH_RISK_ENABLED !== 'false';
    const ip = getClientIp(req);
    const deviceHash = getDeviceHash(req);
    const uaHash = getUserAgentHash(req);

    if (riskEnabled) {
      const { score, threshold, requiresChallenge } = computeLoginRisk({ user, deviceHash, ip, uaHash });

      if (requiresChallenge) {
        const otpTtlSeconds = Number(process.env.AUTH_RISK_OTP_TTL_SECONDS || 600); // 10 minutes
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const otpHash = await bcrypt.hash(otp, 10);
        const nonce = crypto.randomBytes(16).toString('hex');
        const nonceHash = sha256(nonce);
        const expiresAt = new Date(Date.now() + otpTtlSeconds * 1000);

        user.riskOtpHash = otpHash;
        user.riskOtpExpiresAt = expiresAt;
        user.riskOtpAttempts = 0;
        user.riskChallengeNonceHash = nonceHash;
        user.riskChallengeIssuedAt = new Date();
        user.riskChallengeContextDeviceHash = deviceHash || undefined;
        user.riskChallengeContextIp = ip || undefined;
        user.riskChallengeContextUaHash = uaHash || undefined;

        // Successful credential validation: clear lockout counters now
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;

        let challengePersisted = true;
        try {
          await user.save({ validateBeforeSave: false });
        } catch (e) {
          // if persistence fails, fall back to normal login to avoid locking out users
          console.warn('Risk challenge persistence failed, bypassing:', e?.message);
          challengePersisted = false;
        }

        if (challengePersisted) {
          const riskToken = generateRiskChallengeToken(user._id, nonce, otpTtlSeconds);

          // By default: NEVER return OTP to client. Use email delivery.
          const includeDevOtp = process.env.AUTH_RISK_DEV_RETURN_OTP === 'true';
          if (process.env.NODE_ENV === 'development') {
              // Development-only: OTP generated (not logged in production)
            }

          let delivery = 'unconfigured';
          if (!includeDevOtp) {
            if (isMailConfigured()) {
              try {
                await sendRiskOtpEmail({ to: user.email, otp, expiresInSeconds: otpTtlSeconds });
                delivery = 'email';
              } catch (e) {
                console.warn('Failed to send risk OTP email:', e?.message);
                delivery = 'unconfigured';
              }
            }
          } else {
            delivery = 'dev';
          }

          return res.status(202).json({
            success: true,
            code: 'RISK_CHALLENGE_REQUIRED',
            message: 'VÃ©rification supplÃ©mentaire requise',
            data: {
              riskToken,
              delivery,
              expiresInSeconds: otpTtlSeconds,
              ...(includeDevOtp ? { devOtp: otp } : {})
            }
          });
        }

        // Bypass: ensure we don't accidentally persist a half-created challenge
        user.riskOtpHash = undefined;
        user.riskOtpExpiresAt = undefined;
        user.riskOtpAttempts = 0;
        user.riskChallengeNonceHash = undefined;
        user.riskChallengeIssuedAt = undefined;
        user.riskChallengeContextDeviceHash = undefined;
        user.riskChallengeContextIp = undefined;
        user.riskChallengeContextUaHash = undefined;
      }
    }

    // Successful credential validation: clear lockout counters
    if (user.failedLoginAttempts || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
    }

    // Successful login â€” update device history
    touchKnownDevice(user, deviceHash);
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip || undefined;
    user.lastLoginUaHash = uaHash || undefined;
    user.lastLoginDeviceHash = deviceHash || undefined;
    try {
      await user.save({ validateBeforeSave: false });
    } catch (e) {
      // ignore save errors on post-login metadata
      console.warn('Post-login save warning:', e?.message);
    }

    // Generate token
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profileComplete: user.profileComplete,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc    Verify risk-based step-up OTP
// @route   POST /api/auth/risk/verify
// @access  Public
exports.verifyRisk = async (req, res) => {
  try {
    const { riskToken, otp } = req.body;

    if (!riskToken || !otp) {
      return res.status(400).json({
        success: false,
        code: 'RISK_MISSING_FIELDS',
        message: 'Veuillez fournir le token et le code de vÃ©rification.'
      });
    }

    let payload;
    try {
      payload = jwt.verify(riskToken, process.env.JWT_SECRET);
    } catch (e) {
    return res.status(401).json({
        success: false,
        code: 'RISK_TOKEN_INVALID',
        message: 'Session de vérification invalide ou expirée.'
      });
    }

    if (!payload || payload.type !== 'risk_challenge' || !payload.id || !payload.nonce) {
    return res.status(401).json({
        success: false,
        code: 'RISK_TOKEN_INVALID',
        message: 'Session de vérification invalide.'
      });
    }

    const user = await User.findById(payload.id).select('+riskChallengeNonceHash +riskOtpHash');
    if (!user) {
    return res.status(401).json({
        success: false,
        code: 'RISK_USER_NOT_FOUND',
        message: 'Utilisateur introuvable.'
      });
    }

    const now = Date.now();
    if (!user.riskOtpHash || !user.riskOtpExpiresAt || user.riskOtpExpiresAt.getTime() <= now) {
    return res.status(401).json({
        success: false,
        code: 'RISK_CHALLENGE_EXPIRED',
        message: 'Code expiré. Veuillez vous reconnecter.'
      });
    }

    const nonceHash = sha256(payload.nonce);
    if (!user.riskChallengeNonceHash || user.riskChallengeNonceHash !== nonceHash) {
    return res.status(401).json({
        success: false,
        code: 'RISK_CHALLENGE_INVALID',
        message: 'Session de vérification invalide. Veuillez vous reconnecter.'
      });
    }

    // Bind challenge to the same context (device/ip/ua) to reduce token replay
    const ip = getClientIp(req);
    const deviceHash = getDeviceHash(req);
    const uaHash = getUserAgentHash(req);

    if (user.riskChallengeContextDeviceHash && user.riskChallengeContextDeviceHash !== (deviceHash || undefined)) {
    return res.status(401).json({
        success: false,
        code: 'RISK_CONTEXT_CHANGED',
        message: 'Appareil différent détecté. Veuillez vous reconnecter.'
      });
    }
    if (user.riskChallengeContextIp && user.riskChallengeContextIp !== (ip || undefined)) {
    return res.status(401).json({
        success: false,
        code: 'RISK_CONTEXT_CHANGED',
        message: 'Réseau différent détecté. Veuillez vous reconnecter.'
      });
    }
    if (user.riskChallengeContextUaHash && user.riskChallengeContextUaHash !== (uaHash || undefined)) {
    return res.status(401).json({
        success: false,
        code: 'RISK_CONTEXT_CHANGED',
        message: 'Navigateur différent détecté. Veuillez vous reconnecter.'
      });
    }

    const maxOtpAttempts = Number(process.env.AUTH_RISK_OTP_MAX_ATTEMPTS || 5);
    user.riskOtpAttempts = Number(user.riskOtpAttempts || 0);
    if (user.riskOtpAttempts >= maxOtpAttempts) {
      user.riskOtpHash = undefined;
      user.riskOtpExpiresAt = undefined;
      user.riskOtpAttempts = 0;
      user.riskChallengeNonceHash = undefined;
      user.riskChallengeIssuedAt = undefined;
      user.riskChallengeContextDeviceHash = undefined;
      user.riskChallengeContextIp = undefined;
      user.riskChallengeContextUaHash = undefined;
      try {
        await user.save({ validateBeforeSave: false });
      } catch (e) {
        // ignore
      }
      return res.status(423).json({
        success: false,
        code: 'RISK_OTP_TOO_MANY_ATTEMPTS',
        message: 'Trop de tentatives. Veuillez vous reconnecter.'
      });
    }

    const ok = await bcrypt.compare(String(otp).trim(), user.riskOtpHash);
    if (!ok) {
      user.riskOtpAttempts += 1;
      try {
        await user.save({ validateBeforeSave: false });
      } catch (e) {
        // ignore
      }

      const remaining = Math.max(0, maxOtpAttempts - user.riskOtpAttempts);
    return res.status(401).json({
        success: false,
        code: 'RISK_OTP_INVALID',
        message: `Code invalide. Tentatives restantes: ${remaining}.`
      });
    }

    // Verified â€” clear challenge and complete login
    user.riskOtpHash = undefined;
    user.riskOtpExpiresAt = undefined;
    user.riskOtpAttempts = 0;
    user.riskChallengeNonceHash = undefined;
    user.riskChallengeIssuedAt = undefined;
    user.riskChallengeContextDeviceHash = undefined;
    user.riskChallengeContextIp = undefined;
    user.riskChallengeContextUaHash = undefined;

    touchKnownDevice(user, deviceHash);
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip || undefined;
    user.lastLoginUaHash = uaHash || undefined;
    user.lastLoginDeviceHash = deviceHash || undefined;

    try {
      await user.save({ validateBeforeSave: false });
    } catch (e) {
      // ignore
    }

    const token = generateToken(user._id);
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profileComplete: user.profileComplete,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    console.error('Risk verify error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying code',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

