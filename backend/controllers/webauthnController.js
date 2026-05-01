const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

let simplewebauthn = null;
try {
  simplewebauthn = require('@simplewebauthn/server');
} catch (e) {
  console.warn('[WebAuthn] @simplewebauthn/server not installed. Run: npm install @simplewebauthn/server');
}

const RP_NAME = process.env.WEBAUTHN_RP_NAME || 'INET RH Management';
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getRpConfig(req) {
  if (process.env.WEBAUTHN_RP_ID) {
    const rpId = process.env.WEBAUTHN_RP_ID.trim();
    const rpOrigin = (process.env.WEBAUTHN_ORIGIN || `https://${rpId}`).trim();
    return { rpId, rpOrigin };
  }
  const origin = (req.headers.origin || req.headers.referer || '').trim();
  try {
    const url = new URL(origin);
    return { rpId: url.hostname, rpOrigin: url.origin };
  } catch {
    return { rpId: 'localhost', rpOrigin: 'http://localhost:4200' };
  }
}

function requireLib(res) {
  if (!simplewebauthn) {
    res.status(503).json({
      success: false,
      code: 'WEBAUTHN_UNAVAILABLE',
      message: 'La bibliothèque WebAuthn n\'est pas installée sur le serveur. Exécutez: npm install @simplewebauthn/server'
    });
    return false;
  }
  return true;
}

// ─── Registration (protected — user must be logged in) ───────────────────────

// @route  POST /api/auth/webauthn/register/options
// @access Private (recruiter)
exports.getRegistrationOptions = async (req, res) => {
  if (!requireLib(res)) return;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    const existingCredentials = (user.webauthnCredentials || []).map(c => ({
      id: c.credentialID,
      type: 'public-key',
      transports: c.transports || []
    }));

    const { rpId, rpOrigin } = getRpConfig(req);
    const options = await simplewebauthn.generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: rpId,
      userID: Buffer.from(user._id.toString()),
      userName: user.email,
      userDisplayName: `${user.firstName} ${user.lastName}`,
      attestationType: 'none',
      excludeCredentials: existingCredentials,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey: false,
        userVerification: 'required'
      },
      supportedAlgorithmIDs: [-7, -257]
    });

    // Store challenge temporarily
    user.webauthnChallenge = options.challenge;
    user.webauthnChallengeExpiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
    await user.save({ validateBeforeSave: false });

    return res.json({ success: true, data: options });
  } catch (err) {
    console.error('[WebAuthn] getRegistrationOptions error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route  POST /api/auth/webauthn/register/verify
// @access Private (recruiter)
exports.verifyRegistration = async (req, res) => {
  if (!requireLib(res)) return;

  try {
    const user = await User.findById(req.user.id).select('+webauthnChallenge');
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    if (!user.webauthnChallenge || !user.webauthnChallengeExpiresAt || user.webauthnChallengeExpiresAt < new Date()) {
      return res.status(400).json({ success: false, code: 'CHALLENGE_EXPIRED', message: 'Le défi a expiré. Recommencez.' });
    }

    const { credential } = req.body;
    if (!credential) return res.status(400).json({ success: false, message: 'Données manquantes.' });

    const { rpId, rpOrigin } = getRpConfig(req);
    const verification = await simplewebauthn.verifyRegistrationResponse({
      response: credential,
      expectedChallenge: user.webauthnChallenge,
      expectedOrigin: rpOrigin,
      expectedRPID: rpId,
      requireUserVerification: true
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ success: false, code: 'VERIFICATION_FAILED', message: 'Vérification échouée.' });
    }

    const { credential: cred } = verification.registrationInfo;
    const info = verification.registrationInfo;

    // credentialPublicKey is Uint8Array — store as base64url string
    const publicKeyBase64 = Buffer.from(cred.publicKey).toString('base64url');

    user.webauthnCredentials.push({
      credentialID:        cred.id,
      credentialPublicKey: publicKeyBase64,
      counter:             cred.counter,
      transports:          cred.transports || credential.response?.transports || [],
      deviceType:          cred.deviceType || info.credentialDeviceType || 'singleDevice',
      backedUp:            cred.backedUp ?? info.credentialBackedUp ?? false
    });

    user.webauthnChallenge = undefined;
    user.webauthnChallengeExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });

    return res.json({ success: true, message: 'Empreinte digitale enregistrée avec succès.' });
  } catch (err) {
    console.error('[WebAuthn] verifyRegistration error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Authentication (public) ─────────────────────────────────────────────────

// @route  POST /api/auth/webauthn/auth/options
// @access Public
exports.getAuthenticationOptions = async (req, res) => {
  if (!requireLib(res)) return;

  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, message: 'Email requis.' });

    const user = await User.findOne({ email });
    if (!user || !user.webauthnCredentials?.length) {
      // Generic message — don't reveal whether the email exists
      return res.status(404).json({
        success: false,
        code: 'NO_CREDENTIAL',
        message: 'Aucune empreinte configurée pour ce compte. Connectez-vous avec email/mot de passe.'
      });
    }

    const allowCredentials = user.webauthnCredentials.map(c => ({
      id: c.credentialID,
      type: 'public-key',
      transports: c.transports || []
    }));

    const { rpId } = getRpConfig(req);
    const options = await simplewebauthn.generateAuthenticationOptions({
      rpID: rpId,
      allowCredentials,
      userVerification: 'required'
    });

    user.webauthnChallenge = options.challenge;
    user.webauthnChallengeExpiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
    await user.save({ validateBeforeSave: false });

    return res.json({ success: true, data: options });
  } catch (err) {
    console.error('[WebAuthn] getAuthenticationOptions error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route  POST /api/auth/webauthn/auth/verify
// @access Public
exports.verifyAuthentication = async (req, res) => {
  if (!requireLib(res)) return;

  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const { credential } = req.body;

    if (!email || !credential) {
      return res.status(400).json({ success: false, message: 'Données manquantes.' });
    }

    const user = await User.findOne({ email }).select('+webauthnChallenge');
    if (!user || !user.webauthnCredentials?.length) {
      return res.status(401).json({ success: false, code: 'NO_CREDENTIAL', message: 'Authentification échouée.' });
    }

    if (!user.webauthnChallenge || !user.webauthnChallengeExpiresAt || user.webauthnChallengeExpiresAt < new Date()) {
      return res.status(401).json({ success: false, code: 'CHALLENGE_EXPIRED', message: 'Session expirée. Recommencez.' });
    }

    if (user.isLocked) {
      return res.status(423).json({ success: false, code: 'ACCOUNT_LOCKED', message: 'Compte temporairement bloqué.' });
    }

    // Find matching credential
    const storedCred = user.webauthnCredentials.find(c => c.credentialID === credential.id);
    if (!storedCred) {
      return res.status(401).json({ success: false, code: 'CREDENTIAL_NOT_FOUND', message: 'Empreinte non reconnue.' });
    }

    const { rpId, rpOrigin } = getRpConfig(req);
    const verification = await simplewebauthn.verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: user.webauthnChallenge,
      expectedOrigin: rpOrigin,
      expectedRPID: rpId,
      credential: {
        id:        storedCred.credentialID,
        publicKey: Buffer.from(storedCred.credentialPublicKey, 'base64url'),
        counter:   storedCred.counter,
        transports: storedCred.transports || []
      },
      requireUserVerification: true
    });

    if (!verification.verified) {
      return res.status(401).json({ success: false, code: 'VERIFICATION_FAILED', message: 'Authentification échouée.' });
    }

    // Update counter to prevent replay attacks
    storedCred.counter = verification.authenticationInfo?.newCounter ?? storedCred.counter;

    user.webauthnChallenge = undefined;
    user.webauthnChallengeExpiresAt = undefined;
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profileComplete: user.profileComplete
        },
        token
      }
    });
  } catch (err) {
    console.error('[WebAuthn] verifyAuthentication error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route  DELETE /api/auth/webauthn/credentials
// @access Private
exports.deleteCredentials = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    user.webauthnCredentials = [];
    await user.save({ validateBeforeSave: false });

    return res.json({ success: true, message: 'Empreintes supprimées.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route  GET /api/auth/webauthn/credentials
// @access Private
exports.getCredentials = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    const credentials = (user.webauthnCredentials || []).map(c => ({
      id: c._id,
      deviceType: c.deviceType,
      backedUp: c.backedUp,
      createdAt: c.createdAt
    }));

    return res.json({ success: true, data: credentials });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
