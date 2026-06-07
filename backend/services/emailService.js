const nodemailer = require('nodemailer');
const https = require('https');

const APP_NAME = 'I.NET – Gestion des Stages';
const LOGO_URL = 'https://rh-management-97bu.vercel.app/assets/logo-inet.png';

// ── Transport selection ───────────────────────────────────────────────────────
// Prefer Gmail SMTP (available locally and on Vercel if env vars set).
// Falls back to Resend if RESEND_API_KEY is set and SMTP is not.

function getTransporter() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: parseInt(process.env.SMTP_PORT || '465') === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null; // will use Resend
}

async function sendMail({ to, subject, html }) {
  const transporter = getTransporter();

  if (transporter) {
    const from = process.env.SMTP_FROM || `${APP_NAME} <${process.env.SMTP_USER}>`;
    await transporter.sendMail({ from, to, subject, html });
    console.log(`[EMAIL SENT via SMTP] ${subject} → ${to}`);
    return;
  }

  if (process.env.RESEND_API_KEY) {
    await resendPost({ from: `${APP_NAME} <onboarding@resend.dev>`, to: [to], subject, html });
    console.log(`[EMAIL SENT via Resend] ${subject} → ${to}`);
    return;
  }

  console.log(`[EMAIL SKIP] No SMTP or Resend credentials configured — skipping email to ${to}`);
}

async function resendPost(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(json);
          else reject(new Error(json.message || `Resend error ${res.statusCode}`));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function emailFooter() {
  return `
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
    <div style="text-align:center;margin-top:8px">
      <img src="${LOGO_URL}" alt="iNET" style="height:52px;width:52px;border-radius:8px;display:block;margin:0 auto 8px"/>
      <p style="color:#9ca3af;font-size:12px;margin:0">${APP_NAME} — Institut National d'Études Technologiques</p>
    </div>
  `;
}

// ── Interview scheduled ───────────────────────────────────────────────────────
exports.sendInterviewEmail = async ({ to, firstName, lastName, interviewDate, interviewTime, offerTitle, trackingUrl }) => {
  const dateStr = new Date(interviewDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  await sendMail({
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
        <div style="text-align:center;margin:24px 0">
          <a href="${trackingUrl}" style="background:#1d4ed8;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
            Accéder à mon espace de suivi
          </a>
        </div>
        <p style="color:#6b7280;font-size:13px">
          Merci de vous présenter à l'heure indiquée. En cas d'empêchement, veuillez nous contacter dans les plus brefs délais.
        </p>
        ${emailFooter()}
      </div>`,
  });
};

// ── Candidate pre-selected ────────────────────────────────────────────────────
exports.sendPreselectionEmail = async ({ to, firstName, lastName, offerTitle, trackingUrl }) => {
  await sendMail({
    to,
    subject: `Votre candidature a été présélectionnée – ${offerTitle || 'Stage'}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px">
        <div style="background:#4f46e5;border-radius:8px;padding:20px 24px;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:20px">${APP_NAME}</h1>
        </div>
        <h2 style="color:#111827">Bonjour ${firstName} ${lastName},</h2>
        <p style="color:#374151;line-height:1.6">
          Nous avons le plaisir de vous informer que votre candidature pour le poste de
          <strong>${offerTitle || 'stage'}</strong> a été <strong style="color:#4f46e5">présélectionnée</strong>.
        </p>
        <div style="background:#eef2ff;border-left:4px solid #4f46e5;padding:16px 20px;border-radius:6px;margin:20px 0">
          <p style="margin:0;font-weight:700;color:#3730a3">📅 Prochaine étape : Entretien</p>
          <p style="margin:8px 0 0;color:#3730a3;line-height:1.5">
            Notre équipe RH vous contactera prochainement pour vous communiquer les détails de votre entretien.
            Vous serez notifié(e) par email dès la planification.
          </p>
        </div>
        <div style="text-align:center;margin:24px 0">
          <a href="${trackingUrl || '#'}" style="background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
            Accéder à mon espace de suivi
          </a>
        </div>
        <p style="color:#6b7280;font-size:13px">
          En attendant, vous pouvez suivre l'avancement de votre candidature via votre espace personnel.
        </p>
        ${emailFooter()}
      </div>`,
  });
};

// ── Candidate rejected ────────────────────────────────────────────────────────
exports.sendRejectionEmail = async ({ to, firstName, lastName, offerTitle, comment }) => {
  await sendMail({
    to,
    subject: `Suite à votre candidature – ${offerTitle || 'Stage'}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px">
        <div style="background:#64748b;border-radius:8px;padding:20px 24px;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:20px">${APP_NAME}</h1>
        </div>
        <h2 style="color:#111827">Bonjour ${firstName} ${lastName},</h2>
        <p style="color:#374151;line-height:1.6">
          Nous vous remercions de l'intérêt que vous portez à notre établissement et du temps consacré
          à votre candidature pour le poste de <strong>${offerTitle || 'stage'}</strong>.
        </p>
        <p style="color:#374151;line-height:1.6">
          Après examen attentif de votre dossier, nous avons le regret de vous informer que votre candidature
          n'a pas été retenue pour cette offre.
        </p>
        ${comment ? `<div style="background:#f1f5f9;border-left:4px solid #94a3b8;padding:14px 18px;border-radius:6px;margin:20px 0">
          <p style="margin:0;color:#374151;font-size:13px;line-height:1.6">${comment}</p>
        </div>` : ''}
        <p style="color:#374151;line-height:1.6">
          Nous vous encourageons à candidater à de futures offres qui pourraient correspondre à votre profil.
        </p>
        <p style="color:#374151;line-height:1.6">Nous vous souhaitons pleine réussite dans vos démarches.</p>
        ${emailFooter()}
      </div>`,
  });
};

// ── Offer accepted ────────────────────────────────────────────────────────────
exports.sendAcceptanceEmail = async ({ to, firstName, lastName, offerTitle, trackingUrl }) => {
  await sendMail({
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
            <a href="https://discord.gg/aeFTt2AgpA"
               style="background:#fff;color:#5865f2;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block">
              Rejoindre le Discord
            </a>
          </div>
        </div>
        ${emailFooter()}
      </div>`,
  });
};
