const nodemailer = require('nodemailer');

function createTransport() {
  const port = parseInt(process.env.SMTP_PORT || '587');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
}

const FROM = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@inet.tn';
const APP_NAME = 'INET – Gestion des Stages';

// ── Interview scheduled ──────────────────────────────────────────────────────
exports.sendInterviewEmail = async ({ to, firstName, lastName, interviewDate, interviewTime, offerTitle, trackingUrl }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EMAIL SKIP] Interview email to ${to} — SMTP not configured`);
    return;
  }
  const transporter = createTransport();
  const dateStr = new Date(interviewDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  await transporter.sendMail({
    from: `"${APP_NAME}" <${FROM}>`,
    to,
    subject: `Convocation à l'entretien – ${offerTitle || 'Stage'}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px">
        <div style="background:#1d4ed8;border-radius:8px;padding:20px 24px;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:20px">${APP_NAME}</h1>
        </div>
        <h2 style="color:#111827">Bonjour ${firstName} ${lastName},</h2>
        <p style="color:#374151;line-height:1.6">
          Nous avons le plaisir de vous informer que votre candidature pour le poste de
          <strong>${offerTitle || 'stage'}</strong> a été présélectionnée.
        </p>
        <div style="background:#dbeafe;border-left:4px solid #1d4ed8;padding:16px 20px;border-radius:6px;margin:20px 0">
          <p style="margin:0;font-weight:700;color:#1e40af">📅 Date de l'entretien : ${dateStr}</p>
          <p style="margin:8px 0 0;font-weight:700;color:#1e40af">🕐 Heure : ${interviewTime}</p>
        </div>
        <p style="color:#374151;line-height:1.6">
          Vous pouvez suivre l'évolution de votre dossier en temps réel via votre espace personnel :
        </p>
        <div style="text-align:center;margin:24px 0">
          <a href="${trackingUrl}" style="background:#1d4ed8;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
            Accéder à mon espace de suivi
          </a>
        </div>
        <p style="color:#6b7280;font-size:13px">
          Merci de vous présenter à l'heure indiquée. En cas d'empêchement, veuillez nous contacter dans les plus brefs délais.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#9ca3af;font-size:12px;text-align:center">${APP_NAME} — Institut National d'Études Technologiques</p>
      </div>
    `
  });
  console.log(`[EMAIL SENT] Interview email → ${to}`);
};

// ── Offer accepted — with document upload link ───────────────────────────────
exports.sendAcceptanceEmail = async ({ to, firstName, lastName, offerTitle, trackingUrl }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EMAIL SKIP] Acceptance email to ${to} — SMTP not configured`);
    return;
  }
  const transporter = createTransport();
  await transporter.sendMail({
    from: `"${APP_NAME}" <${FROM}>`,
    to,
    subject: `Félicitations ! Votre candidature a été acceptée – ${offerTitle || 'Stage'}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px">
        <div style="background:#059669;border-radius:8px;padding:20px 24px;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:20px">${APP_NAME}</h1>
        </div>
        <h2 style="color:#111827">Félicitations, ${firstName} ${lastName} !</h2>
        <p style="color:#374151;line-height:1.6">
          Nous avons le plaisir de vous annoncer que votre candidature pour le poste de
          <strong>${offerTitle || 'stage'}</strong> a été <strong style="color:#059669">acceptée</strong>.
        </p>
        <div style="background:#d1fae5;border-left:4px solid #059669;padding:16px 20px;border-radius:6px;margin:20px 0">
          <p style="margin:0;font-weight:700;color:#065f46">📄 Action requise</p>
          <p style="margin:8px 0 0;color:#065f46">
            Veuillez déposer votre <strong>demande de stage</strong> (formulaire vierge fourni par votre établissement)
            via votre espace de suivi ci-dessous. Le service RH la complétera et vous la renverra signée.
          </p>
        </div>
        <div style="text-align:center;margin:24px 0">
          <a href="${trackingUrl}" style="background:#059669;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
            Déposer ma demande de stage
          </a>
        </div>
        <p style="color:#6b7280;font-size:13px">
          Après dépôt, le service RH traitera votre document dans les meilleurs délais.
        </p>
        <div style="background:#5865f2;border-radius:8px;padding:20px 24px;margin:24px 0">
          <p style="margin:0;font-weight:700;color:#fff;font-size:15px">💬 Groupe Discord d'encadrement</p>
          <p style="margin:10px 0;color:#e0e7ff;line-height:1.6;font-size:14px">
            Afin de faciliter la communication durant votre encadrement, nous avons créé un groupe Discord.<br/>
            N'hésitez pas à rejoindre ce groupe pour échanger avec votre encadrant.
          </p>
          <div style="text-align:center;margin-top:16px">
            <a href="https://discord.gg/MMyjmtNA"
               style="background:#fff;color:#5865f2;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block">
              Rejoindre le Discord
            </a>
          </div>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#9ca3af;font-size:12px;text-align:center">${APP_NAME} — Institut National d'Études Technologiques</p>
      </div>
    `
  });
  console.log(`[EMAIL SENT] Acceptance email → ${to}`);
};
