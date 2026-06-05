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

const RH_ROLE_LABELS = {
  recruiter:        'Admin RH — Accès complet',
  rh_offres:        'Resp. Offres — Gestion des offres de stage',
  rh_candidatures:  'Resp. Candidatures — Gestion des candidatures et dossiers',
};

const sendNewRhUserEmail = async ({ to, firstName, lastName, email, password, role, appUrl }) => {
  if (!isMailConfigured()) return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  const transport = getTransport();
  const roleLabel = RH_ROLE_LABELS[role] || role;
  const url = appUrl || 'https://rh-management-97bu.vercel.app';

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;background:#f8fafc;padding:32px 24px;border-radius:16px">
      <div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);border-radius:12px;padding:28px 24px;text-align:center;margin-bottom:24px">
        <h1 style="color:white;margin:0;font-size:22px">Bienvenue sur l'Espace RH</h1>
        <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">Votre compte a été créé par l'administrateur</p>
      </div>
      <div style="background:white;border-radius:12px;padding:24px;margin-bottom:16px">
        <p style="color:#374151;font-size:15px;margin:0 0 16px">Bonjour <strong>${firstName} ${lastName}</strong>,</p>
        <p style="color:#6b7280;font-size:14px;margin:0 0 20px">Un compte vous a été créé avec le rôle suivant :</p>
        <div style="background:#EEF2FF;border-radius:8px;padding:12px 16px;margin-bottom:20px">
          <span style="color:#4F46E5;font-weight:700;font-size:14px">${roleLabel}</span>
        </div>
        <p style="color:#374151;font-size:14px;margin:0 0 8px"><strong>Vos identifiants de connexion :</strong></p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Email</td><td style="padding:8px 0;color:#1f2937;font-weight:600;font-size:13px">${email}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Mot de passe</td><td style="padding:8px 0;color:#1f2937;font-weight:600;font-size:13px;font-family:monospace">${password}</td></tr>
        </table>
        <div style="margin-top:24px;text-align:center">
          <a href="${url}" style="background:linear-gradient(135deg,#4F46E5,#7C3AED);color:white;padding:12px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block">Accéder à la plateforme</a>
        </div>
        <p style="color:#9ca3af;font-size:12px;margin:20px 0 0;text-align:center">Nous vous recommandons de changer votre mot de passe après la première connexion.</p>
      </div>
    </div>`;

  await transport.sendMail({ from: process.env.SMTP_FROM, to, subject: '🎉 Votre accès Espace RH — Identifiants de connexion', html });
  return { sent: true };
};

const sendRhUserUpdatedEmail = async ({ to, firstName, lastName, changes }) => {
  if (!isMailConfigured()) return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  const transport = getTransport();

  const changeLines = changes.map(c => `<tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6">${c.field}</td><td style="padding:8px 12px;color:#1f2937;font-weight:600;font-size:13px;border-bottom:1px solid #f3f4f6">${c.value}</td></tr>`).join('');

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;background:#f8fafc;padding:32px 24px;border-radius:16px">
      <div style="background:linear-gradient(135deg,#0EA5E9,#6366F1);border-radius:12px;padding:28px 24px;text-align:center;margin-bottom:24px">
        <h1 style="color:white;margin:0;font-size:20px">Mise à jour de votre compte</h1>
        <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">Espace RH — Informatique net</p>
      </div>
      <div style="background:white;border-radius:12px;padding:24px">
        <p style="color:#374151;font-size:15px;margin:0 0 16px">Bonjour <strong>${firstName} ${lastName}</strong>,</p>
        <p style="color:#6b7280;font-size:14px;margin:0 0 20px">Les modifications suivantes ont été apportées à votre compte :</p>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
          <thead><tr style="background:#f9fafb"><th style="padding:10px 12px;text-align:left;color:#374151;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Champ</th><th style="padding:10px 12px;text-align:left;color:#374151;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Nouvelle valeur</th></tr></thead>
          <tbody>${changeLines}</tbody>
        </table>
        <p style="color:#9ca3af;font-size:12px;margin:20px 0 0;text-align:center">Si vous n'êtes pas à l'origine de cette modification, contactez l'administrateur.</p>
      </div>
    </div>`;

  await transport.sendMail({ from: process.env.SMTP_FROM, to, subject: '🔔 Mise à jour de votre compte Espace RH', html });
  return { sent: true };
};

module.exports = {
  isMailConfigured,
  sendRiskOtpEmail,
  sendPasswordResetEmail,
  sendNewRhUserEmail,
  sendRhUserUpdatedEmail,
};
