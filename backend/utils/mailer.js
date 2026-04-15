const nodemailer = require('nodemailer');

const isMailConfigured = () => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM
  );
};

let cachedTransport;
const getTransport = () => {
  if (cachedTransport) return cachedTransport;

  const port = Number(process.env.SMTP_PORT);
  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return cachedTransport;
};

const sendRiskOtpEmail = async ({ to, otp, expiresInSeconds }) => {
  if (!isMailConfigured()) {
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  const transport = getTransport();
  const minutes = Math.max(1, Math.ceil(Number(expiresInSeconds || 600) / 60));

  const subject = 'Code de vérification (connexion)';
  const text = `Votre code de vérification est : ${otp}\n\nCe code expire dans ${minutes} minute(s).\n\nSi vous n\'êtes pas à l\'origine de cette tentative de connexion, vous pouvez ignorer cet email.`;

  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text
  });

  return { sent: true };
};

const sendPasswordResetEmail = async ({ to, resetUrl, expiresInSeconds }) => {
  if (!isMailConfigured()) {
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  const transport = getTransport();
  const minutes = Math.max(1, Math.ceil(Number(expiresInSeconds || 3600) / 60));

  const subject = 'Reinitialisation de votre mot de passe';
  const text = [
    'Vous avez demande la reinitialisation de votre mot de passe.',
    '',
    `Ouvrez ce lien pour definir un nouveau mot de passe : ${resetUrl}`,
    '',
    `Ce lien expire dans ${minutes} minute(s).`,
    '',
    'Si vous n etes pas a l origine de cette demande, vous pouvez ignorer cet email.'
  ].join('\n');

  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text
  });

  return { sent: true };
};

module.exports = {
  isMailConfigured,
  sendRiskOtpEmail,
  sendPasswordResetEmail
};
