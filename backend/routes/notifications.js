const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/notifications — recent activity for RH recruiter
router.get('/', protect, authorize('recruiter', 'admin', 'rh_offres', 'rh_candidatures'), async (req, res) => {
  try {
    const applications = await Application.find()
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate({
        path: 'candidate',
        select: 'userId statusHistory',
        populate: { path: 'userId', select: 'firstName lastName' }
      })
      .populate('offer', 'title')
      .lean();

    // Collect all changedBy IDs from statusHistory
    const actorIds = new Set();
    applications.forEach(app => {
      const history = app.candidate?.statusHistory || [];
      const last = history[history.length - 1];
      if (last?.changedBy) actorIds.add(last.changedBy.toString());
    });
    const actorUsers = await User.find({ _id: { $in: [...actorIds] } }).select('firstName lastName role').lean();
    const actorMap = {};
    actorUsers.forEach(u => { actorMap[u._id.toString()] = u; });

    const notifications = applications.map(app => {
      const firstName = app.candidate?.userId?.firstName || '';
      const lastName  = app.candidate?.userId?.lastName  || '';
      const fullName  = `${firstName} ${lastName}`.trim() || 'Candidat';
      const offerTitle = app.offer?.title || 'une offre';

      // Find actor from last statusHistory entry
      const history = app.candidate?.statusHistory || [];
      const lastChange = history[history.length - 1];
      const actorUser = lastChange?.changedBy ? actorMap[lastChange.changedBy.toString()] : null;
      const actorName = actorUser
        ? `${actorUser.firstName || ''} ${actorUser.lastName || ''}`.trim()
        : null;

      let type = 'status';
      let text = '';

      switch (app.status) {
        case 'nouveau':
          type = 'new';
          text = `<strong>Nouvelle candidature</strong> reçue pour <strong>${offerTitle}</strong>`;
          break;
        case 'preselectionne':
          type = 'new';
          text = `<strong>${fullName}</strong> présélectionné(e) pour <strong>${offerTitle}</strong>`;
          break;
        case 'documents_recus':
          type = 'doc';
          text = `<strong>Demande de stage</strong> déposée par <strong>${fullName}</strong>`;
          break;
        case 'entretien_programme':
          type = 'status';
          text = `Entretien programmé avec <strong>${fullName}</strong>${app.interviewDate ? ` — ${formatDate(app.interviewDate)}` : ''}`;
          break;
        case 'offre_acceptee':
          type = 'doc';
          text = `<strong>${fullName}</strong> a <strong style="color:#059669">accepté</strong> l'offre pour <strong>${offerTitle}</strong>`;
          break;
        case 'rejete':
          type = 'status';
          text = `Candidature de <strong>${fullName}</strong> rejetée`;
          break;
        default:
          text = `Statut mis à jour pour <strong>${fullName}</strong> — ${offerTitle}`;
      }

      return {
        id: app._id.toString(),
        type,
        text,
        actor: actorName,
        time: timeAgo(app.updatedAt),
        updatedAt: app.updatedAt
      };
    });

    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

function timeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000);
  if (diff < 60)   return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  const days = Math.floor(diff / 86400);
  if (days === 1)  return 'Hier';
  if (days < 7)   return `Il y a ${days} jours`;
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch { return dateStr; }
}

module.exports = router;
