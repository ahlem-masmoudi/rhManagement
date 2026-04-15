const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Generate short-lived token for risk-based step-up challenge
const generateRiskChallengeToken = (userId, nonce, expiresInSeconds) => {
  const expiresIn = expiresInSeconds ? `${Number(expiresInSeconds)}s` : '10m';
  return jwt.sign(
    { id: userId, type: 'risk_challenge', nonce },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  generateRiskChallengeToken,
  verifyToken
};
